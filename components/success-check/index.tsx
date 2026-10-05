import { StyleProp, Text, ViewStyle } from "react-native";

import { PopIn } from "@/components/motion";

import { styles } from "./success-check.styles";

// ==========================================
// SUCCESS CHECK
// ==========================================

// The one success mark used by every success pop-up in SmartFine: a green
// check in a light-green ring. It pops in after the pop-up card.
export function SuccessCheck({
  delay = 0,
  style,
}: {
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PopIn
      style={[styles.ring, style]}
      delay={delay}
      from={0.5}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.mark}>✓</Text>
    </PopIn>
  );
}
