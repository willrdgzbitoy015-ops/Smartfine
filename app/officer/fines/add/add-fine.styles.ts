import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",

  darkNavy: "#0C2F64",

  text: "#123266",

  green: "#45B94F",

  lightGreen: "#56C85C",

  lime: "#8ED000",

  white: "#FFFFFF",

  background: "#F4F6F9",

  muted: "#8C939F",

  border: "#DDE3EB",

  red: "#D32F2F",
};

export const styles = StyleSheet.create({
  // ========================================
  // SCREEN
  // MOBILE PHONE ONLY
  // ========================================

  screen: {
    flex: 1,

    backgroundColor: COLORS.background,
  },

  // ========================================
  // LOADING
  // ========================================

  loadingScreen: {
    flex: 1,

    backgroundColor: COLORS.background,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 30,
  },

  loadingTitle: {
    color: COLORS.text,

    fontFamily: "Poppins-SemiBold",

    fontSize: 15,

    marginTop: 15,
  },

  loadingText: {
    color: COLORS.muted,

    fontFamily: "Poppins-Light",

    fontSize: 10,

    marginTop: 3,
  },

  // ========================================
  // HEADER
  // ========================================

  header: {
    minHeight: 92,

    backgroundColor: COLORS.navy,

    paddingHorizontal: 18,

    paddingTop: 15,

    paddingBottom: 16,

    flexDirection: "row",

    alignItems: "center",

    borderBottomLeftRadius: 24,

    borderBottomRightRadius: 24,
  },

  backButton: {
    width: 42,

    height: 42,

    borderRadius: 13,

    backgroundColor: "rgba(255,255,255,0.10)",

    alignItems: "center",

    justifyContent: "center",

    marginRight: 12,
  },

  backIcon: {
    width: 21,

    height: 21,

    transform: [
      {
        rotate: "180deg",
      },
    ],
  },

  headerTextContainer: {
    flex: 1,
  },

  headerEyebrow: {
    color: COLORS.lime,

    fontFamily: "Poppins-Medium",

    fontSize: 10,

    marginBottom: 1,
  },

  headerTitle: {
    color: COLORS.white,

    fontFamily: "Poppins-Bold",

    fontSize: 21,
  },

  headerFineIconBox: {
    width: 44,

    height: 44,

    borderRadius: 14,

    backgroundColor: COLORS.darkNavy,

    alignItems: "center",

    justifyContent: "center",
  },

  headerFineIcon: {
    width: 23,

    height: 23,
  },

  // ========================================
  // SCROLL
  // ========================================

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 17,

    paddingTop: 18,
  },

  // ========================================
  // STUDENT CARD
  // ========================================

  studentCard: {
    width: "100%",

    backgroundColor: COLORS.white,

    borderRadius: 16,

    padding: 15,

    marginBottom: 15,

    elevation: 2,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,

      height: 2,
    },

    shadowOpacity: 0.06,

    shadowRadius: 5,
  },

  selectedStudentBadge: {
    alignSelf: "flex-start",

    backgroundColor: "#E8F8E9",

    borderRadius: 20,

    paddingHorizontal: 10,

    paddingVertical: 4,

    marginBottom: 13,
  },

  selectedStudentBadgeText: {
    color: "#2D9B38",

    fontFamily: "Poppins-Medium",

    fontSize: 8,
  },

  studentRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  studentPhoto: {
    width: 66,

    height: 66,

    borderRadius: 33,

    borderWidth: 2,

    borderColor: "#E3F4E5",

    marginRight: 14,
  },

  studentPhotoFallback: {
    width: 66,

    height: 66,

    borderRadius: 33,

    backgroundColor: COLORS.navy,

    borderWidth: 2,

    borderColor: "#E3F4E5",

    alignItems: "center",

    justifyContent: "center",

    marginRight: 14,
  },

  studentInitials: {
    color: COLORS.white,

    fontFamily: "Poppins-Bold",

    fontSize: 20,
  },

  studentDetails: {
    flex: 1,

    minWidth: 0,
  },

  studentName: {
    color: COLORS.text,

    fontFamily: "Poppins-Bold",

    fontSize: 15,

    lineHeight: 20,
  },

  studentNumber: {
    color: COLORS.green,

    fontFamily: "Poppins-Medium",

    fontSize: 10,

    marginTop: 3,
  },

  studentGrade: {
    color: "#667085",

    fontFamily: "Poppins-Regular",

    fontSize: 10,

    marginTop: 2,
  },

  // ========================================
  // ERROR
  // ========================================

  errorCard: {
    width: "100%",

    backgroundColor: "#FFF1F1",

    borderWidth: 1,

    borderColor: "#F0B6B6",

    borderRadius: 12,

    padding: 11,

    flexDirection: "row",

    alignItems: "flex-start",

    marginBottom: 15,
  },

  errorIconBox: {
    width: 30,

    height: 30,

    borderRadius: 15,

    backgroundColor: COLORS.red,

    alignItems: "center",

    justifyContent: "center",

    marginRight: 9,
  },

  errorIconText: {
    color: COLORS.white,

    fontFamily: "Poppins-Bold",

    fontSize: 14,
  },

  errorTextContainer: {
    flex: 1,
  },

  errorTitle: {
    color: "#B42318",

    fontFamily: "Poppins-SemiBold",

    fontSize: 10,
  },

  errorMessage: {
    color: "#B42318",

    fontFamily: "Poppins-Regular",

    fontSize: 9,

    lineHeight: 14,

    marginTop: 2,
  },

  // ========================================
  // FORM CARD
  // ========================================

  formCard: {
    width: "100%",

    backgroundColor: COLORS.white,

    borderRadius: 16,

    padding: 16,

    elevation: 2,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,

      height: 2,
    },

    shadowOpacity: 0.06,

    shadowRadius: 5,
  },

  sectionTitle: {
    color: COLORS.text,

    fontFamily: "Poppins-SemiBold",

    fontSize: 16,
  },

  sectionDescription: {
    color: COLORS.muted,

    fontFamily: "Poppins-Light",

    fontSize: 9,

    lineHeight: 14,

    marginTop: 3,

    marginBottom: 20,
  },

  // ========================================
  // FIELD
  // ========================================

  fieldGroup: {
    width: "100%",

    marginBottom: 20,

    position: "relative",
  },

  lastFieldGroup: {
    marginBottom: 0,
  },

  fieldLabel: {
    color: "#202020",

    fontFamily: "Poppins-Medium",

    fontSize: 10,

    marginBottom: 7,
  },

  // ========================================
  // SELECT
  // ========================================

  selectButton: {
    width: "100%",

    height: 47,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 9,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 13,
  },

  selectButtonActive: {
    borderColor: COLORS.navy,

    borderWidth: 1.5,
  },

  selectText: {
    flex: 1,

    color: COLORS.text,

    fontFamily: "Poppins-Regular",

    fontSize: 11,

    marginRight: 8,
  },

  placeholderText: {
    color: "#9AA5B5",
  },

  selectArrow: {
    color: COLORS.navy,

    fontFamily: "Poppins-Medium",

    fontSize: 10,
  },

  // ========================================
  // DROPDOWN
  // ========================================

  dropdownMenu: {
    width: "100%",

    maxHeight: 235,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 9,

    marginTop: 6,

    overflow: "hidden",

    elevation: 6,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,

      height: 3,
    },

    shadowOpacity: 0.12,

    shadowRadius: 7,
  },

  dropdownScroll: {
    maxHeight: 235,
  },

  dropdownItem: {
    minHeight: 61,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 13,

    paddingVertical: 10,

    borderBottomWidth: 1,

    borderBottomColor: "#EDF0F4",
  },

  dropdownTextArea: {
    flex: 1,

    paddingRight: 10,
  },

  dropdownTitle: {
    color: COLORS.text,

    fontFamily: "Poppins-SemiBold",

    fontSize: 10,
  },

  dropdownDescription: {
    color: COLORS.muted,

    fontFamily: "Poppins-Light",

    fontSize: 8,

    lineHeight: 12,

    marginTop: 2,
  },

  dropdownAmount: {
    color: COLORS.green,

    fontFamily: "Poppins-SemiBold",

    fontSize: 10,
  },

  emptyDropdown: {
    minHeight: 60,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 15,
  },

  emptyDropdownText: {
    color: COLORS.muted,

    fontFamily: "Poppins-Regular",

    fontSize: 9,

    textAlign: "center",
  },

  // ========================================
  // AMOUNT
  // ========================================

  amountCard: {
    width: "100%",

    minHeight: 68,

    backgroundColor: "#F4FAF5",

    borderWidth: 1,

    borderColor: "#D6EDD9",

    borderRadius: 10,

    paddingHorizontal: 14,

    paddingVertical: 10,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  amountLabel: {
    color: "#667085",

    fontFamily: "Poppins-Regular",

    fontSize: 10,
  },

  amountValue: {
    color: COLORS.green,

    fontFamily: "Poppins-Bold",

    fontSize: 19,
  },

  amountHelper: {
    color: COLORS.muted,

    fontFamily: "Poppins-Light",

    fontSize: 8,

    lineHeight: 12,

    marginTop: 5,
  },

  // ========================================
  // TEXT INPUT
  // ========================================

  textInput: {
    width: "100%",

    height: 47,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 9,

    paddingHorizontal: 13,

    color: COLORS.text,

    fontFamily: "Poppins-Regular",

    fontSize: 11,
  },

  helperText: {
    color: COLORS.muted,

    fontFamily: "Poppins-Light",

    fontSize: 8,

    marginTop: 5,
  },

  // ========================================
  // REMARKS
  // ========================================

  remarksInput: {
    width: "100%",

    minHeight: 100,

    maxHeight: 150,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 9,

    paddingHorizontal: 13,

    paddingTop: 12,

    paddingBottom: 12,

    color: COLORS.text,

    fontFamily: "Poppins-Regular",

    fontSize: 11,

    lineHeight: 17,
  },

  characterCount: {
    alignSelf: "flex-end",

    color: COLORS.muted,

    fontFamily: "Poppins-Light",

    fontSize: 8,

    marginTop: 5,
  },

  // ========================================
  // ACTIONS
  // ========================================

  actionContainer: {
    width: "100%",

    flexDirection: "row",

    gap: 10,

    marginTop: 15,
  },

  cancelButton: {
    flex: 1,

    minHeight: 47,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 9,

    backgroundColor: COLORS.white,

    alignItems: "center",

    justifyContent: "center",
  },

  cancelButtonText: {
    color: COLORS.navy,

    fontFamily: "Poppins-Medium",

    fontSize: 11,
  },

  saveButton: {
    flex: 1.4,

    minHeight: 47,

    borderRadius: 9,

    backgroundColor: COLORS.green,

    alignItems: "center",

    justifyContent: "center",
  },

  saveButtonText: {
    color: COLORS.white,

    fontFamily: "Poppins-Medium",

    fontSize: 11,
  },

  disabledButton: {
    opacity: 0.55,
  },

  // ========================================
  // RETURN TO SCANNER
  // ========================================

  returnScannerButton: {
    width: "100%",

    minHeight: 47,

    backgroundColor: COLORS.navy,

    borderRadius: 9,

    alignItems: "center",

    justifyContent: "center",

    marginTop: 5,
  },

  returnScannerButtonText: {
    color: COLORS.white,

    fontFamily: "Poppins-Medium",

    fontSize: 11,
  },

  // ========================================
  // EXTRA
  // ========================================

  bottomSpacing: {
    height: 30,
  },
});
