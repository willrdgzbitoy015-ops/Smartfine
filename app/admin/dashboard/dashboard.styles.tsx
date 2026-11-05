import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",

  navyDark: "#0C2F64",

  green: "#45B94F",

  lightGreen: "#56C85C",

  red: "#FF2424",

  yellow: "#F4C542",

  background: "#F4F6F9",

  white: "#FFFFFF",

  text: "#123266",

  muted: "#8C939F",

  activityBackground: "#F5F7FA",
};

export const styles = StyleSheet.create({
  // ==========================================
  // SCREEN
  // ==========================================

  screen: {
    flex: 1,

    backgroundColor: COLORS.background,

    flexDirection: "row",
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

  navIcon: {
    width: 28,

    color: COLORS.white,

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
    color: COLORS.white,

    fontSize: 14,

    fontFamily: "Poppins_600SemiBold",
  },

  navTextActive: {
    color: COLORS.white,
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
  },

  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 28,

    paddingTop: 30,

    paddingBottom: 40,
  },

  // ==========================================
  // HEADER
  // ==========================================

  // Wraps on phones so the profile moves under the title instead of
  // running off the screen.
  header: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "space-between",

    alignItems: "center",

    gap: 12,

    marginBottom: 32,
  },

  pageTitle: {
    fontSize: 27,

    fontFamily: "Poppins_700Bold",

    color: COLORS.text,
  },

  dateText: {
    marginTop: 3,

    color: "#777777",

    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },

  profileArea: {
    flexDirection: "row",

    alignItems: "center",

    marginLeft: "auto",
  },

  // The notification bell sits to the left of the name and avatar.
  bellArea: {
    marginRight: 16,
  },

  profileTextArea: {
    alignItems: "flex-end",

    marginRight: 12,
  },

  adminName: {
    color: COLORS.text,

    fontSize: 13,

    fontFamily: "Poppins_500Medium",
  },

  adminRole: {
    color: COLORS.text,

    fontSize: 14,

    fontFamily: "Poppins_700Bold",
  },

  avatar: {
    width: 46,

    height: 46,

    borderRadius: 23,

    backgroundColor: "#252525",

    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",

    height: "100%",

    borderRadius: 23,
  },

  avatarText: {
    color: COLORS.white,

    fontFamily: "Poppins_700Bold",

    fontSize: 12,
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
  // SUMMARY CARDS
  // ==========================================

  // ==========================================
  // SUMMARY CARD LOADING
  // ==========================================

  // ==========================================
  // RECENT ACTIVITIES
  // ==========================================

  activityPanel: {
    width: "100%",

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: "#DCE4ED",

    borderRadius: 14,

    paddingHorizontal: 26,

    paddingTop: 22,

    paddingBottom: 22,

    shadowColor: COLORS.navyDark,

    shadowOffset: { width: 0, height: 3 },

    shadowOpacity: 0.05,

    shadowRadius: 8,

    elevation: 2,
  },

  activityHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 12,

    marginBottom: 18,
  },

  activityTitle: {
    color: COLORS.text,

    fontSize: 18,

    fontFamily: "Poppins_700Bold",

    flexShrink: 1,
  },

  activityList: {
    gap: 10,
  },

  activityItem: {
    minHeight: 68,

    backgroundColor: COLORS.activityBackground,

    borderRadius: 10,

    borderWidth: 1,

    borderColor: "#ECF0F5",

    paddingHorizontal: 20,

    paddingVertical: 12,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  activityTextArea: {
    flex: 1,

    paddingRight: 15,
  },

  activityDescription: {
    color: "#4D5B6B",

    fontFamily: "Poppins_400Regular",
    fontSize: 14,

    lineHeight: 20,
  },

  activityName: {
    color: COLORS.text,

    fontFamily: "Poppins_700Bold",
  },

  activityDetails: {
    color: "#7B8795",

    fontFamily: "Poppins_400Regular",
    fontSize: 11,

    marginTop: 4,
  },

  activityAmount: {
    fontSize: 14,

    fontFamily: "Poppins_700Bold",

    textAlign: "right",
  },

  amountPaid: {
    color: COLORS.green,
  },

  amountFine: {
    color: COLORS.red,
  },

  // ==========================================
  // ACTIVITY LOADING / EMPTY STATES
  // ==========================================

  activityLoadingContainer: {
    minHeight: 150,

    alignItems: "center",

    justifyContent: "center",
  },

  activityLoadingText: {
    marginTop: 12,

    color: COLORS.muted,

    fontSize: 12,

    fontFamily: "Poppins_500Medium",

    textAlign: "center",
  },

  activityEmptyContainer: {
    minHeight: 110,

    alignItems: "center",

    justifyContent: "center",
  },

  activityEmptyText: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",
    fontSize: 12,

    textAlign: "center",
  },

  viewActivitiesButton: {
    paddingHorizontal: 12,

    paddingVertical: 9,

    borderRadius: 8,

    backgroundColor: "#EDF3FA",
  },

  viewActivitiesText: {
    color: COLORS.text,

    fontSize: 12,

    fontFamily: "Poppins_700Bold",
  },

  // ==========================================
  // HEADER GREETING
  // ==========================================

  greetingText: {
    marginTop: 4,

    color: COLORS.text,

    fontSize: 14,

    fontFamily: "Poppins_600SemiBold",
  },

  // ==========================================
  // SUMMARY CARD EXTRAS (tappable cards)
  // ==========================================

  // The whole card is one touch target; the hint stays at the bottom.
  statsError: {
    alignSelf: "flex-start",

    marginBottom: 16,
  },

  // ==========================================
  // QUICK ACTIONS
  // ==========================================

  quickActions: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 10,

    marginBottom: 24,
  },

  quickAction: {
    flexGrow: 1,

    flexBasis: 150,

    flexDirection: "row",

    gap: 8,

    minHeight: 46,

    borderRadius: 10,

    borderWidth: 1,

    borderColor: "#D5DEE9",

    backgroundColor: COLORS.white,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 14,
  },

  quickActionPrimary: {
    backgroundColor: COLORS.green,

    borderColor: COLORS.green,
  },

  // Icons are single-colour PNGs, tinted to match each button.
  quickActionIcon: {
    width: 20,

    height: 20,

    tintColor: COLORS.navy,
  },

  quickActionIconPrimary: {
    tintColor: COLORS.white,
  },

  quickActionText: {
    color: COLORS.navy,

    fontSize: 13,

    fontFamily: "Poppins_700Bold",
  },

  quickActionTextPrimary: {
    color: COLORS.white,
  },

  // ==========================================
  // ACTIVITY ROWS
  // ==========================================

  activitySubtitle: {
    marginTop: 3,

    color: "#7B8795",

    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },

  activityChip: {
    alignSelf: "flex-start",

    overflow: "hidden",

    borderRadius: 10,

    paddingHorizontal: 8,

    paddingVertical: 3,

    fontSize: 10,

    fontFamily: "Poppins_700Bold",

    marginBottom: 5,
  },

  toneRed: { color: "#B42318", backgroundColor: "#FFEDEC" },

  toneAmber: { color: "#9A5B00", backgroundColor: "#FFF1D6" },

  toneGreen: { color: "#18833B", backgroundColor: "#E6F7EA" },

  toneGrey: { color: "#5E6776", backgroundColor: "#ECEFF4" },

  toneBlue: { color: "#1C5FA8", backgroundColor: "#E6F0FC" },

  amountAmber: {
    color: "#B26A00",
  },

  amountMuted: {
    color: COLORS.muted,
  },

  // ==========================================
  // ALL ACTIVITIES POP-UP (inside AdminModal)
  // ==========================================

  filterRow: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,

    paddingHorizontal: 22,

    paddingVertical: 12,

    borderBottomWidth: 1,

    borderBottomColor: "#E7ECF2",
  },

  filterChip: {
    paddingHorizontal: 13,

    paddingVertical: 7,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#D3D7DD",

    backgroundColor: COLORS.white,
  },

  filterChipActive: {
    backgroundColor: COLORS.navy,

    borderColor: COLORS.navy,
  },

  filterChipText: {
    color: COLORS.navy,

    fontSize: 11,

    fontFamily: "Poppins_700Bold",
  },

  filterChipTextActive: {
    color: COLORS.white,
  },

  modalList: {
    flexShrink: 1,
  },

  modalListContent: {
    gap: 10,

    padding: 18,
  },

  loadMoreButton: {
    alignSelf: "center",

    minHeight: 40,

    borderRadius: 8,

    backgroundColor: "#EDF3FA",

    paddingHorizontal: 20,

    alignItems: "center",

    justifyContent: "center",

    marginTop: 6,
  },

  loadMoreText: {
    color: COLORS.text,

    fontSize: 12,

    fontFamily: "Poppins_700Bold",
  },

  listFooterText: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",
    fontSize: 11,

    textAlign: "center",

    marginTop: 4,
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function DashboardStylesRoute() {
  return null;
}
