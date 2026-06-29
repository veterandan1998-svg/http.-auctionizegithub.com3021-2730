import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { authClient, clearToken } from "../../lib/auth";
import { StatusBar } from "expo-status-bar";

export default function ProfileScreen() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const { data: profile, isLoading: loadingProfile, refetch } = useQuery({
    queryKey: ["my-profile"],
    enabled: !!session,
    queryFn: async () => {
      const res = await api.profile.me.$get();
      return res.json();
    },
  });

  const { data: myListings, isLoading: loadingListings } = useQuery({
    queryKey: ["my-listings"],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const res = await api.listings.seller[":sellerId"].$get({ param: { sellerId: session!.user.id } });
      return res.json();
    },
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    await clearToken();
    router.replace("/(auth)/sign-in");
  };

  if (isPending) return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.center}><ActivityIndicator size="large" color="#FFCC00" /></View>
    </View>
  );

  if (!session) return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <View style={styles.center}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>👤</Text>
        <Text style={styles.signInTitle}>Sign in to your account</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/(auth)/sign-up")}>
          <Text style={styles.secondaryBtnText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loadingProfile} onRefresh={refetch} tintColor="#FFCC00" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{session.user.name?.[0]?.toUpperCase() ?? "?"}</Text>
          </View>
          <Text style={styles.userName}>{session.user.name}</Text>
          <Text style={styles.userEmail}>{session.user.email}</Text>
          {(profile as any)?.profile?.location && <Text style={styles.userLocation}>📍 {(profile as any).profile.location}</Text>}
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/dashboard/seller")}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionLabel}>Seller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/dashboard/buyer")}>
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionLabel}>Purchases</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/sell")}>
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionLabel}>Sell</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/messages")}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* My Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Listings</Text>
            <TouchableOpacity onPress={() => router.push("/dashboard/seller")}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {loadingListings ? (
            <ActivityIndicator color="#FFCC00" style={{ marginTop: 20 }} />
          ) : (myListings as any)?.length > 0 ? (
            <View>
              {(myListings as any).slice(0, 4).map((l: any) => (
                <TouchableOpacity
                  key={l.id}
                  style={styles.listingRow}
                  onPress={() => router.push(`/listing/${l.id}`)}
                >
                  <View style={styles.listingDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingRowTitle} numberOfLines={1}>{l.title}</Text>
                    <Text style={styles.listingRowPrice}>${parseFloat(l.price).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.statusBadge, l.status === "active" ? styles.statusActive : styles.statusSold]}>
                    <Text style={styles.statusText}>{l.status}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No listings yet</Text>
              <TouchableOpacity style={styles.listBtn} onPress={() => router.push("/sell")}>
                <Text style={styles.listBtnText}>List something →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  header: { backgroundColor: "#16161E", paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#2a2a3a" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 24 },
  signInTitle: { fontSize: 20, fontWeight: "700", color: "#fff", textAlign: "center" },
  primaryBtn: { backgroundColor: "#FFCC00", borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14, width: "100%" },
  primaryBtnText: { color: "#000", fontWeight: "800", fontSize: 16, textAlign: "center" },
  secondaryBtn: { backgroundColor: "#16161E", borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14, width: "100%", borderWidth: 1, borderColor: "#2a2a3a" },
  secondaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
  avatarCard: { alignItems: "center", paddingVertical: 28, backgroundColor: "#16161E", borderBottomWidth: 1, borderBottomColor: "#2a2a3a" },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#FFCC00", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: "900", color: "#000" },
  userName: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "#666", marginBottom: 4 },
  userLocation: { fontSize: 13, color: "#888" },
  actionsRow: { flexDirection: "row", backgroundColor: "#16161E", borderBottomWidth: 1, borderBottomColor: "#2a2a3a" },
  actionBtn: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 11, color: "#888", fontWeight: "600" },
  section: { padding: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  seeAll: { color: "#FFCC00", fontSize: 13, fontWeight: "600" },
  listingRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#16161E", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2a2a3a", gap: 10 },
  listingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFCC00", flexShrink: 0 },
  listingRowTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  listingRowPrice: { color: "#FFCC00", fontSize: 13, fontWeight: "700", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusActive: { backgroundColor: "rgba(0,200,100,0.15)" },
  statusSold: { backgroundColor: "rgba(255,77,77,0.15)" },
  statusText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  emptySection: { alignItems: "center", paddingVertical: 24, gap: 12 },
  emptySectionText: { color: "#555", fontSize: 14 },
  listBtn: { backgroundColor: "#FFCC00", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  listBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },
  signOutBtn: { margin: 16, backgroundColor: "#16161E", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#FF4D4D" },
  signOutText: { color: "#FF4D4D", fontWeight: "700", fontSize: 16 },
});
