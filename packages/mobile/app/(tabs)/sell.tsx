import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { authClient } from "../../lib/auth";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";

const CATEGORIES = ["Electronics", "Fashion", "Home", "Sports", "Vehicles", "Collectibles", "Other"];
const CONDITIONS = ["new", "like_new", "good", "fair", "poor"];
const CONDITION_LABELS: Record<string, string> = { new: "New", like_new: "Like New", good: "Good", fair: "Fair", poor: "Poor" };

export default function SellScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Other");
  const [condition, setCondition] = useState("good");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.listings.$post({
        json: {
          title,
          description,
          price: parseFloat(price),
          category,
          condition,
          location,
          imageKeys: [],
        },
      });
      if (!res.ok) {
        const d = await res.json() as any;
        throw new Error(d.error ?? "Failed to create listing");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      router.replace(`/listing/${data.id}`);
    },
    onError: (e: any) => {
      setError(e.message);
    },
  });

  if (!session) return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
        <Text style={styles.authTitle}>Sign in to sell</Text>
        <TouchableOpacity style={styles.authBtn} onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.authBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleSubmit = () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) { setError("Valid price is required"); return; }
    setError("");
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>List an Item</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} placeholder="What are you selling?" placeholderTextColor="#555" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]} placeholder="Describe your item..."
          placeholderTextColor="#555" value={description} onChangeText={setDescription}
          multiline numberOfLines={4} textAlignVertical="top"
        />

        <Text style={styles.label}>Price (USD) *</Text>
        <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#555" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Condition</Text>
        <View style={styles.chips}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, condition === c && styles.chipActive]}
              onPress={() => setCondition(c)}
            >
              <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{CONDITION_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} placeholder="City, State" placeholderTextColor="#555" value={location} onChangeText={setLocation} />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.submitBtnText}>🚀 List Item</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  header: { backgroundColor: "#16161E", paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#2a2a3a" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  authTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  authBtn: { backgroundColor: "#FFCC00", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  authBtnText: { color: "#000", fontWeight: "800", fontSize: 16 },
  label: { color: "#888", fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: "#16161E", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15 },
  textarea: { minHeight: 100 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { backgroundColor: "#16161E", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: "#FFCC00", borderColor: "#FFCC00" },
  chipText: { color: "#888", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#000" },
  errorText: { color: "#FF4D4D", fontSize: 14, marginBottom: 8, textAlign: "center" },
  submitBtn: { backgroundColor: "#FFCC00", borderRadius: 14, padding: 18, alignItems: "center", marginTop: 24 },
  submitBtnText: { color: "#000", fontWeight: "800", fontSize: 17 },
});
