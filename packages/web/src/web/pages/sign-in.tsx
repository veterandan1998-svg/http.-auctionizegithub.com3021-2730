import { useState } from "react";
import { Link, useLocation } from "wouter";
import { authClient, captureToken } from "../lib/auth";

export default function SignInPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await authClient.signIn.email({ email, password }, { onSuccess: captureToken });
    if (error) {
      setError(error.message || "Sign in failed");
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 40, fontFamily: "Poppins", fontWeight: 900, color: "var(--primary)" }}>⚡</span>
            <div style={{ fontSize: 28, fontFamily: "Poppins", fontWeight: 800, color: "white" }}>Auction<span style={{ color: "var(--primary)" }}>ize</span></div>
          </Link>
          <p style={{ color: "var(--text-secondary)", fontFamily: "Inter", marginTop: 8 }}>Welcome back</p>
        </div>
        <form onSubmit={handleSubmit} style={{ background: "var(--bg-card)", borderRadius: 16, padding: 32, border: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "white", marginBottom: 24 }}>Sign In</h2>
          {error && (
            <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "var(--danger)", fontSize: 14, fontFamily: "Inter" }}>{error}</div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              style={{ width: "100%", padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "white", fontFamily: "Inter", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: "100%", padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "white", fontFamily: "Inter", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: loading ? "#666" : "var(--primary)", color: "white", border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p style={{ textAlign: "center", marginTop: 20, color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14 }}>
            Don't have an account? <Link href="/sign-up" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
