import { Link, useLocation } from "wouter";
import { authClient, clearToken } from "../lib/auth";
import { useState } from "react";

export function Navbar() {
  const { data: session } = authClient.useSession();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    clearToken();
    navigate("/");
  };

  return (
    <nav style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ fontSize: 28, fontFamily: "Poppins", fontWeight: 900, color: "var(--primary)" }}>⚡</span>
          <span style={{ fontSize: 22, fontFamily: "Poppins", fontWeight: 800, color: "white" }}>Auction<span style={{ color: "var(--primary)" }}>ize</span></span>
        </Link>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 480, margin: "0 32px", display: "flex" }}>
          <form onSubmit={(e) => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value; navigate(`/listings?search=${encodeURIComponent(q)}`); }} style={{ display: "flex", width: "100%" }}>
            <input
              name="q"
              placeholder="Search listings..."
              style={{
                flex: 1, padding: "8px 16px", borderRadius: "8px 0 0 8px",
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                color: "white", outline: "none", fontFamily: "Inter", fontSize: 14,
              }}
            />
            <button type="submit" style={{ padding: "8px 16px", borderRadius: "0 8px 8px 0", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "Inter", fontSize: 14 }}>
              Search
            </button>
          </form>
        </div>

        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/listings" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, fontWeight: 500, fontFamily: "Inter" }}>Browse</Link>
          {session ? (
            <>
              <Link href="/sell" style={{ padding: "8px 16px", background: "var(--primary)", color: "white", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: "Poppins" }}>+ Sell</Link>
              <Link href="/messages" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>💬</Link>
              <div style={{ position: "relative" }}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14 }}>
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </button>
                {menuOpen && (
                  <div style={{ position: "absolute", right: 0, top: 44, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 0", minWidth: 180, zIndex: 200 }}>
                    <Link href="/dashboard/seller" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 16px", color: "white", textDecoration: "none", fontSize: 14, fontFamily: "Inter" }}>Seller Dashboard</Link>
                    <Link href="/dashboard/buyer" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 16px", color: "white", textDecoration: "none", fontSize: 14, fontFamily: "Inter" }}>My Purchases</Link>
                    <Link href="/messages" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 16px", color: "white", textDecoration: "none", fontSize: 14, fontFamily: "Inter" }}>Messages</Link>
                    {(session.user.email === "danieljones@auctionize.com" || session.user.email === "admin@auctionize.com") && (
                      <Link href="/admin" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "10px 16px", color: "var(--warning)", textDecoration: "none", fontSize: 14, fontFamily: "Inter" }}>Admin Panel</Link>
                    )}
                    <div style={{ borderTop: "1px solid var(--border)", margin: "8px 0" }} />
                    <button onClick={handleSignOut} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontFamily: "Inter" }}>Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/sign-in" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Sign In</Link>
              <Link href="/sign-up" style={{ padding: "8px 16px", background: "var(--primary)", color: "white", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: "Poppins" }}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
