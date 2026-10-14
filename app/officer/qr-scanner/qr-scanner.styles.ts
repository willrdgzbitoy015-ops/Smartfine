import { navBar, OFFICER, OFFICER_COLUMN } from "@/constants/officer-theme";
import { useOfficerLayout } from "@/hooks/use-officer-layout";
import { StyleSheet } from "react-native";

const LABEL_SHADOW = {
  textShadowColor: "rgba(0, 0, 0, 0.65)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
} as const;

export const styles = StyleSheet.create({
  // ==========================================
  // SCANNER SCREEN
  // ==========================================

  scanScreen: {
    flex: 1,
    backgroundColor: OFFICER.navyDeep,
  },

  // Title bar: what this screen is, how to use it, and where you are.
  scanHeader: {
    backgroundColor: OFFICER.navyDeep,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  // Keeps the title, info button and steps in a centred column on a tablet.
  scanHeaderInner: {
    width: "100%",
    maxWidth: OFFICER_COLUMN,
    alignSelf: "center",
  },

  scanHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
  },

  headerSide: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  scanTitle: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
  },

  // The round "i" that opens the how-to-scan tips.
  infoBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  infoBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    lineHeight: 18,
    color: "#FFFFFF",
    includeFontPadding: false,
  },

  headerSteps: {
    marginTop: 2,
  },

  // The camera fills this area; the frame and options sit on top of it.
  cameraArea: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#0A1E45",
  },

  camera: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  scanBody: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 18,
  },

  frame: {
    width: "72%",
    maxWidth: 300,
    aspectRatio: 1,
  },

  framePlaceholder: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  qrIcon: {
    width: 55,
    height: 55,
    opacity: 0.65,
  },

  scanInstruction: {
    maxWidth: 300,
    marginTop: 22,
    paddingHorizontal: 8,
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    ...LABEL_SHADOW,
  },

  supportText: {
    maxWidth: 300,
    marginTop: 8,
    paddingHorizontal: 8,
    color: "#D5DFEF",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    ...LABEL_SHADOW,
  },

  permissionButton: {
    minHeight: 46,
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: OFFICER.green,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  scanError: {
    maxWidth: 320,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: "#FFD5D5",
    backgroundColor: "rgba(120, 20, 20, 0.7)",
    borderRadius: 12,
    overflow: "hidden",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  // Shown after an unreadable code, to get back to scanning.
  scanAgainButton: {
    minHeight: 44,
    marginTop: 14,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 999,
    backgroundColor: "rgba(6, 18, 40, 0.45)",
  },

  scanAgainText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },

  // Pushes the options (or the sheet) to the bottom of the camera area.
  spacer: {
    flex: 1,
    minHeight: 16,
  },

  // ==========================================
  // OPTIONS UNDER THE FRAME
  // ==========================================

  options: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 44,
    paddingHorizontal: 16,
  },

  option: {
    width: 120,
    alignItems: "center",
    paddingVertical: 4,
  },

  optionIcon: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },

  optionGlyph: {
    width: 28,
    height: 28,
    tintColor: "#FFFFFF",
  },

  optionLabel: {
    marginTop: 10,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    ...LABEL_SHADOW,
  },

  // ==========================================
  // BOTTOM SHEET (QR read / type a Student ID)
  // ==========================================

  sheet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: OFFICER_COLUMN,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },

  sheetLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: OFFICER.muted,
  },

  sheetValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    lineHeight: 28,
    color: OFFICER.navyDeep,
    marginBottom: 6,
  },

  textButton: {
    minHeight: 44,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetLink: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: OFFICER.navy,
    textAlign: "center",
  },

  manualInput: {
    minHeight: 50,
    backgroundColor: OFFICER.background,
    borderWidth: 1,
    borderColor: OFFICER.lineStrong,
    color: OFFICER.text,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  manualSearchButton: {
    backgroundColor: OFFICER.green,
  },

  // ==========================================
  // BUTTONS (shared)
  // ==========================================

  button: {
    width: "100%",
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },

  // The main action: green, dimmed until it can be used.
  confirmButton: {
    backgroundColor: OFFICER.green,
  },

  disabled: {
    opacity: 0.45,
  },

  // ==========================================
  // HOW TO SCAN (info pop-up)
  // ==========================================

  infoOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(11, 22, 44, 0.6)",
  },

  infoCard: {
    width: "100%",
    maxWidth: 360,
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    gap: 6,
  },

  infoTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: OFFICER.navyDeep,
    textAlign: "center",
    marginBottom: 8,
  },

  infoItem: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 21,
    color: "#475569",
  },

  infoButton: {
    marginTop: 14,
  },

  // ==========================================
  // BOTTOM NAVIGATION
  // ==========================================

  bottomArea: {
    ...navBar,
    width: "100%",
    maxWidth: OFFICER_COLUMN,
    alignSelf: "center",
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

  // ==========================================
  // STUDENT IDENTIFIED SCREEN
  // ==========================================

  resultScreen: {
    flex: 1,
    backgroundColor: OFFICER.background,
  },

  resultContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: OFFICER_COLUMN,
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },

  // Top bar: a way back, and what this screen is for.
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: 48,
    marginBottom: 12,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  backIcon: {
    width: 24,
    height: 24,
    transform: [{ scaleX: -1 }],
  },

  backIconDark: {
    tintColor: OFFICER.navyDeep,
  },

  backSpacer: {
    width: 44,
  },

  screenTitle: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    textAlign: "center",
  },

  screenTitleDark: {
    color: OFFICER.navyDeep,
  },

  // The three-step strip under the header.
  steps: {
    marginBottom: 16,
  },

  successCheck: {
    marginBottom: 18,
  },

  identifiedTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: OFFICER.greenText,
    textAlign: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    backgroundColor: OFFICER.navy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 3,
    borderColor: OFFICER.surface,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitials: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 25,
    color: "#FFFFFF",
  },

  studentName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: OFFICER.navyDeep,
    textAlign: "center",
    marginBottom: 8,
  },

  studentDetails: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: OFFICER.muted,
    textAlign: "center",
  },

  inactiveNotice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: OFFICER.red,
    textAlign: "center",
    marginTop: 18,
  },

  resultError: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: OFFICER.red,
    textAlign: "center",
    marginTop: 14,
  },

  // Tells the Officer what happens next.
  nextHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: OFFICER.muted,
    textAlign: "center",
    marginTop: 28,
  },

  resultActions: {
    width: "100%",
    maxWidth: 320,
    gap: 12,
    marginTop: 14,
  },

  addFineButton: {
    backgroundColor: OFFICER.navyDeep,
  },

  resultCancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: OFFICER.lineStrong,
  },

  resultCancelText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: OFFICER.navyDeep,
  },
});

// Keeps your requested colocated screen/styles structure.
// Expo Router will register this as a blank route.
export default function OfficerQRScannerStylesRoute() {
  return null;
}

export function useResponsiveStyles() {
  return useOfficerLayout(styles);
}
