import { useOfficerLayout } from "@/hooks/use-officer-layout";

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // ==========================================
  // SCREEN
  // ==========================================

  safeArea: {
    flex: 1,
    backgroundColor: "#E8E8E8",
  },

  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "#E8E8E8",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 28,
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 30,
  },

  greeting: {
    flex: 1,
  },

  hello: {
    fontFamily: "Poppins_500Medium",
    fontSize: 17,
    color: "#161616",
  },

  officerName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    lineHeight: 27,
    color: "#161616",
  },

  // ==========================================
  // AVATAR
  // ==========================================

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#173A73",
    flexShrink: 0,
  },

  avatarLarge: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  initials: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },

  initialsLarge: {
    fontSize: 19,
  },

  // ==========================================
  // TOTAL STUDENTS
  // ==========================================

  totalCard: {
    minHeight: 108,
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#173A73",
    borderRadius: 9,
  },

  cardLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#123266",
  },

  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 34,
    color: "#45B94F",
    textAlign: "center",
    marginTop: 7,
  },

  // ==========================================
  // SUMMARY
  // ==========================================

  summaryRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 24,
    marginHorizontal: 12,
    marginBottom: 23,
  },

  smallCard: {
    flex: 1,
    minHeight: 94,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#173A73",
    borderRadius: 8,
  },

  smallLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#123266",
    textAlign: "center",
  },

  countValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 29,
    color: "#45B94F",
    textAlign: "center",
  },

  moneyValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: "#D32F2F",
    textAlign: "center",
    marginVertical: 8,
  },

  // ==========================================
  // RECENT ACTIVITIES
  // ==========================================

  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: "#333333",
    marginBottom: 12,
  },

  activityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#777777",
    borderRadius: 9,
  },

  activityInfo: {
    flex: 1,
    minWidth: 0,
  },

  studentName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#123266",
  },

  activityDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },

  violation: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#123266",
    marginTop: 2,
  },

  timestamp: {
    fontFamily: "Poppins_300Light",
    fontSize: 10,
    color: "#626975",
    marginTop: 4,
  },

  activityAmountArea: {
    alignItems: "flex-end",
    maxWidth: "36%",
  },

  activityAmount: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#123266",
    textAlign: "right",
  },

  // ==========================================
  // VIEW ALL ACTIVITIES
  // ==========================================

  viewAllButton: {
    minHeight: 42,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    marginTop: 2,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#173A73",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  viewAllText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#173A73",
  },

  // ==========================================
  // BOTTOM NAVIGATION
  // ==========================================

  bottomArea: {
    backgroundColor: "#123266",
  },

  bottomNavigation: {
    flexDirection: "row",
    paddingTop: 9,
    paddingBottom: 5,
    paddingHorizontal: 7,
  },

  navItem: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  navIcon: {
    width: 27,
    height: 27,
    tintColor: "#FFFFFF",
  },

  navLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: "#FFFFFF",
    marginTop: 4,
  },

  activeIndicator: {
    width: "76%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "#16E564",
    marginTop: 4,
  },

  hiddenIndicator: {
    backgroundColor: "transparent",
  },

  // ==========================================
  // ALL ACTIVITIES MODAL
  // ==========================================

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 28,
  },

  modalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "88%",
    backgroundColor: "#E8E8E8",
    borderRadius: 14,
    overflow: "hidden",
  },

  modalHeader: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#E8E8E8",
    borderBottomWidth: 1,
    borderBottomColor: "#C9CDD3",
  },

  modalBackButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  modalBackIcon: {
    width: 23,
    height: 23,
    tintColor: "#111111",
    transform: [
      {
        scaleX: -1,
      },
    ],
  },

  modalTitleArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#111111",
    textAlign: "center",
  },

  modalSubtitle: {
    fontFamily: "Poppins_300Light",
    fontSize: 10,
    color: "#626975",
    marginTop: 2,
    textAlign: "center",
  },

  modalHeaderSpacer: {
    width: 40,
  },

  modalScroll: {
    flexGrow: 0,
  },

  modalContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
  },

  modalEmptyPanel: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFC5CE",
    borderRadius: 9,
  },

  // ==========================================
  // LOADING
  // ==========================================

  loadingPanel: {
    paddingVertical: 15,
    alignItems: "center",
    gap: 10,
  },

  // ==========================================
  // ERROR
  // ==========================================

  errorPanel: {
    borderWidth: 1,
    borderColor: "#D32F2F",
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
  },

  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#D32F2F",
  },

  retryButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    marginTop: 8,
  },

  retryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#173A73",
  },

  // ==========================================
  // EMPTY STATE
  // ==========================================

  emptyPanel: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#BFC5CE",
  },

  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#123266",
  },

  helper: {
    fontFamily: "Poppins_300Light",
    fontSize: 12,
    color: "#626975",
    marginTop: 5,
  },
});

export default function OfficerDashboardStylesRoute() {
  return null;
}

export function useResponsiveStyles() {
  return useOfficerLayout(styles);
}
