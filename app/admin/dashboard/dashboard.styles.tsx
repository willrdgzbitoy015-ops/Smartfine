import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",

  navyDark: "#0C2F64",

  green: "#45B94F",

  lightGreen: "#56C85C",

  red: "#FF2424",

  yellow: "#F4C542",

  background: "#E8E8E8",

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
    color: COLORS.white,

    fontSize: 14,

    fontWeight: "600",
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

    fontWeight: "600",
  },

  // ==========================================
  // MAIN
  // ==========================================

  main: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 38,

    paddingVertical: 35,
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 65,
  },

  pageTitle: {
    fontSize: 27,

    fontWeight: "800",

    color: COLORS.text,
  },

  dateText: {
    marginTop: 3,

    color: "#777777",

    fontSize: 12,
  },

  profileArea: {
    flexDirection: "row",

    alignItems: "center",
  },

  profileTextArea: {
    alignItems: "flex-end",

    marginRight: 12,
  },

  adminName: {
    color: COLORS.text,

    fontSize: 13,

    fontWeight: "500",
  },

  adminRole: {
    color: COLORS.text,

    fontSize: 14,

    fontWeight: "800",
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

    fontWeight: "700",

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
  // SUMMARY CARDS
  // ==========================================

  cardsContainer: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 18,

    justifyContent: "center",

    marginBottom: 75,
  },

  summaryCard: {
    width: 180,

    minHeight: 125,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 10,

    paddingHorizontal: 18,

    paddingVertical: 20,

    justifyContent: "space-between",

    borderTopWidth: 2,
  },

  cardSuccess: {
    borderTopColor: COLORS.green,
  },

  cardDanger: {
    borderTopColor: COLORS.red,
  },

  cardMoney: {
    borderTopColor: COLORS.navy,
  },

  cardLabel: {
    color: COLORS.text,

    fontSize: 14,

    fontWeight: "700",
  },

  cardValue: {
    textAlign: "center",

    fontSize: 25,

    fontWeight: "800",

    marginTop: 18,
  },

  valueSuccess: {
    color: "#00B72A",
  },

  valueDanger: {
    color: COLORS.red,
  },

  valueMoney: {
    color: "#00B72A",
  },

  // ==========================================
  // SUMMARY CARD LOADING
  // ==========================================

  cardLoadingArea: {
    flex: 1,

    minHeight: 55,

    alignItems: "center",

    justifyContent: "center",

    marginTop: 10,
  },

  cardLoadingText: {
    marginTop: 6,

    color: COLORS.muted,

    fontSize: 10,

    fontWeight: "500",
  },

  // ==========================================
  // RECENT ACTIVITIES
  // ==========================================

  activityPanel: {
    width: "82%",

    maxWidth: 760,

    alignSelf: "center",

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 16,

    paddingHorizontal: 34,

    paddingTop: 26,

    paddingBottom: 18,
  },

  activityTitle: {
    color: COLORS.text,

    fontSize: 17,

    fontWeight: "800",

    marginBottom: 35,
  },

  activityList: {
    gap: 18,
  },

  activityItem: {
    minHeight: 63,

    backgroundColor: COLORS.activityBackground,

    borderRadius: 9,

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
    color: "#555555",

    fontSize: 13,
  },

  activityName: {
    color: "#333333",

    fontWeight: "700",
  },

  activityDetails: {
    color: "#A2A9B3",

    fontSize: 10,

    marginTop: 4,
  },

  activityAmount: {
    fontSize: 13,

    fontWeight: "800",
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

    fontWeight: "500",

    textAlign: "center",
  },

  activityEmptyContainer: {
    minHeight: 110,

    alignItems: "center",

    justifyContent: "center",
  },

  activityEmptyText: {
    color: COLORS.muted,

    fontSize: 12,

    textAlign: "center",
  },

  viewActivitiesButton: {
    alignSelf: "flex-end",

    marginTop: 40,

    paddingVertical: 8,
  },

  viewActivitiesText: {
    color: COLORS.text,

    fontSize: 13,

    fontWeight: "800",
  },

  // ==========================================
  // ALL ACTIVITIES MODAL
  // ==========================================

  activitiesModalOverlay: {
    flex: 1,

    backgroundColor: "rgba(0, 0, 0, 0.48)",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 20,

    paddingVertical: 30,
  },

  activitiesModal: {
    width: "88%",

    maxWidth: 760,

    maxHeight: "82%",

    backgroundColor: COLORS.white,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: COLORS.navy,

    overflow: "hidden",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,

      height: 10,
    },

    shadowOpacity: 0.2,

    shadowRadius: 20,

    elevation: 10,
  },

  activitiesModalHeader: {
    minHeight: 88,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 28,

    paddingVertical: 20,

    borderBottomWidth: 1,

    borderBottomColor: "#E5E9EF",

    backgroundColor: COLORS.white,
  },

  activitiesModalHeaderText: {
    flex: 1,

    paddingRight: 20,
  },

  activitiesModalTitle: {
    color: COLORS.text,

    fontSize: 20,

    fontWeight: "800",
  },

  activitiesModalSubtitle: {
    marginTop: 4,

    color: COLORS.muted,

    fontSize: 11,
  },

  activitiesModalCloseButton: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: "#EFF3F8",

    alignItems: "center",

    justifyContent: "center",
  },

  activitiesModalCloseText: {
    color: COLORS.navy,

    fontSize: 25,

    lineHeight: 28,

    fontWeight: "500",
  },

  activitiesModalScroll: {
    maxHeight: 520,
  },

  activitiesModalContent: {
    paddingHorizontal: 28,

    paddingVertical: 22,

    gap: 14,
  },

  activitiesModalEmptyText: {
    color: COLORS.muted,

    fontSize: 13,

    textAlign: "center",

    paddingVertical: 40,
  },

  modalLoadingContainer: {
    minHeight: 220,

    alignItems: "center",

    justifyContent: "center",
  },

  activitiesModalFooter: {
    paddingHorizontal: 28,

    paddingVertical: 16,

    alignItems: "flex-end",

    borderTopWidth: 1,

    borderTopColor: "#E5E9EF",

    backgroundColor: "#FAFBFC",
  },

  activitiesModalDoneButton: {
    minWidth: 110,

    height: 40,

    borderRadius: 8,

    backgroundColor: COLORS.navy,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 20,
  },

  activitiesModalDoneText: {
    color: COLORS.white,

    fontSize: 13,

    fontWeight: "700",
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function DashboardStylesRoute() {
  return null;
}
