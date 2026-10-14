import {
  card,
  navBar,
  OFFICER,
  OFFICER_COLUMN,
} from "@/constants/officer-theme";
import { useOfficerLayout } from "@/hooks/use-officer-layout";

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // ==========================================
  // SCREEN
  // ==========================================

  safeArea: {
    flex: 1,
    backgroundColor: OFFICER.background,
  },

  phone: {
    flex: 1,
    width: "100%",
    maxWidth: OFFICER_COLUMN,
    alignSelf: "center",
    backgroundColor: OFFICER.background,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },

  greeting: {
    flex: 1,
  },

  hello: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: OFFICER.muted,
  },

  officerName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    lineHeight: 26,
    color: OFFICER.navyDeep,
  },

  // ==========================================
  // AVATAR
  // ==========================================

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: OFFICER.navy,
    flexShrink: 0,
  },

  avatarLarge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: OFFICER.surface,
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
    ...card,
    minHeight: 104,
    padding: 16,
    borderTopWidth: 3,
    borderTopColor: OFFICER.navy,
  },

  cardLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: OFFICER.muted,
  },

  totalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 36,
    color: OFFICER.green,
    textAlign: "left",
    marginTop: 6,
  },

  // Takes the total's place while the dashboard loads.
  valueSkeleton: {
    alignSelf: "flex-start",
    marginTop: 12,
  },

  // ==========================================
  // SUMMARY
  // ==========================================

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    marginBottom: 24,
  },

  smallCard: {
    ...card,
    flex: 1,
    minHeight: 96,
    padding: 14,
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderTopWidth: 3,
    borderTopColor: OFFICER.navy,
  },

  smallLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: OFFICER.muted,
    textAlign: "left",
  },

  countValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: OFFICER.green,
    textAlign: "left",
  },

  moneyValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: OFFICER.red,
    textAlign: "left",
    marginVertical: 4,
  },

  // ==========================================
  // RECENT ACTIVITIES
  // ==========================================

  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: OFFICER.text,
    marginBottom: 12,
  },

  activityCard: {
    ...card,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    marginBottom: 12,
  },

  activityInfo: {
    flex: 1,
    minWidth: 0,
  },

  studentName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: OFFICER.navyDeep,
  },

  activityDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: OFFICER.muted,
    marginTop: 2,
  },

  violation: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: OFFICER.text,
    marginTop: 2,
  },

  timestamp: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: OFFICER.faint,
    marginTop: 4,
  },

  activityAmountArea: {
    alignItems: "flex-end",
    maxWidth: "36%",
  },

  activityAmount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: OFFICER.navyDeep,
    textAlign: "right",
  },

  // ==========================================
  // VIEW ALL ACTIVITIES
  // ==========================================

  viewAllButton: {
    minHeight: 46,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: OFFICER.lineStrong,
    borderRadius: 12,
    backgroundColor: OFFICER.surface,
  },

  viewAllText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: OFFICER.navy,
  },

  // ==========================================
  // BOTTOM NAVIGATION
  // ==========================================

  bottomArea: {
    ...navBar,
  },

  bottomNavigation: {
    flexDirection: "row",
    paddingTop: 10,
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
    backgroundColor: "rgba(11, 22, 44, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 28,
  },

  modalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "88%",
    backgroundColor: OFFICER.background,
    borderRadius: 20,
    overflow: "hidden",
  },

  modalHeader: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: OFFICER.surface,
    borderBottomWidth: 1,
    borderBottomColor: OFFICER.line,
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
    color: OFFICER.navyDeep,
    textAlign: "center",
  },

  modalSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: OFFICER.muted,
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
    ...card,
    padding: 24,
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
    borderColor: OFFICER.redLine,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    backgroundColor: OFFICER.redSoft,
  },

  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: OFFICER.red,
  },

  retryButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    marginTop: 8,
  },

  retryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: OFFICER.navy,
  },

  // ==========================================
  // EMPTY STATE
  // ==========================================

  emptyPanel: {
    ...card,
    padding: 20,
  },

  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: OFFICER.navyDeep,
  },

  helper: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: OFFICER.muted,
    marginTop: 5,
  },

  // ==========================================
  // NOTIFICATIONS (bell matches the Student dashboard)
  // ==========================================

  notificationButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: OFFICER.surface,
    borderWidth: 1,
    borderColor: OFFICER.line,
    borderRadius: 23,
    shadowColor: "#173A73",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationIcon: {
    width: 26,
    height: 26,
    tintColor: OFFICER.navy,
  },
  noticeCard: {
    ...card,
    padding: 14,
    marginBottom: 12,
  },
  noticeUnread: {
    backgroundColor: "#F1F7FF",
    borderColor: "#BFD3F2",
  },
  noticeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  noticeTitle: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: OFFICER.navyDeep,
  },
  noticeNewLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#1265B0",
  },
  noticeReadLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: "#8793A0",
  },
  noticeMessage: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
    color: "#435166",
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E7ECF2",
  },
  detailLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: OFFICER.muted,
  },
  detailValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: OFFICER.navyDeep,
  },
  noticeError: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#E52323",
    marginTop: 12,
  },
  noticeLink: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: OFFICER.navy,
    marginTop: 14,
  },
});

export default function OfficerDashboardStylesRoute() {
  return null;
}

export function useResponsiveStyles() {
  return useOfficerLayout(styles);
}
