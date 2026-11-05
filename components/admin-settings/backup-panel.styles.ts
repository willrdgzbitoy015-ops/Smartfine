import { StyleSheet } from "react-native";

import { COLORS } from "./admin-settings.styles";

export const styles = StyleSheet.create({
  // ---------------------------------------- the schedule: three tiles
  // (side by side on a wide panel, stacked on a phone)
  stats: {
    gap: 10,
    marginBottom: 18,
  },

  statsWide: {
    flexDirection: "row",
  },

  stat: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.field,
    gap: 2,
  },

  statLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.6,
    color: COLORS.muted,
  },

  statValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
  },

  statHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: COLORS.muted,
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

  // ---------------------------------------- the list
  listHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },

  listTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: COLORS.text,
  },

  listCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: COLORS.muted,
  },

  // One backup: a card with a coloured edge for its kind. On a wide panel the
  // details are on the left and the buttons on the right.
  item: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 10,
  },

  itemWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },

  itemMain: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },

  itemHead: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
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
    fontSize: 14,
    color: COLORS.text,
  },

  contents: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.body,
  },

  meta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
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
  },

  actionsWide: {
    flexShrink: 0,
    justifyContent: "flex-end",
  },

  // "Show all 18" / "Show fewer".
  more: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  moreText: {
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

  link: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.navy,
  },

  // "Import Backup File" and "Back Up Now", under the list.
  bottomActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  // "Good to know": the short rules, as a list instead of one long paragraph.
  noteBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.field,
    gap: 6,
  },

  noteTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.text,
    marginBottom: 2,
  },

  noteRow: {
    flexDirection: "row",
    gap: 8,
  },

  noteBullet: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Poppins_700Bold",
  },

  noteText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },

  gap: { marginTop: 10 },
  section: { marginTop: 14 },
  listRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  bullet: { color: COLORS.text, fontSize: 13, fontFamily: "Poppins_700Bold" },
  listText: { flex: 1, color: COLORS.body, fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 19 },
});

// [text, background] per kind of backup.
export const TYPE_COLORS: Record<string, [string, string]> = {
  SCHEDULED: ["#173A73", "#E6EDF8"],
  MANUAL: ["#2E7D32", "#E8F6EA"],
  BEFORE_RESTORE: ["#9A5B00", "#FFF4E0"],
  BEFORE_RESET: ["#B3261E", "#FDECEC"],
  IMPORTED: ["#6A1B9A", "#F3E5F5"],
};
