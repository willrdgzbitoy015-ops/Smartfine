import { Image, StyleProp, ViewStyle } from "react-native";

import { PopIn } from "@/components/motion";

import { styles } from "./success-check.styles";

// ==========================================
// SUCCESS CHECK
// ==========================================

// The one success mark used by every success pop-up in SmartFine: the
// official check icon (assets/icons/check.png). It pops in after the pop-up
// card.
export function SuccessCheck({
  delay = 0,
  style,
}: {
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PopIn
      style={[styles.icon, style]}
      delay={delay}
      from={0.5}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={require("../../assets/icons/check.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </PopIn>
  );
}
