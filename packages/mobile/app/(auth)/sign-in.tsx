import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { authClient, captureToken } from "../../lib/auth";
import { StatusBar } from "expo-status-bar";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    const { error: err } = await authClient.signIn.email(
      { email, password },
      { onSuccess: captureToken },
    );
    if (err) {
      setError(err.message || "Sign in failed");
      setLoading(false);
    } else {
      router.replace("/(tabs)/");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoIcon}>⚡</Text>
          <Text style={styles.logoText}>Auction<Text style={styles.logoAccent}>ize</Text></Text>
          <Text style={styles.tagline}>Buy & Sell Anything</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          <TouchableOpacity style={styles.btn} onPress={handleSignIn} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity><Text style={styles.link}>Sign up</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logoArea: { alignItems: "center", marginBottom: 40 },
  logoIcon: { fontSize: 56, marginBottom: 8 },
  logoText: { fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  logoAccent: { color: "#FFCC00" },
  tagline: { fontSize: 14, color: "#888", marginTop: 6 },
  card: { backgroundColor: "#16161E", borderRadius: 20, padding: 28, borderWidth: 1, borderColor: "#2a2a3a" },
  cardTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 20, textAlign: "center" },
  errorText: { color: "#FF4D4D", fontSize: 13, marginBottom: 12, textAlign: "center" },
  input: {
    backgroundColor: "#0A0A0F", borderWidth: 1, borderColor: "#2a2a3a",
    borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, marginBottom: 14,
  },
  btn: {
    backgroundColor: "#FFCC00", borderRadius: 12, padding: 16,
    alignItems: "center", marginTop: 4,
  },
  btnText: { color: "#000", fontWeight: "800", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: "#888", fontSize: 14 },
  link: { color: "#FFCC00", fontSize: 14, fontWeight: "700" },
});
