import { StyleSheet } from "react-native";

const fonts = {
  bold: "Poppins_700Bold",
  semibold: "Poppins_600SemiBold",
  medium: "Poppins_500Medium",
  regular: "Poppins_400Regular",
  light: "Poppins_300Light",
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E8E8E8",
  },

  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "#E8E8E8",
  },

  // HEADER

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    width: 23,
    height: 23,
    tintColor: "#111111",
    transform: [{ rotate: "180deg" }],
  },

  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 21,
    color: "#111111",
    textAlign: "center",
  },

  headerSpacer: {
    width: 44,
  },

  // UNPAID / PAID / PENDING FILTERS

  filters: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 18,
  },

  filterTouch: {
    minHeight: 44,
    justifyContent: "center",
  },

  filterButton: {
    minWidth: 66,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#123266",
    borderRadius: 8,
    alignItems: "center",
  },

  filterActive: {
    backgroundColor: "#123266",
  },

  filterText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#123266",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  // SCROLLABLE CONTENT

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingBottom: 30,
  },

  // FINE CARDS

  fineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 116,
    padding: 15,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#777777",
    borderRadius: 10,
  },

  fineInfo: {
    flex: 1,
    minWidth: 0,
  },

  violation: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "#123266",
  },

  reference: {
    fontFamily: fonts.light,
    fontSize: 10,
    color: "#626975",
    marginTop: 5,
  },

  timestamp: {
    fontFamily: fonts.light,
    fontSize: 10,
    lineHeight: 16,
    color: "#626975",
    marginTop: 10,
  },

  paidDate: {
    fontFamily: fonts.light,
    fontSize: 10,
    lineHeight: 16,
    color: "#239D39",
    marginTop: 5,
  },

  amountArea: {
    maxWidth: "42%",
    alignItems: "center",
    justifyContent: "center",
  },

  amount: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#123266",
    textAlign: "center",
  },

  payTouch: {
    minHeight: 44,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  payButton: {
    minWidth: 52,
    paddingHorizontal: 13,
    paddingVertical: 5,
    backgroundColor: "#123266",
    borderRadius: 7,
    alignItems: "center",
  },

  payText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#FFFFFF",
  },

  status: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 12,
    textAlign: "center",
  },

  paidStatus: {
    color: "#239D39",
  },

  pendingStatus: {
    color: "#936000",
  },

  // TOTAL OUTSTANDING

  totalCard: {
    padding: 18,
    marginTop: 8,
    backgroundColor: "#123266",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0D2348",
  },

  totalLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#FFFFFF",
  },

  totalAmount: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: "#FF6464",
    textAlign: "center",
    marginTop: 13,
  },

  totalHelper: {
    fontFamily: fonts.light,
    fontSize: 11,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 8,
  },

  payNowButton: {
    minHeight: 44,
    width: "80%",
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#45B94F",
    borderRadius: 7,
  },

  payNowText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#FFFFFF",
    textAlign: "center",
  },

  disabled: {
    opacity: 0.45,
  },

  // LOADING AND EMPTY STATES

  loadingPanel: {
    paddingVertical: 30,
    alignItems: "center",
    gap: 10,
  },

  emptyPanel: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFC5CE",
    borderRadius: 10,
    marginBottom: 18,
  },

  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#123266",
  },

  helper: {
    fontFamily: fonts.light,
    fontSize: 12,
    color: "#626975",
    marginTop: 6,
  },

  // ERROR AND RETRY

  errorPanel: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#D32F2F",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 18,
  },

  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#D32F2F",
  },

  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  retryText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#123266",
  },

  // BOTTOM NAVIGATION

  bottomArea: {
    backgroundColor: "#123266",
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
    tintColor: "#FFFFFF",
  },

  navLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#FFFFFF",
    marginTop: 5,
  },

  indicator: {
    width: "65%",
    maxWidth: 52,
    height: 3,
    backgroundColor: "#16E564",
    borderRadius: 2,
    marginTop: 4,
  },

  hiddenIndicator: {
    backgroundColor: "transparent",
  },
});

// Compatibility workaround while this stylesheet lives inside app/.
// This is not an actual application screen.
export default function StudentFinesStylesRoute() {
  return null;
}
