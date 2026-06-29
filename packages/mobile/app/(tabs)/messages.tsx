import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { authClient } from "../../lib/auth";
import { StatusBar } from "expo-status-bar";

export default function MessagesScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    enabled: !!session,
    queryFn: async () => {
      const res = await api.messages.conversations.$get();
      return res.json();
    },
  });

  if (!session) return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
        <Text style={styles.authTitle}>Sign in to view messages</Text>
        <TouchableOpacity style={styles.authBtn} onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.authBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FFCC00" /></View>
      ) : (
        <FlatList
          data={(data as any) ?? []}
          keyExtractor={(item: any) => item.conversation?.id ?? item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>💬</Text>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation from a listing</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const conv = item.conversation ?? item;
            const otherName = item.buyerName ?? "User";
            return (
              <TouchableOpacity
                style={styles.convoItem}
                onPress={() => router.push(`/conversation/${conv.id}`)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{otherName[0]?.toUpperCase() ?? "?"}</Text>
                </View>
                <View style={styles.convoInfo}>
                  <View style={styles.convoTop}>
                    <Text style={styles.convoName}>{otherName}</Text>
                    <Text style={styles.convoTime}>{conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}</Text>
                  </View>
                  <Text style={styles.listingTitle} numberOfLines={1}>re: {item.listingTitle ?? "Listing"}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  header: { backgroundColor: "#16161E", paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#2a2a3a" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  authTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  authBtn: { backgroundColor: "#FFCC00", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  authBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },
  convoItem: { flexDirection: "row", padding: 16, borderBottomWidth: 1, borderBottomColor: "#1a1a24", alignItems: "center", gap: 12 },
  convoUnread: { backgroundColor: "#16161E" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFCC00", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#000" },
  convoInfo: { flex: 1, minWidth: 0 },
  convoTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  convoName: { fontSize: 15, fontWeight: "700", color: "#fff" },
  convoTime: { fontSize: 11, color: "#555" },
  listingTitle: { fontSize: 12, color: "#FFCC00", marginBottom: 2 },
  lastMsg: { fontSize: 13, color: "#666" },
  unreadBadge: { backgroundColor: "#FFCC00", borderRadius: 12, minWidth: 22, height: 22, justifyContent: "center", alignItems: "center", paddingHorizontal: 6 },
  unreadText: { color: "#000", fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 8 },
  emptySubtext: { color: "#555", fontSize: 14 },
});
