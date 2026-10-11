import { useEffect, useState } from "react";
import { Animated, Easing, StyleProp, View, ViewStyle } from "react-native";

import AppIcon, { IconName } from "@/components/AppIcon";
import { NATIVE_DRIVER, PopIn, useReducedMotion } from "@/components/motion";

import { styles } from "./result-mark.styles";

// ==========================================
// RESULT MARK
// ==========================================

export type ResultStatus = "success" | "failed" | "warning";

const LOOK: Record<ResultStatus, { icon: IconName; color: string }> = {
  success: { icon: "paid", color: "#2FA84F" },
  failed: { icon: "failed", color: "#D32F2F" },
  warning: { icon: "warning", color: "#E0A23B" },
};

// Side-to-side distances, in points, for a rejected result.
const SHAKE = {
  failed: [9, -8, 6, -4, 2, 0],
  warning: [5, -5, 3, -2, 0],
};

// The one result mark used by every result pop-up in SmartFine. It pops in
// after the pop-up card, then a ring ripples out once. A failed result also
// shakes; a warning shakes a little. With Reduce Motion on it just appears.
export function ResultMark({
  status,
  delay = 0,
  size = 64,
  style,
}: {
  status: ResultStatus;
  delay?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();

  const [ripple] = useState(() => new Animated.Value(0));

  const [shake] = useState(() => new Animated.Value(0));

  const [rippleStyle] = useState(() => ({
    opacity: ripple.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0.5, 0],
    }),
    transform: [
      {
        scale: ripple.interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1.6],
        }),
      },
    ],
  }));

  useEffect(() => {
    if (reduced) {
      return;
    }

    const spread = Animated.timing(ripple, {
      toValue: 1,
      duration: 700,
      delay: delay + 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });

    spread.start();

    const distances = status === "success" ? [] : SHAKE[status];

    const rattle = Animated.sequence([
      Animated.delay(delay + 320),
      ...distances.map((toValue) =>
        Animated.timing(shake, {
          toValue,
          duration: 55,
          easing: Easing.linear,
          useNativeDriver: NATIVE_DRIVER,
        }),
      ),
    ]);

    rattle.start();

    return () => {
      spread.stop();
      rattle.stop();
    };
    // Plays once, when the mark first appears.
  }, []);

  const look = LOOK[status];

  return (
    <View
      style={[styles.box, { width: size, height: size }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.ripple,
          {
            borderRadius: size / 2,
            borderColor: look.color,
          },
          rippleStyle,
        ]}
      />

      <Animated.View style={{ transform: [{ translateX: shake }] }}>
        <PopIn delay={delay} from={0.4}>
          <AppIcon name={look.icon} size={size} color={look.color} />
        </PopIn>
      </Animated.View>
    </View>
  );
}

export function FailedMark(props: Omit<Parameters<typeof ResultMark>[0], "status">) {
  return <ResultMark status="failed" {...props} />;
}

export function WarningMark(props: Omit<Parameters<typeof ResultMark>[0], "status">) {
  return <ResultMark status="warning" {...props} />;
}
