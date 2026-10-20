import { StyleSheet } from "react-native";

import { COLORS } from "./admin-settings.styles";

export const styles = StyleSheet.create({
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  chip: {
    minHeight: 34,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  chipActive: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.navy,
  },

  chipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: COLORS.text,
  },

  chipTextActive: {
    color: COLORS.white,
  },

  search: {
    minHeight: 42,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.field,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: COLORS.body,
  },

  entry: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 4,
  },

  entryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.3,
  },

  time: {
    flexShrink: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.muted,
    textAlign: "right",
  },

  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.body,
  },

  actor: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: COLORS.muted,
  },

  link: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.navy,
  },

  message: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },

  messageTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: COLORS.text,
    textAlign: "center",
  },

  messageText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
  },

  error: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: COLORS.red,
    textAlign: "center",
  },

  note: {
    marginTop: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.muted,
  },
});

// Tag colours per category: [text, background].
export const TAG_COLORS: Record<string, [string, string]> = {
  FINES: ["#173A73", "#E6EDF8"],
  PAYMENTS: ["#2E7D32", "#E8F6EA"],
  ACCOUNTS: ["#6A3FB5", "#F0EAFB"],
  FINE_TYPES: ["#9A5B00", "#FFF4E0"],
  SYSTEM: ["#B3261E", "#FDECEC"],
};
