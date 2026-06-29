import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { authClient } from "../../lib/auth";
import { StatusBar } from "expo-status-bar";

export default function BuyerDashboard() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard", "buyer"],
    enabled: !!session,
    queryFn: async () => {
      const res = await api.dashboard.buyer.$get();
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
        <Text style={styles.headerTitle}>My Purchases</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FFCC00" />}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#FFCC00" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{d?.totalOrders ?? 0}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: "#FFCC00" }]}>${(d?.totalSpent ?? 0).toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Order History</Text>

            {d?.recentOrders?.length > 0 ? (
              d.recentOrders.map((o: any) => (
                <TouchableOpacity
                  key={o.id}
                  style={styles.orderCard}
                  onPress={() => router.push(`/listing/${o.listingId}`)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderTitle} numberOfLines={1}>{o.listingTitle ?? "Listing"}</Text>
                    <Text style={styles.orderSeller}>Seller: {o.sellerName ?? "—"}</Text>
                    <Text style={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={styles.orderAmount}>${parseFloat(o.amount).toFixed(2)}</Text>
                    <View style={[styles.statusBadge, o.status === "completed" ? styles.statusCompleted : styles.statusPending]}>
                      <Text style={styles.statusText}>{o.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.empty}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🛒</Text>
                <Text style={styles.emptyTitle}>No purchases yet</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/(tabs)/browse")}>
                  <Text style={styles.browseBtnText}>Start Shopping →</Text>
                </TouchableOpacity>
              </View>
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
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "#16161E", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#2a2a3a", alignItems: "center" },
  statValue: { fontSize: 26, fontWeight: "900", color: "#fff", marginBottom: 4 },
  statLabel: { color: "#666", fontSize: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#fff", marginTop: 8 },
  orderCard: { backgroundColor: "#16161E", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#2a2a3a", flexDirection: "row", gap: 12, alignItems: "flex-start" },
  orderTitle: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  orderSeller: { color: "#666", fontSize: 12, marginBottom: 2 },
  orderDate: { color: "#555", fontSize: 11 },
  orderAmount: { color: "#FFCC00", fontSize: 16, fontWeight: "900" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusCompleted: { backgroundColor: "rgba(0,200,100,0.15)" },
  statusPending: { backgroundColor: "rgba(255,153,0,0.15)" },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  browseBtn: { backgroundColor: "#FFCC00", borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  browseBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },
});
