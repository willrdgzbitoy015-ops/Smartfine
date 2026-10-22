import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { API_BASE } from "@/constants/api";
import { stopLiveUpdates } from "@/hooks/use-live-updates";

// ==========================================
// SESSION GUARD
//
// Keeps a person's session honest on this device:
//   - tracks activity, sends the server a short "I am active" signal, warns
//     before the idle limit (15 minutes) and signs out at the limit;
//   - signs out as soon as the server says the session is over (logged out
//     elsewhere, password changed, account locked, idle...);
//   - leaves a one-time notice for the sign-in screen saying why.
// ==========================================

const SESSION_KEYS = ["token", "userId", "userRole", "userEmail", "sessionSettings"];

// Server answers that mean "this sign-in is no longer valid".
const ENDED_CODES: Record<string, "idle" | "ended"> = {
  SESSION_IDLE: "idle",
  SESSION_ENDED: "ended",
  SESSION_EXPIRED: "ended",
  INVALID_TOKEN: "ended",
};

export const NOTICE_KEY = "signedOutNotice";

export type SignedOutReason = "idle" | "ended" | "logout";

type Settings = { idleSeconds: number; warningSeconds: number };

const DEFAULT_SETTINGS: Settings = { idleSeconds: 900, warningSeconds: 120 };

// ---------- state shared with the idle hook ----------

type Listener = () => void;

const listeners = new Set<Listener>();

let tracking = false;
let settings: Settings = DEFAULT_SETTINGS;
let lastActivity = Date.now();
let lastHeartbeat = 0;
let pendingActivity = false;
let warningOpen = false;
let signingOut = false;

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeSession(listener: Listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

// The server hears about activity at most this often, so its idle clock stays
// within this much of ours; the app signs out this much early to match.
function heartbeatSeconds() {
  return Math.max(2, Math.min(20, Math.floor(settings.idleSeconds / 6)));
}

function limitSeconds() {
  return Math.max(5, settings.idleSeconds - heartbeatSeconds());
}

// What the idle hook shows: whether tracking is on and, near the end, how
// many seconds are left.
export function sessionStatus() {
  if (!tracking) {
    return { tracking: false, secondsLeft: null as number | null, warning: false };
  }

  const idleFor = (Date.now() - lastActivity) / 1000;
  const secondsLeft = Math.max(0, Math.ceil(limitSeconds() - idleFor));

  return {
    tracking: true,
    secondsLeft,
    warning: idleFor >= limitSeconds() - settings.warningSeconds,
  };
}

// ---------- starting and stopping ----------

function normalise(value: Partial<Settings> | null | undefined): Settings {
  const idle = Number(value?.idleSeconds);
  const warning = Number(value?.warningSeconds);

  return {
    idleSeconds: Number.isFinite(idle) && idle > 0 ? idle : DEFAULT_SETTINGS.idleSeconds,
    warningSeconds: Number.isFinite(warning) && warning >= 0 ? warning : DEFAULT_SETTINGS.warningSeconds,
  };
}

// Called right after a sign-in succeeds.
export async function beginSession(fromServer?: Partial<Settings> | null) {
  settings = normalise(fromServer);
  lastActivity = Date.now();
  lastHeartbeat = Date.now();
  pendingActivity = false;
  warningOpen = false;
  signingOut = false;
  tracking = true;

  await AsyncStorage.setItem("sessionSettings", JSON.stringify(settings)).catch(() => undefined);

  notify();
}

// Called when the app opens: carries on tracking if someone is signed in.
export async function resumeSession() {
  try {
    const [token, saved] = await Promise.all([
      AsyncStorage.getItem("token"),
      AsyncStorage.getItem("sessionSettings"),
    ]);

    if (!token) {
      tracking = false;
      notify();
      return;
    }

    settings = normalise(saved ? JSON.parse(saved) : null);
    lastActivity = Date.now();
    pendingActivity = false;
    warningOpen = false;
    signingOut = false;
    tracking = true;

    notify();
  } catch {
    tracking = false;
  }
}

// A screen that cleared the sign-in on its own (the session was already dead)
// leaves nothing to watch: stop, so no "inactivity" notice appears later.
export async function syncTracking() {
  if (!tracking) return;

  try {
    if (!(await AsyncStorage.getItem("token"))) {
      stopTracking();
    }
  } catch {
    // Storage unreadable: try again next time.
  }
}

function stopTracking() {
  tracking = false;
  pendingActivity = false;
  warningOpen = false;
  notify();
}

// ---------- activity ----------

async function sendHeartbeat() {
  lastHeartbeat = Date.now();
  pendingActivity = false;

  try {
    const token = await AsyncStorage.getItem("token");

    if (!token) return;

    await fetch(`${API_BASE}/api/auth/activity`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" },
    });
  } catch {
    // Offline for a moment: the next one will do.
  }
}

// Something was touched, typed or clicked. While the warning is up, only its
// own button counts (see staySignedIn).
export function markActivity() {
  if (!tracking || warningOpen || signingOut) return;

  lastActivity = Date.now();
  pendingActivity = true;
}

export function staySignedIn() {
  warningOpen = false;
  lastActivity = Date.now();

  void sendHeartbeat();
  notify();
}

// Run about once a second by the idle hook.
export function tick() {
  if (!tracking || signingOut) {
    return sessionStatus();
  }

  const status = sessionStatus();

  if (pendingActivity && Date.now() - lastHeartbeat >= heartbeatSeconds() * 1000) {
    void sendHeartbeat();
  }

  warningOpen = status.warning;

  if (status.secondsLeft === 0) {
    void forceSignOut("idle");
  }

  return status;
}

// ---------- signing out ----------

async function clearDevice(reason: SignedOutReason, tellServer: boolean) {
  if (tellServer) {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ reason: reason === "idle" ? "AUTO_LOGOUT" : "LOGOUT" }),
        });
      }
    } catch {
      // The session ends on its own after the idle time anyway.
    }
  }

  stopLiveUpdates();
  stopTracking();

  await AsyncStorage.multiRemove(SESSION_KEYS).catch(() => undefined);

  if (reason !== "logout") {
    await AsyncStorage.setItem(NOTICE_KEY, reason).catch(() => undefined);
  }
}

// Signs out on this device: tells the server (which ends the session for every
// tab and device using it), clears what is stored, and opens the sign-in screen.
export async function forceSignOut(reason: SignedOutReason) {
  if (signingOut) return;

  signingOut = true;

  // The server already ended it when it told us so; otherwise we tell it.
  await clearDevice(reason, reason !== "ended");

  goToLogin();
}

// A normal Log Out button: ends the session on the server, then clears.
export async function signOut() {
  signingOut = true;

  await clearDevice("logout", true);
}

// Closes every open screen and opens Login (a screen left underneath would
// keep asking the server for data, and Back would reopen it).
function goToLogin() {
  try {
    if (router.canDismiss()) {
      router.dismissAll();
    }

    router.replace("/login");
  } catch {
    // The navigator is not ready: the role guard sends signed-out visitors to
    // Login on the next screen change.
  }
}

// ---------- the server saying "this session is over" ----------

function headerGiven(headers: unknown, name: string) {
  if (!headers) return false;

  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return headers.has(name);
  }

  if (Array.isArray(headers)) {
    return headers.some(([key]) => String(key).toLowerCase() === name.toLowerCase());
  }

  return Object.keys(headers as Record<string, unknown>).some(
    (key) => key.toLowerCase() === name.toLowerCase(),
  );
}

let interceptorInstalled = false;

// Wraps fetch once: any answer to a signed-in request that says the session is
// over signs this device out, whichever screen made the request.
export function installSessionInterceptor() {
  if (interceptorInstalled || typeof globalThis.fetch !== "function") return;

  interceptorInstalled = true;

  const original = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await original(input, init);

    if (response.status === 401) {
      try {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const sentToken =
          headerGiven(init?.headers, "authorization") ||
          (typeof input === "object" && "headers" in input && headerGiven(input.headers, "authorization"));

        if (sentToken && url.startsWith(API_BASE) && !url.includes("/api/auth/logout")) {
          const body = await response.clone().json();
          const reason = ENDED_CODES[String(body?.code)];

          if (reason) {
            void forceSignOut(reason);
          }
        }
      } catch {
        // Not JSON: not ours to judge.
      }
    }

    return response;
  }) as typeof fetch;
}
