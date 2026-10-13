import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",

  text: "#123266",

  green: "#45B94F",

  lightGreen: "#56C85C",

  white: "#FFFFFF",

  background: "#E8E8E8",

  muted: "#8C939F",

  red: "#D32F2F",
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

    paddingTop: 35,

    paddingBottom: 60,
  },

  scrollContentCompact: {
    paddingHorizontal: 16,

    paddingTop: 18,

    paddingBottom: 35,
  },

  // ==========================================
  // MOBILE NAVIGATION
  // ==========================================

  mobileNav: {
    gap: 8,

    paddingBottom: 25,
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

    fontSize: 12,

    fontFamily: "Poppins_600SemiBold",
  },

  mobileNavTextActive: {
    color: COLORS.white,
  },

  // ==========================================
  // PAGE HEADER
  // ==========================================

  pageHeader: {
    width: "100%",

    maxWidth: 1050,

    alignSelf: "center",

    marginBottom: 28,
  },

  backButton: {
    alignSelf: "flex-start",

    flexDirection: "row",

    alignItems: "center",

    maxWidth: "100%",

    minHeight: 44,
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

    fontFamily: "Poppins_700Bold",

    flexShrink: 1,
  },

  backTextCompact: {
    fontSize: 18,
  },

  headerSubtitle: {
    marginLeft: 32,

    marginTop: 4,
  },

  pageSubtitle: {
    color: "#6F7682",

    fontSize: 12,

    lineHeight: 18,

    fontFamily: "Poppins_400Regular",
  },

  // ==========================================
  // PROFILE CARD
  // ==========================================

  profileCard: {
    width: "100%",

    maxWidth: 1050,

    alignSelf: "center",

    backgroundColor: COLORS.white,

    borderRadius: 15,

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

  profileCardCompact: {
    paddingHorizontal: 18,

    paddingVertical: 20,
  },

  profileTop: {
    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: 20,
  },

  profileTopCompact: {
    alignItems: "flex-start",
  },

  // ==========================================
  // AVATAR
  // ==========================================

  avatar: {
    width: 82,

    height: 82,

    borderRadius: 41,

    backgroundColor: COLORS.navy,

    alignItems: "center",

    justifyContent: "center",

    flexShrink: 0,
  },

  avatarImage: {
    width: 82,

    height: 82,

    borderRadius: 41,

    backgroundColor: "#E6E8EC",

    flexShrink: 0,
  },

  avatarCompact: {
    width: 70,

    height: 70,

    borderRadius: 35,
  },

  avatarText: {
    color: COLORS.white,

    fontSize: 27,

    fontFamily: "Poppins_700Bold",
  },

  avatarTextCompact: {
    fontSize: 22,
  },

  // ==========================================
  // PROFILE HEADING
  // ==========================================

  profileHeading: {
    flexGrow: 1,

    flexShrink: 1,

    minWidth: 180,
  },

  officerName: {
    color: COLORS.text,

    fontSize: 23,

    fontFamily: "Poppins_700Bold",
  },

  officerNameCompact: {
    fontSize: 19,
  },

  employeeNumber: {
    color: "#657080",

    fontSize: 12,

    fontFamily: "Poppins_600SemiBold",

    marginTop: 4,
  },

  // ==========================================
  // PROFILE ACTION BUTTONS
  // ==========================================

  profileActions: {
    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    justifyContent: "flex-end",

    gap: 10,
  },

  profileActionsCompact: {
    width: "100%",

    justifyContent: "flex-start",
  },

  profileActionButtonCompact: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 145,

    minWidth: 130,
  },

  // ==========================================
  // EDIT INFORMATION BUTTON
  // ==========================================

  editButton: {
    minWidth: 170,

    minHeight: 44,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 8,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    paddingHorizontal: 18,
  },

  editButtonIcon: {
    width: 19,

    height: 19,
  },

  editButtonText: {
    color: COLORS.text,

    fontSize: 12,

    fontFamily: "Poppins_600SemiBold",
  },

  // ==========================================
  // DELETE OFFICER BUTTON
  // ==========================================

  deleteButton: {
    minWidth: 150,

    minHeight: 44,

    backgroundColor: COLORS.red,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 18,
  },

  deleteButtonDisabled: {
    opacity: 0.5,
  },

  deleteButtonText: {
    color: COLORS.white,

    fontSize: 12,

    fontFamily: "Poppins_600SemiBold",
  },

  // ==========================================
  // ACCOUNT STATUS
  // ==========================================

  statusBadge: {
    alignSelf: "flex-start",

    minWidth: 74,

    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 20,

    alignItems: "center",

    marginTop: 9,
  },

  activeBadge: {
    backgroundColor: "#E5F7E8",
  },

  inactiveBadge: {
    backgroundColor: "#ECEFF4",
  },

  statusBadgeText: {
    fontSize: 10,

    fontFamily: "Poppins_600SemiBold",
  },

  activeStatusText: {
    color: "#2E9D43",
  },

  inactiveStatusText: {
    color: "#606775",
  },

  // ==========================================
  // DIVIDER
  // ==========================================

  divider: {
    height: 1,

    backgroundColor: "#E3E5E8",

    marginVertical: 28,
  },

  // ==========================================
  // OFFICER DETAILS
  // ==========================================

  detailsGrid: {
    width: "100%",

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 22,
  },

  detailItem: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 260,

    minWidth: 0,

    backgroundColor: "#F7F8FA",

    borderRadius: 10,

    paddingHorizontal: 16,

    paddingVertical: 14,
  },

  detailLabel: {
    color: COLORS.muted,

    fontSize: 10,

    fontFamily: "Poppins_500Medium",

    marginBottom: 6,
  },

  detailValue: {
    color: "#333333",

    fontSize: 12,

    fontFamily: "Poppins_400Regular",

    flexShrink: 1,
  },

  detailValueStrong: {
    color: COLORS.navy,

    fontSize: 13,

    fontFamily: "Poppins_600SemiBold",

    flexShrink: 1,
  },

  // ==========================================
  // SUMMARY
  // ==========================================

  summaryRow: {
    width: "100%",

    maxWidth: 1050,

    alignSelf: "center",

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 20,

    marginTop: 24,
  },

  summaryCard: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 320,

    minWidth: 230,

    minHeight: 115,

    backgroundColor: COLORS.white,

    borderRadius: 14,

    alignItems: "center",

    justifyContent: "center",

    padding: 20,

    shadowColor: "#000000",

    shadowOpacity: 0.04,

    shadowRadius: 5,

    shadowOffset: {
      width: 0,

      height: 2,
    },

    elevation: 2,
  },

  summaryCardCompact: {
    flexBasis: "100%",

    minWidth: 0,

    minHeight: 100,
  },

  summaryLabel: {
    color: "#6E7682",

    fontSize: 11,

    fontFamily: "Poppins_500Medium",

    marginBottom: 8,

    textAlign: "center",
  },

  summaryValue: {
    color: COLORS.navy,

    fontSize: 27,

    fontFamily: "Poppins_700Bold",
  },

  summaryValueGreen: {
    color: COLORS.green,

    fontSize: 27,

    fontFamily: "Poppins_700Bold",
  },

  // ==========================================
  // RECENT FINES CARD
  // ==========================================

  historyCard: {
    width: "100%",

    maxWidth: 1050,

    alignSelf: "center",

    backgroundColor: COLORS.white,

    borderRadius: 14,

    marginTop: 24,

    overflow: "hidden",

    shadowColor: "#000000",

    shadowOpacity: 0.04,

    shadowRadius: 5,

    shadowOffset: {
      width: 0,

      height: 2,
    },

    elevation: 2,
  },

  historyHeaderBar: {
    paddingHorizontal: 24,

    paddingVertical: 20,
  },

  historyTitle: {
    color: COLORS.text,

    fontSize: 17,

    fontFamily: "Poppins_600SemiBold",
  },

  historySubtitle: {
    color: COLORS.muted,

    fontSize: 10,

    fontFamily: "Poppins_400Regular",

    marginTop: 4,
  },

  // ==========================================
  // HISTORY TABLE
  // ==========================================

  historyTable: {
    minWidth: 1000,
  },

  tableHeader: {
    minHeight: 55,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: COLORS.navy,

    paddingHorizontal: 20,
  },

  headerCell: {
    color: COLORS.white,

    fontSize: 10,

    fontFamily: "Poppins_600SemiBold",

    textTransform: "uppercase",
  },

  historyRow: {
    minHeight: 70,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: COLORS.white,

    paddingHorizontal: 20,

    borderBottomWidth: 1,

    borderBottomColor: "#ECEEF1",
  },

  bodyCell: {
    color: "#333333",

    fontSize: 11,

    fontFamily: "Poppins_400Regular",

    paddingRight: 10,
  },

  // ==========================================
  // TABLE COLUMNS
  // ==========================================

  referenceColumn: {
    width: 150,
  },

  studentColumn: {
    width: 190,
  },

  violationColumn: {
    width: 210,
  },

  dateColumn: {
    width: 145,
  },

  amountColumn: {
    width: 130,
  },

  statusColumn: {
    width: 130,

    alignItems: "center",

    justifyContent: "center",
  },

  // ==========================================
  // HISTORY CONTENT
  // ==========================================

  referenceText: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    textDecorationLine: "underline",
  },

  studentName: {
    color: "#222222",

    fontSize: 11,

    fontFamily: "Poppins_500Medium",
  },

  studentNumber: {
    color: COLORS.muted,

    fontSize: 9,

    fontFamily: "Poppins_300Light",

    marginTop: 3,
  },

  amountText: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",
  },

  // ==========================================
  // FINE STATUS
  // ==========================================

  fineStatusBadge: {
    minWidth: 78,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 10,

    paddingVertical: 6,

    borderRadius: 20,
  },

  fineStatusText: {
    fontSize: 10,

    fontFamily: "Poppins_600SemiBold",
  },

  // ==========================================
  // EMPTY HISTORY
  // ==========================================

  emptyHistory: {
    minHeight: 180,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyHistoryText: {
    color: COLORS.muted,

    fontSize: 11,

    fontFamily: "Poppins_400Regular",

    textAlign: "center",

    paddingHorizontal: 20,
  },

  // ==========================================
  // FINE INFORMATION POPUP BACKDROP
  // ==========================================

  fineModalBackdrop: {
    flex: 1,

    backgroundColor: "rgba(0, 0, 0, 0.48)",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 20,

    paddingVertical: 30,
  },

  // ==========================================
  // FINE INFORMATION POPUP
  // ==========================================

  fineModalCard: {
    width: "100%",

    maxWidth: 470,

    backgroundColor: COLORS.white,

    borderRadius: 16,

    paddingHorizontal: 26,

    paddingTop: 24,

    paddingBottom: 26,

    shadowColor: "#000000",

    shadowOpacity: 0.2,

    shadowRadius: 15,

    shadowOffset: {
      width: 0,

      height: 8,
    },

    elevation: 15,
  },

  fineModalCardCompact: {
    paddingHorizontal: 18,

    paddingTop: 20,

    paddingBottom: 20,
  },

  // ==========================================
  // FINE POPUP HEADER
  // ==========================================

  fineModalHeader: {
    width: "100%",

    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: 16,
  },

  fineModalHeaderText: {
    flex: 1,
  },

  fineModalTitle: {
    color: COLORS.text,

    fontSize: 19,

    fontFamily: "Poppins_700Bold",
  },

  fineModalSubtitle: {
    color: COLORS.muted,

    fontSize: 10,

    lineHeight: 16,

    fontFamily: "Poppins_400Regular",

    marginTop: 3,
  },

  // ==========================================
  // POPUP X BUTTON
  // ==========================================

  fineModalCloseIconButton: {
    width: 34,

    height: 34,

    borderRadius: 17,

    backgroundColor: "#F1F3F6",

    alignItems: "center",

    justifyContent: "center",

    flexShrink: 0,
  },

  fineModalCloseIcon: {
    color: COLORS.text,

    fontSize: 24,

    lineHeight: 27,

    fontFamily: "Poppins_500Medium",
  },

  // ==========================================
  // FINE REFERENCE
  // ==========================================

  fineReferenceBox: {
    marginTop: 20,

    backgroundColor: "#F4F7FB",

    borderRadius: 10,

    paddingHorizontal: 16,

    paddingVertical: 13,
  },

  fineReferenceLabel: {
    color: COLORS.muted,

    fontSize: 9,

    fontFamily: "Poppins_500Medium",
  },

  fineReferenceValue: {
    color: COLORS.navy,

    fontSize: 16,

    fontFamily: "Poppins_700Bold",

    marginTop: 3,
  },

  // ==========================================
  // MODAL DIVIDER
  // ==========================================

  fineModalDivider: {
    height: 1,

    backgroundColor: "#E4E7EB",

    marginVertical: 18,
  },

  // ==========================================
  // MODAL DETAILS
  // ==========================================

  fineModalDetails: {
    width: "100%",

    gap: 14,
  },

  fineModalRow: {
    width: "100%",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 18,
  },

  fineModalLabel: {
    width: 105,

    color: COLORS.muted,

    fontSize: 11,

    fontFamily: "Poppins_500Medium",
  },

  fineModalValue: {
    flex: 1,

    color: "#333333",

    fontSize: 11,

    fontFamily: "Poppins_400Regular",

    textAlign: "right",
  },

  fineModalAmount: {
    flex: 1,

    color: COLORS.navy,

    fontSize: 13,

    fontFamily: "Poppins_700Bold",

    textAlign: "right",
  },

  // ==========================================
  // MODAL STATUS
  // ==========================================

  fineModalStatusBadge: {
    minWidth: 82,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 20,
  },

  fineModalStatusText: {
    fontSize: 10,

    fontFamily: "Poppins_600SemiBold",
  },

  // ==========================================
  // MODAL CLOSE BUTTON
  // ==========================================

  fineModalCloseButton: {
    width: "100%",

    minHeight: 44,

    marginTop: 24,

    backgroundColor: COLORS.navy,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",
  },

  fineModalCloseButtonText: {
    color: COLORS.white,

    fontSize: 12,

    fontFamily: "Poppins_600SemiBold",
  },

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  // Placeholder while the page loads.
  skeleton: {
    width: "100%",
    maxWidth: 1050,
    alignSelf: "center",
  },

  centerState: {
    width: "100%",

    maxWidth: 1050,

    minHeight: 420,

    alignSelf: "center",

    backgroundColor: COLORS.white,

    borderRadius: 14,

    alignItems: "center",

    justifyContent: "center",

    padding: 30,
  },

  stateText: {
    color: COLORS.muted,

    fontSize: 12,

    fontFamily: "Poppins_400Regular",

    marginTop: 12,
  },

  errorText: {
    color: COLORS.red,

    fontSize: 12,

    fontFamily: "Poppins_400Regular",

    textAlign: "center",

    marginBottom: 18,
  },

  retryButton: {
    backgroundColor: COLORS.navy,

    borderRadius: 8,

    paddingHorizontal: 20,

    paddingVertical: 10,
  },

  retryText: {
    color: COLORS.white,

    fontSize: 12,

    fontFamily: "Poppins_600SemiBold",
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function OfficerProfileStylesRoute() {
  return null;
}
