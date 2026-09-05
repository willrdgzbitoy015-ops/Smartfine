import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",

  green: "#45B94F",

  lightGreen: "#56C85C",

  red: "#FF2424",

  background: "#E8E8E8",

  white: "#FFFFFF",

  text: "#123266",

  muted: "#8C939F",
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,

    flexDirection: "row",

    backgroundColor: COLORS.background,
  },

  // ==========================================
  // LOADING
  // ==========================================

  loadingScreen: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: COLORS.background,
  },

  loadingText: {
    color: COLORS.text,

    fontSize: 13,

    marginTop: 12,
  },

  // ==========================================
  // SIDEBAR
  // ==========================================

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

  navIcon: {
    width: 28,

    color: COLORS.white,

    fontSize: 21,

    fontWeight: "700",

    textAlign: "center",

    marginRight: 10,
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

    fontWeight: "600",
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

    fontWeight: "600",
  },

  // ==========================================
  // MAIN
  // ==========================================

  main: {
    flex: 1,

    minWidth: 0,
  },

  scrollContent: {
    flexGrow: 1,

    width: "100%",

    paddingHorizontal: 38,

    paddingTop: 30,

    paddingBottom: 35,
  },

  // ==========================================
  // RESPONSIVE BACK BUTTON
  // ==========================================

  backButton: {
    alignSelf: "flex-start",

    flexDirection: "row",

    alignItems: "center",

    maxWidth: "100%",

    minHeight: 44,

    paddingVertical: 6,

    paddingRight: 12,

    marginBottom: 20,
  },

  backIconContainer: {
    width: 30,

    height: 30,

    alignItems: "center",

    justifyContent: "center",

    marginRight: 8,

    flexShrink: 0,
  },

  backIconImage: {
    width: 20,

    height: 20,

    transform: [
      {
        rotate: "180deg",
      },
    ],
  },

  backText: {
    color: COLORS.text,

    fontSize: 18,

    fontWeight: "800",

    flexShrink: 1,
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    width: "100%",

    maxWidth: 1000,

    alignSelf: "center",

    marginBottom: 25,
  },

  pageTitle: {
    color: COLORS.text,

    fontSize: 27,

    fontWeight: "800",
  },

  subtitle: {
    color: "#666666",

    fontSize: 12,

    marginTop: 5,
  },

  // ==========================================
  // MOBILE NAV
  // ==========================================

  mobileNav: {
    gap: 8,

    paddingBottom: 22,
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

    fontWeight: "600",
  },

  mobileNavTextActive: {
    color: COLORS.white,
  },

  // ==========================================
  // FORM
  // ==========================================

  formContainer: {
    width: "100%",

    maxWidth: 1000,

    alignSelf: "center",

    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "flex-start",

    gap: 18,
  },

  formCard: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 410,

    minWidth: 0,

    backgroundColor: COLORS.white,

    borderRadius: 18,

    paddingHorizontal: 28,

    paddingTop: 24,

    paddingBottom: 28,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,

      height: 2,
    },

    shadowOpacity: 0.06,

    shadowRadius: 5,

    elevation: 2,
  },

  cardTitle: {
    color: COLORS.text,

    fontSize: 20,

    fontWeight: "800",

    marginBottom: 12,
  },

  label: {
    color: "#222222",

    fontSize: 13,

    fontWeight: "500",

    marginTop: 12,

    marginBottom: 7,
  },

  input: {
    width: "100%",

    height: 46,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: "#505050",

    borderRadius: 8,

    paddingHorizontal: 14,

    color: "#222222",

    fontSize: 13,

    outlineStyle: "none",
  } as any,

  twoColumnRow: {
    width: "100%",

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 12,
  },

  flexField: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 160,

    minWidth: 0,
  },

  // ==========================================
  // STUDENT ID
  // ==========================================

  readOnlyBox: {
    width: "100%",

    height: 46,

    borderWidth: 1,

    borderColor: "#B2B5BA",

    borderRadius: 8,

    backgroundColor: "#F2F3F5",

    justifyContent: "center",

    paddingHorizontal: 14,
  },

  readOnlyText: {
    color: COLORS.text,

    fontSize: 14,

    fontWeight: "700",
  },

  note: {
    color: COLORS.muted,

    fontSize: 10,

    lineHeight: 15,

    marginTop: 6,
  },

  // ==========================================
  // STATUS
  // ==========================================

  statusCard: {
    width: "100%",

    minHeight: 82,

    borderWidth: 1,

    borderColor: "#505050",

    borderRadius: 8,

    paddingHorizontal: 18,

    marginTop: 25,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  statusLabel: {
    color: "#222222",

    fontSize: 14,

    fontWeight: "500",

    marginBottom: 6,
  },

  statusValue: {
    fontSize: 13,

    fontWeight: "800",
  },

  statusActive: {
    color: COLORS.green,
  },

  statusInactive: {
    color: COLORS.red,
  },

  switchTrack: {
    width: 48,

    height: 26,

    borderRadius: 13,

    backgroundColor: "#B8BDC5",

    padding: 3,

    justifyContent: "center",

    flexShrink: 0,
  },

  switchTrackActive: {
    backgroundColor: "#00CC58",
  },

  switchThumb: {
    width: 20,

    height: 20,

    borderRadius: 10,

    backgroundColor: COLORS.white,

    alignSelf: "flex-start",
  },

  switchThumbActive: {
    alignSelf: "flex-end",
  },

  statusExplanation: {
    color: COLORS.muted,

    fontSize: 10,

    lineHeight: 16,

    marginTop: 12,
  },

  // ==========================================
  // SECURITY
  // ==========================================

  securityBox: {
    backgroundColor: "#F4F6F9",

    borderRadius: 10,

    padding: 16,

    marginTop: 25,
  },

  securityTitle: {
    color: COLORS.text,

    fontSize: 14,

    fontWeight: "700",

    marginBottom: 5,
  },

  securityText: {
    color: "#666666",

    fontSize: 11,

    lineHeight: 17,
  },

  // ==========================================
  // ERROR
  // ==========================================

  errorBox: {
    width: "100%",

    maxWidth: 1000,

    alignSelf: "center",

    backgroundColor: "#FFEAEA",

    borderWidth: 1,

    borderColor: "#FFB5B5",

    borderRadius: 9,

    paddingHorizontal: 16,

    paddingVertical: 13,

    marginTop: 18,
  },

  errorTitle: {
    color: "#D32F2F",

    fontSize: 12,

    fontWeight: "800",

    marginBottom: 3,
  },

  errorText: {
    color: "#B42318",

    fontSize: 11,

    lineHeight: 16,
  },

  // ==========================================
  // ACTION BUTTONS
  // ==========================================

  actionRow: {
    width: "100%",

    maxWidth: 650,

    alignSelf: "center",

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 20,

    marginTop: 30,

    justifyContent: "center",
  },

  cancelButton: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 220,

    minHeight: 46,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 8,

    backgroundColor: COLORS.white,

    alignItems: "center",

    justifyContent: "center",
  },

  cancelButtonText: {
    color: "#222222",

    fontSize: 13,

    fontWeight: "700",
  },

  saveButton: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 220,

    minHeight: 46,

    backgroundColor: COLORS.green,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",
  },

  saveButtonText: {
    color: COLORS.white,

    fontSize: 13,

    fontWeight: "700",
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});
