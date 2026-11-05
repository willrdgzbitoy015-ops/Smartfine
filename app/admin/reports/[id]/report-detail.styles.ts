import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // ========================================
  // SCREEN
  // ========================================

  screen: {
    flex: 1,

    flexDirection: "row",

    backgroundColor: "#E8E8E8",
  },

  // ========================================
  // SIDEBAR
  // ========================================

  sidebar: {
    width: 220,

    minHeight: "100%",

    backgroundColor: "#173A73",

    paddingHorizontal: 28,

    paddingTop: 30,

    paddingBottom: 25,
  },

  logoArea: {
    alignItems: "center",

    justifyContent: "center",

    marginBottom: 35,
  },

  smartFineLogo: {
    width: 150,

    height: 90,
  },

  navigation: {
    gap: 10,
  },

  navItem: {
    height: 42,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 12,

    borderRadius: 24,
  },

  navItemActive: {
    backgroundColor: "#56C85C",
  },

  navIcon: {
    width: 28,

    color: "#FFFFFF",

    fontSize: 21,

    fontFamily: "Poppins_700Bold",

    textAlign: "center",

    marginRight: 10,
  },

  navIconContainer: {
    width: 28,
    height: 28,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  navImageIcon: {
    width: 20,
    height: 20,
  },

  navText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontFamily: "Poppins_600SemiBold",
  },

  logoutButton: {
    marginTop: "auto",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.5)",

    borderRadius: 8,

    paddingVertical: 10,

    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",

    fontFamily: "Poppins_600SemiBold",
  },

  // ========================================
  // MAIN
  // ========================================

  main: {
    flex: 1,

    backgroundColor: "#E8E8E8",
  },

  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 28,

    paddingTop: 30,

    paddingBottom: 50,
  },

  // ========================================
  // MOBILE NAV
  // ========================================

  mobileNav: {
    gap: 8,

    paddingBottom: 20,
  },

  mobileNavItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,

    paddingVertical: 9,

    borderRadius: 20,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#D3D7DD",
  },

  mobileNavItemActive: {
    backgroundColor: "#56C85C",

    borderColor: "#56C85C",
  },

  mobileNavText: {
    color: "#173A73",

    fontSize: 12,

    fontFamily: "Poppins_700Bold",
  },

  mobileNavTextActive: {
    color: "#FFFFFF",
  },

  // ========================================
  // PAGE HEADER
  // ========================================

  pageHeader: {
    marginBottom: 26,
  },

  headerBackButton: {
    alignSelf: "flex-start",

    flexDirection: "row",

    alignItems: "center",

    marginBottom: 10,
  },

  // Same back arrow image as the Student Profile screen.
  headerBackIcon: {
    width: 22,

    height: 22,

    marginRight: 8,

    transform: [
      {
        rotate: "180deg",
      },
    ],
  },

  headerBackText: {
    color: "#173A73",

    fontSize: 12,

    fontFamily: "Poppins_700Bold",
  },

  pageTitle: {
    color: "#123266",

    fontSize: 25,

    fontFamily: "Poppins_700Bold",
  },

  pageSubtitle: {
    color: "#7E8794",

    fontFamily: "Poppins_400Regular",
    fontSize: 11,

    marginTop: 5,
  },

  // ========================================
  // VOUCHER
  // ========================================

  voucherCard: {
    width: "100%",

    maxWidth: 900,

    alignSelf: "center",

    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    paddingHorizontal: 34,

    paddingVertical: 30,
  },

  voucherHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    flexWrap: "wrap",

    gap: 12,
  },

  voucherTitle: {
    color: "#123266",

    fontSize: 18,

    fontFamily: "Poppins_700Bold",
  },

  divider: {
    width: "100%",

    height: 1,

    backgroundColor: "#DEE3EA",

    marginVertical: 22,
  },

  // ========================================
  // STATUS BADGE
  // ========================================

  statusBadge: {
    minWidth: 82,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 13,

    paddingVertical: 6,

    borderRadius: 16,

    backgroundColor: "#FFF4D6",
  },

  statusBadgePaid: {
    backgroundColor: "#E7F7EA",
  },

  statusBadgePending: {
    backgroundColor: "#FFF4D6",
  },

  statusBadgeCancelled: {
    backgroundColor: "#ECEFF4",
  },

  statusBadgeFailed: {
    backgroundColor: "#FFEAEA",
  },

  statusBadgeText: {
    fontSize: 10,

    fontFamily: "Poppins_700Bold",

    color: "#A16A00",
  },

  statusTextPaid: {
    color: "#2E9D43",
  },

  statusTextPending: {
    color: "#A16A00",
  },

  statusTextCancelled: {
    color: "#606775",
  },

  statusTextFailed: {
    color: "#D32F2F",
  },

  // ========================================
  // DETAILS
  // ========================================

  detailsGrid: {
    flexDirection: "row",

    flexWrap: "wrap",

    columnGap: 45,

    rowGap: 24,
  },

  detailItem: {
    flexGrow: 1,

    flexBasis: 330,

    minWidth: 250,
  },

  fullWidthDetail: {
    flexBasis: "100%",
  },

  detailLabel: {
    color: "#676C74",

    fontSize: 10,

    fontFamily: "Poppins_600SemiBold",

    letterSpacing: 0.4,

    marginBottom: 7,
  },

  detailValueStrong: {
    color: "#30343B",

    fontSize: 13,

    fontFamily: "Poppins_700Bold",

    lineHeight: 19,
  },

  detailSecondary: {
    color: "#7E8794",

    fontFamily: "Poppins_400Regular",
    fontSize: 10,

    marginTop: 3,
  },

  amountValue: {
    fontSize: 21,

    fontFamily: "Poppins_700Bold",
  },

  amountPaid: {
    color: "#31A94A",
  },

  amountDefault: {
    color: "#173A73",
  },

  fineReferenceValue: {
    color: "#173A73",

    fontSize: 13,

    fontFamily: "Poppins_700Bold",

    lineHeight: 19,
  },

  notesText: {
    color: "#4F5660",

    fontFamily: "Poppins_400Regular",
    fontSize: 12,

    lineHeight: 18,
  },

  // ========================================
  // PAYMENT METHOD
  // ========================================

  cashierMethodBadge: {
    alignSelf: "flex-start",

    backgroundColor: "#EEF1F5",

    borderRadius: 6,

    paddingHorizontal: 10,

    paddingVertical: 6,
  },

  cashierMethodText: {
    color: "#173A73",

    fontSize: 11,

    fontFamily: "Poppins_700Bold",
  },

  onlineMethodBadge: {
    alignSelf: "flex-start",

    backgroundColor: "#E2F2FF",

    borderRadius: 6,

    paddingHorizontal: 10,

    paddingVertical: 6,
  },

  onlineMethodText: {
    color: "#0877B7",

    fontSize: 11,

    fontFamily: "Poppins_700Bold",
  },

  // ========================================
  // STATUS MESSAGE
  // ========================================

  statusMessageRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  statusMessageIcon: {
    width: 25,

    height: 25,

    borderRadius: 13,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#FFF4D6",
  },

  statusMessageIconPaid: {
    backgroundColor: "#E7F7EA",
  },

  statusMessageIconPending: {
    backgroundColor: "#FFF4D6",
  },

  statusMessageIconCancelled: {
    backgroundColor: "#ECEFF4",
  },

  statusMessageIconFailed: {
    backgroundColor: "#FFEAEA",
  },

  statusMessageIconText: {
    fontSize: 17,

    fontFamily: "Poppins_700Bold",

    color: "#A16A00",
  },

  statusMessageIconTextPaid: {
    color: "#31A94A",
  },

  statusMessageIconTextPending: {
    color: "#A16A00",
  },

  statusMessageIconTextCancelled: {
    color: "#606775",
  },

  statusMessageIconTextFailed: {
    color: "#D32F2F",
  },

  statusMessageText: {
    flex: 1,

    color: "#6F747C",

    fontFamily: "Poppins_400Regular",
    fontSize: 11,

    lineHeight: 18,
  },

  // ========================================
  // BOTTOM ACTION
  // ========================================

  bottomAction: {
    alignItems: "center",

    marginTop: 45,
  },

  backToReportsButton: {
    minWidth: 145,

    height: 46,

    borderRadius: 9,

    backgroundColor: "#FF2424",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 22,
  },

  backToReportsButtonText: {
    color: "#FFFFFF",

    fontSize: 12,

    fontFamily: "Poppins_700Bold",
  },

  // ========================================
  // STATES
  // ========================================

  // Placeholder while the page loads.
  skeleton: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },

  centerState: {
    width: "100%",

    maxWidth: 900,

    minHeight: 400,

    alignSelf: "center",

    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    alignItems: "center",

    justifyContent: "center",

    padding: 35,
  },

  stateText: {
    color: "#7E8794",

    fontFamily: "Poppins_400Regular",
    fontSize: 12,

    marginTop: 14,
  },

  errorIcon: {
    width: 54,

    height: 54,

    borderRadius: 27,

    backgroundColor: "#FFEAEA",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 15,
  },

  errorIconText: {
    color: "#D32F2F",

    fontSize: 25,

    fontFamily: "Poppins_700Bold",
  },

  errorTitle: {
    color: "#123266",

    fontSize: 17,

    fontFamily: "Poppins_700Bold",

    marginBottom: 7,
  },

  errorText: {
    maxWidth: 420,

    color: "#7E8794",

    fontFamily: "Poppins_400Regular",
    fontSize: 11,

    lineHeight: 17,

    textAlign: "center",
  },

  errorActions: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "center",

    gap: 10,

    marginTop: 20,
  },

  retryButton: {
    height: 40,

    minWidth: 105,

    borderRadius: 8,

    backgroundColor: "#173A73",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 16,
  },

  retryButtonText: {
    color: "#FFFFFF",

    fontSize: 11,

    fontFamily: "Poppins_700Bold",
  },

  backReportsOutlineButton: {
    height: 40,

    minWidth: 125,

    borderRadius: 8,

    borderWidth: 1,

    borderColor: "#173A73",

    backgroundColor: "#FFFFFF",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 16,
  },

  backReportsOutlineText: {
    color: "#173A73",

    fontSize: 11,

    fontFamily: "Poppins_700Bold",
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function ReportDetailStylesRoute() {
  return null;
}
