import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",
  darkNavy: "#123266",
  green: "#45B94F",
  lightGreen: "#56C85C",
  white: "#FFFFFF",
  background: "#E8E8E8",
  text: "#123266",
  muted: "#8C939F",
  border: "#DADDE2",
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
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 40,
  },

  // ==========================================
  // MOBILE NAVIGATION
  // ==========================================

  // A ScrollView grows to fill spare height by default; without this the
  // menu pills stretch tall when the page is shorter than the screen.
  mobileNavScroll: {
    flexGrow: 0,
  },

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
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  mobileNavTextActive: {
    color: COLORS.white,
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    marginBottom: 28,
  },

  pageTitle: {
    color: COLORS.text,
    fontFamily: "Poppins_700Bold",
    fontSize: 27,
  },

  pageSubtitle: {
    color: "#6F7682",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginTop: 5,
  },

  // ==========================================
  // TOOLBAR
  // ==========================================

  toolbar: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    zIndex: 500,
  },

  // ==========================================
  // SEARCH
  // ==========================================

  searchContainer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 300,
    minWidth: 230,
    maxWidth: 390,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#D2D6DC",
    paddingHorizontal: 13,
  },

  searchIcon: {
    color: COLORS.muted,
    fontFamily: "Poppins_400Regular",
    fontSize: 20,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    color: "#222222",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    outlineStyle: "none",
  } as any,

  // ==========================================
  // FILTERS
  // ==========================================

  filterWrapper: {
    width: 145,
    position: "relative",
    zIndex: 900,
  },

  areaFilterWrapper: {
    width: 175,
    zIndex: 800,
  },

  filterButton: {
    width: "100%",
    height: 44,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#D2D6DC",
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 13,
    gap: 8,
  },

  filterText: {
    flex: 1,
    color: "#333333",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  filterArrow: {
    color: "#555555",
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
  },

  filterMenu: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.navy,
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 9999,
    elevation: 30,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  filterOption: {
    minHeight: 42,
    justifyContent: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E8EB",
  },

  filterOptionText: {
    color: COLORS.text,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  // ==========================================
  // ADD OFFICER
  // ==========================================

  addButton: {
    height: 44,
    backgroundColor: COLORS.green,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  addButtonText: {
    color: COLORS.white,
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },

  // ==========================================
  // TABLE CARD
  // ==========================================

  tableCard: {
    width: "100%",
    maxWidth: 1100,
    minHeight: 260,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  centerState: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  stateText: {
    color: COLORS.muted,
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
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  retryText: {
    color: COLORS.white,
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },

  // ==========================================
  // TABLE
  // ==========================================

  // Lets the table stretch to the card on wide screens and scroll sideways
  // when the card is narrower than the columns need.
  tableScroll: {
    flexGrow: 1,
  },

  table: {
    flexGrow: 1,
    minWidth: 920,
  },

  // ==========================================
  // TABLE HEADER
  // ==========================================

  tableHeader: {
    width: "100%",
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
  },

  headerCell: {
    color: COLORS.white,
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
  },

  // ==========================================
  // COLUMNS
  // ==========================================

  // Columns share the width in proportion, with a minimum so nothing is
  // squeezed too small.
  employeeColumn: {
    flex: 1,
    minWidth: 100,
  },

  nameColumn: {
    flex: 2,
    minWidth: 170,
  },

  areaColumn: {
    flex: 1.5,
    minWidth: 130,
  },

  emailColumn: {
    flex: 2,
    minWidth: 180,
  },

  contactColumn: {
    flex: 1.3,
    minWidth: 110,
  },

  finesColumn: {
    flex: 1,
    minWidth: 90,
    textAlign: "center",
  },

  statusColumn: {
    flex: 1,
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
    // For the "Status" heading, which is text rather than a badge.
    textAlign: "center",
  },

  // ==========================================
  // OFFICER ROW
  // ==========================================

  officerRow: {
    width: "100%",
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF1",
  },

  bodyCell: {
    color: "#333333",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    paddingRight: 12,
  },

  employeeNumber: {
    color: COLORS.navy,
    fontFamily: "Poppins_700Bold",
  },

  officerName: {
    color: "#222222",
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    paddingRight: 12,
  },

  usernameText: {
    color: COLORS.muted,
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    marginTop: 4,
  },

  finesRecorded: {
    color: COLORS.navy,
    fontFamily: "Poppins_700Bold",
  },

  // ==========================================
  // SUMMARY CARDS
  // ==========================================

  summaryWrap: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    marginBottom: 24,
  },

  // ==========================================
  // NAME CELL: initials beside the name
  // ==========================================

  nameCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  nameText: {
    flex: 1,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EEF8",
  },

  avatarText: {
    color: COLORS.navy,
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
  },

  // ==========================================
  // PHONE: each officer as a card
  // ==========================================

  cardList: {
    padding: 14,
    gap: 12,
  },

  officerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E8EB",
    padding: 14,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardIdentity: {
    flex: 1,
  },

  cardName: {
    color: "#222222",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },

  cardSub: {
    color: COLORS.muted,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    marginTop: 1,
  },

  cardDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF0F3",
    gap: 6,
  },

  cardLine: {
    flexDirection: "row",
    gap: 8,
  },

  cardLabel: {
    width: 62,
    color: COLORS.muted,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },

  cardValue: {
    flex: 1,
    color: "#333333",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },

  cardValueStrong: {
    flex: 1,
    color: COLORS.navy,
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },

  // ==========================================
  // STATUS
  // ==========================================

  statusBadge: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  activeBadge: {
    backgroundColor: "#E7F8EA",
  },

  inactiveBadge: {
    backgroundColor: "#ECEFF4",
  },

  statusText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
  },

  activeStatusText: {
    color: "#2E9D43",
  },

  inactiveStatusText: {
    color: "#606775",
  },

  // ==========================================
  // EMPTY
  // ==========================================

  emptyRow: {
    width: "100%",
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: COLORS.muted,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },

  // ==========================================
  // TABLE FOOTER
  // ==========================================

  tableFooter: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    borderTopWidth: 1,
    borderTopColor: "#E6E8EB",
    backgroundColor: "#FAFAFB",
  },

  totalOfficersText: {
    color: COLORS.text,
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
  },

  visibleOfficersText: {
    color: COLORS.muted,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function OfficersStylesRoute() {
  return null;
}
