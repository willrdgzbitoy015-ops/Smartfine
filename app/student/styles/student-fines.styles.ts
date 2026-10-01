import { StyleSheet } from "react-native";

const colors = {
  background: "#E8E8E8",
  navy: "#123266",
  white: "#FFFFFF",
  text: "#111111",
  muted: "#626975",
  border: "#777777",
  red: "#E52323",
  green: "#238A35",
  amber: "#936000",
  active: "#16E564",
  gcash: "#0B63E5",
  gcashDark: "#0A4BAF",
  gcashLight: "#EEF5FF",
};

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
    backgroundColor: colors.background,
  },

  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: colors.background,
  },

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
    tintColor: colors.text,
    transform: [{ rotate: "180deg" }],
  },

  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 21,
    color: colors.text,
    textAlign: "center",
  },

  headerSpacer: {
    width: 44,
  },

  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 18,
  },

  filterButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#B9C4D3",
    borderRadius: 9,
  },

  filterActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },

  filterText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.navy,
  },

  filterTextActive: {
    color: colors.white,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  totalCard: {
    paddingHorizontal: 19,
    paddingVertical: 18,
    backgroundColor: colors.navy,
    borderRadius: 12,
  },

  totalLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: "#D9E7FA",
  },

  totalAmount: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 42,
    color: colors.white,
    marginTop: 5,
  },

  totalHelper: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: "#D9E7FA",
    marginTop: 3,
  },

  paymentNote: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginTop: 12,
    marginBottom: 23,
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: "#C9D4E1",
    borderRadius: 9,
  },

  paymentNoteTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.navy,
  },

  paymentNoteText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 3,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 11,
  },

  listTitle: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },

  listCount: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.muted,
  },

  fineCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#C5CDD7",
    borderRadius: 11,
  },

  fineHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  violation: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 21,
    color: colors.navy,
  },

  readBadge: {
    minWidth: 46,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    borderRadius: 6,
  },

  readBadgeNew: {
    backgroundColor: "#FDE8E8",
  },

  readBadgeRead: {
    backgroundColor: "#EBEFF3",
  },

  readBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
  },

  readBadgeTextNew: {
    color: colors.red,
  },

  readBadgeTextRead: {
    color: colors.muted,
  },

  reference: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 7,
  },

  timestamp: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 2,
  },

  paidDate: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.green,
    marginTop: 2,
  },

  fineDivider: {
    height: 1,
    backgroundColor: "#E5E9EE",
    marginTop: 14,
    marginBottom: 13,
  },

  fineSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  amountArea: {
    flex: 1,
    minWidth: 0,
  },

  amountLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.muted,
  },

  amount: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 26,
    color: colors.navy,
    marginTop: 1,
  },

  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 7,
  },

  statusUnpaid: {
    backgroundColor: "#FDE8E8",
  },

  statusPaid: {
    backgroundColor: "#E6F5E9",
  },

  statusPending: {
    backgroundColor: "#FFF3D8",
  },
  statusCancelled: {
    backgroundColor: "#ECEFF3",
  },

  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
  },

  statusTextUnpaid: {
    color: colors.red,
  },

  statusTextPaid: {
    color: colors.green,
  },

  statusTextPending: {
    color: colors.amber,
  },
  statusTextCancelled: {
    color: colors.muted,
  },

  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginTop: 15,
  },

  // GCASH (PayMongo)

  gcashButton: {
    minHeight: 46,
    marginTop: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gcash,
    borderRadius: 8,
  },

  gcashButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.white,
  },

  gcashPending: {
    marginTop: 16,
    padding: 14,
    backgroundColor: colors.gcashLight,
    borderWidth: 1,
    borderColor: "#B9D3FB",
    borderRadius: 10,
  },

  gcashPendingTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.gcashDark,
  },

  gcashPendingText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 4,
  },

  gcashPendingActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },

  gcashSmallButton: {
    flexGrow: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gcash,
    borderRadius: 8,
  },

  gcashOutlineButton: {
    flexGrow: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gcash,
    borderRadius: 8,
  },

  gcashOutlineText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.gcash,
  },

  gcashCancelLink: {
    alignSelf: "center",
    paddingVertical: 8,
    marginTop: 4,
  },

  gcashCancelText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.red,
    textDecorationLine: "underline",
  },

  gcashNote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 12,
  },

  gcashTestBadge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "#FFF1D6",
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.amber,
  },

  verifyingBox: {
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },

  detailsButton: {
    minHeight: 42,
    minWidth: 112,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.navy,
    borderRadius: 8,
  },

  detailsButtonText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.white,
  },

  markReadButton: {
    minHeight: 42,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  markReadText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.navy,
  },

  loadingPanel: {
    paddingVertical: 30,
    alignItems: "center",
    gap: 10,
  },

  // Placeholders while fines load.
  skeletonGap: {
    marginTop: 9,
  },

  skeletonCard: {
    marginTop: 12,
    marginBottom: 0,
  },

  emptyPanel: {
    padding: 19,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#C5CDD7",
    borderRadius: 10,
    marginBottom: 18,
  },

  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.navy,
  },

  helper: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 6,
  },

  errorPanel: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 10,
    backgroundColor: colors.white,
    marginBottom: 18,
  },

  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.red,
  },

  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  retryText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.navy,
  },

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
    marginTop: 5,
  },

  indicator: {
    width: "65%",
    maxWidth: 52,
    height: 3,
    backgroundColor: colors.active,
    borderRadius: 2,
    marginTop: 4,
  },

  hiddenIndicator: {
    backgroundColor: "transparent",
  },
});

// Compatibility workaround while this stylesheet lives inside app/.
export default function StudentFinesStylesRoute() {
  return null;
}
