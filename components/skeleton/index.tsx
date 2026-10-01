import { ReactNode, useEffect } from "react";
import {
  Animated,
  DimensionValue,
  Easing,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

import { NATIVE_DRIVER, useReducedMotion } from "@/components/motion";
import { styles } from "./skeleton.styles";

// ==========================================
// SHARED PULSE
// ==========================================

// One pulse drives every placeholder on screen, so they breathe together
// and only one animation runs.
const pulse = new Animated.Value(0);

const pulseOpacity = pulse.interpolate({
  inputRange: [0, 1],
  outputRange: [0.45, 1],
});

let pulseUsers = 0;

let pulseLoop: Animated.CompositeAnimation | null = null;

function startPulse() {
  pulseUsers += 1;

  if (pulseUsers > 1) {
    return;
  }

  pulse.setValue(0);

  pulseLoop = Animated.loop(
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: 700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: 700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: NATIVE_DRIVER,
      }),
    ]),
  );

  pulseLoop.start();
}

function stopPulse() {
  pulseUsers = Math.max(0, pulseUsers - 1);

  if (pulseUsers > 0) {
    return;
  }

  pulseLoop?.stop();

  pulseLoop = null;
}

// ==========================================
// BLOCK
// ==========================================

// A grey placeholder shape that pulses while content loads.
export function Skeleton({
  width = "100%",
  height = 12,
  radius = 6,
  onDark = false,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  // Lighter shape for dark (navy) cards.
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      return;
    }

    startPulse();

    return stopPulse;
  }, [reduced]);

  return (
    <Animated.View
      style={[
        styles.block,
        onDark && styles.blockOnDark,
        { width, height, borderRadius: radius },
        { opacity: reduced ? 0.7 : pulseOpacity },
        style,
      ]}
    />
  );
}

// Groups placeholders so screen readers announce "Loading …" once.
export function SkeletonGroup({
  label,
  style,
  children,
}: {
  label: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View
      style={style}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      {children}
    </View>
  );
}

// Varied line lengths look more like real text.
const LINE_WIDTHS: DimensionValue[] = ["62%", "48%", "70%", "55%", "40%"];

// ==========================================
// LIST (cards: activities, fines, notices)
// ==========================================

export function SkeletonList({
  label,
  count = 4,
  avatar = true,
  trailing = true,
  style,
  itemStyle,
}: {
  label: string;
  count?: number;
  avatar?: boolean;
  trailing?: boolean;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonGroup label={label} style={style}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.listItem, itemStyle]}>
          {avatar && <Skeleton width={40} height={40} radius={20} />}

          <View style={styles.listText}>
            <Skeleton
              width={LINE_WIDTHS[index % LINE_WIDTHS.length]}
              height={13}
            />
            <Skeleton width="38%" height={10} style={styles.lineGap} />
          </View>

          {trailing && <Skeleton width={62} height={22} radius={11} />}
        </View>
      ))}
    </SkeletonGroup>
  );
}

// ==========================================
// TABLE (Admin directories)
// ==========================================

export function SkeletonTable({
  label,
  rows = 6,
  columns = 5,
  avatar = true,
  style,
  rowStyle,
}: {
  label: string;
  rows?: number;
  columns?: number;
  avatar?: boolean;
  style?: StyleProp<ViewStyle>;
  rowStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonGroup label={label} style={style}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={[styles.tableRow, rowStyle]}>
          <View style={styles.tableLead}>
            {avatar && <Skeleton width={36} height={36} radius={18} />}

            <View style={styles.listText}>
              <Skeleton
                width={LINE_WIDTHS[row % LINE_WIDTHS.length]}
                height={12}
              />
              <Skeleton width="40%" height={9} style={styles.lineGap} />
            </View>
          </View>

          {Array.from({ length: columns - 1 }, (_, column) => (
            <View key={column} style={styles.tableCell}>
              <Skeleton
                width={LINE_WIDTHS[(row + column + 1) % LINE_WIDTHS.length]}
                height={11}
              />
            </View>
          ))}
        </View>
      ))}
    </SkeletonGroup>
  );
}

// ==========================================
// DETAILS (label and value rows in pop-ups)
// ==========================================

export function SkeletonDetails({
  label,
  rows = 4,
  style,
}: {
  label: string;
  rows?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonGroup label={label} style={style}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={styles.detailRow}>
          <Skeleton width="28%" height={11} />
          <Skeleton
            width={LINE_WIDTHS[row % LINE_WIDTHS.length]}
            height={12}
            style={styles.detailValue}
          />
        </View>
      ))}
    </SkeletonGroup>
  );
}

// ==========================================
// PROFILE (student, officer, settings)
// ==========================================

export function SkeletonProfile({
  label,
  sections = 2,
  style,
}: {
  label: string;
  sections?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonGroup label={label} style={style}>
      <View style={[styles.card, styles.profileHeader]}>
        <Skeleton width={72} height={72} radius={36} />

        <View style={styles.listText}>
          <Skeleton width="55%" height={18} />
          <Skeleton width="35%" height={12} style={styles.lineGap} />
          <Skeleton width={88} height={22} radius={11} style={styles.lineGap} />
        </View>
      </View>

      {Array.from({ length: sections }, (_, section) => (
        <View key={section} style={styles.card}>
          <Skeleton width="30%" height={14} />

          {Array.from({ length: 3 }, (_, row) => (
            <View key={row} style={styles.profileRow}>
              <Skeleton width="26%" height={10} />
              <Skeleton
                width={LINE_WIDTHS[(section + row) % LINE_WIDTHS.length]}
                height={12}
                style={styles.lineGap}
              />
            </View>
          ))}
        </View>
      ))}
    </SkeletonGroup>
  );
}

// ==========================================
// FORM (add and edit screens)
// ==========================================

export function SkeletonForm({
  label,
  fields = 5,
  style,
}: {
  label: string;
  fields?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonGroup label={label} style={[styles.card, style]}>
      <Skeleton width="38%" height={18} />
      <Skeleton width="62%" height={11} style={styles.lineGap} />

      {Array.from({ length: fields }, (_, field) => (
        <View key={field} style={styles.formField}>
          <Skeleton width="24%" height={10} />
          <Skeleton height={46} radius={10} style={styles.lineGap} />
        </View>
      ))}

      <View style={styles.formActions}>
        <Skeleton width={110} height={44} radius={10} />
        <Skeleton width={150} height={44} radius={10} />
      </View>
    </SkeletonGroup>
  );
}
