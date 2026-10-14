import { StyleSheet } from "react-native";

const BIG = 1200;

export const styles = StyleSheet.create({
  frame: {
    position: "relative",
  },

  // A box that reaches far past the frame on every side with a thick dark
  // border and a clear middle: it darkens the camera outside the frame only.
  dim: {
    position: "absolute",
    top: -BIG,
    left: -BIG,
    right: -BIG,
    bottom: -BIG,
    borderWidth: BIG,
    borderColor: "rgba(6, 18, 40, 0.58)",
  },

  corner: {
    position: "absolute",
  },

  cornerLarge: {
    width: 40,
    height: 40,
  },

  cornerSmall: {
    width: 14,
    height: 14,
  },

  topLeft: {
    top: 0,
    left: 0,
  },

  topRight: {
    top: 0,
    right: 0,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
  },
});
