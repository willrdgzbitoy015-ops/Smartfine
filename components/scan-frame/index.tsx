import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { styles } from "./scan-frame.styles";

// ==========================================
// SCAN FRAME
// ==========================================

// The frame on the QR scanner screens: four corner brackets, and (optionally)
// a dimmed surround so the camera shows brightest inside the frame. Give it a
// width and height through `style`; children (the scan line, a placeholder)
// sit inside the frame.
export function ScanFrame({
  color = "#45B94F",
  dim = true,
  size = "large",
  style,
  children,
}: {
  // Colour of the corner brackets.
  color?: string;
  // Darkens everything outside the frame. The parent must clip its overflow.
  dim?: boolean;
  // "small" is for the little brackets around an option's picture.
  size?: "large" | "small";
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const small = size === "small";

  const thickness = small ? 3 : 4;

  const radius = small ? 8 : 16;

  const base = [
    styles.corner,
    small ? styles.cornerSmall : styles.cornerLarge,
    { borderColor: color },
  ];

  return (
    <View style={[styles.frame, style]}>
      {dim && <View pointerEvents="none" style={styles.dim} />}

      {children}

      <View
        pointerEvents="none"
        style={[
          base,
          styles.topLeft,
          { borderTopWidth: thickness, borderLeftWidth: thickness, borderTopLeftRadius: radius },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          base,
          styles.topRight,
          { borderTopWidth: thickness, borderRightWidth: thickness, borderTopRightRadius: radius },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          base,
          styles.bottomLeft,
          { borderBottomWidth: thickness, borderLeftWidth: thickness, borderBottomLeftRadius: radius },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          base,
          styles.bottomRight,
          { borderBottomWidth: thickness, borderRightWidth: thickness, borderBottomRightRadius: radius },
        ]}
      />
    </View>
  );
}
