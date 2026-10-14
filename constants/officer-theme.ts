import { ViewStyle } from "react-native";

// ==========================================
// OFFICER THEME
// ==========================================

// One look for every Fines Officer screen: a soft page, white cards with a
// light border and a gentle shadow, and the SmartFine navy and green.
export const OFFICER = {
  background: "#F1F4F9",
  surface: "#FFFFFF",

  // Card and divider borders.
  line: "#E1E7F0",

  // Input and outlined-button borders.
  lineStrong: "#CBD5E1",

  navy: "#173A73",
  navyDeep: "#123266",

  text: "#1B2437",
  muted: "#6B7689",
  faint: "#94A3B8",

  green: "#45B94F",
  greenText: "#16883A",
  greenSoft: "#E8F6EA",

  red: "#D32F2F",
  redSoft: "#FDECEC",
  redLine: "#F3B8B8",

  grey: "#5B6475",
  greySoft: "#EEF1F5",
} as const;

// Widest the screen content grows on a tablet. Phones use the full width.
export const OFFICER_COLUMN = 640;

// The soft lift under cards.
export const cardShadow: ViewStyle = {
  shadowColor: "#173A73",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.07,
  shadowRadius: 10,
  elevation: 2,
};

// A white card: light border, rounded corners, gentle shadow.
export const card: ViewStyle = {
  backgroundColor: OFFICER.surface,
  borderWidth: 1,
  borderColor: OFFICER.line,
  borderRadius: 14,
  ...cardShadow,
};

// The bottom navigation bar: navy with rounded top corners.
export const navBar: ViewStyle = {
  backgroundColor: OFFICER.navyDeep,
  borderTopLeftRadius: 22,
  borderTopRightRadius: 22,
  shadowColor: "#0B1F44",
  shadowOffset: { width: 0, height: -3 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 8,
};
