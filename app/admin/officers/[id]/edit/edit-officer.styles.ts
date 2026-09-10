import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",
  green: "#45B94F",
  lightGreen: "#56C85C",
  white: "#FFFFFF",
  background: "#E8E8E8",
  text: "#123266",
  muted: "#8C939F",
  red: "#D32F2F",
};

const FONT = {
  light: "Poppins_300Light",
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.background,
  },

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
    fontFamily: FONT.medium,
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
    fontFamily: FONT.medium,
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  scrollContent: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 38,
    paddingTop: 35,
    paddingBottom: 60,
  },

  scrollContentCompact: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 35,
  },

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
    fontFamily: FONT.medium,
  },

  mobileNavTextActive: {
    color: COLORS.white,
  },

  pageHeader: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    marginBottom: 28,
  },

  backButton: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
  },

  backIconImage: {
    width: 22,
    height: 22,
    marginRight: 10,
    flexShrink: 0,
    transform: [{ rotate: "180deg" }],
  },

  backText: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONT.bold,
    flexShrink: 1,
  },

  backTextCompact: {
    fontSize: 18,
  },

  headerSubtitle: {
    marginLeft: 32,
    marginTop: 4,
  },

  pageTitle: {
    color: COLORS.text,
    fontSize: 27,
    fontFamily: FONT.bold,
  },

  pageSubtitle: {
    color: "#6F7682",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONT.light,
  },

  formCard: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 28,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 30,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  section: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 420,
    minWidth: 0,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONT.semibold,
    marginBottom: 22,
  },

  label: {
    color: "#222222",
    fontSize: 12,
    fontFamily: FONT.medium,
    marginBottom: 7,
  },

  helperText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: FONT.light,
    marginTop: -9,
    marginBottom: 17,
  },

  input: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: "#B9BEC7",
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    color: "#222222",
    fontSize: 12,
    fontFamily: FONT.regular,
    marginBottom: 17,
  },

  readOnlyBox: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: "#CCD1D8",
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginBottom: 17,
  },

  readOnlyText: {
    color: COLORS.navy,
    fontSize: 13,
    fontFamily: FONT.semibold,
  },

  twoColumnRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  flexField: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 150,
    minWidth: 0,
  },

  pictureSection: {
    alignItems: "center",
    marginBottom: 26,
  },

  profilePicture: {
    width: 115,
    height: 115,
    borderRadius: 58,
    backgroundColor: "#E6E8EC",
    borderWidth: 3,
    borderColor: COLORS.navy,
  },

  profilePictureCompact: {
    width: 95,
    height: 95,
    borderRadius: 48,
  },

  profilePlaceholder: {
    backgroundColor: COLORS.navy,
    borderColor: "#D6DFEA",
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitials: {
    color: COLORS.white,
    fontSize: 29,
    fontFamily: FONT.bold,
  },

  pictureLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: FONT.medium,
    marginTop: 12,
  },

  pictureHint: {
    color: COLORS.muted,
    fontSize: 10,
    fontFamily: FONT.light,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },

  pictureActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },

  pictureButton: {
    minWidth: 125,
    minHeight: 40,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
  },

  pictureButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: FONT.medium,
  },

  cancelPictureButton: {
    backgroundColor: "#F2F3F5",
    borderWidth: 1,
    borderColor: "#CFD4DB",
  },

  cancelPictureText: {
    color: COLORS.navy,
    fontSize: 11,
    fontFamily: FONT.medium,
  },

  removePictureButton: {
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#F3B6B6",
  },

  removePictureText: {
    color: COLORS.red,
    fontSize: 11,
    fontFamily: FONT.medium,
  },

  pictureSelectedText: {
    color: COLORS.green,
    fontSize: 10,
    fontFamily: FONT.medium,
    marginTop: 10,
    textAlign: "center",
  },

  passwordSection: {
    marginTop: 4,
    marginBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "#E6E8EC",
    paddingTop: 18,
  },

  passwordTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: FONT.semibold,
    marginBottom: 6,
  },

  passwordHint: {
    color: "#6F7682",
    fontSize: 11,
    lineHeight: 17,
    fontFamily: FONT.light,
    marginBottom: 16,
  },

  passwordInputRow: {
    width: "100%",
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B9BEC7",
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginBottom: 10,
    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    height: 46,
    paddingHorizontal: 14,
    color: "#222222",
    fontSize: 12,
    fontFamily: FONT.regular,
  },

  passwordToggle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.navy,
  },

  passwordRules: {
    color: "#6F7682",
    fontSize: 10,
    lineHeight: 16,
    fontFamily: FONT.light,
    marginBottom: 16,
  },

  statusCard: {
    width: "100%",
    minHeight: 95,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    backgroundColor: "#F7F8FA",
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 8,
  },

  statusInfo: {
    flex: 1,
    minWidth: 0,
  },

  statusLabel: {
    color: "#555D68",
    fontSize: 11,
    fontFamily: FONT.medium,
  },

  statusValue: {
    fontSize: 14,
    fontFamily: FONT.medium,
    marginTop: 3,
  },

  activeText: {
    color: COLORS.green,
  },

  inactiveText: {
    color: COLORS.red,
  },

  statusDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: FONT.light,
    marginTop: 4,
  },

  switchTrack: {
    width: 50,
    height: 28,
    borderRadius: 20,
    backgroundColor: "#C7CBD2",
    padding: 3,
    justifyContent: "center",
    flexShrink: 0,
  },

  switchTrackActive: {
    backgroundColor: COLORS.green,
  },

  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 20,
    backgroundColor: COLORS.white,
  },

  switchThumbActive: {
    alignSelf: "flex-end",
  },

  errorBox: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    backgroundColor: "#FFEAEA",
    borderWidth: 1,
    borderColor: "#FF9B9B",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 11,
    marginBottom: 20,
  },

  errorTitle: {
    color: COLORS.red,
    fontSize: 12,
    fontFamily: FONT.semibold,
    marginBottom: 3,
  },

  errorText: {
    color: COLORS.red,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FONT.regular,
  },

  actionRow: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    marginTop: 30,
  },

  cancelButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 210,
    maxWidth: 300,
    minHeight: 46,
    backgroundColor: "#E2E3E5",
    borderWidth: 1,
    borderColor: COLORS.navy,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  cancelButtonText: {
    color: "#222222",
    fontSize: 12,
    fontFamily: FONT.medium,
  },

  saveButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 210,
    maxWidth: 300,
    minHeight: 46,
    backgroundColor: COLORS.green,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONT.medium,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  stateText: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 12,
  },
});

// Preserved from your existing styles file.
export default function EditOfficerStylesRoute() {
  return null;
}
