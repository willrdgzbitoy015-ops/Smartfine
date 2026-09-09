import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // ========================================
  // SCREEN
  // ========================================

  screen: {
    flex: 1,
    backgroundColor: "#F4F6F9",
  },

  // ========================================
  // HEADER
  // MOBILE ONLY
  // ========================================

  header: {
    backgroundColor: "#173A73",

    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",

    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerEyebrow: {
    color: "#8ED000",

    fontFamily: "Poppins-Medium",

    fontSize: 12,

    marginBottom: 1,
  },

  headerTitle: {
    color: "#FFFFFF",

    fontFamily: "Poppins-Bold",

    fontSize: 24,
  },

  headerIconContainer: {
    width: 48,
    height: 48,

    borderRadius: 16,

    backgroundColor: "#0C2F64",

    alignItems: "center",
    justifyContent: "center",
  },

  headerIcon: {
    width: 26,
    height: 26,
  },

  // ========================================
  // SCROLL
  // ========================================

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  pageDescription: {
    color: "#667085",

    fontFamily: "Poppins-Regular",

    fontSize: 12,
    lineHeight: 19,

    marginBottom: 18,
  },

  // ========================================
  // LOADING
  // ========================================

  loadingCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    paddingHorizontal: 20,
    paddingVertical: 40,

    alignItems: "center",

    elevation: 2,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 5,
  },

  loadingTitle: {
    color: "#123266",

    fontFamily: "Poppins-SemiBold",

    fontSize: 15,

    marginTop: 15,
  },

  loadingText: {
    color: "#8C939F",

    fontFamily: "Poppins-Light",

    fontSize: 11,
    lineHeight: 17,

    textAlign: "center",

    marginTop: 5,
  },

  // ========================================
  // SCANNER CARD
  // ========================================

  scannerCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    padding: 14,

    elevation: 3,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.07,
    shadowRadius: 7,
  },

  sectionTitle: {
    color: "#123266",

    fontFamily: "Poppins-SemiBold",

    fontSize: 16,
  },

  sectionSubtitle: {
    color: "#8C939F",

    fontFamily: "Poppins-Light",

    fontSize: 10,
    lineHeight: 15,

    marginTop: 2,
    marginBottom: 14,
  },

  // ========================================
  // CAMERA
  // ========================================

  cameraWrapper: {
    width: "100%",

    aspectRatio: 0.86,

    maxHeight: 410,

    borderRadius: 14,

    overflow: "hidden",

    backgroundColor: "#082B52",

    position: "relative",
  },

  // FIXED:
  // removed StyleSheet.absoluteFillObject
  camera: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // FIXED:
  // removed StyleSheet.absoluteFillObject
  cameraOverlay: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 22,
  },

  scannerFrame: {
    width: "72%",

    aspectRatio: 1,

    position: "relative",
  },

  corner: {
    width: 46,
    height: 46,

    position: "absolute",

    borderColor: "#56C85C",
  },

  topLeftCorner: {
    left: 0,
    top: 0,

    borderTopWidth: 4,
    borderLeftWidth: 4,

    borderTopLeftRadius: 10,
  },

  topRightCorner: {
    right: 0,
    top: 0,

    borderTopWidth: 4,
    borderRightWidth: 4,

    borderTopRightRadius: 10,
  },

  bottomLeftCorner: {
    left: 0,
    bottom: 0,

    borderBottomWidth: 4,
    borderLeftWidth: 4,

    borderBottomLeftRadius: 10,
  },

  bottomRightCorner: {
    right: 0,
    bottom: 0,

    borderBottomWidth: 4,
    borderRightWidth: 4,

    borderBottomRightRadius: 10,
  },

  scanInstruction: {
    color: "#FFFFFF",

    fontFamily: "Poppins-Regular",

    fontSize: 11,

    textAlign: "center",

    marginTop: 24,

    paddingHorizontal: 15,

    textShadowColor: "rgba(0,0,0,0.55)",

    textShadowOffset: {
      width: 0,
      height: 1,
    },

    textShadowRadius: 3,
  },

  // ========================================
  // CAMERA PROCESSING
  // ========================================

  // FIXED:
  // removed StyleSheet.absoluteFillObject
  processingOverlay: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: "rgba(8, 43, 82, 0.82)",

    alignItems: "center",
    justifyContent: "center",
  },

  processingText: {
    color: "#FFFFFF",

    fontFamily: "Poppins-Medium",

    fontSize: 12,

    marginTop: 12,
  },

  tryAgainCameraButton: {
    minWidth: 135,

    height: 42,

    backgroundColor: "#45B94F",

    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 22,
  },

  tryAgainCameraButtonText: {
    color: "#FFFFFF",

    fontFamily: "Poppins-Medium",

    fontSize: 12,
  },

  // ========================================
  // CAMERA STATE
  // ========================================

  cameraState: {
    width: "100%",

    minHeight: 300,

    borderRadius: 14,

    backgroundColor: "#EEF2F7",

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 25,
    paddingVertical: 35,
  },

  cameraStateText: {
    color: "#667085",

    fontFamily: "Poppins-Regular",

    fontSize: 11,

    marginTop: 12,
  },

  permissionIcon: {
    width: 56,
    height: 56,

    marginBottom: 16,
  },

  permissionTitle: {
    color: "#123266",

    fontFamily: "Poppins-SemiBold",

    fontSize: 15,

    textAlign: "center",
  },

  permissionText: {
    color: "#667085",

    fontFamily: "Poppins-Regular",

    fontSize: 11,
    lineHeight: 17,

    textAlign: "center",

    marginTop: 7,
    marginBottom: 20,
  },

  permissionButton: {
    minWidth: 150,

    height: 42,

    borderRadius: 8,

    backgroundColor: "#45B94F",

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 20,
  },

  permissionButtonText: {
    color: "#FFFFFF",

    fontFamily: "Poppins-Medium",

    fontSize: 12,
  },

  // ========================================
  // WEB FALLBACK
  // ========================================

  cameraUnavailable: {
    width: "100%",

    minHeight: 270,

    backgroundColor: "#EEF2F7",

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 24,
    paddingVertical: 30,
  },

  cameraUnavailableIcon: {
    width: 58,
    height: 58,

    marginBottom: 14,
  },

  cameraUnavailableTitle: {
    color: "#123266",

    fontFamily: "Poppins-SemiBold",

    fontSize: 15,
  },

  cameraUnavailableText: {
    color: "#667085",

    fontFamily: "Poppins-Regular",

    fontSize: 11,
    lineHeight: 17,

    textAlign: "center",

    marginTop: 7,
  },

  // ========================================
  // ERROR CARD
  // ========================================

  errorCard: {
    width: "100%",

    backgroundColor: "#FFF1F1",

    borderWidth: 1,
    borderColor: "#F1B8B8",

    borderRadius: 12,

    padding: 12,

    marginTop: 14,

    flexDirection: "row",

    alignItems: "center",
  },

  errorIconContainer: {
    width: 32,
    height: 32,

    borderRadius: 16,

    backgroundColor: "#D32F2F",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },

  errorIcon: {
    color: "#FFFFFF",

    fontFamily: "Poppins-Bold",

    fontSize: 15,
  },

  errorTextArea: {
    flex: 1,
  },

  errorTitle: {
    color: "#B42318",

    fontFamily: "Poppins-SemiBold",

    fontSize: 11,
  },

  errorMessage: {
    color: "#B42318",

    fontFamily: "Poppins-Regular",

    fontSize: 10,
    lineHeight: 15,

    marginTop: 1,
  },

  errorTryAgain: {
    marginLeft: 8,

    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  errorTryAgainText: {
    color: "#D32F2F",

    fontFamily: "Poppins-Medium",

    fontSize: 10,
  },

  // ========================================
  // MANUAL STUDENT SEARCH
  // ========================================

  manualSearchCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    padding: 16,

    marginTop: 16,

    elevation: 2,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 5,
  },

  inputLabel: {
    color: "#123266",

    fontFamily: "Poppins-Medium",

    fontSize: 11,

    marginBottom: 6,
  },

  studentIdInput: {
    width: "100%",

    height: 46,

    borderWidth: 1,
    borderColor: "#D9DFE8",

    borderRadius: 9,

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 13,

    color: "#123266",

    fontFamily: "Poppins-Regular",

    fontSize: 12,
  },

  searchButton: {
    width: "100%",

    height: 44,

    borderRadius: 9,

    backgroundColor: "#173A73",

    alignItems: "center",
    justifyContent: "center",

    marginTop: 11,
  },

  searchButtonText: {
    color: "#FFFFFF",

    fontFamily: "Poppins-Medium",

    fontSize: 12,
  },

  // ========================================
  // STUDENT RESULT
  // ========================================

  resultCard: {
    width: "100%",

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    marginTop: 2,

    padding: 18,

    elevation: 3,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.08,
    shadowRadius: 7,
  },

  verifiedRow: {
    flexDirection: "row",

    alignItems: "center",

    paddingBottom: 15,

    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },

  verifiedIconContainer: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: "#E8F8E9",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  verifiedIconText: {
    color: "#45B94F",

    fontFamily: "Poppins-Bold",

    fontSize: 19,
  },

  verifiedTextArea: {
    flex: 1,
  },

  studentFoundTitle: {
    color: "#123266",

    fontFamily: "Poppins-SemiBold",

    fontSize: 14,
  },

  studentFoundSubtitle: {
    color: "#8C939F",

    fontFamily: "Poppins-Light",

    fontSize: 9,

    marginTop: 1,
  },

  // ========================================
  // STUDENT INFORMATION
  // ========================================

  studentInformation: {
    alignItems: "center",

    paddingTop: 20,
    paddingBottom: 18,
  },

  studentAvatarImage: {
    width: 86,
    height: 86,

    borderRadius: 43,

    borderWidth: 3,
    borderColor: "#E8F5E9",

    marginBottom: 12,
  },

  studentAvatarFallback: {
    width: 86,
    height: 86,

    borderRadius: 43,

    backgroundColor: "#173A73",

    borderWidth: 3,
    borderColor: "#E8F5E9",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 12,
  },

  studentAvatarText: {
    color: "#FFFFFF",

    fontFamily: "Poppins-Bold",

    fontSize: 25,
  },

  studentName: {
    color: "#123266",

    fontFamily: "Poppins-Bold",

    fontSize: 18,

    textAlign: "center",
  },

  studentNumber: {
    color: "#45B94F",

    fontFamily: "Poppins-Medium",

    fontSize: 11,

    marginTop: 3,
  },

  gradeSection: {
    color: "#667085",

    fontFamily: "Poppins-Regular",

    fontSize: 11,

    marginTop: 3,
  },

  statusBadge: {
    borderRadius: 20,

    paddingHorizontal: 12,
    paddingVertical: 4,

    marginTop: 9,
  },

  activeBadge: {
    backgroundColor: "#E7F8E8",
  },

  inactiveBadge: {
    backgroundColor: "#FDECEC",
  },

  statusBadgeText: {
    fontFamily: "Poppins-Medium",

    fontSize: 9,
  },

  activeBadgeText: {
    color: "#2D9B38",
  },

  inactiveBadgeText: {
    color: "#D32F2F",
  },

  // ========================================
  // FINANCIAL SUMMARY
  // ========================================

  summaryContainer: {
    width: "100%",

    minHeight: 76,

    borderRadius: 12,

    backgroundColor: "#F6F8FB",

    flexDirection: "row",

    alignItems: "center",

    marginBottom: 18,
  },

  summaryItem: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  summaryDivider: {
    width: 1,

    height: 42,

    backgroundColor: "#DDE3EB",
  },

  summaryLabel: {
    color: "#8C939F",

    fontFamily: "Poppins-Light",

    fontSize: 9,

    marginBottom: 4,
  },

  summaryValue: {
    color: "#123266",

    fontFamily: "Poppins-SemiBold",

    fontSize: 15,
  },

  outstandingValue: {
    color: "#D32F2F",

    fontFamily: "Poppins-SemiBold",

    fontSize: 15,
  },

  // ========================================
  // RESULT ACTIONS
  // ========================================

  recordFineButton: {
    width: "100%",

    height: 46,

    borderRadius: 9,

    backgroundColor: "#45B94F",

    alignItems: "center",
    justifyContent: "center",
  },

  recordFineButtonText: {
    color: "#FFFFFF",

    fontFamily: "Poppins-Medium",

    fontSize: 13,
  },

  scanAnotherButton: {
    width: "100%",

    height: 44,

    borderRadius: 9,

    borderWidth: 1,
    borderColor: "#173A73",

    alignItems: "center",
    justifyContent: "center",

    marginTop: 10,
  },

  scanAnotherButtonText: {
    color: "#173A73",

    fontFamily: "Poppins-Medium",

    fontSize: 11,
  },

  disabledButton: {
    opacity: 0.5,
  },

  inactiveNotice: {
    color: "#D32F2F",

    fontFamily: "Poppins-Light",

    fontSize: 9,
    lineHeight: 14,

    textAlign: "center",

    marginTop: 9,
  },

  // ========================================
  // MOBILE BOTTOM NAVIGATION
  // ========================================

  bottomNavigation: {
    minHeight: 72,

    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,
    borderTopColor: "#E6EAF0",

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-around",

    paddingTop: 7,
    paddingBottom: 8,

    elevation: 12,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: -2,
    },

    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  bottomNavItem: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    minHeight: 55,
  },

  bottomNavItemActive: {
    position: "relative",
  },

  bottomNavIcon: {
    width: 21,
    height: 21,

    marginBottom: 4,

    opacity: 0.6,
  },

  activeNavIconCircle: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: "#45B94F",

    alignItems: "center",
    justifyContent: "center",

    marginTop: -20,
    marginBottom: 3,

    elevation: 5,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  bottomNavActiveIcon: {
    width: 21,
    height: 21,
  },

  bottomNavText: {
    color: "#667085",

    fontFamily: "Poppins-Medium",

    fontSize: 8,
  },

  bottomNavTextActive: {
    color: "#45B94F",

    fontFamily: "Poppins-Medium",

    fontSize: 8,
  },

  futureNavItem: {
    opacity: 0.45,
  },

  futureNavText: {
    color: "#8C939F",

    fontFamily: "Poppins-Medium",

    fontSize: 8,
  },

  // ========================================
  // EXTRA
  // ========================================

  bottomSpacing: {
    height: 22,
  },
});
