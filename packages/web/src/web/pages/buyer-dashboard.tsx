import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { authClient } from "../lib/auth";
import { Link } from "wouter";

export default function BuyerDashboard() {
  const { data: session } = authClient.useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "buyer"],
    queryFn: async () => {
      const res = await api.dashboard.buyer.$get();
      return res.json();
    },
    enabled: !!session,
  });

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 16px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color: "white" }}>My Purchases</h1>
        <p style={{ color: "var(--text-secondary)", fontFamily: "Inter", marginTop: 4 }}>Track your orders and leave reviews</p>
      </div>

      {isLoading ? (
        <div style={{ color: "var(--text-secondary)", fontFamily: "Inter" }}>Loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
            <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", flex: 1, minWidth: 160 }}>
              <div style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 13, marginBottom: 8 }}>Total Spent</div>
              <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color: "var(--primary)" }}>${(data?.totalSpent ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", flex: 1, minWidth: 160 }}>
              <div style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 13, marginBottom: 8 }}>Total Orders</div>
              <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color: "var(--accent)" }}>{data?.totalOrders ?? 0}</div>
            </div>
          </div>

          {/* Orders */}
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "white", marginBottom: 16 }}>Order History</h2>
          {!data?.recentOrders?.length ? (
            <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 48, textAlign: "center", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
              <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 20, color: "white", marginBottom: 8 }}>No orders yet</h3>
              <Link href="/listings" style={{ color: "var(--primary)", fontFamily: "Inter", textDecoration: "none" }}>Browse listings →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.recentOrders.map((order: any) => (
                <div key={order.id} style={{ background: "var(--bg-card)", borderRadius: 12, padding: "20px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "Inter", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Order #{order.id.slice(0, 8)}</div>
                    <Link href={`/listings/${order.listingId}`} style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 16, color: "white", textDecoration: "none" }}>View Item</Link>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
                      <span style={{ fontFamily: "Poppins", fontWeight: 700, color: "var(--primary)", fontSize: 18 }}>${order.amount.toFixed(2)}</span>
                      <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontFamily: "Inter", fontWeight: 600, background: order.status === "paid" ? "rgba(0,200,83,0.15)" : "rgba(160,160,160,0.15)", color: order.status === "paid" ? "var(--success)" : "var(--text-secondary)" }}>{order.status}</span>
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  {order.status === "paid" && (
                    <Link href={`/listings/${order.listingId}`} style={{ padding: "8px 16px", background: "var(--accent)", color: "white", borderRadius: 8, textDecoration: "none", fontFamily: "Inter", fontSize: 13, fontWeight: 600 }}>Leave Review</Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
