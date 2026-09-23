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
  border: "#777777",
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
    paddingTop: 14,
    paddingBottom: 28,
  },

  // STUDENT HEADER

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
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
    marginLeft: 10,
    marginRight: 8,
  },

  hello: {
    fontFamily: fonts.regular,
    fontSize: 17,
    color: colors.text,
  },

  studentName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 25,
    color: colors.text,
  },

  notificationButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationIcon: {
    width: 29,
    height: 29,
    tintColor: colors.text,
  },

  // OUTSTANDING FINE

  balanceCard: {
    width: "100%",
    minHeight: 180,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },

  balanceTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },

  balanceValue: {
    fontFamily: fonts.bold,
    fontSize: 34,
    color: colors.red,
    marginTop: 20,
  },

  balanceStatus: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.red,
    marginTop: 2,
  },

  balanceHint: {
    fontFamily: fonts.light,
    fontSize: 11,
    color: colors.muted,
    marginTop: 8,
  },

  // OFFICIAL ICON QUICK ACTIONS

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },

  quickCard: {
    width: 92,
    minHeight: 92,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },

  quickIcon: {
    width: 43,
    height: 43,
    tintColor: colors.text,
  },

  quickLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.text,
    textAlign: "center",
    marginTop: 7,
  },

  // RECENT ACTIVITIES

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: "#383838",
    marginRight: 8,
  },

  viewAllButton: {
    minHeight: 44,
    paddingHorizontal: 4,
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
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
  },

  activityTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 19,
  },

  activityDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.navy,
    marginTop: 3,
  },

  activityFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 10,
    rowGap: 5,
    marginTop: 7,
  },

  timestamp: {
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: fonts.light,
    fontSize: 10,
    lineHeight: 16,
    color: colors.muted,
  },

  activityAmount: {
    fontFamily: fonts.medium,
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

  // LOADING, EMPTY AND ERROR STATES

  loadingPanel: {
    paddingVertical: 26,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  helper: {
    fontFamily: fonts.light,
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
    borderColor: "#BFC5CE",
    borderRadius: 10,
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
    fontFamily: fonts.light,
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
