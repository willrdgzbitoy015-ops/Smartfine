import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { API_BASE } from "@/constants/api";

// ==========================================
// ROLE GUARD
// Keeps each person on their own screens. Checked on every screen change:
//   - signed out, on an Admin / Officer / Student screen  -> Login
//   - signed in, on another role's screen                 -> their own home
// Typing an address (on the web) or pressing Back cannot get around it. The
// server still checks the role on every request; this stops the wrong screens
// from opening at all.
// ==========================================

const AREA_BY_ROLE: Record<string, string> = {
  ADMIN: "admin",
  FINES_OFFICER: "officer",
  STUDENT: "student",
};

const HOME_BY_AREA: Record<string, string> = {
  admin: "/admin/dashboard",
  officer: "/officer/dashboard",
  student: "/student/dashboard",
};

const PROTECTED_AREAS = Object.keys(HOME_BY_AREA);

// The sign-in whose session was last checked with the server.
let sessionCheckedFor: string | null = null;

// Tells the server a screen was refused, for the Log Trail (the server keeps
// only the screen path and who it was, if signed in).
function reportRefusal(screen: string, token: string | null) {
  void fetch(`${API_BASE}/api/auth/access-denied`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ page: `/${screen}` }),
  }).catch(() => undefined);
}

export function useRoleGuard(enabled: boolean) {
  const router = useRouter();
  const segments = useSegments();

  const area = String(segments[0] ?? "");

  // Re-checked whenever the screen changes.
  const screen = segments.join("/");

  useEffect(() => {
    if (!enabled || !PROTECTED_AREAS.includes(area)) {
      return;
    }

    let cancelled = false;

    async function check() {
      let token: string | null = null;
      let role: string | null = null;

      try {
        const stored = await AsyncStorage.multiGet(["token", "userRole"]);

        token = stored[0]?.[1] ?? null;
        role = stored[1]?.[1] ?? null;
      } catch {
        // Storage that cannot be read counts as signed out.
      }

      if (cancelled) {
        return;
      }

      const own = role ? AREA_BY_ROLE[String(role).toUpperCase()] : undefined;

      try {
        if (!token || !own) {
          reportRefusal(screen, token);
          router.replace("/login");
        } else if (own !== area) {
          reportRefusal(screen, token);
          router.replace(HOME_BY_AREA[own] as never);
        } else if (token !== sessionCheckedFor) {
          // A typed address or an old tab may hold a sign-in whose session has
          // ended. Asking once makes the app notice at once (the session guard
          // signs out on the server's answer).
          sessionCheckedFor = token;

          void fetch(`${API_BASE}/api/auth/session`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }).catch(() => undefined);
        }
      } catch {
        // The navigator is not ready yet; the next screen change checks again.
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, [enabled, area, screen]);
}
