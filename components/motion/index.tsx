import { ReactNode, useEffect, useLayoutEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";

import { styles } from "./motion.styles";

// Animations run on the native thread on phones and tablets; web has no
// native driver, so it animates from JavaScript instead.
export const NATIVE_DRIVER = Platform.OS !== "web";

// ==========================================
// REDUCED MOTION
// ==========================================

// Android "Remove animations" and iOS "Reduce Motion" turn every animation
// below into its end state.
let reduceMotion = false;

const subscribers = new Set<(value: boolean) => void>();

function publish(value: boolean) {
  reduceMotion = value;

  subscribers.forEach((notify) => notify(value));
}

AccessibilityInfo.isReduceMotionEnabled()
  .then(publish)
  .catch(() => {});

AccessibilityInfo.addEventListener("reduceMotionChanged", publish);

export function useReducedMotion() {
  const [value, setValue] = useState(reduceMotion);

  useEffect(() => {
    subscribers.add(setValue);

    setValue(reduceMotion);

    return () => {
      subscribers.delete(setValue);
    };
  }, []);

  return value;
}

// ==========================================
// FADE IN (entrance)
// ==========================================

const STAGGER_MS = 45;

// Items after this share the last delay, so long lists never wait.
const MAX_STAGGERED = 8;

// Items after this appear without animating.
const MAX_ANIMATED = 24;

// Fades and slides content up when it first appears. Pass `index` for list
// items to stagger them.
export function FadeIn({
  children,
  index,
  delay = 0,
  distance = 12,
  duration = 300,
  style,
  ...viewProps
}: ViewProps & {
  children?: ReactNode;
  index?: number;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();

  const skip = reduced || (index !== undefined && index >= MAX_ANIMATED);

  const [progress] = useState(() => new Animated.Value(skip ? 1 : 0));

  const [translateY] = useState(() =>
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [distance, 0],
    }),
  );

  useEffect(() => {
    if (skip) {
      progress.setValue(1);

      return;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay: delay + Math.min(index ?? 0, MAX_STAGGERED) * STAGGER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });

    animation.start();

    return () => animation.stop();
    // Plays once, when the content first appears.
  }, []);

  return (
    <Animated.View
      {...viewProps}
      style={[style, { opacity: progress, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
}

// ==========================================
// SWITCH FADE (content replaced in place)
// ==========================================

// Returns an animated style that fades content in whenever `key` changes,
// e.g. a pop-up moving from a list to one record, or a filter tab. Apply it
// to an Animated.View or Animated.ScrollView that stays mounted.
export function useSwitchFade(key: unknown, distance = 8) {
  const reduced = useReducedMotion();

  const [progress] = useState(() => new Animated.Value(1));

  const [translateY] = useState(() =>
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [distance, 0],
    }),
  );

  // Layout effect: hide the new content before it is painted.
  useLayoutEffect(() => {
    if (reduced) {
      progress.setValue(1);

      return;
    }

    progress.setValue(0);

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });

    animation.start();

    return () => animation.stop();
  }, [key]);

  return { opacity: progress, transform: [{ translateY }] };
}

// ==========================================
// POP IN (pop-up cards)
// ==========================================

// Scales a pop-up card in with a small settle. Pop-ups mount when shown, so
// this plays every time one opens.
export function PopIn({
  children,
  delay = 0,
  from = 0.92,
  style,
  ...viewProps
}: ViewProps & {
  children?: ReactNode;
  delay?: number;
  from?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();

  const [progress] = useState(() => new Animated.Value(reduced ? 1 : 0));

  const [animated] = useState(() => ({
    opacity: progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 1],
      extrapolate: "clamp",
    }),
    scale: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [from, 1],
    }),
  }));

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);

      return;
    }

    const animation = Animated.spring(progress, {
      toValue: 1,
      delay,
      friction: 8,
      tension: 90,
      useNativeDriver: NATIVE_DRIVER,
    });

    animation.start();

    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      {...viewProps}
      style={[
        style,
        { opacity: animated.opacity, transform: [{ scale: animated.scale }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ==========================================
// PRESSABLE SCALE (cards and tiles)
// ==========================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A card that shrinks slightly while pressed.
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  ...pressableProps
}: Omit<PressableProps, "style" | "children"> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}) {
  const reduced = useReducedMotion();

  const [scale] = useState(() => new Animated.Value(1));

  const springTo = (toValue: number) => {
    if (reduced) {
      return;
    }

    Animated.spring(scale, {
      toValue,
      friction: 7,
      tension: 180,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  return (
    <AnimatedPressable
      {...pressableProps}
      style={[style, { transform: [{ scale }] }]}
      onPressIn={(event) => {
        springTo(scaleTo);

        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        springTo(1);

        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}

// ==========================================
// TAB INDICATOR (bottom navigation)
// ==========================================

// The active tab's underline grows in from the centre when its screen opens.
export function TabIndicator({
  active,
  style,
  hiddenStyle,
}: {
  active: boolean;
  style: StyleProp<ViewStyle>;
  hiddenStyle?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();

  const [scaleX] = useState(
    () => new Animated.Value(active && !reduced ? 0 : 1),
  );

  useEffect(() => {
    if (!active) {
      return;
    }

    if (reduced) {
      scaleX.setValue(1);

      return;
    }

    const animation = Animated.spring(scaleX, {
      toValue: 1,
      delay: 60,
      friction: 7,
      tension: 70,
      useNativeDriver: NATIVE_DRIVER,
    });

    animation.start();

    return () => animation.stop();
  }, [active]);

  return (
    <Animated.View
      style={[style, !active && hiddenStyle, { transform: [{ scaleX }] }]}
    />
  );
}

// ==========================================
// SCAN LINE (QR camera frame)
// ==========================================

// A line that sweeps up and down the camera frame while it waits for a
// code. Place it inside the frame; it fills the frame and ignores touches.
export function ScanLine({
  active,
  color = "#45B94F",
}: {
  active: boolean;
  color?: string;
}) {
  const reduced = useReducedMotion();

  const [height, setHeight] = useState(0);

  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!active || reduced || height === 0) {
      return;
    }

    progress.setValue(0);

    const sweep = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: NATIVE_DRIVER,
        }),
      ]),
    );

    sweep.start();

    return () => sweep.stop();
  }, [active, reduced, height]);

  if (!active || reduced) {
    return null;
  }

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, Math.max(10, height - 12)],
  });

  return (
    <View
      pointerEvents="none"
      style={styles.scanArea}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
    >
      <Animated.View
        style={[
          styles.scanLine,
          { backgroundColor: color, shadowColor: color },
          { transform: [{ translateY }] },
        ]}
      />
    </View>
  );
}

// ==========================================
// SHAKE (rejected input)
// ==========================================

// A short side-to-side shake, e.g. for a rejected login.
export function useShake() {
  const reduced = useReducedMotion();

  const [offset] = useState(() => new Animated.Value(0));

  const shake = () => {
    if (reduced) {
      return;
    }

    offset.setValue(0);

    Animated.sequence(
      [10, -9, 7, -5, 3, 0].map((toValue) =>
        Animated.timing(offset, {
          toValue,
          duration: 55,
          easing: Easing.linear,
          useNativeDriver: NATIVE_DRIVER,
        }),
      ),
    ).start();
  };

  return {
    shake,
    shakeStyle: { transform: [{ translateX: offset }] },
  };
}
