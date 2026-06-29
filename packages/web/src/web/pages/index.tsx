import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link, useLocation } from "wouter";
import { ListingCard } from "../components/listing-card";

const CATEGORIES = ["Electronics", "Clothing", "Vehicles", "Home & Garden", "Sports", "Collectibles", "Books", "Toys", "Art", "Other"];

function Index() {
  const [, navigate] = useLocation();
  const promoted = useQuery({
    queryKey: ["listings", "promoted"],
    queryFn: async () => {
      const res = await api.listings.$get({ query: { promoted: "true" } });
      return res.json();
    },
  });
  const recent = useQuery({
    queryKey: ["listings", "recent"],
    queryFn: async () => {
      const res = await api.listings.$get({ query: {} });
      return res.json();
    },
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)", padding: "64px 16px 48px", textAlign: "center", borderBottom: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.15) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,102,255,0.15) 0%, transparent 70%)" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", borderRadius: 999, padding: "4px 16px", marginBottom: 24 }}>
            <span style={{ color: "var(--primary)", fontSize: 12, fontWeight: 700, fontFamily: "Poppins", letterSpacing: "0.05em" }}>⚡ LIVE MARKETPLACE</span>
          </div>
          <h1 style={{ fontFamily: "Poppins", fontWeight: 900, fontSize: 56, lineHeight: 1.1, color: "white", marginBottom: 16 }}>
            Buy & Sell <span style={{ color: "var(--primary)" }}>Anything</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 18, fontFamily: "Inter", marginBottom: 32, lineHeight: 1.6 }}>The marketplace where great deals happen. List in minutes, sell fast.</p>
          <form onSubmit={(e) => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value; navigate(`/listings?search=${encodeURIComponent(q)}`); }} style={{ display: "flex", gap: 0, maxWidth: 480, margin: "0 auto 32px" }}>
            <input
              name="q"
              placeholder="What are you looking for?"
              style={{ flex: 1, padding: "14px 20px", borderRadius: "12px 0 0 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "white", outline: "none", fontFamily: "Inter", fontSize: 16 }}
            />
            <button type="submit" style={{ padding: "14px 24px", background: "var(--primary)", color: "white", border: "none", borderRadius: "0 12px 12px 0", cursor: "pointer", fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>Search</button>
          </form>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {CATEGORIES.slice(0, 6).map(cat => (
              <Link key={cat} href={`/listings?category=${encodeURIComponent(cat)}`} style={{ padding: "6px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 999, color: "var(--text-secondary)", textDecoration: "none", fontSize: 13, fontFamily: "Inter", transition: "all 0.15s" }}>
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "16px", display: "flex", justifyContent: "center", gap: 48 }}>
        {[["10M+", "Listings"], ["500K+", "Sellers"], ["No Fees*", "For Buyers"], ["Secure", "Checkout"]].map(([num, label]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 20, color: "var(--primary)" }}>{num}</div>
            <div style={{ fontFamily: "Inter", fontSize: 12, color: "var(--text-secondary)" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 16px" }}>
        {/* Promoted Listings */}
        {(promoted.data?.length ?? 0) > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ background: "linear-gradient(135deg, #FFD600, #FF6B00)", borderRadius: 8, padding: "4px 12px" }}>
                <span style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 14, color: "#000" }}>⚡ PROMOTED</span>
              </div>
              <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 24, color: "white" }}>Featured Listings</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {promoted.data?.slice(0, 4).map((listing: any) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Listings */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 28, color: "white" }}>Latest Listings</h2>
            <Link href="/listings" style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "Inter", fontWeight: 600, fontSize: 14 }}>View All →</Link>
          </div>
          {recent.isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ background: "var(--bg-card)", borderRadius: 12, aspectRatio: "3/4", border: "1px solid var(--border)", animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : recent.data?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-secondary)", fontFamily: "Inter" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
              <p>No listings yet. <Link href="/sell" style={{ color: "var(--primary)" }}>Be the first to sell!</Link></p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {recent.data?.slice(0, 12).map((listing: any) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          )}
        </section>

        {/* CTA Sell */}
        <div style={{ marginTop: 64, background: "linear-gradient(135deg, rgba(255,107,0,0.15), rgba(0,102,255,0.15))", border: "1px solid rgba(255,107,0,0.3)", borderRadius: 16, padding: "40px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color: "white", marginBottom: 12 }}>Got something to sell?</h2>
          <p style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 16, marginBottom: 24 }}>List it in 2 minutes. Reach thousands of buyers. You keep 90%.</p>
          <Link href="/sell" style={{ display: "inline-block", padding: "14px 32px", background: "var(--primary)", color: "white", borderRadius: 12, textDecoration: "none", fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>Start Selling →</Link>
        </div>
      </div>
    </div>
  );
}

export default Index;
