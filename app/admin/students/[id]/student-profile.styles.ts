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

    marginBottom: 20,
  },

  mobileNavItem: {
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

    fontSize: 12,

    fontWeight: "700",
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

    fontSize: 27,

    fontWeight: "800",
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

    fontSize: 25,

    fontWeight: "800",

    marginBottom: 8,
  },

  studentNameCompact: {
    fontSize: 19,

    marginBottom: 5,
  },

  studentMeta: {
    color: COLORS.muted,

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

    fontSize: 12,

    fontWeight: "800",
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

  summaryRow: {
    width: "100%",

    maxWidth: 1000,

    alignSelf: "center",

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 25,

    marginTop: 30,
  },

  summaryCard: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 320,

    minWidth: 260,

    minHeight: 130,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: "#333333",

    borderRadius: 8,

    paddingHorizontal: 24,

    paddingVertical: 22,

    justifyContent: "center",
  },

  summaryCardCompact: {
    flexBasis: "100%",

    minWidth: 0,

    minHeight: 105,

    paddingHorizontal: 20,

    paddingVertical: 18,
  },

  summaryLabel: {
    color: "#111111",

    fontSize: 13,

    fontWeight: "800",

    marginBottom: 15,
  },

  outstandingValue: {
    color: "#E52323",

    fontSize: 26,

    fontWeight: "800",
  },

  paidValue: {
    color: "#00A21B",

    fontSize: 26,

    fontWeight: "800",
  },

  // ==========================================
  // HISTORY
  // ==========================================

  historyCard: {
    width: "100%",

    maxWidth: 1100,

    alignSelf: "center",

    backgroundColor: COLORS.white,

    borderRadius: 12,

    marginTop: 30,

    overflow: "hidden",
  },

  historyTitleBar: {
    minHeight: 58,

    justifyContent: "center",

    backgroundColor: COLORS.navy,

    paddingHorizontal: 24,
  },

  historyTitle: {
    color: COLORS.white,

    fontSize: 15,

    fontWeight: "800",
  },

  historyTable: {
    minWidth: 1000,
  },

  historyHeader: {
    minHeight: 48,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#F1F2F4",

    paddingHorizontal: 24,
  },

  historyHeaderText: {
    color: "#333333",

    fontSize: 11,

    fontWeight: "700",
  },

  historyRow: {
    minHeight: 62,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 24,

    backgroundColor: COLORS.white,

    borderBottomWidth: 1,

    borderBottomColor: "#E5E5E5",
  },

  historyCell: {
    color: "#555555",

    fontSize: 11,
  },

  violationColumn: {
    width: 240,
  },

  dateColumn: {
    width: 230,
  },

  amountColumn: {
    width: 140,
  },

  fineStatusColumn: {
    width: 140,

    alignItems: "center",

    justifyContent: "center",
  },

  officerColumn: {
    width: 190,
  },

  violationText: {
    color: "#222222",

    fontWeight: "600",
  },

  amountText: {
    color: "#222222",

    fontWeight: "800",
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
    fontSize: 10,

    fontWeight: "800",
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

    fontSize: 11,
  },

  // ==========================================
  // LOADING / ERROR
  // ==========================================

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

    fontSize: 12,

    marginTop: 12,
  },

  errorText: {
    color: COLORS.red,

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

    fontSize: 12,

    fontWeight: "800",
  },

  // ==========================================
  // QR MODAL
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

    fontSize: 21,

    fontWeight: "800",
  },

  qrModalSubtitle: {
    color: "#7A8290",

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

    fontSize: 22,

    fontWeight: "700",

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

    fontSize: 20,

    fontWeight: "800",

    textAlign: "center",
  },

  qrStudentId: {
    color: COLORS.navy,

    fontSize: 13,

    fontWeight: "800",

    textAlign: "center",

    marginTop: 6,
  },

  qrGradeSection: {
    color: "#777777",

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

    fontSize: 11,

    fontWeight: "800",

    marginBottom: 4,
  },

  qrNoteText: {
    color: "#707784",

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

    fontSize: 12,

    fontWeight: "800",
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function StudentProfileStylesRoute() {
  return null;
}
