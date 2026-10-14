import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  MOTION,
  NATIVE_DRIVER,
  useReducedMotion,
  useRetainedValue,
} from "@/components/motion";
import { openBannerNotice, useNoticeBanner } from "@/hooks/use-notice-banner";
import { styles } from "./notice-banner.styles";

// Drops from the top of any screen when a new notice arrives while the app is
// open, and goes away by itself after a few seconds. Tapping it opens the
// notice's own screen. Mounted once, in the root layout.
export function NoticeBanner() {
  const notice = useNoticeBanner();

  // Keeps the text on screen while the banner slides away.
  const shown = useRetainedValue(notice);

  const insets = useSafeAreaInsets();

  const reduced = useReducedMotion();

  const [progress] = useState(() => new Animated.Value(0));

  const [bump] = useState(() => new Animated.Value(1));

  const lastId = useRef<number | null>(null);

  const visible = notice !== null;

  useEffect(() => {
    if (reduced) {
      progress.setValue(visible ? 1 : 0);
      return;
    }

    const animation = visible
      ? Animated.spring(progress, {
          toValue: 1,
          ...MOTION.spring.popIn,
          useNativeDriver: NATIVE_DRIVER,
        })
      : Animated.timing(progress, {
          toValue: 0,
          duration: MOTION.duration.switch,
          easing: Easing.in(Easing.quad),
          useNativeDriver: NATIVE_DRIVER,
        });

    animation.start();

    return () => animation.stop();
  }, [visible, reduced, progress]);

  // A newer notice replacing the one on screen gives a small pop.
  useEffect(() => {
    const id = notice?.id ?? null;
    const before = lastId.current;

    lastId.current = id;

    if (id === null || before === null || id === before || reduced) {
      return;
    }

    bump.setValue(0.96);

    Animated.spring(bump, {
      toValue: 1,
      ...MOTION.spring.press,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [notice?.id, reduced, bump]);

  if (!shown) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.layer, { paddingTop: insets.top + 8 }]}
    >
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        accessibilityLiveRegion="polite"
        style={[
          styles.cardWrap,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.6, 1],
              outputRange: [0, 1, 1],
              extrapolate: "clamp",
            }),
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-110, 0],
                }),
              },
              { scale: bump },
            ],
          },
        ]}
      >
        <View style={styles.shadow}>
          <Pressable
            onPress={() => void openBannerNotice(shown)}
            accessibilityRole="alert"
            accessibilityLabel={`${shown.title}. ${shown.message}`}
            accessibilityHint="Opens the details"
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            {/* The glass: a blur of the page, a navy tint and a top highlight. */}
            <BlurView
              intensity={85}
              tint="dark"
              style={StyleSheet.absoluteFill}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />

            <View pointerEvents="none" style={styles.tint} />

            <View pointerEvents="none" style={styles.sheen} />

            <View style={styles.iconTile}>
              <View style={styles.iconWindow}>
                <Image
                  source={require("../../assets/branding/smartfine-logo.png")}
                  style={styles.iconImage}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </View>
            </View>

            <View style={styles.body}>
              <View style={styles.headerRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {shown.title}
                </Text>

                <Text style={styles.time}>now</Text>
              </View>

              <Text style={styles.message} numberOfLines={2}>
                {shown.message}
              </Text>

              {shown.more > 0 && (
                <Text style={styles.more}>
                  {shown.more === 1
                    ? "+1 more notice"
                    : `+${shown.more} more notices`}
                </Text>
              )}
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
