import { useOfficerLayout } from "@/hooks/use-officer-layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#DADADA",
  },

  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "#DADADA",
  },

  header: {
    paddingTop: 22,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },

  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 19,
    lineHeight: 27,
    textAlign: "center",
    color: "#123266",
  },

  filters: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 22,
  },

  filterTouch: {
    minHeight: 44,
    justifyContent: "center",
  },

  filterButton: {
    minWidth: 68,
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#123266",
    borderRadius: 9,
    backgroundColor: "transparent",
  },

  filterButtonActive: {
    backgroundColor: "#123266",
  },

  filterText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#123266",
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
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 24,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 122,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 10,
  },

  details: {
    flex: 1,
    minWidth: 0,
  },

  studentName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    lineHeight: 19,
    color: "#123266",
  },

  studentMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 15,
    color: "#161616",
    marginTop: 3,
  },

  transactionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    lineHeight: 14,
    color: "#161616",
    marginTop: 2,
  },

  violation: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    lineHeight: 19,
    color: "#123266",
    marginTop: 6,
  },

  recordedDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    lineHeight: 14,
    color: "#333333",
    marginTop: 4,
  },

  recordedTime: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    lineHeight: 14,
    color: "#626975",
    marginTop: 1,
  },

  amountArea: {
    flex: 0.65,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  status: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#123266",
  },

  paid: {
    color: "#00BF20",
  },

  unpaid: {
    color: "#E32626",
  },

  cancelled: {
    color: "#6B7280",
  },

  amount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    lineHeight: 25,
    textAlign: "center",
    color: "#123266",
    marginTop: 5,
  },

  paidDateArea: {
    alignItems: "center",
    marginTop: 5,
  },

  paidDate: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    lineHeight: 14,
    color: "#00A91C",
    textAlign: "center",
  },

  loadingPanel: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },

  errorPanel: {
    padding: 15,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D32F2F",
    borderRadius: 10,
  },

  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#D32F2F",
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
    color: "#123266",
  },

  emptyPanel: {
    padding: 24,
    borderWidth: 1,
    borderColor: "#BFC5CE",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#123266",
    textAlign: "center",
  },

  helperText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#626975",
    textAlign: "center",
    marginTop: 5,
  },

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
});

// Compatibility workaround for your chosen structure:
// Expo Router also discovers this file inside app/.
export default function OfficerRecordsStylesRoute() {
  return null;
}

export function useResponsiveStyles() {
  return useOfficerLayout(styles);
}
