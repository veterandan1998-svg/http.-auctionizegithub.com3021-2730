import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { authClient } from "../lib/auth";

interface Props { id: string; }

export default function ListingDetailPage({ id }: Props) {
  const [, navigate] = useLocation();
  const { data: session } = authClient.useSession();
  const qc = useQueryClient();
  const [activeImg, setActiveImg] = useState(0);
  const [msgContent, setMsgContent] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [promoteTier, setPromoteTier] = useState<string | null>(null);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const res = await api.listings[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", listing?.sellerId],
    enabled: !!listing?.sellerId,
    queryFn: async () => {
      const res = await api.reviews[":userId"].$get({ param: { userId: listing.sellerId } });
      return res.json();
    },
  });

  const { data: tiers } = useQuery({
    queryKey: ["promo-tiers"],
    queryFn: async () => {
      const res = await api.promotions.tiers.$get();
      return res.json();
    },
  });

  const buyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.orders.checkout.$post({ json: { listingId: id } });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const msgMutation = useMutation({
    mutationFn: async () => {
      // Start or get conversation
      const convRes = await api.messages.conversations.$post({ json: { listingId: id, sellerId: listing.sellerId } });
      const conv = await convRes.json();
      // Send message
      await api.messages[":conversationId"].$post({ param: { conversationId: conv.id }, json: { content: msgContent } });
      return conv.id;
    },
    onSuccess: (convId) => {
      setMsgSent(true);
      setMsgContent("");
      setTimeout(() => navigate(`/messages?conv=${convId}`), 1500);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (tier: string) => {
      const res = await api.promotions.checkout.$post({ json: { listingId: id, tier } });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) window.location.href = data.url;
    },
  });

  if (isLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "var(--text-secondary)", fontFamily: "Inter" }}>Loading listing...</div>
    </div>
  );

  if (!listing) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontFamily: "Poppins", fontWeight: 700, color: "white" }}>Listing not found</h2>
        <Link href="/listings" style={{ color: "var(--accent)", fontFamily: "Inter" }}>← Back to listings</Link>
      </div>
    </div>
  );

  const isSeller = session?.user.id === listing.sellerId;
  const isSold = listing.status === "sold";

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 16px" }}>
      <Link href="/listings" style={{ color: "var(--text-secondary)", textDecoration: "none", fontFamily: "Inter", fontSize: 14, marginBottom: 24, display: "inline-block" }}>← Back to listings</Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 40, alignItems: "start" }}>
        {/* Left: Images + Details */}
        <div>
          {/* Main image */}
          <div style={{ background: "var(--bg-elevated)", borderRadius: 16, overflow: "hidden", aspectRatio: "4/3", marginBottom: 12, position: "relative" }}>
            {listing.imageUrls?.[activeImg] ? (
              <img src={listing.imageUrls[activeImg]} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 64, color: "var(--text-muted)" }}>📦</div>
            )}
            {listing.isPromoted && (
              <div style={{ position: "absolute", top: 16, left: 16, background: "linear-gradient(135deg, #FFD600, #FF6B00)", color: "#000", fontFamily: "Poppins", fontWeight: 800, fontSize: 13, padding: "4px 12px", borderRadius: 999 }}>⚡ PROMOTED</div>
            )}
            {isSold && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ background: "var(--danger)", color: "white", fontFamily: "Poppins", fontWeight: 800, fontSize: 32, padding: "10px 24px", borderRadius: 12 }}>SOLD</span>
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {listing.imageUrls?.length > 1 && (
            <div style={{ display: "flex", gap: 8 }}>
              {listing.imageUrls.map((url: string, i: number) => (
                <button key={i} onClick={() => setActiveImg(i)} style={{ width: 72, height: 72, borderRadius: 8, overflow: "hidden", border: `2px solid ${activeImg === i ? "var(--primary)" : "transparent"}`, padding: 0, cursor: "pointer", background: "none" }}>
                  <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: "white", marginBottom: 12 }}>Description</h2>
            <p style={{ color: "var(--text-secondary)", fontFamily: "Inter", lineHeight: 1.7, fontSize: 15 }}>{listing.description}</p>
          </div>

          {/* Reviews */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: "white" }}>Seller Reviews</h2>
              {reviews?.avgRating && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--warning)", fontSize: 18 }}>⭐</span>
                  <span style={{ fontFamily: "Poppins", fontWeight: 700, color: "white" }}>{parseFloat(reviews.avgRating).toFixed(1)}</span>
                  <span style={{ color: "var(--text-muted)", fontFamily: "Inter", fontSize: 13 }}>({reviews.total})</span>
                </div>
              )}
            </div>
            {reviews?.reviews?.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontFamily: "Inter" }}>No reviews yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reviews?.reviews?.slice(0, 3).map((r: any) => (
                  <div key={r.review.id} style={{ background: "var(--bg-card)", borderRadius: 12, padding: 16, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "white" }}>
                        {r.reviewerName?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontFamily: "Inter", fontWeight: 600, color: "white", fontSize: 14 }}>{r.reviewerName}</span>
                      <span style={{ color: "var(--warning)" }}>{"⭐".repeat(r.review.rating)}</span>
                    </div>
                    {r.review.comment && <p style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, lineHeight: 1.5, margin: 0 }}>{r.review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Purchase Panel */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <span style={{ background: "var(--bg-elevated)", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "Inter" }}>{listing.category}</span>
              {listing.location && <span style={{ background: "var(--bg-elevated)", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "var(--text-secondary)", fontFamily: "Inter" }}>📍 {listing.location}</span>}
            </div>
            <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 26, color: "white", lineHeight: 1.2, marginBottom: 8 }}>{listing.title}</h1>
            <div style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 40, color: "var(--primary)", marginBottom: 16 }}>${listing.price?.toLocaleString()}</div>

            {/* Seller */}
            <Link href={`/profile/${listing.sellerId}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 20, padding: "12px", background: "var(--bg-elevated)", borderRadius: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "white" }}>
                {listing.sellerName?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, color: "white" }}>{listing.sellerName}</div>
                <div style={{ fontFamily: "Inter", fontSize: 12, color: "var(--text-muted)" }}>Seller · {listing.viewCount} views</div>
              </div>
            </Link>

            {/* Buy button */}
            {!isSeller && !isSold && session && (
              <button onClick={() => buyMutation.mutate()} disabled={buyMutation.isPending}
                style={{ width: "100%", padding: "14px", background: buyMutation.isPending ? "#666" : "var(--primary)", color: "white", border: "none", borderRadius: 12, cursor: buyMutation.isPending ? "not-allowed" : "pointer", fontFamily: "Poppins", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
                {buyMutation.isPending ? "Processing..." : "Buy Now"}
              </button>
            )}
            {!session && !isSold && (
              <Link href="/sign-in" style={{ display: "block", textAlign: "center", padding: "14px", background: "var(--primary)", color: "white", borderRadius: 12, textDecoration: "none", fontFamily: "Poppins", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
                Sign in to Buy
              </Link>
            )}
            {isSold && (
              <div style={{ textAlign: "center", padding: "14px", background: "var(--bg-elevated)", color: "var(--text-muted)", borderRadius: 12, fontFamily: "Poppins", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>This item is sold</div>
            )}

            {/* Message Seller */}
            {!isSeller && session && !isSold && (
              <div style={{ marginTop: 4 }}>
                {msgSent ? (
                  <div style={{ textAlign: "center", color: "var(--success)", fontFamily: "Inter", fontWeight: 600, fontSize: 14 }}>✓ Message sent! Redirecting to inbox...</div>
                ) : (
                  <div>
                    <textarea value={msgContent} onChange={e => setMsgContent(e.target.value)} placeholder="Ask the seller a question..."
                      style={{ width: "100%", padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, color: "white", fontFamily: "Inter", fontSize: 14, outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
                    <button onClick={() => msgContent.trim() && msgMutation.mutate()} disabled={msgMutation.isPending || !msgContent.trim()}
                      style={{ width: "100%", padding: "10px", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: 14, marginTop: 8 }}>
                      💬 {msgMutation.isPending ? "Sending..." : "Message Seller"}
                    </button>
                  </div>
                )}
              </div>
            )}
            {buyMutation.error && <p style={{ color: "var(--danger)", fontFamily: "Inter", fontSize: 13, marginTop: 8 }}>Error: {(buyMutation.error as any).message}</p>}
          </div>

          {/* Promote (seller only) */}
          {isSeller && !isSold && (
            <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 20, border: "1px solid rgba(255,214,0,0.3)" }}>
              <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 16, color: "var(--warning)", marginBottom: 12 }}>⚡ Boost This Listing</h3>
              {tiers && Object.entries(tiers).map(([key, tier]: [string, any]) => (
                <button key={key} onClick={() => promoteMutation.mutate(key)}
                  style={{ display: "block", width: "100%", padding: "10px 14px", background: promoteTier === key ? "rgba(255,214,0,0.15)" : "var(--bg-elevated)", border: `1px solid ${promoteTier === key ? "var(--warning)" : "var(--border)"}`, borderRadius: 8, color: "white", cursor: "pointer", fontFamily: "Inter", fontSize: 13, textAlign: "left", marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{tier.label}</div>
                  <div style={{ color: "var(--warning)", fontWeight: 700 }}>${(tier.amount / 100).toFixed(2)}</div>
                </button>
              ))}
            </div>
          )}

          {/* Edit (seller only) */}
          {isSeller && (
            <Link href={`/sell?edit=${id}`} style={{ display: "block", textAlign: "center", marginTop: 12, padding: "10px", background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 10, textDecoration: "none", fontFamily: "Inter", fontSize: 14 }}>
              ✏️ Edit Listing
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
