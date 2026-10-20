import {
  card,
  navBar,
  OFFICER,
  OFFICER_COLUMN,
} from "@/constants/officer-theme";
import { useOfficerLayout } from "@/hooks/use-officer-layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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

  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "flex-start",
  },

  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    lineHeight: 32,
    textAlign: "left",
    color: OFFICER.navyDeep,
  },

  filters: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 8,
    marginTop: 10,
  },

  filterTouch: {
    minHeight: 44,
    justifyContent: "center",
  },

  filterButton: {
    minWidth: 72,
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: OFFICER.lineStrong,
    borderRadius: 999,
    backgroundColor: OFFICER.surface,
  },

  filterButtonActive: {
    backgroundColor: OFFICER.navyDeep,
    borderColor: OFFICER.navyDeep,
  },

  filterText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: OFFICER.navyDeep,
    textAlign: "center",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 24,
  },

  card: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 104,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  details: {
    flex: 1,
    minWidth: 0,
  },

  studentName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: OFFICER.navyDeep,
  },

  studentMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
    color: OFFICER.muted,
    marginTop: 2,
  },

  transactionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 15,
    color: OFFICER.muted,
    marginTop: 2,
  },

  violation: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    lineHeight: 19,
    color: OFFICER.text,
    marginTop: 8,
  },

  recordedDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
    color: OFFICER.muted,
    marginTop: 4,
  },

  recordedTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
    color: OFFICER.faint,
    marginTop: 1,
  },

  amountArea: {
    flex: 0.7,
    minWidth: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  // A small coloured badge; paid / unpaid / cancelled set its colours.
  status: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    color: OFFICER.navyDeep,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },

  paid: {
    color: OFFICER.greenText,
    backgroundColor: OFFICER.greenSoft,
  },

  unpaid: {
    color: OFFICER.red,
    backgroundColor: OFFICER.redSoft,
  },

  cancelled: {
    color: OFFICER.grey,
    backgroundColor: OFFICER.greySoft,
  },

  amount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    lineHeight: 24,
    textAlign: "right",
    color: OFFICER.navyDeep,
    marginTop: 8,
  },

  paidDateArea: {
    alignItems: "flex-end",
    marginTop: 4,
  },

  paidDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
    color: OFFICER.greenText,
    textAlign: "right",
  },

  loadingPanel: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },

  errorPanel: {
    padding: 15,
    marginBottom: 18,
    backgroundColor: OFFICER.redSoft,
    borderWidth: 1,
    borderColor: OFFICER.redLine,
    borderRadius: 12,
  },

  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: OFFICER.red,
  },

  retryButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
    marginTop: 5,
  },

  retryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: OFFICER.navyDeep,
  },

  emptyPanel: {
    ...card,
    padding: 24,
    alignItems: "center",
  },

  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: OFFICER.navyDeep,
    textAlign: "center",
  },

  helperText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: OFFICER.muted,
    textAlign: "center",
    marginTop: 5,
  },

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
    width: 28,
    height: 28,
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

  // Under each record: opens its details and evidence.
  openHint: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    lineHeight: 16,
    color: OFFICER.navy,
    marginTop: 8,
  },

  // ---------- Fine details pop-up ----------

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11, 22, 44, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 36,
  },

  modalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "90%",
    padding: 20,
    backgroundColor: OFFICER.background,
    borderRadius: 20,
  },

  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: OFFICER.navyDeep,
    marginBottom: 6,
  },

  modalScroll: {
    flexShrink: 1,
  },

  modalViolation: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: OFFICER.text,
    marginTop: 4,
  },

  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: OFFICER.line,
  },

  modalLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: OFFICER.muted,
  },

  modalValue: {
    flexShrink: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: OFFICER.text,
    textAlign: "right",
  },

  modalClose: {
    minHeight: 48,
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: OFFICER.navyDeep,
  },

  modalCloseText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});

// Compatibility workaround for your chosen structure:
// Expo Router also discovers this file inside app/.
export default function OfficerRecordsStylesRoute() {
  return null;
}

export function useResponsiveStyles() {
  return useOfficerLayout(styles);
}
