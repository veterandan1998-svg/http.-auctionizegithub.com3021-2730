import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { authClient } from "../../lib/auth";
import { StatusBar } from "expo-status-bar";

export default function SellerDashboard() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard", "seller"],
    enabled: !!session,
    queryFn: async () => {
      const res = await api.dashboard.seller.$get();
      return res.json();
    },
  });

  if (!session) return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🔒</Text>
        <Text style={styles.authTitle}>Sign in required</Text>
        <TouchableOpacity style={styles.authBtn} onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.authBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const d = data as any;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FFCC00" />}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 60 }}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#FFCC00" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsGrid}>
              {[
                { label: "Total Revenue", value: `$${(d?.totalRevenue ?? 0).toFixed(2)}`, color: "#FFCC00" },
                { label: "Total Orders", value: String(d?.totalOrders ?? 0), color: "#fff" },
                { label: "Active Listings", value: String(d?.activeListings ?? 0), color: "#00C864" },
                { label: "Recent Orders", value: String(d?.recentOrders?.length ?? 0), color: "#FF9900" },
              ].map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Quick actions */}
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/sell")}>
              <Text style={styles.actionText}>➕ List a new item</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>

            {/* Recent listings */}
            <Text style={styles.sectionTitle}>Recent Listings</Text>
            {d?.myListings?.length > 0 ? (
              d.myListings.slice(0, 8).map((l: any) => (
                <TouchableOpacity
                  key={l.id}
                  style={styles.listingCard}
                  onPress={() => router.push(`/listing/${l.id}`)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingTitle} numberOfLines={1}>{l.title}</Text>
                    <Text style={styles.listingPrice}>${parseFloat(l.price).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.statusBadge, l.status === "active" ? styles.statusActive : styles.statusSold]}>
                    <Text style={styles.statusText}>{l.status}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No listings yet</Text>
            )}

            {/* Recent orders */}
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {d?.recentOrders?.length > 0 ? (
              d.recentOrders.slice(0, 5).map((o: any) => (
                <View key={o.id} style={styles.orderCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingTitle} numberOfLines={1}>{o.listingTitle}</Text>
                    <Text style={styles.orderAmount}>${parseFloat(o.amount).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.statusBadge, o.status === "completed" ? styles.statusActive : styles.statusPending]}>
                    <Text style={styles.statusText}>{o.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No orders yet</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  header: { backgroundColor: "#16161E", paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#2a2a3a", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: "#FFCC00", fontWeight: "700", fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  authTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  authBtn: { backgroundColor: "#FFCC00", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  authBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: "#16161E", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#2a2a3a", alignItems: "center" },
  statValue: { fontSize: 26, fontWeight: "900", marginBottom: 4 },
  statLabel: { color: "#666", fontSize: 12, textAlign: "center" },
  actionRow: { backgroundColor: "#FFCC00", borderRadius: 12, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  actionText: { color: "#000", fontWeight: "800", fontSize: 15 },
  actionArrow: { color: "#000", fontSize: 18, fontWeight: "900" },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#fff", marginTop: 8 },
  listingCard: { backgroundColor: "#16161E", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#2a2a3a", flexDirection: "row", alignItems: "center" },
  listingTitle: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  listingPrice: { color: "#FFCC00", fontSize: 14, fontWeight: "700" },
  orderCard: { backgroundColor: "#16161E", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#2a2a3a", flexDirection: "row", alignItems: "center" },
  orderAmount: { color: "#FFCC00", fontSize: 14, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusActive: { backgroundColor: "rgba(0,200,100,0.15)" },
  statusSold: { backgroundColor: "rgba(255,77,77,0.15)" },
  statusPending: { backgroundColor: "rgba(255,153,0,0.15)" },
  statusText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  emptyText: { color: "#555", fontSize: 14, textAlign: "center", paddingVertical: 20 },
});
