import { StyleSheet } from "react-native";

const fonts = {
  bold: "Poppins_700Bold",
  semibold: "Poppins_600SemiBold",
  medium: "Poppins_500Medium",
  regular: "Poppins_400Regular",
  light: "Poppins_300Light",
};

const colors = {
  background: "#E8E8E8",
  navy: "#123266",
  white: "#FFFFFF",
  text: "#111111",
  muted: "#626975",
  border: "#C5CDD7",
  red: "#E52323",
  green: "#238A35",
  active: "#16E564",
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: colors.background,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 30,
  },

  // STUDENT HEADER

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  initials: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.white,
  },

  greeting: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    marginRight: 8,
  },

  hello: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },

  studentName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 25,
    color: colors.text,
  },

  notificationButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 23,
  },

  notificationIcon: {
    width: 26,
    height: 26,
    tintColor: colors.navy,
  },

  // OUTSTANDING FINE

  balanceCard: {
    width: "100%",
    minHeight: 160,
    paddingHorizontal: 20,
    paddingVertical: 19,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },

  balanceTitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.muted,
  },

  balanceValue: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 43,
    color: colors.red,
    marginTop: 13,
  },

  balanceStatus: {
    alignSelf: "flex-start",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "#FDE8E8",
    borderRadius: 6,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.red,
    marginTop: 7,
  },

  balanceHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 9,
  },

  // QUICK ACTIONS

  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 26,
  },

  quickCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 92,
    paddingHorizontal: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
  },

  quickIcon: {
    width: 35,
    height: 35,
    tintColor: colors.navy,
  },

  quickLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.navy,
    textAlign: "center",
    marginTop: 7,
  },

  // RECENT ACTIVITIES

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },

  sectionTitle: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
  },

  viewAllButton: {
    minHeight: 44,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },

  viewAllText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.navy,
  },

  activityCard: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
  },

  activityTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },

  activityDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.navy,
    marginTop: 4,
  },

  activityFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 10,
    rowGap: 5,
    marginTop: 9,
  },

  timestamp: {
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 16,
    color: colors.muted,
  },

  activityAmount: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.navy,
    textAlign: "right",
    marginLeft: "auto",
  },

  greenText: {
    color: colors.green,
  },

  redText: {
    color: colors.red,
  },

  // LOADING, EMPTY, AND ERROR STATES

  loadingPanel: {
    paddingVertical: 26,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  helper: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.muted,
    marginTop: 6,
  },

  emptyPanel: {
    padding: 18,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
  },

  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.navy,
  },

  errorPanel: {
    padding: 14,
    marginBottom: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 10,
  },

  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.red,
  },

  retryButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginTop: 4,
  },

  retryText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.navy,
  },

  // BOTTOM NAVIGATION

  bottomArea: {
    backgroundColor: colors.navy,
  },

  bottomNavigation: {
    flexDirection: "row",
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 8,
  },

  navItem: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  navIcon: {
    width: 28,
    height: 28,
    tintColor: colors.white,
  },

  navLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.white,
    textAlign: "center",
    marginTop: 5,
  },

  indicator: {
    width: "65%",
    maxWidth: 52,
    height: 3,
    marginTop: 4,
    backgroundColor: colors.active,
    borderRadius: 2,
  },

  hiddenIndicator: {
    backgroundColor: "transparent",
  },

  // RECENT ACTIVITIES POPUP

  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    flexShrink: 1,
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFC5CE",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  modalTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.navy,
  },

  modalHelper: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.muted,
    marginBottom: 16,
  },

  modalScroll: {
    flexShrink: 1,
  },

  modalList: {
    paddingBottom: 4,
  },

  modalWarning: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: "#936000",
    marginBottom: 12,
  },

  modalCloseButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 14,
    backgroundColor: colors.navy,
    borderRadius: 8,
  },

  modalCloseText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.white,
    textAlign: "center",
  },
});

// Compatibility workaround while this stylesheet lives inside app/.
export default function StudentDashboardStylesRoute() {
  return null;
}
