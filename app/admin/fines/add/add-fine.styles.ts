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

  loadingScreen: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 14,

    color: COLORS.muted,

    fontSize: 13,
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

    paddingBottom: 40,
  },

  scrollContentCompact: {
    paddingHorizontal: 16,

    paddingTop: 18,

    paddingBottom: 30,
  },

  // ==========================================
  // BACK / TITLE
  // ==========================================

  backButton: {
    width: "100%",

    maxWidth: 1000,

    alignSelf: "center",

    flexDirection: "row",

    alignItems: "center",

    minHeight: 44,

    marginBottom: 35,
  },

  backIconImage: {
    width: 22,

    height: 22,

    marginRight: 10,

    flexShrink: 0,

    transform: [
      {
        rotate: "180deg",
      },
    ],
  },

  backText: {
    color: COLORS.text,

    fontSize: 20,

    fontWeight: "800",

    flexShrink: 1,
  },

  backTextCompact: {
    fontSize: 18,
  },

  // ==========================================
  // MOBILE NAV
  // ==========================================

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

    fontWeight: "600",
  },

  mobileNavTextActive: {
    color: COLORS.white,
  },

  // ==========================================
  // FORM CARD
  // ==========================================

  formCard: {
    width: "100%",

    maxWidth: 1000,

    minHeight: 470,

    alignSelf: "center",

    backgroundColor: COLORS.white,

    borderRadius: 16,

    paddingHorizontal: 30,

    paddingTop: 20,

    paddingBottom: 30,

    overflow: "visible",
  },

  cardTitle: {
    color: COLORS.text,

    fontSize: 20,

    fontWeight: "800",

    marginBottom: 22,
  },

  // ==========================================
  // FORM ROWS
  // ==========================================

  formRow: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 25,

    marginBottom: 22,

    position: "relative",
  },

  formRowTop: {
    zIndex: 500,
  },

  formRowMiddle: {
    zIndex: 400,
  },

  formRowBottom: {
    zIndex: 300,
  },

  fieldGroup: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 300,

    minWidth: 0,

    position: "relative",
  },

  label: {
    color: "#202020",

    fontSize: 13,

    fontWeight: "500",

    marginBottom: 8,
  },

  input: {
    width: "100%",

    height: 46,

    borderWidth: 1,

    borderColor: "#333333",

    borderRadius: 7,

    backgroundColor: COLORS.white,

    paddingHorizontal: 15,

    fontSize: 13,

    color: "#222222",

    outlineStyle: "none",
  } as any,

  searchField: {
    width: "100%",

    height: 46,

    borderWidth: 1,

    borderColor: "#333333",

    borderRadius: 7,

    backgroundColor: COLORS.white,

    justifyContent: "center",
  },

  searchInput: {
    flex: 1,

    height: "100%",

    paddingHorizontal: 15,

    fontSize: 13,

    color: "#222222",

    outlineStyle: "none",
  } as any,

  suggestionMenu: {
    position: "absolute",

    top: 72,

    left: 0,

    right: 0,

    maxHeight: 260,

    backgroundColor: COLORS.white,

    borderWidth: 1.5,

    borderColor: COLORS.navy,

    borderRadius: 8,

    overflow: "hidden",

    zIndex: 9999,

    elevation: 30,

    shadowColor: "#000000",

    shadowOpacity: 0.2,

    shadowRadius: 10,

    shadowOffset: {
      width: 0,

      height: 5,
    },
  },

  suggestionScroll: {
    maxHeight: 260,
  },

  suggestionItem: {
    minHeight: 58,

    backgroundColor: COLORS.white,

    justifyContent: "center",

    paddingHorizontal: 15,

    paddingVertical: 10,

    borderBottomWidth: 1,

    borderBottomColor: "#E0E2E5",
  },

  suggestionTitle: {
    color: COLORS.text,

    fontSize: 13,

    fontWeight: "700",
  },

  suggestionSubtitle: {
    color: "#737B88",

    fontSize: 10,

    marginTop: 4,
  },

  selectButton: {
    width: "100%",

    height: 46,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: "#333333",

    borderRadius: 7,

    paddingHorizontal: 14,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 10,
  },

  selectText: {
    flex: 1,

    color: "#222222",

    fontSize: 13,

    fontWeight: "500",
  },

  placeholderText: {
    color: COLORS.muted,
  },

  selectArrow: {
    color: "#111111",

    fontSize: 12,

    fontWeight: "800",
  },

  dropdownMenu: {
    position: "absolute",

    top: 72,

    left: 0,

    right: 0,

    maxHeight: 260,

    backgroundColor: COLORS.white,

    borderWidth: 1.5,

    borderColor: COLORS.navy,

    borderRadius: 8,

    overflow: "hidden",

    zIndex: 9999,

    elevation: 30,

    shadowColor: "#000000",

    shadowOpacity: 0.2,

    shadowRadius: 10,

    shadowOffset: {
      width: 0,

      height: 5,
    },
  },

  dropdownScroll: {
    maxHeight: 260,
  },

  dropdownItem: {
    minHeight: 58,

    backgroundColor: COLORS.white,

    justifyContent: "center",

    paddingHorizontal: 15,

    paddingVertical: 10,

    borderBottomWidth: 1,

    borderBottomColor: "#E0E2E5",
  },

  dropdownTitle: {
    color: COLORS.text,

    fontSize: 13,

    fontWeight: "700",
  },

  dropdownSubtitle: {
    color: "#737B88",

    fontSize: 10,

    marginTop: 4,
  },

  emptyOption: {
    minHeight: 60,

    justifyContent: "center",

    paddingHorizontal: 15,

    backgroundColor: COLORS.white,
  },

  emptyOptionText: {
    color: COLORS.muted,

    fontSize: 11,

    textAlign: "center",
  },

  amountBox: {
    width: "100%",

    height: 46,

    borderWidth: 1,

    borderColor: "#333333",

    borderRadius: 7,

    backgroundColor: COLORS.white,

    alignItems: "center",

    justifyContent: "center",
  },

  amountText: {
    color: COLORS.navy,

    fontSize: 13,

    fontWeight: "800",
  },

  errorBox: {
    width: "100%",

    backgroundColor: "#FFEAEA",

    borderWidth: 1,

    borderColor: "#FF8B8B",

    borderRadius: 8,

    paddingHorizontal: 15,

    paddingVertical: 11,

    marginBottom: 18,
  },

  errorTitle: {
    color: COLORS.red,

    fontSize: 12,

    fontWeight: "800",

    marginBottom: 3,
  },

  errorText: {
    color: "#D32F2F",

    fontSize: 11,
  },

  actionRow: {
    marginTop: 50,

    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "center",

    gap: 22,
  },

  cancelButton: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 200,

    maxWidth: 230,

    minHeight: 45,

    backgroundColor: "#E0E0E0",

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",
  },

  cancelButtonText: {
    color: "#111111",

    fontSize: 13,

    fontWeight: "700",
  },

  saveButton: {
    flexGrow: 1,

    flexShrink: 1,

    flexBasis: 200,

    maxWidth: 230,

    minHeight: 45,

    backgroundColor: "#0AC62E",

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",
  },

  saveButtonText: {
    color: COLORS.white,

    fontSize: 13,

    fontWeight: "800",
  },

  buttonDisabled: {
    opacity: 0.55,
  },
});
