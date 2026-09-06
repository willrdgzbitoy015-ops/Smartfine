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
    fontWeight: "700",
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
    fontWeight: "600",
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
    fontWeight: "600",
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
    paddingHorizontal: 42,
    paddingTop: 34,
    paddingBottom: 45,
  },

  // ========================================
  // MOBILE NAV
  // ========================================

  mobileNav: {
    gap: 8,
    paddingBottom: 22,
  },

  mobileNavItem: {
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
    fontSize: 12,
    fontWeight: "700",
    color: "#173A73",
  },

  mobileNavTextActive: {
    color: "#FFFFFF",
  },

  // ========================================
  // PAGE HEADER
  // ========================================

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 26,
  },

  pageTitle: {
    color: "#123266",
    fontSize: 26,
    fontWeight: "800",
  },

  pageSubtitle: {
    color: "#7E8794",
    fontSize: 12,
    marginTop: 5,
  },

  refreshButton: {
    minWidth: 90,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#173A73",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  refreshButtonText: {
    color: "#173A73",
    fontSize: 12,
    fontWeight: "700",
  },

  // ========================================
  // LOADING / ERROR
  // ========================================

  centerState: {
    minHeight: 350,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 30,
  },

  stateText: {
    color: "#7E8794",
    fontSize: 13,
    marginTop: 14,
  },

  errorTitle: {
    color: "#D32F2F",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },

  errorText: {
    maxWidth: 480,
    color: "#69717D",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },

  retryButton: {
    marginTop: 18,
    minWidth: 100,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#173A73",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // ========================================
  // SUMMARY CARDS
  // ========================================

  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 28,
    marginBottom: 32,
  },

  summaryCard: {
    flexGrow: 1,
    flexBasis: 230,
    minWidth: 210,
    minHeight: 120,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 20,
    justifyContent: "center",
  },

  summaryLabel: {
    color: "#123266",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 12,
  },

  summaryAmountRed: {
    color: "#FF2424",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
  },

  summaryAmountGreen: {
    color: "#16B53F",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
  },

  summaryCount: {
    color: "#9198A2",
    fontSize: 10,
    marginTop: 6,
  },

  // ========================================
  // PAYMENT TRANSACTIONS CARD
  // ========================================

  transactionsCard: {
    width: "100%",
    minHeight: 470,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1E4E8",
    overflow: "hidden",
  },

  transactionsTitleRow: {
    minHeight: 66,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },

  transactionsTitle: {
    color: "#123266",
    fontSize: 15,
    fontWeight: "800",
  },

  transactionsSubtitle: {
    color: "#8C939F",
    fontSize: 9,
    marginTop: 3,
  },

  transactionCount: {
    color: "#173A73",
    fontSize: 10,
    fontWeight: "700",
    backgroundColor: "#EEF3FA",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
  },

  // ========================================
  // TABLE
  // ========================================

  horizontalTableContent: {
    flexGrow: 1,
    minWidth: "100%",
  },

  table: {
    flex: 1,
    width: "100%",
    minWidth: 900,
    minHeight: 385,
    backgroundColor: "#FFFFFF",
  },

  // ========================================
  // TABLE HEADER
  // ========================================

  tableHeader: {
    width: "100%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#173A73",
    paddingHorizontal: 12,
  },

  headerCell: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
  },

  // ========================================
  // TABLE COLUMNS
  //
  // These flex values make all columns
  // expand evenly across the whole table.
  // ========================================

  transactionColumn: {
    flex: 1.2,
    minWidth: 145,
    paddingHorizontal: 8,
  },

  methodColumn: {
    flex: 1.1,
    minWidth: 140,
    paddingHorizontal: 8,
  },

  studentColumn: {
    flex: 1.45,
    minWidth: 180,
    paddingHorizontal: 8,
  },

  amountColumn: {
    flex: 0.8,
    minWidth: 105,
    paddingHorizontal: 8,
  },

  fineColumn: {
    flex: 1.15,
    minWidth: 145,
    paddingHorizontal: 8,
  },

  dateColumn: {
    flex: 1,
    minWidth: 125,
    paddingHorizontal: 8,
  },

  // ========================================
  // TRANSACTION ROW
  //
  // Flat rows like Officers Directory.
  // ========================================

  transactionRow: {
    width: "100%",
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E7E9ED",
  },

  bodyCell: {
    color: "#30363D",
    fontSize: 10,
  },

  transactionReference: {
    color: "#123266",
    fontSize: 10,
    fontWeight: "800",
  },

  gatewayText: {
    color: "#8C939F",
    fontSize: 8,
    marginTop: 3,
  },

  studentName: {
    color: "#30363D",
    fontSize: 10,
    fontWeight: "700",
  },

  studentNumber: {
    color: "#8C939F",
    fontSize: 8,
    marginTop: 3,
  },

  amountText: {
    color: "#30363D",
    fontSize: 10,
    fontWeight: "700",
  },

  fineReference: {
    color: "#123266",
    fontSize: 10,
    fontWeight: "700",
  },

  dateText: {
    color: "#555D68",
    fontSize: 10,
  },

  // ========================================
  // PAYMENT STATUS
  // ========================================

  paymentStatusBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },

  paymentStatusText: {
    fontSize: 8,
    fontWeight: "800",
  },

  // ========================================
  // EMPTY TABLE
  // ========================================

  emptyState: {
    width: "100%",
    minHeight: 300,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#FFFFFF",
  },

  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#EAF0F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyIconText: {
    color: "#173A73",
    fontSize: 24,
    fontWeight: "800",
  },

  emptyTitle: {
    color: "#123266",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },

  emptyText: {
    maxWidth: 370,
    color: "#8C939F",
    fontSize: 9,
    lineHeight: 15,
    textAlign: "center",
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function ReportsStylesRoute() {
  return null;
}
