import AsyncStorage from "@react-native-async-storage/async-storage";

// ==========================================
// API FETCH
// fetch() for SmartFine's server that sends the signed-in account's login
// token, so the server can check who is asking. A call that sets its own
// Authorization header keeps it.
// ==========================================

export async function apiFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (!headers.has("Authorization")) {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Phones reach the server through ngrok, which needs this to skip its
  // warning page.
  if (!headers.has("ngrok-skip-browser-warning")) {
    headers.set("ngrok-skip-browser-warning", "true");
  }

  return fetch(url, { ...init, headers });
}
