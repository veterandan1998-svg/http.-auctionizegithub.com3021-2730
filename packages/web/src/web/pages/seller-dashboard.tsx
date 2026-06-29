import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { authClient } from "../lib/auth";
import { Link } from "wouter";

export default function SellerDashboard() {
  const { data: session } = authClient.useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "seller"],
    queryFn: async () => {
      const res = await api.dashboard.seller.$get();
      return res.json();
    },
    enabled: !!session,
  });

  const statCard = (label: string, value: string, color = "white") => (
    <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "24px", border: "1px solid var(--border)", flex: 1, minWidth: 160 }}>
      <div style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color }}>{value}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color: "white" }}>Seller Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", fontFamily: "Inter", marginTop: 4 }}>Hi {session?.user.name} 👋</p>
        </div>
        <Link href="/sell" style={{ padding: "12px 24px", background: "var(--primary)", color: "white", borderRadius: 10, textDecoration: "none", fontFamily: "Poppins", fontWeight: 700, fontSize: 15 }}>+ New Listing</Link>
      </div>

      {isLoading ? (
        <div style={{ color: "var(--text-secondary)", fontFamily: "Inter" }}>Loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
            {statCard("Total Revenue", `$${(data?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "var(--success)")}
            {statCard("Total Orders", data?.totalOrders?.toString() ?? "0", "var(--primary)")}
            {statCard("Active Listings", data?.activeListings?.toString() ?? "0", "var(--accent)")}
          </div>

          {/* My Listings */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "white", marginBottom: 16 }}>My Listings</h2>
            {!data?.myListings?.length ? (
              <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 32, textAlign: "center", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <p style={{ color: "var(--text-secondary)", fontFamily: "Inter" }}>No listings yet. <Link href="/sell" style={{ color: "var(--primary)" }}>Create one!</Link></p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.myListings.map((listing: any) => (
                  <div key={listing.id} style={{ background: "var(--bg-card)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15, color: "white", marginBottom: 4 }}>{listing.title}</div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span style={{ fontFamily: "Poppins", fontWeight: 700, color: "var(--primary)", fontSize: 16 }}>${listing.price}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontFamily: "Inter", fontWeight: 600, background: listing.status === "active" ? "rgba(0,200,83,0.15)" : "rgba(160,160,160,0.15)", color: listing.status === "active" ? "var(--success)" : "var(--text-secondary)" }}>{listing.status}</span>
                        {listing.isPromoted && <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontFamily: "Inter", fontWeight: 700, background: "rgba(255,214,0,0.2)", color: "var(--warning)" }}>⚡ Promoted</span>}
                        <span style={{ color: "var(--text-muted)", fontFamily: "Inter", fontSize: 12 }}>{listing.viewCount} views</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Link href={`/listings/${listing.id}`} style={{ padding: "6px 14px", background: "var(--bg-elevated)", color: "var(--text-secondary)", borderRadius: 8, textDecoration: "none", fontFamily: "Inter", fontSize: 13, border: "1px solid var(--border)" }}>View</Link>
                      <Link href={`/sell?edit=${listing.id}`} style={{ padding: "6px 14px", background: "var(--accent)", color: "white", borderRadius: 8, textDecoration: "none", fontFamily: "Inter", fontSize: 13, fontWeight: 600 }}>Edit</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div>
            <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "white", marginBottom: 16 }}>Recent Sales</h2>
            {!data?.recentOrders?.length ? (
              <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 32, textAlign: "center", border: "1px solid var(--border)" }}>
                <p style={{ color: "var(--text-secondary)", fontFamily: "Inter" }}>No sales yet</p>
              </div>
            ) : (
              <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Order ID", "Amount", "Your Cut", "Status", "Date"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 12, textAlign: "left", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order: any) => (
                      <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "Inter", fontSize: 13, color: "var(--text-secondary)" }}>{order.id.slice(0, 8)}...</td>
                        <td style={{ padding: "12px 16px", fontFamily: "Poppins", fontWeight: 700, color: "white" }}>${order.amount.toFixed(2)}</td>
                        <td style={{ padding: "12px 16px", fontFamily: "Poppins", fontWeight: 700, color: "var(--success)" }}>${order.sellerPayout.toFixed(2)}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontFamily: "Inter", fontWeight: 600, background: order.status === "paid" ? "rgba(0,200,83,0.15)" : "rgba(160,160,160,0.15)", color: order.status === "paid" ? "var(--success)" : "var(--text-secondary)" }}>{order.status}</span></td>
                        <td style={{ padding: "12px 16px", fontFamily: "Inter", fontSize: 13, color: "var(--text-muted)" }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
