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

  flex: {
    flex: 1,
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
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
    tintColor: OFFICER.navyDeep,
    resizeMode: "contain",
    transform: [{ scaleX: -1 }],
  },

  headerSpacer: {
    width: 40,
  },

  title: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: OFFICER.navyDeep,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  // ==========================================
  // CONTENT
  // ==========================================

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 26,
  },

  // ==========================================
  // IDENTITY
  // ==========================================

  identity: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 18,
    paddingHorizontal: 2,
  },

  identityText: {
    flex: 1,
    marginLeft: 16,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: OFFICER.navyDeep,
    borderWidth: 2,
    borderColor: OFFICER.surface,
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
    lineHeight: 26,
    color: OFFICER.navyDeep,
    includeFontPadding: false,
  },

  role: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 17,
    color: OFFICER.muted,
    marginTop: 3,
    includeFontPadding: false,
  },

  // ==========================================
  // INFO CARD
  // ==========================================

  infoCard: {
    ...card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "center",
  },

  employeeId: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    lineHeight: 18,
    color: OFFICER.navy,
    marginBottom: 8,
    includeFontPadding: false,
  },

  detail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: OFFICER.muted,
    includeFontPadding: false,
  },

  // ==========================================
  // PROFILE MENU
  // ==========================================

  menu: {
    marginTop: 22,
  },

  menuButton: {
    ...card,
    width: "100%",
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },

  menuIcon: {
    width: 27,
    height: 27,
    tintColor: OFFICER.navy,
    resizeMode: "contain",
  },

  menuText: {
    flex: 1,
    paddingHorizontal: 12,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: OFFICER.text,
    textAlign: "left",
    includeFontPadding: false,
  },

  menuArrow: {
    width: 20,
    height: 20,
    tintColor: OFFICER.faint,
    resizeMode: "contain",
    transform: [{ scaleX: -1 }],
  },

  // ==========================================
  // PRIMARY BUTTON
  // ==========================================

  primaryButton: {
    width: "100%",
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: OFFICER.navyDeep,
    shadowColor: "#123266",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },

  primaryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
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
    marginBottom: 16,
  },

  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    lineHeight: 19,
    color: OFFICER.text,
    marginBottom: 6,
    includeFontPadding: false,
  },

  input: {
    width: "100%",
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: OFFICER.lineStrong,
    borderRadius: 12,
    backgroundColor: OFFICER.surface,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: OFFICER.text,
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  // The email is shown, not typed: it changes through Change Email.
  readOnlyInput: {
    backgroundColor: OFFICER.greySoft,
    color: OFFICER.muted,
  },

  changeEmailButton: {
    alignSelf: "flex-start",
    minHeight: 40,
    justifyContent: "center",
    paddingTop: 4,
  },

  changeEmailText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: OFFICER.navy,
  },

  // Border colour only, so focusing never shifts the layout.
  inputFocused: {
    borderColor: OFFICER.navy,
  },

  // ==========================================
  // CHANGE PASSWORD PAGE
  // ==========================================

  passwordPage: {
    flexGrow: 1,
    justifyContent: "space-between",
    minHeight: 480,
    paddingTop: 16,
    paddingBottom: 24,
  },

  passwordHelp: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: OFFICER.muted,
    marginBottom: 20,
  },

  saveButton: {
    width: "100%",
    alignSelf: "center",
    marginTop: 24,
  },

  // ==========================================
  // PASSWORD INPUT
  // ==========================================

  passwordInputContainer: {
    width: "100%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: OFFICER.lineStrong,
    borderRadius: 12,
    backgroundColor: OFFICER.surface,
    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,
    minHeight: 44,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: OFFICER.text,
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
    tintColor: OFFICER.navyDeep,
  },

  // ==========================================
  // LINK
  // ==========================================

  link: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: OFFICER.navyDeep,
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
    marginBottom: 28,
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
    ...card,
    width: "100%",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 10,
    borderRadius: 12,
    shadowOpacity: 0,
    elevation: 0,
  },

  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: OFFICER.navyDeep,
    includeFontPadding: false,
  },

  // ==========================================
  // ABOUT / PRIVACY CONTENT CARD
  // ==========================================

  aboutCard: {
    ...card,
    width: "100%",
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
  },

  aboutText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 20,
    color: "#475569",
    textAlign: "left",
    includeFontPadding: false,
  },

  // ==========================================
  // DEVELOPER CARD
  // ==========================================

  developerCard: {
    ...card,
    width: "100%",
    minHeight: 150,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 18,
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
    color: OFFICER.navyDeep,
    textAlign: "center",
    marginBottom: 14,
    includeFontPadding: false,
  },

  developerContact: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: OFFICER.muted,
    textAlign: "center",
    includeFontPadding: false,
  },

  // ==========================================
  // BOTTOM NAVIGATION
  // ==========================================

  bottomArea: {
    ...navBar,
  },

  bottomNavigation: {
    flexDirection: "row",
    paddingTop: 9,
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
    color: OFFICER.muted,
  },

  // ==========================================
  // ERROR
  // ==========================================

  errorPanel: {
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: OFFICER.redLine,
    borderRadius: 12,
    backgroundColor: OFFICER.redSoft,
  },

  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: OFFICER.red,
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
