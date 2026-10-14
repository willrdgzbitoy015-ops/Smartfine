import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { io, type Socket } from "socket.io-client";

import { API_BASE } from "@/constants/api";

// Live updates. The server tells every signed-in app when SmartFine data
// changed (a fine was recorded, a payment came in, ...), and open screens
// reload quietly instead of waiting for a manual refresh. A message names a
// topic only; the screen reloads through the normal API, so it still shows
// just what that user may see.
export type LiveTopic = "fines" | "payments" | "refunds" | "people" | "settings";

const ALL_TOPICS: LiveTopic[] = [
  "fines",
  "payments",
  "refunds",
  "people",
  "settings",
];

// Several messages in a burst cause one reload.
const RELOAD_DELAY_MS = 250;

type LiveListener = (topics: readonly LiveTopic[]) => void;

const listeners = new Set<LiveListener>();

// Told when a sign-in's connection starts (true) and when it is closed (false).
const lifecycleListeners = new Set<(running: boolean) => void>();

let socket: Socket | null = null;
let socketToken: string | null = null;
let hasConnected = false;
let appStateWatched = false;

function broadcast(topics: readonly LiveTopic[]) {
  listeners.forEach((listener) => listener(topics));
}

function isTopic(value: unknown): value is LiveTopic {
  return ALL_TOPICS.includes(value as LiveTopic);
}

export function subscribeLive(listener: LiveListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function onLiveLifecycle(listener: (running: boolean) => void) {
  lifecycleListeners.add(listener);

  return () => {
    lifecycleListeners.delete(listener);
  };
}

// Closes the connection, e.g. when the user signs out.
export function stopLiveUpdates() {
  const wasRunning = socket !== null;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = null;
  socketToken = null;
  hasConnected = false;

  if (wasRunning) {
    lifecycleListeners.forEach((listener) => listener(false));
  }
}

// Opens the connection for the signed-in user, once. A different sign-in
// replaces it, and no sign-in closes it. If the connection cannot be made,
// every screen still works as before (it loads when opened, and the badges
// keep checking every 15 seconds).
export async function ensureLiveUpdates() {
  let token: string | null = null;

  try {
    token = await AsyncStorage.getItem("token");
  } catch {
    token = null;
  }

  if (!token) {
    stopLiveUpdates();
    return;
  }

  if (socket && socketToken === token) {
    return;
  }

  stopLiveUpdates();

  socketToken = token;

  // Starts over plain HTTP and upgrades to a WebSocket when the network
  // allows it (the library default), so it also works through ngrok and
  // other proxies that do not pass WebSockets.
  const next = io(API_BASE, {
    // Read again on every reconnect, so a fresh sign-in is never replayed.
    auth: (callback) => {
      AsyncStorage.getItem("token")
        .then((stored) => callback({ token: stored ?? "" }))
        .catch(() => callback({ token: "" }));
    },
    extraHeaders: { "ngrok-skip-browser-warning": "true" },
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket = next;

  lifecycleListeners.forEach((listener) => listener(true));

  next.on("changed", (payload: { topics?: unknown }) => {
    const topics = Array.isArray(payload?.topics)
      ? payload.topics.filter(isTopic)
      : [];

    if (topics.length) {
      broadcast(topics);
    }
  });

  next.on("connect", () => {
    // Changes made while the connection was down were missed.
    if (hasConnected) {
      broadcast(ALL_TOPICS);
    }

    hasConnected = true;
  });

  // A phone that was asleep or in the background missed messages too.
  if (!appStateWatched) {
    appStateWatched = true;

    AppState.addEventListener("change", (state) => {
      if (state !== "active" || !socket) {
        return;
      }

      if (!socket.connected) {
        socket.connect();
      }

      broadcast(ALL_TOPICS);
    });
  }
}

// Reloads a screen's data when one of `topics` changes while the screen is
// showing. `reload` should be the screen's quiet reload: no loading spinner,
// and no error message if the refresh fails.
export function useLiveReload(
  topics: readonly LiveTopic[],
  reload: () => unknown,
) {
  const reloadRef = useRef(reload);

  useEffect(() => {
    reloadRef.current = reload;
  });

  const wanted = topics.join(",");

  useFocusEffect(
    useCallback(() => {
      void ensureLiveUpdates();

      const interested = new Set(wanted.split(","));

      let timer: ReturnType<typeof setTimeout> | null = null;
      let running = false;
      let again = false;

      async function run() {
        timer = null;

        // A change that arrives during a reload gets one more reload after it.
        if (running) {
          again = true;
          return;
        }

        running = true;

        try {
          await reloadRef.current();
        } catch {
          // Keep showing the data already on screen.
        } finally {
          running = false;

          if (again) {
            again = false;
            schedule();
          }
        }
      }

      function schedule() {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(() => {
          void run();
        }, RELOAD_DELAY_MS);
      }

      const unsubscribe = subscribeLive((changed) => {
        if (changed.some((topic) => interested.has(topic))) {
          schedule();
        }
      });

      return () => {
        unsubscribe();

        if (timer) {
          clearTimeout(timer);
        }
      };
    }, [wanted]),
  );
}
