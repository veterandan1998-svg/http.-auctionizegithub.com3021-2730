import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../lib/api";
import { authClient } from "../../lib/auth";
import { useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = authClient.useSession();
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["conversation", id],
    enabled: !!session && !!id,
    refetchInterval: 5000,
    queryFn: async () => {
      const res = await api.messages.conversations[":id"].$get({ param: { id: id! } });
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await api.messages[":conversationId"].$post({
        param: { conversationId: id! },
        json: { content: text.trim() },
      });
      return res.json();
    },
    onSuccess: () => {
      setText("");
      refetch();
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    sendMutation.mutate();
  };

  const msgs: any[] = ((data as any)?.messages ?? []).map((m: any) => ({ ...m.message, senderName: m.senderName }));
  const myId = session?.user?.id;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Conversation</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FFCC00" /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 20 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }: { item: any }) => {
            const isMe = item.senderId === myId;
            return (
              <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
                  <Text style={[styles.bubbleTime, isMe && { color: "rgba(0,0,0,0.5)" }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#555"
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
          onPress={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  header: { backgroundColor: "#16161E", paddingTop: 52, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#2a2a3a", flexDirection: "row", alignItems: "center" },
  back: { color: "#FFCC00", fontWeight: "700", fontSize: 14, width: 60 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11, color: "#FFCC00", marginTop: 2 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  msgRow: { flexDirection: "row" },
  msgRowMe: { justifyContent: "flex-end" },
  bubble: { maxWidth: "78%", borderRadius: 16, padding: 12 },
  bubbleMe: { backgroundColor: "#FFCC00", borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: "#16161E", borderWidth: 1, borderColor: "#2a2a3a", borderBottomLeftRadius: 4 },
  bubbleText: { color: "#fff", fontSize: 15, lineHeight: 20 },
  bubbleTextMe: { color: "#000" },
  bubbleTime: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 4, textAlign: "right" },
  inputBar: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#2a2a3a", backgroundColor: "#16161E", gap: 10, alignItems: "flex-end" },
  input: { flex: 1, backgroundColor: "#0A0A0F", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: "#fff", fontSize: 15, maxHeight: 100 },
  sendBtn: { backgroundColor: "#FFCC00", width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  sendIcon: { color: "#000", fontSize: 18, fontWeight: "900" },
});
