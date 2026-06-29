import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, TextInput, Dimensions,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../lib/api";
import { authClient } from "../../lib/auth";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";

const { width: W } = Dimensions.get("window");

const CONDITION_LABELS: Record<string, string> = { new: "New", like_new: "Like New", good: "Good", fair: "Fair", poor: "Poor" };

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = authClient.useSession();

  const [activeImg, setActiveImg] = useState(0);
  const [msgContent, setMsgContent] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const res = await api.listings[":id"].$get({ param: { id: id! } });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", (listing as any)?.sellerId],
    enabled: !!(listing as any)?.sellerId,
    queryFn: async () => {
      const res = await api.reviews[":userId"].$get({ param: { userId: (listing as any).sellerId } });
      return res.json();
    },
  });

  const buyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.orders.checkout.$post({ json: { listingId: id! } });
      return res.json() as any;
    },
    onSuccess: (data) => {
      if (data.url) {
        // On mobile, open in browser
        import("expo-linking").then(({ default: Linking }) => Linking.openURL(data.url));
      }
    },
  });

  const msgMutation = useMutation({
    mutationFn: async () => {
      const convRes = await api.messages.conversations.$post({ json: { listingId: id!, sellerId: (listing as any).sellerId } });
      const conv = await convRes.json() as any;
      await api.messages[":conversationId"].$post({ param: { conversationId: conv.id }, json: { content: msgContent } });
      return conv.id;
    },
    onSuccess: () => {
      setMsgSent(true);
      setMsgContent("");
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Reviews require orderId — posting reviews is handled after purchase

  const stars = (r: number) => Array.from({ length: 5 }, (_, i) => (
    <Text key={i} style={{ color: i < Math.round(r) ? "#FFCC00" : "#333", fontSize: 16 }}>★</Text>
  ));

  if (isLoading) return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.center}><ActivityIndicator size="large" color="#FFCC00" /></View>
    </View>
  );

  if (!listing) return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
        <Text style={styles.notFoundText}>Listing not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>← Go back</Text></TouchableOpacity>
      </View>
    </View>
  );

  const l = listing as any;
  const images: string[] = l.imageUrls ?? [];
  const isSeller = session?.user?.id === l.sellerId;
  const avgRating = (reviews as any)?.avgRating ?? 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Back button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        {l.isPromoted && <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>⭐ FEATURED</Text></View>}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Images */}
        <View style={styles.imgContainer}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onScroll={(e) => setActiveImg(Math.round(e.nativeEvent.contentOffset.x / W))}
                scrollEventThrottle={16}
              >
                {images.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={{ width: W, height: 280 }} resizeMode="cover" />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.dots}>
                  {images.map((_, i) => (
                    <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImg}><Text style={{ fontSize: 64 }}>📦</Text></View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{l.title}</Text>
            <Text style={styles.price}>${parseFloat(l.price).toFixed(2)}</Text>
          </View>

          <View style={styles.metaRow}>
            {l.category && <View style={styles.tag}><Text style={styles.tagText}>{l.category}</Text></View>}
            {l.condition && <View style={styles.tag}><Text style={styles.tagText}>{CONDITION_LABELS[l.condition] ?? l.condition}</Text></View>}
            {l.location && <Text style={styles.location}>📍 {l.location}</Text>}
          </View>

          {l.description && <Text style={styles.description}>{l.description}</Text>}

          {/* Seller info */}
          <TouchableOpacity
            style={styles.sellerRow}
            onPress={() => router.push(`/profile/${l.sellerId}`)}
          >
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>{l.sellerName?.[0]?.toUpperCase() ?? "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{l.sellerName ?? "Seller"}</Text>
              {avgRating > 0 && (
                <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                  {stars(avgRating)}
                  <Text style={styles.ratingCount}>({(reviews as any)?.total})</Text>
                </View>
              )}
            </View>
            <Text style={styles.viewProfile}>View →</Text>
          </TouchableOpacity>
        </View>

        {/* Buy button */}
        {!isSeller && l.status === "active" && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.buyBtn}
              onPress={() => {
                if (!session) { router.push("/(auth)/sign-in"); return; }
                buyMutation.mutate();
              }}
              disabled={buyMutation.isPending}
            >
              {buyMutation.isPending
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.buyBtnText}>Buy Now — ${parseFloat(l.price).toFixed(2)}</Text>
              }
            </TouchableOpacity>
            {buyMutation.isError && <Text style={styles.errorText}>Checkout failed. Try again.</Text>}
          </View>
        )}

        {l.status === "sold" && (
          <View style={styles.soldBanner}><Text style={styles.soldText}>This item has been sold</Text></View>
        )}

        {/* Message seller */}
        {!isSeller && session && l.status === "active" && (
          <View style={styles.msgSection}>
            <Text style={styles.sectionTitle}>Message Seller</Text>
            {msgSent ? (
              <Text style={styles.successText}>✓ Message sent!</Text>
            ) : (
              <>
                <TextInput
                  style={styles.msgInput}
                  placeholder="Ask about this item..."
                  placeholderTextColor="#555"
                  value={msgContent}
                  onChangeText={setMsgContent}
                  multiline numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !msgContent.trim() && { opacity: 0.5 }]}
                  onPress={() => msgContent.trim() && msgMutation.mutate()}
                  disabled={!msgContent.trim() || msgMutation.isPending}
                >
                  {msgMutation.isPending
                    ? <ActivityIndicator color="#000" />
                    : <Text style={styles.sendBtnText}>Send Message</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Reviews */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>
            Seller Reviews {avgRating > 0 && `— ⭐ ${avgRating.toFixed(1)}`}
          </Text>



          {/* Review list */}
          {(reviews as any)?.reviews?.map((r: any) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{r.reviewerName ?? "Anonymous"}</Text>
                <View style={{ flexDirection: "row" }}>{stars(r.rating)}</View>
              </View>
              {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  notFoundText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  link: { color: "#FFCC00", fontSize: 15 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 52, paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  backText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  featuredBadge: { backgroundColor: "#FFCC00", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  featuredBadgeText: { color: "#000", fontWeight: "800", fontSize: 11 },
  imgContainer: { position: "relative" },
  noImg: { height: 280, backgroundColor: "#16161E", justifyContent: "center", alignItems: "center" },
  dots: { position: "absolute", bottom: 8, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { backgroundColor: "#FFCC00" },
  infoSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1a1a24" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginTop: 8 },
  title: { flex: 1, fontSize: 22, fontWeight: "800", color: "#fff", lineHeight: 28 },
  price: { fontSize: 24, fontWeight: "900", color: "#FFCC00", flexShrink: 0 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" },
  tag: { backgroundColor: "#16161E", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "#2a2a3a" },
  tagText: { color: "#888", fontSize: 12, fontWeight: "600" },
  location: { color: "#666", fontSize: 13 },
  description: { color: "#aaa", fontSize: 15, lineHeight: 22, marginTop: 14 },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18, backgroundColor: "#16161E", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2a2a3a" },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFCC00", justifyContent: "center", alignItems: "center" },
  sellerAvatarText: { fontSize: 18, fontWeight: "900", color: "#000" },
  sellerName: { fontSize: 15, fontWeight: "700", color: "#fff" },
  ratingCount: { color: "#666", fontSize: 12, marginLeft: 4 },
  viewProfile: { color: "#FFCC00", fontSize: 13, fontWeight: "700" },
  actionSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1a1a24" },
  buyBtn: { backgroundColor: "#FFCC00", borderRadius: 14, padding: 18, alignItems: "center" },
  buyBtnText: { color: "#000", fontWeight: "900", fontSize: 18 },
  soldBanner: { margin: 16, backgroundColor: "#FF4D4D22", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#FF4D4D44", alignItems: "center" },
  soldText: { color: "#FF4D4D", fontWeight: "700", fontSize: 15 },
  errorText: { color: "#FF4D4D", fontSize: 13, textAlign: "center", marginTop: 8 },
  msgSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1a1a24" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 14 },
  msgInput: { backgroundColor: "#16161E", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 12, padding: 14, color: "#fff", fontSize: 14, minHeight: 90, marginBottom: 12 },
  sendBtn: { backgroundColor: "#FFCC00", borderRadius: 12, padding: 14, alignItems: "center" },
  sendBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },
  successText: { color: "#00C864", fontSize: 15, fontWeight: "700", textAlign: "center", padding: 12 },
  reviewSection: { padding: 16 },
  reviewCard: { backgroundColor: "#16161E", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#2a2a3a" },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  reviewerName: { color: "#fff", fontWeight: "700", fontSize: 14 },
  reviewComment: { color: "#888", fontSize: 14, lineHeight: 20 },
});
