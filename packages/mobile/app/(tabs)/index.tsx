import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, FlatList, RefreshControl, TextInput,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: featured, isLoading: loadingFeatured, refetch: refetchFeatured, isRefetching } = useQuery({
    queryKey: ["listings", "featured"],
    queryFn: async () => {
      const res = await api.listings.$get({ query: { promoted: "true", limit: "8" } });
      return res.json();
    },
  });

  const { data: recent, refetch: refetchRecent } = useQuery({
    queryKey: ["listings", "recent"],
    queryFn: async () => {
      const res = await api.listings.$get({ query: { limit: "12", sort: "newest" } });
      return res.json();
    },
  });

  const handleSearch = () => {
    if (search.trim()) {
      router.push(`/browse?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const refetchAll = () => { refetchFeatured(); refetchRecent(); };

  const CATEGORIES = ["Electronics", "Fashion", "Home", "Sports", "Vehicles", "Collectibles", "Other"];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchAll} tintColor="#FFCC00" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>⚡</Text>
            <Text style={styles.logoText}>Auction<Text style={styles.logoAccent}>ize</Text></Text>
          </View>
          {/* Search bar */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search listings..."
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
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={styles.catChip}
              onPress={() => router.push(`/browse?category=${encodeURIComponent(cat)}`)}
            >
              <Text style={styles.catText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured */}
        {(featured as any)?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⭐ Featured</Text>
              <TouchableOpacity onPress={() => router.push("/browse")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, gap: 14 }}>
              {(featured as any).map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.featuredCard}
                  onPress={() => router.push(`/listing/${item.id}`)}
                >
                  {item.imageUrls?.[0] ? (
                    <Image source={{ uri: item.imageUrls[0] }} style={styles.featuredImg} />
                  ) : (
                    <View style={[styles.featuredImg, styles.noImg]}><Text style={{ fontSize: 32 }}>📦</Text></View>
                  )}
                  <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>FEATURED</Text></View>
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.featuredPrice}>${parseFloat(item.price).toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🆕 Recent</Text>
            <TouchableOpacity onPress={() => router.push("/browse")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {(recent as any)?.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridCard}
                onPress={() => router.push(`/listing/${item.id}`)}
              >
                {item.imageUrls?.[0] ? (
                  <Image source={{ uri: item.imageUrls[0] }} style={styles.gridImg} />
                ) : (
                  <View style={[styles.gridImg, styles.noImg]}><Text style={{ fontSize: 28 }}>📦</Text></View>
                )}
                <View style={styles.gridInfo}>
                  <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.gridPrice}>${parseFloat(item.price).toFixed(2)}</Text>
                  {item.location && <Text style={styles.gridLocation} numberOfLines={1}>📍 {item.location}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  header: { backgroundColor: "#16161E", paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#2a2a3a" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  logoIcon: { fontSize: 26 },
  logoText: { fontSize: 24, fontWeight: "900", color: "#fff" },
  logoAccent: { color: "#FFCC00" },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: { flex: 1, backgroundColor: "#0A0A0F", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 12, padding: 12, color: "#fff", fontSize: 14 },
  searchBtn: { backgroundColor: "#FFCC00", borderRadius: 12, paddingHorizontal: 14, justifyContent: "center", alignItems: "center" },
  catScroll: { marginVertical: 14 },
  catChip: { backgroundColor: "#16161E", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  catText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  seeAll: { fontSize: 13, color: "#FFCC00", fontWeight: "600" },
  featuredCard: { width: 180, backgroundColor: "#16161E", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#2a2a3a", marginRight: 4 },
  featuredImg: { width: 180, height: 130, backgroundColor: "#0A0A0F" },
  noImg: { justifyContent: "center", alignItems: "center" },
  featuredBadge: { position: "absolute", top: 8, left: 8, backgroundColor: "#FFCC00", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  featuredBadgeText: { color: "#000", fontSize: 10, fontWeight: "800" },
  featuredInfo: { padding: 12 },
  featuredTitle: { color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  featuredPrice: { color: "#FFCC00", fontSize: 16, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 12 },
  gridCard: { width: "47%", backgroundColor: "#16161E", borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#2a2a3a" },
  gridImg: { width: "100%", height: 120, backgroundColor: "#0A0A0F" },
  gridInfo: { padding: 10 },
  gridTitle: { color: "#fff", fontSize: 13, fontWeight: "600", marginBottom: 4 },
  gridPrice: { color: "#FFCC00", fontSize: 15, fontWeight: "800", marginBottom: 2 },
  gridLocation: { color: "#666", fontSize: 11 },
});
