import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text } from "react-native";

import { MOTION, NATIVE_DRIVER, useReducedMotion } from "@/components/motion";
import {
  NotificationCounts,
  useNotificationCounts,
} from "@/hooks/use-notification-counts";
import { styles } from "./notification-badge.styles";

type Variant = "sidebar" | "menu" | "tab" | "bell";

// A badge pops in when unread notices arrive, bumps once when the count
// changes and shrinks away when everything is read. Polling that returns the
// same count does nothing, and a screen that opens with unread notices shows
// the badge without animating.
export function NotificationBadge({
  count,
  variant,
  describe,
}: {
  count: number;
  variant: Variant;
  // What a screen reader says for a count, when it is not "unread notices".
  describe?: (count: number) => string;
}) {
  const reduced = useReducedMotion();

  const unread = count > 0 ? count : 0;

  // The last unread count stays on the badge while it shrinks away.
  const [shownCount, setShownCount] = useState(unread);

  const [mounted, setMounted] = useState(unread > 0);

  const [scale] = useState(() => new Animated.Value(unread > 0 ? 1 : 0));

  const previous = useRef(unread);

  useEffect(() => {
    const before = previous.current;

    previous.current = unread;

    if (unread === before) {
      return;
    }

    let animation: Animated.CompositeAnimation;

    if (unread > 0) {
      setShownCount(unread);
      setMounted(true);

      if (reduced) {
        scale.setValue(1);
        return;
      }

      if (before === 0) {
        scale.setValue(0.4);

        animation = Animated.spring(scale, {
          toValue: 1,
          ...MOTION.spring.press,
          useNativeDriver: NATIVE_DRIVER,
        });
      } else {
        animation = Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.18,
            duration: MOTION.duration.quick / 2,
            easing: Easing.out(Easing.quad),
            useNativeDriver: NATIVE_DRIVER,
          }),
          Animated.spring(scale, {
            toValue: 1,
            ...MOTION.spring.press,
            useNativeDriver: NATIVE_DRIVER,
          }),
        ]);
      }

      animation.start();

      return () => animation.stop();
    }

    // Everything was read.
    if (reduced) {
      setMounted(false);
      return;
    }

    animation = Animated.timing(scale, {
      toValue: 0,
      duration: MOTION.duration.quick,
      easing: Easing.in(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    });

    animation.start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });

    return () => animation.stop();
  }, [unread, reduced, scale]);

  if (!mounted) return null;

  const admin = variant === "sidebar" || variant === "menu";

  const label = unread > 0 ? unread : shownCount;

  return (
    <Animated.View
      style={[
        styles.base,
        styles[variant],
        {
          opacity: scale.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1, 1],
            extrapolate: "clamp",
          }),
          transform: [{ scale }],
        },
      ]}
      accessibilityLabel={
        unread > 0
          ? describe
            ? describe(unread)
            : `${unread} unread ${unread === 1 ? "notification" : "notifications"}`
          : undefined
      }
      accessibilityElementsHidden={unread === 0}
      importantForAccessibility={unread === 0 ? "no-hide-descendants" : "auto"}
    >
      <Text style={admin ? styles.adminText : styles.phoneText}>
        {label > 99 ? "99+" : label}
      </Text>
    </Animated.View>
  );
}

// Each Admin module counts only its own notification types.
export function adminModuleCount(label: string, counts: NotificationCounts) {
  if (label === "Fines") return counts.FINE + counts.PAYMENT;
  if (label === "Reports") return counts.reports;
  return 0;
}

function LiveAdminBadge({
  label,
  variant,
}: {
  label: string;
  variant: "sidebar" | "menu";
}) {
  const counts = useNotificationCounts();
  return (
    <NotificationBadge count={adminModuleCount(label, counts)} variant={variant} />
  );
}

// Admin sidebar and phone menu: Fines (FINE + PAYMENT) and Reports.
export function AdminNavBadge({
  label,
  variant = "sidebar",
}: {
  label: string;
  variant?: "sidebar" | "menu";
}) {
  if (label !== "Fines" && label !== "Reports") return null;
  return <LiveAdminBadge label={label} variant={variant} />;
}

function LiveTabBadge() {
  const counts = useNotificationCounts();
  return <NotificationBadge count={counts.total} variant="tab" />;
}

export const describeNewFines = (count: number) =>
  `${count} new ${count === 1 ? "fine" : "fines"} you have not opened yet`;

// A student's new fines: shown on the Fines tab and the My Fines shortcut.
export function NewFinesBadge({ variant }: { variant: Variant }) {
  const counts = useNotificationCounts();
  return (
    <NotificationBadge
      count={counts.newFines}
      variant={variant}
      describe={describeNewFines}
    />
  );
}

// Student and Officer bottom tabs: the notification bell lives on Home, and a
// student's Fines tab shows how many new fines they have not opened yet.
export function HomeTabBadge({ label }: { label: string }) {
  if (label === "Home") return <LiveTabBadge />;
  if (label === "Fines") return <NewFinesBadge variant="tab" />;
  return null;
}
