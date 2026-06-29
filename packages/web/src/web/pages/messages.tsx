import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { authClient } from "../lib/auth";
import { useSearch } from "wouter";
import { useState, useEffect, useRef } from "react";

export default function MessagesPage() {
  const { data: session } = authClient.useSession();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [activeConv, setActiveConv] = useState<string | null>(params.get("conv"));
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await api.messages.conversations.$get();
      return res.json();
    },
    enabled: !!session,
    refetchInterval: 5000,
  });

  const { data: msgData, refetch: refetchMsgs } = useQuery({
    queryKey: ["messages", activeConv],
    queryFn: async () => {
      if (!activeConv) return null;
      const res = await api.messages[":conversationId"].$get({ param: { conversationId: activeConv } });
      return res.json();
    },
    enabled: !!activeConv && !!session,
    refetchInterval: 3000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgData]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!activeConv || !newMsg.trim()) return;
      await api.messages[":conversationId"].$post({ param: { conversationId: activeConv }, json: { content: newMsg.trim() } });
    },
    onSuccess: () => { setNewMsg(""); refetchMsgs(); qc.invalidateQueries({ queryKey: ["conversations"] }); },
  });

  if (!session) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: "white" }}>Sign in to view messages</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", height: "calc(100vh - 64px)" }}>
      {/* Sidebar */}
      <div style={{ width: 300, background: "var(--bg-card)", borderRight: "1px solid var(--border)", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 18, color: "white" }}>Messages</h2>
        </div>
        {!conversations?.length ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontFamily: "Inter", fontSize: 14 }}>No conversations yet</div>
        ) : (
          conversations.map((conv: any) => (
            <button key={conv.conversation.id} onClick={() => setActiveConv(conv.conversation.id)}
              style={{ display: "block", width: "100%", padding: "14px 16px", textAlign: "left", background: activeConv === conv.conversation.id ? "rgba(255,107,0,0.1)" : "transparent", border: "none", borderLeft: activeConv === conv.conversation.id ? "3px solid var(--primary)" : "3px solid transparent", cursor: "pointer" }}>
              <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, color: "white", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.buyerName}</div>
              <div style={{ fontFamily: "Inter", fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.listingTitle}</div>
            </button>
          ))
        )}
      </div>

      {/* Chat */}
      {activeConv && msgData ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 24px", background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "white" }}>Conversation</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {msgData.messages?.map((m: any) => {
              const isMe = m.message.senderId === session.user.id;
              return (
                <div key={m.message.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "70%", background: isMe ? "var(--primary)" : "var(--bg-elevated)", color: "white", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px" }}>
                    <div style={{ fontFamily: "Inter", fontSize: 14, lineHeight: 1.5 }}>{m.message.content}</div>
                    <div style={{ fontFamily: "Inter", fontSize: 11, color: isMe ? "rgba(255,255,255,0.7)" : "var(--text-muted)", marginTop: 4 }}>
                      {new Date(m.message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ padding: 16, background: "var(--bg-card)", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), newMsg.trim() && sendMutation.mutate())}
              placeholder="Type a message..."
              style={{ flex: 1, padding: "10px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, color: "white", fontFamily: "Inter", fontSize: 14, outline: "none" }}
            />
            <button onClick={() => newMsg.trim() && sendMutation.mutate()} disabled={sendMutation.isPending || !newMsg.trim()}
              style={{ padding: "10px 20px", background: "var(--primary)", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "Poppins", fontWeight: 600, fontSize: 14 }}>
              Send
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48 }}>💬</div>
          <div style={{ fontFamily: "Inter", fontSize: 16 }}>Select a conversation to start chatting</div>
        </div>
      )}
    </div>
  );
}
