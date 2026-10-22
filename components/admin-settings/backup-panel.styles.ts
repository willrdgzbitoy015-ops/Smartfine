import { StyleSheet } from "react-native";

import { COLORS } from "./admin-settings.styles";

export const styles = StyleSheet.create({
  status: {
    padding: 14,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.field,
    gap: 6,
  },

  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  statusLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.text,
  },

  statusText: {
    flexShrink: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.body,
  },

  warning: {
    padding: 12,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: "#FDECEC",
  },

  warningText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.red,
  },

  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 6,
  },

  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  tags: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    flexShrink: 1,
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
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.text,
    textAlign: "right",
  },

  contents: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.body,
  },

  meta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.muted,
  },

  checked: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    lineHeight: 18,
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
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

  link: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.navy,
  },

  note: {
    marginTop: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.muted,
  },

  gap: { marginTop: 10 },
  section: { marginTop: 14 },
  listRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  bullet: { color: COLORS.text, fontSize: 13, fontWeight: "900" },
  listText: { flex: 1, color: COLORS.body, fontSize: 13, lineHeight: 19 },
});

// [text, background] per kind of backup.
export const TYPE_COLORS: Record<string, [string, string]> = {
  SCHEDULED: ["#173A73", "#E6EDF8"],
  MANUAL: ["#2E7D32", "#E8F6EA"],
  BEFORE_RESTORE: ["#9A5B00", "#FFF4E0"],
  BEFORE_RESET: ["#B3261E", "#FDECEC"],
};
