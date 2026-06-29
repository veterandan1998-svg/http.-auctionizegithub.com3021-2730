import { Link } from "wouter";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  category: string;
  location?: string | null;
  imageUrls?: string[];
  isPromoted?: boolean;
  sellerName?: string;
  status?: string;
}

export function ListingCard({ id, title, price, category, location, imageUrls, isPromoted, sellerName, status }: ListingCardProps) {
  return (
    <Link href={`/listings/${id}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        background: "var(--bg-card)",
        borderRadius: 12,
        overflow: "hidden",
        border: isPromoted ? "1px solid #FFD600" : "1px solid var(--border)",
        boxShadow: isPromoted ? "0 0 16px rgba(255,214,0,0.2)" : "none",
        transition: "transform 0.15s, box-shadow 0.15s",
        cursor: "pointer",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = isPromoted ? "0 4px 24px rgba(255,214,0,0.3)" : "0 4px 16px rgba(0,0,0,0.4)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = isPromoted ? "0 0 16px rgba(255,214,0,0.2)" : "none"; }}
      >
        {/* Image */}
        <div style={{ width: "100%", aspectRatio: "4/3", background: "var(--bg-elevated)", position: "relative", overflow: "hidden" }}>
          {imageUrls?.[0] ? (
            <img src={imageUrls[0]} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: 40 }}>📦</div>
          )}
          {isPromoted && (
            <div style={{ position: "absolute", top: 8, left: 8, background: "linear-gradient(135deg, #FFD600, #FF6B00)", color: "#000", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999, fontFamily: "Poppins", letterSpacing: "0.05em" }}>
              ⚡ PROMOTED
            </div>
          )}
          {status === "sold" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ background: "var(--danger)", color: "white", fontFamily: "Poppins", fontWeight: 800, fontSize: 18, padding: "6px 16px", borderRadius: 8, letterSpacing: "0.05em" }}>SOLD</span>
            </div>
          )}
        </div>
        {/* Info */}
        <div style={{ padding: 12 }}>
          <div style={{ fontFamily: "Inter", color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 11 }}>{category}</div>
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 15, color: "white", marginBottom: 6, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h3>
          <div style={{ fontSize: 20, fontFamily: "Poppins", fontWeight: 800, color: "var(--primary)" }}>${price.toLocaleString()}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            {location && <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "Inter" }}>📍 {location}</span>}
            {sellerName && <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "Inter" }}>{sellerName}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
