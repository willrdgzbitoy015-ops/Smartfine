import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { API_BASE } from "@/constants/api";
import { ensureLiveUpdates, subscribeLive } from "@/hooks/use-live-updates";

// Unread notification counts for the signed-in user, shared by every badge.
export type NotificationCounts = {
  total: number;
  FINE: number;
  PAYMENT: number;
  SYSTEM: number;
  ACCOUNT: number;
  // Admin Reports "Payment Collected" activity.
  reports: number;
  // Student: unpaid fines not opened yet (the NEW tag on My Fines).
  newFines: number;
};

const EMPTY_COUNTS: NotificationCounts = {
  total: 0,
  FINE: 0,
  PAYMENT: 0,
  SYSTEM: 0,
  ACCOUNT: 0,
  reports: 0,
  newFines: 0,
};

const POLL_INTERVAL_MS = 15000;

let latestCounts = EMPTY_COUNTS;
let countsToken: string | null = null;
let inFlight: Promise<void> | null = null;
let refreshQueued = false;
let focusedScreens = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let stopListeningLive: (() => void) | null = null;
const listeners = new Set<(counts: NotificationCounts) => void>();

function publish(counts: NotificationCounts) {
  latestCounts = counts;
  listeners.forEach((listener) => listener(counts));
}

function toCount(value: unknown) {
  const count = Number(value);
  return Number.isSafeInteger(count) && count > 0 ? count : 0;
}

async function fetchCounts() {
  try {
    const token = await AsyncStorage.getItem("token");

    // A different sign-in never shows the previous account's counts.
    if (token !== countsToken) {
      countsToken = token;
      publish(EMPTY_COUNTS);
    }

    if (!token) {
      return;
    }

    const response = await fetch(
      `${API_BASE}/api/notifications/unread-count`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    if (response.status === 401 || response.status === 403) {
      publish(EMPTY_COUNTS);
      return;
    }

    const body = await response.json();

    if (!response.ok || !body?.success || !body.counts) {
      throw new Error(body?.message || `HTTP ${response.status}`);
    }

    publish({
      total: toCount(body.counts.total),
      FINE: toCount(body.counts.FINE),
      PAYMENT: toCount(body.counts.PAYMENT),
      SYSTEM: toCount(body.counts.SYSTEM),
      ACCOUNT: toCount(body.counts.ACCOUNT),
      reports: toCount(body.counts.reports),
      newFines: toCount(body.counts.newFines),
    });
  } catch (error) {
    // Keep the last known counts while the server is unreachable.
    console.warn("Notification count refresh failed:", error);
  }
}

// Refresh every mounted badge; concurrent calls share one request. A call
// made while a request is running gets one more request after it, so a
// change just made (read, delete) is never answered by a count taken before
// that change.
export function refreshNotificationCounts(): Promise<void> {
  if (inFlight) {
    refreshQueued = true;
    return inFlight;
  }

  inFlight = (async () => {
    try {
      do {
        refreshQueued = false;
        await fetchCounts();
      } while (refreshQueued);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

// SQLite stores CURRENT_TIMESTAMP in UTC; show it in Philippine time.
export function formatNotificationTime(value: string | null | undefined) {
  if (!value) return "Time unavailable";

  const text = value.trim();
  const normalized =
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text)
      ? `${text.replace(" ", "T")}Z`
      : text;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Mark one notification read, then refresh the badges.
export async function markNotificationRead(notificationId: number) {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("Please sign in again.");
  }

  const response = await fetch(
    `${API_BASE}/api/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    },
  );

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "Could not mark the notification read.");
  }

  void refreshNotificationCounts();
}

// Subscribes to the shared counts. While the screen is focused the counts
// refresh on focus and poll every 15 seconds, with one timer for the app.
export function useNotificationCounts() {
  const [counts, setCounts] = useState(latestCounts);

  useEffect(() => {
    listeners.add(setCounts);
    setCounts(latestCounts);

    return () => {
      listeners.delete(setCounts);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      focusedScreens += 1;
      void refreshNotificationCounts();

      if (!pollTimer) {
        pollTimer = setInterval(() => {
          void refreshNotificationCounts();
        }, POLL_INTERVAL_MS);
      }

      // A change announced by the server updates the badges at once; the
      // 15-second check above stays as the fallback.
      void ensureLiveUpdates();

      if (!stopListeningLive) {
        stopListeningLive = subscribeLive(() => {
          void refreshNotificationCounts();
        });
      }

      return () => {
        focusedScreens = Math.max(0, focusedScreens - 1);

        if (focusedScreens === 0) {
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }

          stopListeningLive?.();
          stopListeningLive = null;
        }
      };
    }, []),
  );

  return counts;
}

// Delete one of the signed-in user's notifications, then refresh the badges.
// Only the notice is removed; the fine or payment it mentions is unchanged.
export async function deleteNotification(notificationId: number) {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("Please sign in again.");
  }

  const response = await fetch(
    `${API_BASE}/api/notifications/${notificationId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    },
  );

  const body = await response.json().catch(() => null);

  // Already gone (deleted on another device): treat as done. A backend
  // without this route (not restarted yet) or ngrok also answer 404, but
  // not with SmartFine's JSON reply, so those show an error instead.
  if (response.status === 404 && body?.success === false) {
    void refreshNotificationCounts();
    return;
  }

  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "Could not delete the notification.");
  }

  void refreshNotificationCounts();
}
