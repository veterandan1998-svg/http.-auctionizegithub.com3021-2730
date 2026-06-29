import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useSearch } from "wouter";
import { useState, useEffect } from "react";
import { ListingCard } from "../components/listing-card";
import { useLocation } from "wouter";

const CATEGORIES = ["All", "Electronics", "Clothing", "Vehicles", "Home & Garden", "Sports", "Collectibles", "Books", "Toys", "Art", "Other"];

export default function ListingsPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const [category, setCategory] = useState(params.get("category") || "");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");
  const [location, setLocation] = useState(params.get("location") || "");
  const [searchQ, setSearchQ] = useState(params.get("search") || "");

  const query = useQuery({
    queryKey: ["listings", category, minPrice, maxPrice, location, searchQ],
    queryFn: async () => {
      const q: any = {};
      if (category) q.category = category;
      if (minPrice) q.minPrice = minPrice;
      if (maxPrice) q.maxPrice = maxPrice;
      if (location) q.location = location;
      if (searchQ) q.search = searchQ;
      const res = await api.listings.$get({ query: q });
      return res.json();
    },
  });

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 16px", minHeight: "100vh" }}>
      <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color: "white", marginBottom: 24 }}>Browse Listings</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
        {/* Category pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat === "All" ? "" : cat)}
              style={{ padding: "6px 14px", borderRadius: 999, border: `1px solid ${(cat === "All" && !category) || cat === category ? "var(--primary)" : "var(--border)"}`, background: (cat === "All" && !category) || cat === category ? "rgba(255,107,0,0.15)" : "var(--bg-elevated)", color: (cat === "All" && !category) || cat === category ? "var(--primary)" : "var(--text-secondary)", cursor: "pointer", fontFamily: "Inter", fontSize: 13, fontWeight: 500 }}>
              {cat}
            </button>
          ))}
        </div>
        {/* Price + Location */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min $"
            style={{ width: 80, padding: "6px 10px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "white", fontFamily: "Inter", fontSize: 13, outline: "none" }} />
          <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max $"
            style={{ width: 80, padding: "6px 10px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "white", fontFamily: "Inter", fontSize: 13, outline: "none" }} />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="📍 Location"
            style={{ width: 120, padding: "6px 10px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "white", fontFamily: "Inter", fontSize: 13, outline: "none" }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Search"
            style={{ width: 140, padding: "6px 10px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "white", fontFamily: "Inter", fontSize: 13, outline: "none" }} />
        </div>
      </div>

      {query.isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {[...Array(12)].map((_, i) => <div key={i} style={{ background: "var(--bg-card)", borderRadius: 12, aspectRatio: "3/4", border: "1px solid var(--border)" }} />)}
        </div>
      ) : query.data?.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h3 style={{ fontFamily: "Poppins", fontWeight: 700, fontSize: 22, color: "white", marginBottom: 8 }}>No listings found</h3>
          <p style={{ color: "var(--text-secondary)", fontFamily: "Inter" }}>Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div style={{ color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, marginBottom: 16 }}>{query.data?.length} listing{query.data?.length !== 1 ? "s" : ""}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {query.data?.map((listing: any) => <ListingCard key={listing.id} {...listing} />)}
          </div>
        </>
      )}
    </div>
  );
}
