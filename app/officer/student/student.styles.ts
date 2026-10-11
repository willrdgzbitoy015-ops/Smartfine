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

  scroll: {
    flex: 1,
  },

  listScreen: {
    flex: 1,
  },

  searchArea: {
    paddingHorizontal: 34,
    paddingTop: 30,
    paddingBottom: 38,
  },

  searchBox: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingVertical: 9,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#161616",
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
    borderColor: "#222222",
  },

  searchHandle: {
    position: "absolute",
    top: 18,
    left: 15,
    width: 11,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "#222222",
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
    color: "#666666",
  },

  listContent: {
    flexGrow: 1,
    paddingHorizontal: 34,
    paddingBottom: 24,
  },

  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 84,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#173A73",
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
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#123266",
  },

  studentMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 16,
    color: "#666666",
  },

  chevron: {
    marginLeft: 5,
    marginRight: 6,
  },

  profileContent: {
    flexGrow: 1,
    paddingHorizontal: 34,
    paddingBottom: 30,
  },

  backButton: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginLeft: -14,
    marginTop: 3,
    marginBottom: 9,
  },

  backArrow: {
    fontSize: 32,
    color: "#111111",
  },

  profileCard: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
  },

  profileName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 22,
    lineHeight: 31,
    textAlign: "center",
    color: "#111111",
    marginTop: 22,
  },

  profileSummary: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 17,
    color: "#111111",
    textAlign: "center",
    marginTop: 17,
  },

  profileFields: {
    marginTop: 54,
    gap: 16,
  },

  infoRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 9,
  },

  infoLabel: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#647799",
    textAlign: "center",
  },

  infoValue: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#123266",
    textAlign: "center",
  },

  qrButton: {
    alignSelf: "center",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  qrIcon: {
    width: 29,
    height: 29,
    tintColor: "#111111",
  },

  qrButtonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#111111",
  },

  addFineArea: {
    flexGrow: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 65,
  },

  addFineButton: {
    width: "76%",
    maxWidth: 250,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#111111",
    backgroundColor: "#123266",
  },

  addFineText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
  },

  inactiveText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 12,
  },

  disabled: {
    opacity: 0.45,
  },

  errorPanel: {
    marginHorizontal: 24,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D32F2F",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },

  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#D32F2F",
  },

  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  retryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#123266",
  },

  emptyPanel: {
    alignItems: "center",
    paddingVertical: 26,
    gap: 10,
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
    color: "#666666",
    textAlign: "center",
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

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "90%",
    borderRadius: 16,
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
    color: "#123266",
    textAlign: "center",
  },

  modalName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#333333",
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
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 22,
    borderRadius: 7,
    backgroundColor: "#123266",
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
