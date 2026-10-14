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

  scroll: {
    flex: 1,
  },

  listScreen: {
    flex: 1,
  },

  // Page title above the search box.
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  pageTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    lineHeight: 32,
    color: OFFICER.navyDeep,
  },

  pageSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: OFFICER.muted,
    marginTop: 2,
  },

  searchArea: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },

  searchBox: {
    ...card,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingVertical: 9,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: OFFICER.text,
  },

  searchIcon: {
    width: 24,
    height: 26,
  },

  searchCircle: {
    position: "absolute",
    top: 2,
    left: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: OFFICER.navyDeep,
  },

  searchHandle: {
    position: "absolute",
    top: 18,
    left: 15,
    width: 11,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: OFFICER.navyDeep,
    transform: [{ rotate: "45deg" }],
  },

  clearButton: {
    minWidth: 32,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  clearText: {
    fontSize: 25,
    color: OFFICER.muted,
  },

  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  studentCard: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: OFFICER.navy,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },

  avatarLarge: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  initials: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },

  initialsLarge: {
    fontSize: 34,
  },

  studentDetails: {
    flex: 1,
    minWidth: 0,
  },

  studentName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    lineHeight: 19,
    color: OFFICER.navyDeep,
  },

  studentMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: OFFICER.muted,
  },

  chevron: {
    width: 10,
    height: 10,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: OFFICER.faint,
    transform: [{ rotate: "45deg" }],
    marginLeft: 5,
    marginRight: 6,
  },

  profileContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  backButton: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginLeft: -12,
    marginTop: 8,
    marginBottom: 6,
  },

  backArrow: {
    fontSize: 32,
    color: OFFICER.navyDeep,
  },

  profileCard: {
    ...card,
    borderRadius: 18,
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 22,
  },

  profileName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    lineHeight: 30,
    textAlign: "center",
    color: OFFICER.navyDeep,
    marginTop: 18,
  },

  profileSummary: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: OFFICER.muted,
    textAlign: "center",
    marginTop: 8,
  },

  profileFields: {
    marginTop: 18,
    gap: 12,
  },

  infoRow: {
    ...card,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowOpacity: 0,
    elevation: 0,
  },

  infoLabel: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: OFFICER.muted,
    textAlign: "left",
  },

  infoValue: {
    flex: 1,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: OFFICER.text,
    textAlign: "right",
  },

  qrButton: {
    alignSelf: "stretch",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: OFFICER.lineStrong,
    borderRadius: 12,
    backgroundColor: OFFICER.surface,
  },

  qrIcon: {
    width: 27,
    height: 27,
    tintColor: OFFICER.navyDeep,
  },

  qrButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: OFFICER.navyDeep,
  },

  addFineArea: {
    flexGrow: 1,
    justifyContent: "flex-end",
    alignItems: "stretch",
    paddingTop: 24,
  },

  addFineButton: {
    width: "100%",
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: OFFICER.navyDeep,
    shadowColor: "#123266",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },

  addFineText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },

  inactiveText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: OFFICER.red,
    textAlign: "center",
    marginBottom: 12,
  },

  disabled: {
    opacity: 0.45,
  },

  errorPanel: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: OFFICER.redLine,
    borderRadius: 12,
    backgroundColor: OFFICER.redSoft,
  },

  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: OFFICER.red,
  },

  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  retryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: OFFICER.navyDeep,
  },

  emptyPanel: {
    alignItems: "center",
    paddingVertical: 26,
    gap: 10,
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

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(11, 22, 44, 0.55)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "90%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  modalContent: {
    padding: 20,
    alignItems: "center",
  },

  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: OFFICER.navyDeep,
    textAlign: "center",
  },

  modalName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: OFFICER.muted,
    textAlign: "center",
    marginTop: 8,
  },

  qrContainer: {
    padding: 12,
    marginVertical: 18,
    backgroundColor: "#FFFFFF",
  },

  modalCloseButton: {
    width: "100%",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 22,
    borderRadius: 12,
    backgroundColor: OFFICER.navyDeep,
  },
});

// Compatibility workaround for keeping styles inside app/.
// This file is also discovered by Expo Router as a route.
export default function OfficerStudentStylesRoute() {
  return null;
}

export function useResponsiveStyles() {
  return useOfficerLayout(styles);
}
