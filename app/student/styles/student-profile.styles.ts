import { StyleSheet } from "react-native";

const colors = {
  background: "#E8E8E8",
  navy: "#123266",
  white: "#FFFFFF",
  text: "#111111",
  muted: "#626975",
  border: "#777777",
  green: "#238A35",
  red: "#E52323",
  active: "#16E564",
};

const fonts = {
  bold: "Poppins_700Bold",
  semibold: "Poppins_600SemiBold",
  medium: "Poppins_500Medium",
  regular: "Poppins_400Regular",
  light: "Poppins_300Light",
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    width: 23,
    height: 23,
    resizeMode: "contain",
    tintColor: colors.text,
    transform: [{ rotate: "180deg" }],
  },

  headerTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 21,
    color: colors.text,
    textAlign: "center",
  },

  headerSpacer: {
    width: 44,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 30,
  },

  loading: {
    paddingVertical: 42,
    alignItems: "center",
    gap: 10,
  },

  helper: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.muted,
  },

  errorCard: {
    padding: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 10,
    marginBottom: 16,
  },

  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.red,
  },

  retryButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
    marginTop: 4,
  },

  retryText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.navy,
  },

  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 20,
    marginBottom: 23,
  },

  avatarButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  // Dims the photo while a new one uploads.
  avatarBusy: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18, 50, 102, 0.55)",
  },

  avatarInitials: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    color: colors.white,
  },

  identityText: {
    flex: 1,
    minWidth: 0,
  },

  studentName: {
    fontFamily: fonts.bold,
    fontSize: 19,
    lineHeight: 27,
    color: colors.text,
  },

  studentSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.muted,
    marginTop: 2,
  },

  photoHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.navy,
    marginTop: 5,
  },

  infoCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 17,
    marginBottom: 21,
  },

  studentId: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.navy,
    marginBottom: 12,
  },

  infoLine: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.muted,
  },

  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
  },

  overview: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 17,
    paddingHorizontal: 8,
    marginBottom: 26,
  },

  overviewItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 3,
  },

  overviewLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.text,
    textAlign: "center",
  },

  overviewValue: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.navy,
    textAlign: "center",
    marginTop: 12,
  },

  paidValue: {
    color: colors.green,
  },

  outstandingValue: {
    color: colors.red,
  },

  menu: {
    gap: 12,
  },

  menuButton: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 14,
  },

  menuIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
    tintColor: colors.text,
  },

  menuText: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
    textAlign: "center",
    marginHorizontal: 8,
  },

  arrowIcon: {
    width: 25,
    height: 25,
    resizeMode: "contain",
    tintColor: colors.text,
    transform: [{ rotate: "180deg" }],
  },

  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.navy,
    borderRadius: 9,
    paddingHorizontal: 18,
    marginTop: 20,
  },

  primaryText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
  },

  disabled: {
    opacity: 0.5,
  },

  formIntro: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.muted,
    marginBottom: 18,
  },

  editPhotoArea: {
    alignItems: "center",
    marginBottom: 22,
  },

  editAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  editPhotoButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  editPhotoText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.navy,
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text,
    marginBottom: 6,
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },

  // Border colour only, so focusing never shifts the layout.
  inputFocused: {
    borderColor: "#173A73",
  },

  readOnlyInput: {
    backgroundColor: "#F3F4F6",
    color: colors.muted,
  },

  passwordHelp: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.muted,
    marginBottom: 18,
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },

  passwordInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 9,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },

  visibilityButton: {
    minWidth: 55,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  visibilityText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.navy,
  },

  aboutLogoArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 18,
  },

  aboutLogo: {
    width: 110,
    height: 110,
    resizeMode: "contain",
  },

  aboutHeading: {
    minHeight: 40,
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 6,
  },

  aboutHeadingText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },

  aboutCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 17,
    marginBottom: 14,
  },

  aboutBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.muted,
    textAlign: "center",
  },

  developerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
  },

  developerPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  developerInfo: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },

  developerName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.navy,
    textAlign: "center",
  },

  developerContact: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: colors.muted,
    textAlign: "center",
    marginTop: 3,
  },

  textCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },

  textCardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.navy,
    marginBottom: 7,
  },

  textCardBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.text,
  },

  bottomArea: {
    backgroundColor: colors.navy,
  },

  bottomNavigation: {
    flexDirection: "row",
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 8,
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
    tintColor: colors.white,
    resizeMode: "contain",
  },

  navLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.white,
    textAlign: "center",
    marginTop: 5,
  },

  indicator: {
    width: "65%",
    maxWidth: 52,
    height: 3,
    marginTop: 4,
    backgroundColor: colors.active,
    borderRadius: 2,
  },

  hiddenIndicator: {
    backgroundColor: "transparent",
  },

  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  modalCard: {
    width: "100%",
    maxWidth: 390,
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 13,
  },

  modalTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.navy,
    textAlign: "center",
  },

  modalMessage: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
    textAlign: "center",
    marginTop: 10,
  },
});

// Compatibility with Expo Router while this stylesheet is inside app/.
export default function StudentProfileStylesRoute() {
  return null;
}
