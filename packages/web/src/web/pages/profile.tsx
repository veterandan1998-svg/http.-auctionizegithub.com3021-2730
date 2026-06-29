import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link } from "wouter";
import { Navbar } from "../components/navbar";
import { ListingCard } from "../components/listing-card";

interface Props { id: string; }

export default function ProfilePage({ id }: Props) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const res = await api.profile[":userId"].$get({ param: { userId: id } });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["listings", "user", id],
    enabled: !!profile,
    queryFn: async () => {
      const res = await api.listings.seller[":sellerId"].$get({ param: { sellerId: id } });
      return res.json();
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const res = await api.reviews[":userId"].$get({ param: { userId: id } });
      return res.json();
    },
  });

  const stars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? "var(--warning)" : "var(--border)", fontSize: 16 }}>★</span>
    ));

  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
          <div style={{ color: "var(--text-secondary)", fontFamily: "Inter" }}>Loading profile...</div>
        </div>
      </div>
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 24, color: "white", marginBottom: 8 }}>User not found</h2>
          <Link href="/listings" style={{ color: "var(--primary)", fontFamily: "Inter", textDecoration: "none" }}>Browse listings →</Link>
        </div>
      </div>
    </div>
  );

  const avgRating = (reviews as any)?.avgRating ?? 0;
  const totalReviews = (reviews as any)?.total ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {/* Hero banner */}
      <div style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)", height: 160 }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
        {/* Profile header card */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20,
          padding: "32px", marginTop: -60, position: "relative", zIndex: 1,
          display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 96, height: 96, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40, fontWeight: 800, fontFamily: "Poppins", color: "white",
              border: "4px solid var(--bg-card)", flexShrink: 0,
            }}>
              {(profile as any)?.user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 28, color: "white", margin: 0 }}>
              {(profile as any)?.user?.name}
            </h1>
            {(profile as any)?.profile?.location && (
              <p style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, margin: "6px 0 0" }}>
                📍 {(profile as any).profile.location}
              </p>
            )}
            {(profile as any)?.profile?.bio && (
              <p style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, margin: "10px 0 0", maxWidth: 480, lineHeight: 1.6 }}>
                {(profile as any).profile.bio}
              </p>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 24, color: "white" }}>{(listings as any)?.length ?? 0}</div>
              <div style={{ fontFamily: "Inter", fontSize: 12, color: "var(--text-secondary)" }}>Listings</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 24, color: "var(--warning)" }}>
                {avgRating > 0 ? avgRating.toFixed(1) : "—"}
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 12, color: "var(--text-secondary)" }}>Rating</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 24, color: "white" }}>{totalReviews}</div>
              <div style={{ fontFamily: "Inter", fontSize: 12, color: "var(--text-secondary)" }}>Reviews</div>
            </div>
          </div>
        </div>

        {/* Listings */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "white", marginBottom: 20 }}>
            Active Listings
          </h2>
          {(listings as any)?.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {(listings as any).map((l: any) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px", background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <p style={{ color: "var(--text-secondary)", fontFamily: "Inter" }}>No active listings</p>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div style={{ marginTop: 48, marginBottom: 60 }}>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "white", marginBottom: 20 }}>
            Reviews {totalReviews > 0 && (
              <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-secondary)" }}>({totalReviews})</span>
            )}
          </h2>

          {avgRating > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 48, color: "var(--warning)" }}>
                {avgRating.toFixed(1)}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2 }}>{stars(avgRating)}</div>
                <div style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 13 }}>{totalReviews} reviews</div>
              </div>
            </div>
          )}

          {(reviews as any)?.reviews?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(reviews as any).reviews.map((r: any) => (
                <div key={r.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15, color: "white" }}>{r.reviewerName ?? "Anonymous"}</div>
                      <div style={{ display: "flex", gap: 2, marginTop: 4 }}>{stars(r.rating)}</div>
                    </div>
                    <div style={{ color: "var(--text-muted)", fontFamily: "Inter", fontSize: 12 }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {r.comment && (
                    <p style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px", background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
              <p style={{ color: "var(--text-secondary)", fontFamily: "Inter" }}>No reviews yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
