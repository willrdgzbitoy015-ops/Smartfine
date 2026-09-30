import { StyleSheet } from "react-native";
const COLORS = {
  navy: "#173A73",
  green: "#45B94F",
  lightGreen: "#56C85C",
  red: "#FF2424",
  background: "#E8E8E8",
  white: "#FFFFFF",
  text: "#123266",
  muted: "#8C939F",
  border: "#DADDE2",
};
export const styles = StyleSheet.create({
  // ==========================================
  // SCREEN
  // ==========================================
  screen: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.background,
  },
  // ==========================================
  // LOADING / ERROR
  // ==========================================
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: 30,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 14,
  },
  errorStateText: {
    color: COLORS.red,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  backErrorButton: {
    marginTop: 15,
    padding: 8,
  },
  backErrorText: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: "700",
  },
  // ==========================================
  // SIDEBAR
  // ==========================================
  sidebar: {
    width: 220,
    minHeight: "100%",
    backgroundColor: COLORS.navy,
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
    backgroundColor: COLORS.lightGreen,
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
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  navBadge: {
    marginLeft: "auto", minWidth: 22, height: 22, paddingHorizontal: 5,
    borderRadius: 11, backgroundColor: COLORS.red,
    alignItems: "center", justifyContent: "center",
  },
  navBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
    logoutButton: {
    marginTop: "auto",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  logoutText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  // ==========================================
  // MAIN
  // ==========================================
  main: {
    flex: 1,
    minWidth: 0,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 38,
    paddingTop: 30,
    paddingBottom: 40,
  },
  scrollContentCompact: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 30,
  },
  // ==========================================
  // BACK / PAGE TITLE
  // ==========================================
  backButton: {
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    marginBottom: 35,
  },
  backIconImage: {
    width: 22,
    height: 22,
    marginRight: 10,
    flexShrink: 0,
    transform: [
      {
        rotate: "180deg",
      },
    ],
  },
  backText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    flexShrink: 1,
  },
  backTextCompact: {
    fontSize: 18,
  },
  // ==========================================
  // MOBILE NAV
  // ==========================================
  mobileNav: {
    gap: 8,
    paddingBottom: 25,
  },
  mobileNavItem: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mobileNavBadge: {
    minWidth: 20, height: 20, paddingHorizontal: 4,
    borderRadius: 10, backgroundColor: COLORS.red,
    alignItems: "center", justifyContent: "center",
  },
    mobileNavItemActive: {
    backgroundColor: COLORS.green,
  },
  mobileNavText: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: "600",
  },
  mobileNavTextActive: {
    color: COLORS.white,
  },
  // ==========================================
  // DETAILS
  // ==========================================
  detailsCard: {
    width: "100%",
    maxWidth: 1000,
    minHeight: 350,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 30,
    paddingVertical: 28,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  cashRequestBanner: {
    backgroundColor: "#FFF5E8",
    borderWidth: 1,
    borderColor: "#F0C38E",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 20,
  },
  cashRequestBannerTitle: {
    color: "#875000",
    fontSize: 14,
    fontWeight: "800",
  },
  cashRequestBannerText: {
    color: "#755B39",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },
  cardTitle: {
    flexGrow: 1,
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  notificationNew: {
    color: COLORS.red, fontSize: 11, fontWeight: "800",
  },
  notificationRead: {
    color: COLORS.muted, fontSize: 11, fontWeight: "700",
  },
    divider: {
    height: 1,
    backgroundColor: "#E2E5EA",
    marginTop: 22,
    marginBottom: 24,
  },
  // ==========================================
  // STATUS
  // ==========================================
  statusBadge: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeUnpaid: {
    backgroundColor: "#FFEAEA",
  },
  statusBadgePaid: {
    backgroundColor: "#E7F8EA",
  },
  statusBadgeCancelled: {
    backgroundColor: "#ECEFF4",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statusTextUnpaid: {
    color: "#D32F2F",
  },
  statusTextPaid: {
    color: "#2E9D43",
  },
  statusTextCancelled: {
    color: "#606775",
  },
  // ==========================================
  // INFORMATION
  // ==========================================
  informationArea: {
    width: "100%",
    maxWidth: 750,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: 18,
    rowGap: 5,
  },
  infoLabel: {
    width: 170,
    maxWidth: "100%",
    color: "#626874",
    fontSize: 13,
    fontWeight: "500",
  },
  infoValue: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 150,
    color: "#292929",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  infoValueEmphasized: {
    color: COLORS.navy,
    fontWeight: "800",
  },
  // ==========================================
  // ACTION ERROR
  // ==========================================
  actionError: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    marginTop: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#FF9A9A",
    borderRadius: 8,
    backgroundColor: "#FFEAEA",
  },
  actionErrorText: {
    color: "#D32F2F",
    fontSize: 12,
    textAlign: "center",
  },
  // ==========================================
  // ACTION BUTTONS
  // ==========================================
  actionRow: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 55,
  },
  cancelFineButton: {
    minWidth: 135,
    height: 44,
    backgroundColor: COLORS.red,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cancelFineText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  editButton: {
    minWidth: 110,
    height: 44,
    backgroundColor: COLORS.navy,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  paidButton: {
    minWidth: 145,
    height: 44,
    backgroundColor: COLORS.green,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  paidButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.4,
  },
  completedHint: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
  },
  // ==========================================
  // SHARED MODAL OVERLAY
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  // ==========================================
  // CANCEL FINE MODAL
  // ==========================================
  cancelModalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 26,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 20,
  },
  cancelModalTitle: {
    color: "#173A73",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  cancelModalMessage: {
    color: "#5E6673",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 22,
  },
  cancelModalFineReference: {
    color: "#173A73",
    fontWeight: "800",
  },
  cancelReasonLabel: {
    color: "#222222",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  cancelReasonInput: {
    width: "100%",
    minHeight: 105,
    borderWidth: 1,
    borderColor: "#AEB4BE",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#222222",
    fontSize: 13,
    outlineStyle: "none",
  } as any,
  cancelReasonCounter: {
    color: "#8C939F",
    fontSize: 10,
    textAlign: "right",
    marginTop: 5,
  },
  cancelModalError: {
    marginTop: 12,
    backgroundColor: "#FFEAEA",
    borderWidth: 1,
    borderColor: "#FF9B9B",
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  cancelModalErrorText: {
    color: "#D32F2F",
    fontSize: 11,
  },
  cancelModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 25,
  },
  cancelModalBackButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 125,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#173A73",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  cancelModalBackText: {
    color: "#173A73",
    fontSize: 12,
    fontWeight: "700",
  },
  cancelModalConfirmButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 145,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: "#FF2424",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  cancelModalConfirmText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  cancelModalButtonDisabled: {
    opacity: 0.5,
  },
  // ==========================================
  // MARK AS PAID MODAL
  // ==========================================
  paidModalCard: {
    width: "100%",
    maxWidth: 415,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#555555",
    paddingTop: 27,
    paddingHorizontal: 32,
    paddingBottom: 32,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 12,
  },
  paidModalIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E7F8EA",
    borderWidth: 2,
    borderColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  paidModalIconText: {
    color: COLORS.green,
    fontSize: 28,
    fontWeight: "800",
  },
  paidModalTitle: {
    color: COLORS.navy,
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  paidModalMessage: {
    width: "100%",
    color: "#64789B",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 20,
  },
  paidModalFineReference: {
    color: COLORS.navy,
    fontWeight: "800",
  },
  paidModalAmountBox: {
    width: "100%",
    maxWidth: 280,
    backgroundColor: "#F5F7FA",
    borderRadius: 9,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 28,
  },
  paidModalAmountLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginBottom: 4,
  },
  paidModalAmount: {
    color: COLORS.green,
    fontSize: 20,
    fontWeight: "800",
  },
  paidModalActions: {
    width: "100%",
    maxWidth: 310,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  paidModalCancelButton: {
    flex: 1,
    height: 43,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: "#7A8EAD",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  paidModalCancelText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "700",
  },
  paidModalConfirmButton: {
    flex: 1,
    height: 43,
    backgroundColor: COLORS.green,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  paidModalConfirmText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },
  paidModalButtonDisabled: {
    opacity: 0.55,
  },
});
// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================
export default function FineProfileStylesRoute() {
  return null;
}
