import { StyleSheet } from "react-native";

import { OFFICER } from "@/constants/officer-theme";

const DOT = 26;

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
  },

  step: {
    width: 84,
    alignItems: "center",
  },

  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  // Steps still to come.
  dotLight: {
    backgroundColor: OFFICER.surface,
    borderColor: OFFICER.lineStrong,
  },

  dotDark: {
    backgroundColor: "transparent",
    borderColor: "rgba(255, 255, 255, 0.4)",
  },

  // Steps already finished.
  dotDone: {
    backgroundColor: OFFICER.green,
    borderColor: OFFICER.green,
  },

  // The step you are on.
  dotActiveLight: {
    backgroundColor: OFFICER.navyDeep,
    borderColor: OFFICER.navyDeep,
  },

  dotActiveDark: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },

  dotText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    includeFontPadding: false,
  },

  dotTextLight: {
    color: OFFICER.muted,
  },

  dotTextDark: {
    color: "rgba(255, 255, 255, 0.7)",
  },

  dotTextOn: {
    color: "#FFFFFF",
  },

  dotTextActiveDark: {
    color: OFFICER.navyDeep,
  },

  label: {
    marginTop: 6,
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    textAlign: "center",
  },

  labelLight: {
    color: OFFICER.muted,
  },

  labelDark: {
    color: "rgba(255, 255, 255, 0.65)",
  },

  labelActiveLight: {
    color: OFFICER.navyDeep,
    fontFamily: "Poppins_700Bold",
  },

  labelActiveDark: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
  },

  // Joins one step to the next, level with the middle of the dots.
  line: {
    flex: 1,
    maxWidth: 56,
    height: 2,
    marginTop: DOT / 2 - 1,
    marginHorizontal: -14,
    borderRadius: 1,
  },

  lineLight: {
    backgroundColor: OFFICER.line,
  },

  lineDark: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },

  lineOn: {
    backgroundColor: OFFICER.green,
  },
});
