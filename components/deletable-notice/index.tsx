import { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import {
  FadeIn,
  MOTION,
  NATIVE_DRIVER,
  useReducedMotion,
} from "@/components/motion";
import { useActionLock } from "@/hooks/use-action-lock";
import { deleteNotification } from "@/hooks/use-notification-counts";
import { haptics } from "@/utils/haptics";

import { styles } from "./deletable-notice.styles";

// ==========================================
// DELETABLE NOTICE
// ==========================================

// A notification row that opens on tap and offers Delete on long press.
// The confirmation appears under the row, so no second pop-up opens on top
// of the notifications pop-up. Deleting removes only the notice; the fine
// or payment it mentions is not changed.
export function DeletableNotice({
  noticeId,
  style,
  confirmStyle,
  accessibilityLabel,
  onOpen,
  onDeleted,
  children,
}: {
  noticeId: number;
  style: StyleProp<ViewStyle>;
  // Lines the confirmation up with the list (for example its side padding).
  confirmStyle?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  onOpen: () => void;
  onDeleted: (noticeId: number) => void;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();

  const runLocked = useActionLock();

  const [confirming, setConfirming] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  const [presence] = useState(() => new Animated.Value(1));

  const askToDelete = () => {
    if (deleting) {
      return;
    }

    haptics.impact();
    setError("");
    setConfirming(true);
  };

  const keep = () => {
    if (deleting) {
      return;
    }

    setConfirming(false);
    setError("");
  };

  const confirmDelete = () =>
    runLocked(async () => {
      setDeleting(true);
      setError("");

      try {
        await deleteNotification(noticeId);
      } catch (caught) {
        haptics.error();
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not delete the notification.",
        );
        setDeleting(false);
        return;
      }

      haptics.success();

      // The row shrinks away, then leaves the list.
      if (reduced) {
        onDeleted(noticeId);
        return;
      }

      Animated.timing(presence, {
        toValue: 0,
        duration: MOTION.duration.quick,
        easing: Easing.in(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }).start(() => onDeleted(noticeId));
    });

  return (
    <Animated.View
      style={{
        opacity: presence,
        transform: [
          {
            scale: presence.interpolate({
              inputRange: [0, 1],
              outputRange: [0.96, 1],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        style={style}
        onPress={confirming ? keep : onOpen}
        onLongPress={askToDelete}
        delayLongPress={450}
        disabled={deleting}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Opens the notification. Long press to delete it."
        accessibilityActions={[
          { name: "activate" },
          { name: "longpress", label: "Delete notification" },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "longpress") {
            askToDelete();
          } else {
            onOpen();
          }
        }}
      >
        {children}
      </TouchableOpacity>

      {confirming && (
        <FadeIn
          distance={MOTION.distance.switch}
          duration={MOTION.duration.quick}
          style={[styles.confirm, confirmStyle]}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.confirmText}>
            <Text style={styles.confirmTitle}>Delete this notification?</Text>
            <Text style={styles.confirmHint}>
              Only the notice is removed. The fine or payment stays as it is.
            </Text>
            {error !== "" && <Text style={styles.error}>{error}</Text>}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.keepButton]}
              onPress={keep}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Keep notification"
              activeOpacity={0.8}
            >
              <Text style={styles.keepText}>Keep</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                deleting && styles.busy,
              ]}
              onPress={() => void confirmDelete()}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Delete notification"
              accessibilityState={{ busy: deleting, disabled: deleting }}
              activeOpacity={0.8}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.deleteText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </FadeIn>
      )}
    </Animated.View>
  );
}

// Shown once above a notification list.
export function DeleteHint() {
  return (
    <Text style={styles.hint}>Tip: press and hold a notification to delete it.</Text>
  );
}
