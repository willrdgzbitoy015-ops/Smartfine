import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Fills the camera frame.
  scanArea: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  scanLine: {
    position: "absolute",
    top: 0,
    left: "8%",
    right: "8%",
    height: 3,
    borderRadius: 2,
    opacity: 0.9,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
});
