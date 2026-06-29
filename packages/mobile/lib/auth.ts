import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const TOKEN_KEY = "auctionize_bearer_token";

const baseURL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  basePath: "/api/auth",
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: async () => {
        try {
          return (await SecureStore.getItemAsync(TOKEN_KEY)) ?? "";
        } catch {
          return "";
        }
      },
    },
  },
});

export async function captureToken(ctx: { response: Response }) {
  const token = ctx.response.headers.get("set-auth-token");
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getToken(): Promise<string> {
  try {
    return (await SecureStore.getItemAsync(TOKEN_KEY)) ?? "";
  } catch {
    return "";
  }
}
