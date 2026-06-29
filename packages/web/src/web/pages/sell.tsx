import { useState, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { api } from "../lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";

const CATEGORIES = ["Electronics", "Clothing", "Vehicles", "Home & Garden", "Sports", "Collectibles", "Books", "Toys", "Art", "Other"];

export default function SellPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const editId = params.get("edit");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [location, setLocation] = useState("");
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.listings.$post({ json: { title, description, price, category, location, imageKeys } });
      return res.json();
    },
    onSuccess: (data: any) => navigate(`/listings/${data.id}`),
    onError: (err: any) => setError(err.message || "Failed to create listing"),
  });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const newKeys: string[] = [];
    const newPreviews: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const presignRes = await api.upload.presign.$post({ json: { filename: file.name, contentType: file.type } });
        const { url, key } = await presignRes.json();
        await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        newKeys.push(key);
        newPreviews.push(URL.createObjectURL(file));
      } catch {}
    }
    setImageKeys(prev => [...prev, ...newKeys]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title || !description || !price || !category) { setError("Fill in all required fields"); return; }
    createMutation.mutate();
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 16px" }}>
      <h1 style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color: "white", marginBottom: 8 }}>Create Listing</h1>
      <p style={{ color: "var(--text-secondary)", fontFamily: "Inter", marginBottom: 32 }}>List your item and reach thousands of buyers. You keep 90% of every sale.</p>

      {error && <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "var(--danger)", fontSize: 14, fontFamily: "Inter" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Photos */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 20, border: "1px solid var(--border)" }}>
          <label style={{ display: "block", color: "white", fontFamily: "Poppins", fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Photos</label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            {previewUrls.map((url, i) => (
              <div key={i} style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", position: "relative" }}>
                <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button type="button" onClick={() => { setPreviewUrls(p => p.filter((_, j) => j !== i)); setImageKeys(k => k.filter((_, j) => j !== i)); }}
                  style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{ width: 100, height: 100, borderRadius: 8, border: "2px dashed var(--border)", background: "var(--bg-elevated)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 24 }}>
              {uploading ? <span style={{ fontSize: 12 }}>Uploading...</span> : <>+<span style={{ fontSize: 11 }}>Add Photo</span></>}
            </button>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => handleImageUpload(e.target.files)} style={{ display: "none" }} />
        </div>

        {/* Title */}
        <div>
          <label style={{ display: "block", color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, marginBottom: 6 }}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="What are you selling?"
            style={{ width: "100%", padding: "12px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, color: "white", fontFamily: "Inter", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Category */}
        <div>
          <label style={{ display: "block", color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, marginBottom: 6 }}>Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, color: "white", fontFamily: "Inter", fontSize: 15, outline: "none", boxSizing: "border-box" }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Price */}
        <div>
          <label style={{ display: "block", color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, marginBottom: 6 }}>Price (USD) *</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--primary)", fontFamily: "Poppins", fontWeight: 700, fontSize: 16 }}>$</span>
            <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00"
              style={{ width: "100%", padding: "12px 16px 12px 28px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, color: "white", fontFamily: "Poppins", fontWeight: 700, fontSize: 18, outline: "none", boxSizing: "border-box" }} />
          </div>
          {price && <p style={{ color: "var(--text-muted)", fontFamily: "Inter", fontSize: 12, marginTop: 4 }}>You receive: <span style={{ color: "var(--success)" }}>${(parseFloat(price) * 0.9).toFixed(2)}</span> (after 10% platform fee)</p>}
        </div>

        {/* Description */}
        <div>
          <label style={{ display: "block", color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, marginBottom: 6 }}>Description *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Describe your item — condition, features, specs..."
            style={{ width: "100%", padding: "12px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, color: "white", fontFamily: "Inter", fontSize: 14, outline: "none", resize: "vertical", minHeight: 120, boxSizing: "border-box" }} />
        </div>

        {/* Location */}
        <div>
          <label style={{ display: "block", color: "var(--text-secondary)", fontFamily: "Inter", fontSize: 14, marginBottom: 6 }}>Location (optional)</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, State"
            style={{ width: "100%", padding: "12px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, color: "white", fontFamily: "Inter", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>

        <button type="submit" disabled={createMutation.isPending}
          style={{ padding: "16px", background: createMutation.isPending ? "#666" : "var(--primary)", color: "white", border: "none", borderRadius: 12, cursor: createMutation.isPending ? "not-allowed" : "pointer", fontFamily: "Poppins", fontWeight: 700, fontSize: 18 }}>
          {createMutation.isPending ? "Publishing..." : "Publish Listing →"}
        </button>
      </form>
    </div>
  );
}
