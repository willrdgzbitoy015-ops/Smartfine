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

  flex: {
    flex: 1,
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  backIcon: {
    width: 24,
    height: 24,
    tintColor: "#111111",
    resizeMode: "contain",
    transform: [{ scaleX: -1 }],
  },

  headerSpacer: {
    width: 40,
  },

  title: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 21,
    color: "#111111",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  // ==========================================
  // CONTENT
  // ==========================================

  content: {
    flexGrow: 1,
    paddingHorizontal: 42,
    paddingTop: 12,
    paddingBottom: 26,
  },

  // ==========================================
  // IDENTITY
  // ==========================================

  identity: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 4,
  },

  identityText: {
    flex: 1,
    marginLeft: 24,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#123266",
  },

  avatarLarge: {
    width: 126,
    height: 126,
    borderRadius: 63,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  initials: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#FFFFFF",
    includeFontPadding: false,
  },

  initialsLarge: {
    fontSize: 34,
  },

  name: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    lineHeight: 25,
    color: "#111111",
    includeFontPadding: false,
  },

  role: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 17,
    color: "#707070",
    marginTop: 3,
    includeFontPadding: false,
  },

  // ==========================================
  // INFO CARD
  // ==========================================

  infoCard: {
    minHeight: 94,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },

  employeeId: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    lineHeight: 18,
    color: "#123266",
    marginBottom: 12,
    includeFontPadding: false,
  },

  detail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: "#707070",
    includeFontPadding: false,
  },

  // ==========================================
  // PROFILE MENU
  // ==========================================

  menu: {
    marginTop: 64,
  },

  menuButton: {
    width: "100%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  menuIcon: {
    width: 29,
    height: 29,
    tintColor: "#111111",
    resizeMode: "contain",
  },

  menuText: {
    flex: 1,
    paddingHorizontal: 8,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#111111",
    textAlign: "center",
    includeFontPadding: false,
  },

  menuArrow: {
    width: 23,
    height: 23,
    tintColor: "#111111",
    resizeMode: "contain",
    transform: [{ scaleX: -1 }],
  },

  // ==========================================
  // PRIMARY BUTTON
  // ==========================================

  primaryButton: {
    width: "100%",
    minHeight: 43,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 3,
    borderRadius: 7,
    backgroundColor: "#123266",
  },

  primaryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
    textAlign: "center",
    includeFontPadding: false,
  },

  // ==========================================
  // PROFILE PHOTO
  // ==========================================

  photoArea: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 26,
  },

  // ==========================================
  // FORM FIELDS
  // ==========================================

  field: {
    marginBottom: 15,
  },

  label: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    lineHeight: 20,
    color: "#111111",
    marginBottom: 4,
    includeFontPadding: false,
  },

  input: {
    width: "100%",
    minHeight: 42,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#444444",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#555555",
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  // ==========================================
  // CHANGE PASSWORD PAGE
  // ==========================================

  passwordPage: {
    flexGrow: 1,
    justifyContent: "space-between",
    minHeight: 480,
    paddingTop: 24,
    paddingBottom: 24,
  },

  passwordHelp: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#555555",
    marginBottom: 20,
  },

  saveButton: {
    width: "85%",
    alignSelf: "center",
    marginTop: 24,
  },

  // ==========================================
  // PASSWORD INPUT
  // ==========================================

  passwordInputContainer: {
    width: "100%",
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444444",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,
    minHeight: 44,
    paddingLeft: 13,
    paddingRight: 8,
    paddingVertical: 8,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#555555",
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  passwordToggle: {
    width: 48,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordIcon: {
    width: 21,
    height: 21,
    resizeMode: "contain",
    tintColor: "#123266",
  },

  // ==========================================
  // LINK
  // ==========================================

  link: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#123266",
    textDecorationLine: "underline",
  },

  // ==========================================
  // ABOUT SMARTFINE LOGO
  // ==========================================

  aboutLogoArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 34,
  },

  aboutLogo: {
    width: 110,
    height: 110,
    resizeMode: "contain",
  },

  // ==========================================
  // ABOUT / PRIVACY SECTION TITLE
  // ==========================================

  sectionHeading: {
    width: "100%",
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#555555",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#111111",
    includeFontPadding: false,
  },

  // ==========================================
  // ABOUT / PRIVACY CONTENT CARD
  // ==========================================

  aboutCard: {
    width: "100%",
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#555555",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  aboutText: {
    fontFamily: "Poppins_300Light",
    fontSize: 11,
    lineHeight: 18,
    color: "#555555",
    textAlign: "center",
    includeFontPadding: false,
  },

  // ==========================================
  // DEVELOPER CARD
  // ==========================================

  developerCard: {
    width: "100%",
    minHeight: 150,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#555555",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  developerPhoto: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#E8E8E8",
    flexShrink: 0,
  },

  developerInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },

  developerName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 19,
    lineHeight: 24,
    color: "#123266",
    textAlign: "center",
    marginBottom: 14,
    includeFontPadding: false,
  },

  developerContact: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 16,
    color: "#707070",
    textAlign: "center",
    includeFontPadding: false,
  },

  // ==========================================
  // BOTTOM NAVIGATION
  // ==========================================

  bottomArea: {
    backgroundColor: "#123266",
  },

  bottomNavigation: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 7,
  },

  navItem: {
    flex: 1,
    minHeight: 57,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  navIcon: {
    width: 26,
    height: 26,
    tintColor: "#FFFFFF",
    resizeMode: "contain",
  },

  navLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 9,
    color: "#FFFFFF",
    marginTop: 3,
    includeFontPadding: false,
  },

  activeIndicator: {
    width: "66%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "#16E564",
    marginTop: 3,
  },

  hiddenIndicator: {
    backgroundColor: "transparent",
  },

  // ==========================================
  // LOADING
  // ==========================================

  loading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },

  helper: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#666666",
  },

  // ==========================================
  // ERROR
  // ==========================================

  errorPanel: {
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D32F2F",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: "#D32F2F",
  },

  retry: {
    minHeight: 36,
    alignSelf: "flex-start",
    justifyContent: "center",
  },

  // ==========================================
  // DISABLED
  // ==========================================

  disabled: {
    opacity: 0.6,
  },
});

export default function OfficerProfileStylesRoute() {
  return null;
}

export function useResponsiveStyles() {
  return useOfficerLayout(styles);
}
