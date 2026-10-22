import { useEffect, useState } from "react";
import {
  AppState,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { PopIn } from "@/components/motion";
import {
  forceSignOut,
  markActivity,
  resumeSession,
  staySignedIn,
  syncTracking,
  tick,
} from "@/utils/session-guard";

// ==========================================
// SESSION WATCHER
// Lives at the top of the app. It notices activity, warns before the idle
// limit (15 minutes) and signs out at the limit. On the web it also signs
// this tab out when another tab signs out.
// ==========================================

function clock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);

  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

const WEB_ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "touchstart", "wheel", "scroll"];

export function SessionWatcher() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Picks up an existing sign-in when the app opens.
  useEffect(() => {
    void resumeSession();
  }, []);

  // One check a second: warning, then sign-out.
  useEffect(() => {
    let seconds = 0;

    const timer = setInterval(() => {
      seconds += 1;

      if (seconds % 5 === 0) {
        void syncTracking();
      }

      const status = tick();

      setSecondsLeft((current) => {
        const next = status.tracking && status.warning ? status.secondsLeft : null;

        return current === next ? current : next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // A phone that was asleep, or a tab that was in the background, checks at
  // once when it wakes instead of waiting for the next second.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        tick();
      }
    });

    return () => subscription.remove();
  }, []);

  // Web: what counts as activity, and signing out together across tabs.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    let lastMove = 0;

    const onActivity = (event: Event) => {
      // Mouse movement fires constantly; once a second is plenty.
      if (event.type === "mousemove") {
        const now = Date.now();

        if (now - lastMove < 1000) return;

        lastMove = now;
      }

      markActivity();
    };

    WEB_ACTIVITY_EVENTS.forEach((name) =>
      document.addEventListener(name, onActivity, { passive: true, capture: true }),
    );

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    // The other tab ended the session (or signed in as someone else): this tab
    // follows. localStorage tells every tab of this browser at once.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== "token") return;

      if (event.key === null || !event.newValue) {
        // No notice here: the tab that signed out says why, if it needs to.
        void forceSignOut("logout");
      } else if (event.oldValue && event.oldValue !== event.newValue) {
        window.location.reload();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      WEB_ACTIVITY_EVENTS.forEach((name) =>
        document.removeEventListener(name, onActivity, { capture: true }),
      );
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <Modal visible={secondsLeft !== null} transparent animationType="fade" onRequestClose={() => staySignedIn()}>
      <View style={styles.overlay}>
        <PopIn style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            Are you still there?
          </Text>

          <Text style={styles.text}>
            For your security, you will be signed out in{" "}
            <Text style={styles.time} accessibilityLiveRegion="polite">
              {clock(secondsLeft ?? 0)}
            </Text>{" "}
            because there has been no activity.
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.outline]}
              onPress={() => void forceSignOut("logout")}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, styles.outlineText]}>Log Out Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => staySignedIn()}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Stay Signed In</Text>
            </TouchableOpacity>
          </View>
        </PopIn>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 24, 46, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    gap: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    color: "#123266",
  },

  text: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 21,
    color: "#4A5468",
  },

  time: {
    fontFamily: "Poppins_700Bold",
    color: "#D32F2F",
  },

  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },

  button: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#123266",
  },

  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },

  outline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  outlineText: {
    color: "#123266",
  },
});
