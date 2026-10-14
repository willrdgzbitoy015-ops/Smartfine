import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",
  text: "#123266",
  green: "#45B94F",
  lightGreen: "#56C85C",
  white: "#FFFFFF",
  background: "#E8E8E8",
  muted: "#777777",
  red: "#FF2424",
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
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
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
    color: COLORS.white,
    fontFamily: "Poppins_600SemiBold",
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
    paddingBottom: 60,
  },

  scrollContentCompact: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 35,
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
    marginBottom: 22,
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
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
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
    marginBottom: 20,
  },

  mobileNavItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  mobileNavItemActive: {
    backgroundColor: COLORS.green,
  },

  mobileNavText: {
    color: COLORS.navy,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  mobileNavTextActive: {
    color: COLORS.white,
  },

  // ==========================================
  // PROFILE CARD
  // ==========================================

  profileCard: {
    width: "100%",
    maxWidth: 1080,
    minHeight: 150,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 25,
    elevation: 1,
  },

  profileCardCompact: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 18,
  },

  profileLeft: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 420,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },

  profileLeftCompact: {
    flexBasis: "100%",
    gap: 16,
  },

  // ==========================================
  // AVATAR
  // ==========================================

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E2E2E2",
    flexShrink: 0,
  },

  avatarCompact: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },

  avatarText: {
    color: COLORS.white,
    fontFamily: "Poppins_700Bold",
    fontSize: 27,
  },

  avatarTextCompact: {
    fontSize: 22,
  },

  // ==========================================
  // STUDENT INFO
  // ==========================================

  studentInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  studentName: {
    color: "#111111",
    fontFamily: "Poppins_700Bold",
    fontSize: 25,
    marginBottom: 8,
  },

  studentNameCompact: {
    fontSize: 19,
    marginBottom: 5,
  },

  studentMeta: {
    color: COLORS.muted,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 21,
  },

  // ==========================================
  // PROFILE ACTIONS
  // ==========================================

  profileActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 12,
  },

  profileActionsCompact: {
    width: "100%",
    justifyContent: "flex-start",
  },

  outlineButton: {
    minWidth: 145,
    height: 48,
    borderWidth: 1,
    borderColor: "#222222",
    borderRadius: 8,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  outlineButtonCompact: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 150,
    minWidth: 135,
  },

  outlineButtonText: {
    color: "#111111",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  // The main action on the profile: green, like "+ Add Fine" on the Fines page.
  addFineButton: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  addFineButtonDisabled: {
    opacity: 0.45,
  },

  addFineButtonText: {
    color: COLORS.white,
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },

  // Why the Add Fine button is dimmed.
  inactiveHint: {
    flexBasis: "100%",
    color: "#B42318",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    textAlign: "right",
  },

  inactiveHintCompact: {
    textAlign: "left",
  },

  actionButtonIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    flexShrink: 0,
  },

  // ==========================================
  // SUMMARY
  // ==========================================

  // Holds the shared summary cards at the same width as the cards around it.
  summaryWrap: {
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
    marginTop: 24,
  },

  // ==========================================
  // HISTORY
  // ==========================================

  historyCard: {
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginTop: 24,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  historyTitleBar: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },

  historyTitle: {
    color: COLORS.navy,
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },

  historySubtitle: {
    marginTop: 3,
    color: "#8C939F",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },

  // Lets the table stretch to the card on wide screens and scroll sideways
  // when it is narrower than its columns need.
  historyScroll: {
    flexGrow: 1,
  },

  // On a phone the content is exactly as wide as the card, so long lines wrap
  // instead of pushing the amount and status off the edge.
  historyScrollCompact: {
    width: "100%",
  },

  historyTable: {
    flexGrow: 1,
    minWidth: 700,
  },

  // A phone lists each fine as a card, so it never scrolls sideways.
  historyTableCompact: {
    minWidth: 0,
    width: "100%",
  },

  historyHeader: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.navy,
    paddingHorizontal: 24,
  },

  historyHeaderText: {
    color: COLORS.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
  },

  historyRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF1",
  },

  historyCell: {
    color: "#555555",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },

  // Columns share the width in proportion, with a minimum so nothing is
  // squeezed too small.
  violationColumn: {
    flex: 2.2,
    minWidth: 150,
  },

  dateColumn: {
    flex: 2,
    minWidth: 150,
  },

  amountColumn: {
    flex: 1.2,
    minWidth: 100,
  },

  fineStatusColumn: {
    flex: 1.2,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  officerColumn: {
    flex: 1.8,
    minWidth: 130,
  },

  // ----- phone card rows -----

  compactRow: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#ECEEF1",
  },

  compactTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  compactViolation: {
    flex: 1,
    fontSize: 13,
  },

  compactBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },

  compactMeta: {
    flex: 1,
    color: "#7A8290",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },

  violationText: {
    color: "#222222",
    fontFamily: "Poppins_500Medium",
  },

  amountText: {
    color: "#222222",
    fontFamily: "Poppins_700Bold",
  },

  // ==========================================
  // STATUS
  // ==========================================

  statusBadge: {
    minWidth: 67,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },

  statusBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
  },

  paidBadge: {
    backgroundColor: "#E3F5E7",
  },

  paidBadgeText: {
    color: "#2E9D43",
  },

  unpaidBadge: {
    backgroundColor: "#FFE5E5",
  },

  unpaidBadgeText: {
    color: "#E52323",
  },

  cancelledBadge: {
    backgroundColor: "#ECEFF4",
  },

  cancelledBadgeText: {
    color: "#606775",
  },

  // ==========================================
  // EMPTY
  // ==========================================

  emptyHistory: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyHistoryText: {
    color: "#8C939F",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  // Placeholder while the page loads.
  skeleton: {
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
  },

  centerState: {
    width: "100%",
    maxWidth: 1080,
    minHeight: 350,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  stateText: {
    color: "#8C939F",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginTop: 12,
  },

  errorText: {
    color: COLORS.red,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 18,
  },

  retryButton: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  retryText: {
    color: COLORS.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  // ==========================================
  // SHARED MODAL
  // ==========================================

  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // ==========================================
  // FINE INFORMATION MODAL
  // ==========================================

  fineModal: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "88%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 24,
    elevation: 12,
  },

  fineModalCompact: {
    paddingHorizontal: 18,
    paddingVertical: 20,
  },

  fineModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
  },

  fineModalTitleArea: {
    flex: 1,
    minWidth: 0,
  },

  fineModalTitle: {
    color: COLORS.text,
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
  },

  fineModalSubtitle: {
    color: "#7A8290",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    marginTop: 4,
  },

  fineModalDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E0E3E8",
    marginTop: 18,
    marginBottom: 20,
  },

  fineModalScroll: {
    flexGrow: 0,
  },

  fineDetailRows: {
    width: "100%",
  },

  fineDetailRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 9,
  },

  fineDetailLabel: {
    width: 150,
    flexShrink: 0,
    color: "#626975",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },

  fineDetailValue: {
    flex: 1,
    color: "#222222",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },

  fineDetailAmount: {
    flex: 1,
    color: COLORS.navy,
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },

  fineModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },

  fineCloseButton: {
    minWidth: 110,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.navy,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
  },

  fineCloseButtonText: {
    color: COLORS.navy,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  fineManageButton: {
    minWidth: 130,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 18,
  },

  fineManageButtonText: {
    color: COLORS.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  // ==========================================
  // QR MODAL
  // ==========================================

  qrModal: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 26,
    elevation: 10,
  },

  qrModalCompact: {
    paddingHorizontal: 18,
    paddingVertical: 20,
  },

  qrModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 24,
  },

  qrModalTitle: {
    color: COLORS.text,
    fontFamily: "Poppins_700Bold",
    fontSize: 21,
  },

  qrModalSubtitle: {
    color: "#7A8290",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
    maxWidth: 320,
  },

  closeIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFF1F4",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  closeIconText: {
    color: "#444444",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    lineHeight: 24,
  },

  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  qrWhiteBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E2E5",
    borderRadius: 14,
    padding: 15,
  },

  qrStudentName: {
    color: "#111111",
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    textAlign: "center",
  },

  qrStudentId: {
    color: COLORS.navy,
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },

  qrGradeSection: {
    color: "#777777",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },

  qrNoteBox: {
    backgroundColor: "#F3F6FA",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginTop: 20,
  },

  qrNoteTitle: {
    color: COLORS.navy,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    marginBottom: 4,
  },

  qrNoteText: {
    color: "#707784",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 15,
  },

  qrCloseButton: {
    height: 45,
    backgroundColor: COLORS.navy,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  qrCloseButtonText: {
    color: COLORS.white,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function StudentProfileStylesRoute() {
  return null;
}
