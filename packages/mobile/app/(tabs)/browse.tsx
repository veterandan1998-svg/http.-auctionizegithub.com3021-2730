import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Image, ScrollView, ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "../../lib/api";
import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";

const CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Sports", "Vehicles", "Collectibles", "Other"];

export default function BrowseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string; category?: string }>();

  const [search, setSearch] = useState(params.search ?? "");
  const [category, setCategory] = useState(params.category ?? "All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (params.search) setSearch(params.search);
    if (params.category) setCategory(params.category);
  }, [params.search, params.category]);

  const query: Record<string, string> = { limit: "20", page: String(page) };
  if (search.trim()) query.search = search.trim();
  if (category && category !== "All") query.category = category;
  if (minPrice) query.minPrice = minPrice;
  if (maxPrice) query.maxPrice = maxPrice;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["browse", search, category, minPrice, maxPrice, page],
    queryFn: async () => {
      const res = await api.listings.$get({ query });
      return res.json();
    },
  });

  const handleSearch = () => { setPage(1); refetch(); };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Price filters */}
        <View style={styles.priceRow}>
          <TextInput
            style={styles.priceInput}
            placeholder="Min $"
            placeholderTextColor="#666"
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="numeric"
          />
          <Text style={styles.priceDash}>—</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="Max $"
            placeholderTextColor="#666"
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.filterBtn} onPress={handleSearch}>
            <Text style={styles.filterBtnText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && styles.catChipActive]}
            onPress={() => { setCategory(cat); setPage(1); }}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#FFCC00" /></View>
      ) : (
        <FlatList
          data={(data as any) ?? []}
          keyExtractor={(item: any) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
              <Text style={styles.resultCount}>{(data as any)?.length ?? 0} results</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
              <Text style={styles.emptyText}>No listings found</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/listing/${item.id}`)}
            >
              {item.imageUrls?.[0] ? (
                <Image source={{ uri: item.imageUrls[0] }} style={styles.cardImg} />
              ) : (
                <View style={[styles.cardImg, styles.noImg]}><Text style={{ fontSize: 28 }}>📦</Text></View>
              )}
              {item.isPromoted && (
                <View style={styles.badge}><Text style={styles.badgeText}>FEATURED</Text></View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardPrice}>${parseFloat(item.price).toFixed(2)}</Text>
                {item.location && <Text style={styles.cardLoc} numberOfLines={1}>📍 {item.location}</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  header: { backgroundColor: "#16161E", paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#2a2a3a" },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 12 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: "#0A0A0F", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 10, padding: 10, color: "#fff", fontSize: 14 },
  searchBtn: { backgroundColor: "#FFCC00", borderRadius: 10, paddingHorizontal: 14, justifyContent: "center" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceInput: { flex: 1, backgroundColor: "#0A0A0F", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 10, padding: 10, color: "#fff", fontSize: 13 },
  priceDash: { color: "#666" },
  filterBtn: { backgroundColor: "#2a2a3a", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  filterBtnText: { color: "#FFCC00", fontWeight: "700", fontSize: 13 },
  catScroll: { maxHeight: 52, marginTop: 10 },
  catChip: { backgroundColor: "#16161E", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, alignSelf: "flex-start" },
  catChipActive: { backgroundColor: "#FFCC00", borderColor: "#FFCC00" },
  catText: { color: "#888", fontSize: 13, fontWeight: "600" },
  catTextActive: { color: "#000" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  resultCount: { color: "#666", fontSize: 12 },
  card: { flex: 1, backgroundColor: "#16161E", borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#2a2a3a" },
  cardImg: { width: "100%", height: 120, backgroundColor: "#0A0A0F" },
  noImg: { justifyContent: "center", alignItems: "center" },
  badge: { position: "absolute", top: 6, left: 6, backgroundColor: "#FFCC00", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: "#000", fontSize: 9, fontWeight: "800" },
  cardInfo: { padding: 10 },
  cardTitle: { color: "#fff", fontSize: 13, fontWeight: "600", marginBottom: 4 },
  cardPrice: { color: "#FFCC00", fontSize: 15, fontWeight: "800", marginBottom: 2 },
  cardLoc: { color: "#666", fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: "#666", fontSize: 16 },
});
