import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { authClient } from "../lib/auth";
import { useState } from "react";

const TABS = ["Overview", "Listings", "Orders", "Users"];

export default function AdminPage() {
  const { data: session } = authClient.useSession();
  const [tab, setTab] = useState("Overview");
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await api.admin.stats.$get();
      return res.json();
    },
    enabled: !!session,
  });
  const { data: listings } = useQuery({
    queryKey: ["admin", "listings"],
    queryFn: async () => {
      const res = await api.admin.listings.$get();
      return res.json();
    },
    enabled: tab === "Listings" && !!session,
  });
  const { data: orders } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const res = await api.admin.orders.$get();
      return res.json();
    },
    enabled: tab === "Orders" && !!session,
  });
  const { data: users } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api.admin.users.$get();
      return res.json();
    },
    enabled: tab === "Users" && !!session,
  });

  const removeListing = useMutation({
    mutationFn: async (id: string) => {
      await api.admin.listings[":id"].$delete({ param: { id } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "listings"] }),
  });

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div style={{ background: "var(--warning)", color: "#000", padding: "4px 12px", borderRadius: 8, fontFamily: "Poppins", fontWeight: 800, fontSize: 14 }}>ADMIN</div>
        <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color: "white" }}>Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "var(--bg-card)", borderRadius: 12, padding: 4, width: "fit-content", border: "1px solid var(--border)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: tab === t ? "var(--primary)" : "transparent", color: tab === t ? "white" : "var(--text-secondary)", cursor: "pointer", fontFamily: "Poppins", fontWeight: 600, fontSize: 14, transition: "all 0.15s" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && stats && (
        <div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Total Revenue", value: `$${(stats.totalRevenue ?? 0).toFixed(2)}`, color: "var(--primary)" },
              { label: "Platform Earnings (10%)", value: `$${(stats.platformRevenue ?? 0).toFixed(2)}`, color: "var(--success)" },
              { label: "Total Orders", value: stats.totalOrders?.toString(), color: "var(--accent)" },
              { label: "Total Listings", value: stats.totalListings?.toString(), color: "var(--warning)" },
              { label: "Total Users", value: stats.totalUsers?.toString(), color: "white" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", flex: 1, minWidth: 160 }}>
                <div style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 13, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listings */}
      {tab === "Listings" && (
        <div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "white", marginBottom: 16 }}>All Listings ({listings?.length ?? 0})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {listings?.map((l: any) => (
              <div key={l.id} style={{ background: "var(--bg-card)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15, color: "white" }}>{l.title}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                    <span style={{ fontFamily: "Poppins", fontWeight: 700, color: "var(--primary)" }}>${l.price}</span>
                    <span style={{ fontFamily: "Inter", fontSize: 12, color: "var(--text-muted)" }}>{l.category}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontFamily: "Inter", fontWeight: 600, background: l.status === "active" ? "rgba(0,200,83,0.15)" : "rgba(160,160,160,0.15)", color: l.status === "active" ? "var(--success)" : "var(--text-secondary)" }}>{l.status}</span>
                  </div>
                </div>
                <button onClick={() => removeListing.mutate(l.id)} style={{ padding: "6px 14px", background: "rgba(255,59,48,0.15)", color: "var(--danger)", border: "1px solid rgba(255,59,48,0.3)", borderRadius: 8, cursor: "pointer", fontFamily: "Inter", fontSize: 13, fontWeight: 600 }}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders */}
      {tab === "Orders" && (
        <div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "white", marginBottom: 16 }}>All Orders ({orders?.length ?? 0})</h2>
          <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["ID", "Amount", "Platform Fee", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 12, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders?.map((o: any) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "Inter", fontSize: 13, color: "var(--text-secondary)" }}>{o.id.slice(0, 10)}...</td>
                    <td style={{ padding: "12px 16px", fontFamily: "Poppins", fontWeight: 700, color: "white" }}>${o.amount?.toFixed(2)}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "Poppins", fontWeight: 700, color: "var(--success)" }}>${o.platformFee?.toFixed(2)}</td>
                    <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontFamily: "Inter", fontWeight: 600, background: o.status === "paid" ? "rgba(0,200,83,0.15)" : "rgba(160,160,160,0.15)", color: o.status === "paid" ? "var(--success)" : "var(--text-secondary)" }}>{o.status}</span></td>
                    <td style={{ padding: "12px 16px", fontFamily: "Inter", fontSize: 13, color: "var(--text-muted)" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === "Users" && (
        <div>
          <h2 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "white", marginBottom: 16 }}>All Users ({users?.length ?? 0})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {users?.map((u: any) => (
              <div key={u.user.id} style={{ background: "var(--bg-card)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "white", flexShrink: 0 }}>
                  {u.user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 15, color: "white" }}>{u.user.name}</div>
                  <div style={{ fontFamily: "Inter", fontSize: 13, color: "var(--text-secondary)" }}>{u.user.email}</div>
                  <div style={{ fontFamily: "Inter", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Joined {new Date(u.user.createdAt).toLocaleDateString()} · {u.profile?.role ?? "buyer"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
