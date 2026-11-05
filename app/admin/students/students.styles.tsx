import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",

  navyDark: "#0C2F64",

  green: "#45B94F",

  lightGreen: "#56C85C",

  red: "#FF2424",

  background: "#E8E8E8",

  white: "#FFFFFF",

  text: "#123266",

  muted: "#8C939F",

  lightBorder: "#DADDE2",

  orange: "#E59C24",

  lightOrange: "#FFF5E5",

  lightRed: "#FFF1F1",

  lightGreenBackground: "#EFFAEF",
};

export const styles = StyleSheet.create({
  // ========================================
  // SCREEN
  // ========================================

  screen: {
    flex: 1,

    backgroundColor: COLORS.background,

    flexDirection: "row",
  },

  // ==========================================
  // SIDEBAR
  // EXACTLY MATCHES FINES MODULE
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

    fontFamily: "Poppins_600SemiBold",
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

    fontFamily: "Poppins_600SemiBold",
  },

  // ========================================
  // MAIN
  // ========================================

  main: {
    flex: 1,
  },

  // Same spacing as the Fines Directory.
  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 28,

    paddingTop: 30,
    paddingBottom: 40,
  },

  header: {
    width: "100%",

    maxWidth: 1220,

    alignSelf: "center",

    marginBottom: 20,
  },

  pageTitle: {
    fontSize: 27,

    fontFamily: "Poppins_700Bold",

    color: COLORS.text,
  },

  pageSubtitle: {
    color: "#66758B",

    fontFamily: "Poppins_400Regular",

    fontSize: 13,

    marginTop: 5,
  },

  // ========================================
  // MOBILE NAV
  // ========================================

  mobileNav: {
    gap: 8,

    paddingBottom: 25,
  },

  mobileNavItem: {
    flexDirection: "row",
    alignItems: "center",
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

    fontFamily: "Poppins_600SemiBold",
  },

  mobileNavTextActive: {
    color: COLORS.white,
  },

  // ========================================
  // TOOLBAR
  // ========================================

  toolbar: {
    width: "100%",

    maxWidth: 1220,

    alignSelf: "center",

    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: 14,

    marginBottom: 18,

    zIndex: 100,
  },

  searchContainer: {
    flexGrow: 1,

    flexBasis: 300,

    maxWidth: 420,

    minHeight: 48,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 12,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 14,
  },

  searchIcon: {
    color: "#222222",

    fontFamily: "Poppins_400Regular",
    fontSize: 27,

    marginRight: 10,

    marginTop: -4,
  },

  searchInput: {
    flex: 1,

    fontFamily: "Poppins_400Regular",

    fontSize: 14,

    color: "#333333",

    outlineStyle: "none",
  } as any,

  searchClear: {
    color: COLORS.muted,

    fontSize: 14,

    fontFamily: "Poppins_700Bold",

    paddingLeft: 8,
  },

  // ========================================
  // FILTERS
  // ========================================

  filtersContainer: {
    flexDirection: "row",

    gap: 12,

    zIndex: 200,
  },

  filterWrapper: {
    position: "relative",

    zIndex: 300,
  },

  filterButton: {
    minWidth: 135,

    maxWidth: 220,

    height: 46,

    paddingHorizontal: 14,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 11,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  // A chosen grade or section stands out from the defaults.
  filterButtonActive: {
    backgroundColor: "#EDF3FA",

    borderWidth: 2,
  },

  filterText: {
    flexShrink: 1,

    color: "#333333",

    fontFamily: "Poppins_600SemiBold",

    fontSize: 13,

    marginRight: 12,
  },

  filterArrow: {
    color: "#111111",

    fontFamily: "Poppins_400Regular",
    fontSize: 10,
  },

  filterMenu: {
    position: "absolute",

    top: 50,

    left: 0,

    minWidth: 170,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: "#C5CAD2",

    borderRadius: 8,

    overflow: "hidden",

    zIndex: 1000,

    elevation: 10,

    shadowColor: "#000000",

    shadowOpacity: 0.12,

    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  // Long section lists scroll inside the menu.
  filterMenuScroll: {
    maxHeight: 280,
  },

  filterOption: {
    paddingHorizontal: 14,

    paddingVertical: 12,

    borderBottomWidth: 1,

    borderBottomColor: "#EEEEEE",
  },

  filterOptionActive: {
    backgroundColor: "#EDF3FA",
  },

  filterOptionText: {
    color: "#333333",

    fontFamily: "Poppins_400Regular",

    fontSize: 12,
  },

  // ========================================
  // ACTIONS
  // ========================================

  // Shrinks to the screen width so the buttons wrap on phones.
  actionButtons: {
    marginLeft: "auto",

    flexShrink: 1,

    maxWidth: "100%",

    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: 10,
  },

  importButton: {
    minHeight: 46,

    backgroundColor: COLORS.navy,

    borderRadius: 8,

    paddingHorizontal: 20,

    alignItems: "center",

    justifyContent: "center",
  },

  importButtonText: {
    color: COLORS.white,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 12,
  },

  addButton: {
    minHeight: 46,

    backgroundColor: COLORS.green,

    borderRadius: 8,

    paddingHorizontal: 22,

    alignItems: "center",

    justifyContent: "center",
  },

  addButtonText: {
    color: COLORS.white,

    fontFamily: "Poppins_700Bold",

    fontSize: 13,
  },

  // ========================================
  // DIRECTORY CARD
  // ========================================

  tableCard: {
    width: "100%",

    maxWidth: 1220,

    minHeight: 470,

    alignSelf: "center",

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: "#DFE5EC",

    borderRadius: 14,

    overflow: "hidden",
  },

  tableIntro: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "space-between",

    alignItems: "center",

    gap: 10,

    paddingHorizontal: 18,

    paddingTop: 16,

    paddingBottom: 10,
  },

  tableIntroText: {
    flexShrink: 1,
  },

  tableIntroTitle: {
    color: COLORS.navy,

    fontSize: 16,

    fontFamily: "Poppins_700Bold",
  },

  tableIntroSubtitle: {
    color: "#6B7788",

    fontFamily: "Poppins_400Regular",

    fontSize: 11,

    marginTop: 3,
  },

  tableIntroActions: {
    flexDirection: "row",

    alignItems: "center",

    gap: 12,

    marginLeft: "auto",
  },

  clearFiltersText: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 12,

    textDecorationLine: "underline",
  },

  resultCount: {
    color: COLORS.navy,

    fontSize: 11,

    fontFamily: "Poppins_700Bold",

    backgroundColor: "#EDF3FA",

    borderRadius: 20,

    overflow: "hidden",

    paddingHorizontal: 10,

    paddingVertical: 5,
  },

  // ========================================
  // VIEW CHIPS
  // ========================================

  viewChips: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,

    paddingHorizontal: 18,

    paddingBottom: 14,
  },

  viewChip: {
    paddingHorizontal: 13,

    paddingVertical: 7,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#D3D7DD",

    backgroundColor: COLORS.white,
  },

  viewChipActive: {
    backgroundColor: COLORS.navy,

    borderColor: COLORS.navy,
  },

  viewChipText: {
    color: COLORS.navy,

    fontSize: 11,

    fontFamily: "Poppins_700Bold",
  },

  viewChipTextActive: {
    color: COLORS.white,
  },

  refreshError: {
    marginHorizontal: 18,

    marginBottom: 12,

    color: "#9A5B00",

    backgroundColor: COLORS.lightOrange,

    borderRadius: 8,

    overflow: "hidden",

    paddingHorizontal: 12,

    paddingVertical: 8,

    fontFamily: "Poppins_400Regular",

    fontSize: 12,
  },

  // ========================================
  // WIDE TABLE
  // ========================================

  // Fills the card on wide screens; scrolls sideways only if squeezed.
  tableScrollContent: {
    flexGrow: 1,
  },

  table: {
    flex: 1,

    minWidth: 700,
  },

  tableHeader: {
    minHeight: 50,

    marginHorizontal: 10,

    backgroundColor: COLORS.navy,

    flexDirection: "row",

    alignItems: "center",

    borderRadius: 10,
  },

  headerCell: {
    color: COLORS.white,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 13,

    paddingHorizontal: 8,
  },

  selectColumn: {
    width: 42,

    alignItems: "center",

    justifyContent: "center",
  },

  nameColumn: {
    flex: 2.4,
  },

  gradeSectionColumn: {
    flex: 1.5,
  },

  moneyColumn: {
    flex: 1,

    textAlign: "right",
  },

  statusColumn: {
    width: 110,

    alignItems: "center",

    textAlign: "center",
  },

  chevronColumn: {
    width: 26,
  },

  studentRow: {
    minHeight: 64,

    marginHorizontal: 10,

    marginTop: 10,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: "#D7DEE8",

    borderRadius: 10,

    flexDirection: "row",

    alignItems: "center",

    overflow: "hidden",
  },

  studentRowSelected: {
    borderColor: COLORS.red,

    borderWidth: 2,

    backgroundColor: "#FFF8F8",
  },

  rowMain: {
    flex: 1,

    minHeight: 62,

    flexDirection: "row",

    alignItems: "center",
  },

  bodyCell: {
    color: "#444444",

    fontFamily: "Poppins_400Regular",

    fontSize: 13,

    paddingHorizontal: 8,
  },

  mutedCell: {
    color: COLORS.muted,

    fontStyle: "italic",
  },

  studentCell: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    paddingHorizontal: 8,

    paddingVertical: 10,
  },

  studentText: {
    flex: 1,

    minWidth: 0,
  },

  studentName: {
    color: "#333333",

    fontFamily: "Poppins_600SemiBold",

    fontSize: 13,
  },

  studentMeta: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",

    fontSize: 11,

    marginTop: 2,
  },

  rowChevron: {
    color: "#A0AAB8",

    fontSize: 20,

    fontFamily: "Poppins_700Bold",

    textAlign: "center",
  },

  // ========================================
  // AVATAR
  // ========================================

  avatar: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: "#E6F0FC",

    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",
  },

  avatarText: {
    color: COLORS.navy,

    fontFamily: "Poppins_700Bold",

    fontSize: 13,
  },

  // ========================================
  // STATUS CHIPS
  // ========================================

  statusChip: {
    alignSelf: "center",

    paddingHorizontal: 10,

    paddingVertical: 4,

    borderRadius: 20,
  },

  statusChipActive: {
    backgroundColor: "#E7F8EA",
  },

  statusChipInactive: {
    backgroundColor: "#FFEAEA",
  },

  statusChipOther: {
    backgroundColor: "#ECEFF4",
  },

  statusChipText: {
    fontFamily: "Poppins_700Bold",

    fontSize: 11,
  },

  statusChipTextActive: {
    color: "#2E9D43",
  },

  statusChipTextInactive: {
    color: "#D32F2F",
  },

  statusChipTextOther: {
    color: "#606775",
  },

  // ========================================
  // COMPACT LIST (phones, portrait tablets)
  // ========================================

  compactList: {
    paddingHorizontal: 10,

    gap: 10,
  },

  compactRow: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: "#D7DEE8",

    borderRadius: 10,

    paddingLeft: 10,

    overflow: "hidden",
  },

  compactSelectSlot: {
    width: 30,

    alignItems: "flex-start",

    justifyContent: "center",
  },

  compactMain: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    paddingVertical: 12,

    paddingRight: 8,
  },

  compactText: {
    flex: 1,

    minWidth: 0,
  },

  compactTitleRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 8,
  },

  compactName: {
    flexShrink: 1,
  },

  compactMoney: {
    color: "#5E6776",

    fontFamily: "Poppins_400Regular",

    fontSize: 12,

    marginTop: 4,
  },

  // ========================================
  // MULTI-SELECT CIRCLE
  // ========================================

  selectCircle: {
    width: 21,

    height: 21,

    borderRadius: 11,

    borderWidth: 2,

    borderColor: COLORS.red,

    backgroundColor: COLORS.white,
  },

  // Selected = solid circle, no checkmark
  selectCircleSelected: {
    borderColor: COLORS.red,

    backgroundColor: COLORS.red,
  },

  balanceDanger: {
    color: COLORS.red,

    fontFamily: "Poppins_700Bold",
  },

  balanceZero: {
    color: "#666666",
  },

  // ========================================
  // TABLE FOOTER
  // ========================================

  tableFooter: {
    marginTop: "auto",

    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 15,

    paddingHorizontal: 20,

    paddingTop: 22,

    paddingBottom: 10,
  },

  footerInfo: {
    flexShrink: 1,

    gap: 5,
  },

  totalStudentsText: {
    color: "#666666",

    fontFamily: "Poppins_500Medium",

    fontSize: 13,
  },

  selectionRow: {
    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: 12,
  },

  selectedStudentText: {
    color: COLORS.red,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 11,
  },

  clearSelectionText: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 11,

    textDecorationLine: "underline",
  },

  deleteButton: {
    minWidth: 180,

    minHeight: 45,

    backgroundColor: COLORS.red,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 20,
  },

  deleteButtonDisabled: {
    opacity: 0.45,
  },

  deleteButtonText: {
    color: COLORS.white,

    fontFamily: "Poppins_700Bold",

    fontSize: 12,
  },

  deleteHint: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",

    fontSize: 10,

    textAlign: "right",

    paddingHorizontal: 20,

    paddingBottom: 18,
  },

  // ========================================
  // STATES
  // ========================================

  centerState: {
    minHeight: 400,

    alignItems: "center",

    justifyContent: "center",

    padding: 30,
  },

  stateText: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",

    marginTop: 14,

    fontSize: 13,
  },

  errorText: {
    color: COLORS.red,

    fontFamily: "Poppins_400Regular",

    fontSize: 13,

    textAlign: "center",

    marginBottom: 18,
  },

  retryButton: {
    backgroundColor: COLORS.navy,

    paddingHorizontal: 20,

    paddingVertical: 10,

    borderRadius: 7,
  },

  retryText: {
    color: COLORS.white,

    fontFamily: "Poppins_700Bold",
  },

  emptyState: {
    minHeight: 260,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 24,
  },

  emptyTitle: {
    color: COLORS.navy,

    fontSize: 18,

    fontFamily: "Poppins_700Bold",

    textAlign: "center",
  },

  emptyText: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",

    fontSize: 13,

    marginTop: 7,

    textAlign: "center",
  },

  // "Show all students" when filters leave the list empty.
  emptyResetButton: {
    marginTop: 16,

    minHeight: 40,

    paddingHorizontal: 20,

    borderRadius: 8,

    backgroundColor: COLORS.navy,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyResetText: {
    color: COLORS.white,

    fontSize: 12,

    fontFamily: "Poppins_700Bold",
  },

  // ========================================
  // IMPORT OVERLAY
  // ========================================

  importOverlay: {
    flex: 1,

    backgroundColor: "rgba(7, 24, 49, 0.62)",

    alignItems: "center",

    justifyContent: "center",

    padding: 18,
  },

  importModal: {
    width: "100%",

    maxWidth: 1000,

    maxHeight: "92%",

    backgroundColor: "#F7F8FA",

    borderRadius: 18,

    overflow: "hidden",

    elevation: 12,
  },

  importModalContent: {
    padding: 24,

    paddingBottom: 30,
  },

  importHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: 20,

    marginBottom: 22,
  },

  importHeaderText: {
    flex: 1,
  },

  importTitle: {
    color: COLORS.text,

    fontFamily: "Poppins_700Bold",

    fontSize: 24,
  },

  importSubtitle: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",

    fontSize: 12,

    lineHeight: 19,

    marginTop: 5,
  },

  importCloseButton: {
    width: 36,

    height: 36,

    borderRadius: 18,

    backgroundColor: "#E8EBF0",

    alignItems: "center",

    justifyContent: "center",
  },

  importCloseText: {
    color: COLORS.navy,

    fontFamily: "Poppins_400Regular",
    fontSize: 25,

    lineHeight: 28,
  },

  // ========================================
  // IMPORT CARDS
  // ========================================

  importSectionCard: {
    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.lightBorder,

    borderRadius: 12,

    padding: 18,

    marginBottom: 18,
  },

  importSectionTitle: {
    color: COLORS.text,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 15,

    marginBottom: 14,
  },

  importFieldsRow: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 14,
  },

  importField: {
    flexGrow: 1,

    flexBasis: 210,

    minWidth: 190,
  },

  importLabel: {
    color: COLORS.text,

    fontFamily: "Poppins_500Medium",

    fontSize: 11,

    marginBottom: 7,
  },

  importSelect: {
    minHeight: 44,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: "#BCC5D1",

    borderRadius: 8,

    paddingHorizontal: 12,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  importSelectText: {
    color: "#333333",

    fontFamily: "Poppins_400Regular",

    fontSize: 12,
  },

  importPlaceholder: {
    color: COLORS.muted,
  },

  importSelectArrow: {
    color: COLORS.navy,

    fontFamily: "Poppins_400Regular",
    fontSize: 9,
  },

  importMenu: {
    marginTop: 5,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: "#C8CDD5",

    borderRadius: 8,

    overflow: "hidden",
  },

  importMenuOption: {
    paddingHorizontal: 12,

    paddingVertical: 10,

    borderBottomWidth: 1,

    borderBottomColor: "#EEEEEE",
  },

  importMenuOptionText: {
    color: "#333333",

    fontFamily: "Poppins_400Regular",

    fontSize: 11,
  },

  importTextInput: {
    minHeight: 44,

    borderWidth: 1,

    borderColor: "#BCC5D1",

    backgroundColor: COLORS.white,

    borderRadius: 8,

    paddingHorizontal: 12,

    color: "#333333",

    fontFamily: "Poppins_400Regular",

    fontSize: 12,

    outlineStyle: "none",
  } as any,

  classPreview: {
    marginTop: 15,

    backgroundColor: "#EEF3FA",

    borderRadius: 8,

    paddingHorizontal: 14,

    paddingVertical: 11,
  },

  classPreviewLabel: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",

    fontSize: 10,
  },

  classPreviewValue: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 13,

    marginTop: 2,
  },

  // ========================================
  // CSV GUIDE
  // ========================================

  csvGuide: {
    backgroundColor: "#EDF3FB",

    borderWidth: 1,

    borderColor: "#CBD9EB",

    borderRadius: 12,

    padding: 16,

    marginBottom: 18,
  },

  csvGuideHeader: {
    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 14,

    marginBottom: 12,
  },

  csvGuideHeaderText: {
    flex: 1,

    minWidth: 260,
  },

  csvGuideTitle: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 13,
  },

  csvGuideDescription: {
    color: "#526275",

    fontFamily: "Poppins_400Regular",

    fontSize: 10,

    lineHeight: 16,

    marginTop: 5,
  },

  csvColumnLabel: {
    color: COLORS.text,

    fontFamily: "Poppins_500Medium",

    fontSize: 9,

    marginBottom: 6,
  },

  csvCode: {
    backgroundColor: COLORS.white,

    color: COLORS.navyDark,

    fontFamily: "Poppins_500Medium",

    fontSize: 10,

    paddingHorizontal: 10,

    paddingVertical: 8,

    borderRadius: 6,
  },

  csvGuideNote: {
    color: "#59687A",

    fontFamily: "Poppins_400Regular",

    fontSize: 9,

    lineHeight: 15,

    marginTop: 9,
  },

  downloadTemplateButton: {
    minHeight: 40,

    paddingHorizontal: 15,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 8,

    backgroundColor: COLORS.white,

    alignItems: "center",

    justifyContent: "center",
  },

  downloadTemplateButtonDisabled: {
    opacity: 0.55,
  },

  downloadTemplateText: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 10,
  },

  templateInstructions: {
    marginTop: 12,

    backgroundColor: COLORS.white,

    borderRadius: 8,

    paddingHorizontal: 12,

    paddingVertical: 10,
  },

  templateInstructionTitle: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 10,

    marginBottom: 6,
  },

  templateInstructionText: {
    color: "#536277",

    fontFamily: "Poppins_400Regular",

    fontSize: 9,

    lineHeight: 15,

    marginBottom: 2,
  },

  // ========================================
  // FILE PICKER
  // ========================================

  fileHelperText: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",

    fontSize: 10,

    lineHeight: 15,

    marginTop: -7,

    marginBottom: 12,
  },

  chooseFileButton: {
    alignSelf: "flex-start",

    minHeight: 42,

    backgroundColor: COLORS.navy,

    borderRadius: 8,

    paddingHorizontal: 18,

    alignItems: "center",

    justifyContent: "center",
  },

  chooseFileText: {
    color: COLORS.white,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 11,
  },

  selectedFile: {
    marginTop: 13,

    backgroundColor: "#F3F5F8",

    borderRadius: 8,

    paddingHorizontal: 12,

    paddingVertical: 10,
  },

  selectedFileLabel: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",

    fontSize: 9,
  },

  selectedFileName: {
    color: COLORS.text,

    fontFamily: "Poppins_500Medium",

    fontSize: 11,

    marginTop: 2,
  },

  importErrorBox: {
    marginTop: 12,

    backgroundColor: COLORS.lightRed,

    borderWidth: 1,

    borderColor: "#E8A7A7",

    borderRadius: 8,

    padding: 11,
  },

  importErrorText: {
    color: "#B42318",

    fontFamily: "Poppins_400Regular",

    fontSize: 10,

    lineHeight: 16,
  },

  // ========================================
  // PREVIEW SUMMARY
  // ========================================

  previewHeading: {
    color: COLORS.text,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 16,

    marginBottom: 12,
  },

  importSummary: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 10,

    marginBottom: 16,
  },

  summaryCard: {
    flexGrow: 1,

    flexBasis: 140,

    minWidth: 120,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.lightBorder,

    borderRadius: 10,

    paddingHorizontal: 14,

    paddingVertical: 12,
  },

  summaryValidCard: {
    backgroundColor: COLORS.lightGreenBackground,

    borderColor: "#B9DFBB",
  },

  summaryDuplicateCard: {
    backgroundColor: COLORS.lightOrange,

    borderColor: "#F0C987",
  },

  summaryInvalidCard: {
    backgroundColor: COLORS.lightRed,

    borderColor: "#EAB0B0",
  },

  summaryNumber: {
    color: COLORS.text,

    fontFamily: "Poppins_700Bold",

    fontSize: 22,
  },

  summaryValidText: {
    color: "#278A31",
  },

  summaryDuplicateText: {
    color: "#A56709",
  },

  summaryInvalidText: {
    color: "#B42318",
  },

  summaryLabel: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",

    fontSize: 9,

    marginTop: 1,
  },

  // ========================================
  // PREVIEW TABLE
  // ========================================

  previewCard: {
    width: "100%",

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.lightBorder,

    borderRadius: 12,

    overflow: "hidden",

    marginBottom: 16,
  },

  previewTable: {
    width: "100%",

    minWidth: 1100,
  },

  previewTableHeader: {
    width: "100%",

    minHeight: 50,

    backgroundColor: COLORS.navy,

    flexDirection: "row",

    alignItems: "center",
  },

  previewHeaderText: {
    color: COLORS.white,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 10,

    paddingHorizontal: 14,
  },

  previewTableRow: {
    width: "100%",

    minHeight: 72,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: COLORS.white,

    borderBottomWidth: 1,

    borderBottomColor: "#E4E8EE",
  },

  previewCell: {
    color: "#3E4651",

    fontFamily: "Poppins_400Regular",

    fontSize: 10,

    paddingHorizontal: 14,
  },

  previewRowNumberColumn: {
    width: 70,
  },

  previewStudentNumberColumn: {
    width: 160,
  },

  previewNameColumn: {
    width: 250,
  },

  previewEmailColumn: {
    width: 260,
  },

  previewContactColumn: {
    width: 190,
  },

  previewStatusColumn: {
    flex: 1,

    minWidth: 220,

    paddingHorizontal: 14,

    justifyContent: "center",
  },

  previewStatusBadge: {
    alignSelf: "flex-start",

    borderRadius: 14,

    paddingHorizontal: 10,

    paddingVertical: 5,
  },

  previewValidBadge: {
    backgroundColor: "#E6F7E8",
  },

  previewDuplicateBadge: {
    backgroundColor: "#FFF0D5",
  },

  previewInvalidBadge: {
    backgroundColor: "#FFE5E5",
  },

  previewStatusText: {
    fontFamily: "Poppins_600SemiBold",

    fontSize: 8,
  },

  previewValidText: {
    color: "#278A31",
  },

  previewDuplicateText: {
    color: "#A56709",
  },

  previewInvalidText: {
    color: "#B42318",
  },

  previewIssues: {
    color: COLORS.muted,

    fontFamily: "Poppins_400Regular",

    fontSize: 8,

    lineHeight: 12,

    marginTop: 5,
  },

  // ========================================
  // ACCOUNT NOTICE
  // ========================================

  defaultAccountNotice: {
    backgroundColor: "#EEF4FB",

    borderRadius: 10,

    paddingHorizontal: 14,

    paddingVertical: 12,

    marginBottom: 18,
  },

  defaultAccountTitle: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 11,
  },

  defaultAccountText: {
    color: "#536277",

    fontFamily: "Poppins_400Regular",

    fontSize: 9,

    lineHeight: 17,

    marginTop: 3,
  },

  defaultPasswordText: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",
  },

  // ========================================
  // IMPORT BLOCKED
  // ========================================

  importBlockedNotice: {
    backgroundColor: "#FFF3F3",

    borderWidth: 1,

    borderColor: "#F3B0B0",

    borderRadius: 10,

    paddingHorizontal: 14,

    paddingVertical: 12,

    marginBottom: 18,
  },

  importBlockedTitle: {
    color: "#B42318",

    fontFamily: "Poppins_600SemiBold",

    fontSize: 11,
  },

  importBlockedText: {
    color: "#805050",

    fontFamily: "Poppins_400Regular",

    fontSize: 9,

    lineHeight: 15,

    marginTop: 3,
  },

  // ========================================
  // IMPORT FOOTER
  // ========================================

  importFooter: {
    flexDirection: "row",

    justifyContent: "flex-end",

    flexWrap: "wrap",

    gap: 10,

    marginTop: 4,
  },

  importCancelButton: {
    minWidth: 120,

    minHeight: 44,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 18,
  },

  importCancelText: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 11,
  },

  importContinueButton: {
    minWidth: 190,

    minHeight: 44,

    backgroundColor: COLORS.green,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 18,
  },

  importContinueButtonDisabled: {
    opacity: 0.4,
  },

  importContinueText: {
    color: COLORS.white,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 11,
  },

  importButtonLoadingContent: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 9,
  },

  // ========================================
  // IMPORT CONFIRMATION
  // ========================================

  confirmOverlay: {
    flex: 1,

    backgroundColor: "rgba(7, 24, 49, 0.66)",

    alignItems: "center",

    justifyContent: "center",

    padding: 20,
  },

  confirmModal: {
    width: "100%",

    maxWidth: 480,

    backgroundColor: COLORS.white,

    borderRadius: 18,

    paddingHorizontal: 30,

    paddingVertical: 28,

    alignItems: "center",

    elevation: 20,
  },

  confirmIcon: {
    width: 74,

    height: 74,

    borderRadius: 37,

    borderWidth: 2,

    borderColor: COLORS.green,

    backgroundColor: "#EFFAEF",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 17,
  },

  // ========================================
  // CUSTOM IMPORT PNG
  // ========================================

  confirmIconImage: {
    width: 38,

    height: 38,
  },

  confirmTitle: {
    color: COLORS.navy,

    fontFamily: "Poppins_700Bold",

    fontSize: 24,

    textAlign: "center",
  },

  confirmMessage: {
    maxWidth: 390,

    color: "#66738A",

    fontFamily: "Poppins_400Regular",

    fontSize: 12,

    lineHeight: 20,

    textAlign: "center",

    marginTop: 10,
  },

  confirmClass: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 14,

    textAlign: "center",

    marginTop: 7,
  },

  confirmAccountBox: {
    width: "100%",

    marginTop: 18,

    backgroundColor: "#EEF4FB",

    borderRadius: 10,

    paddingHorizontal: 16,

    paddingVertical: 13,
  },

  confirmAccountText: {
    color: "#536277",

    fontFamily: "Poppins_400Regular",

    fontSize: 10,

    lineHeight: 18,
  },

  confirmWarning: {
    color: "#7E8897",

    fontFamily: "Poppins_400Regular",

    fontSize: 9,

    lineHeight: 15,

    textAlign: "center",

    marginTop: 14,
  },

  confirmActions: {
    width: "100%",

    flexDirection: "row",

    justifyContent: "center",

    gap: 10,

    marginTop: 22,
  },

  confirmCancelButton: {
    flex: 1,

    minHeight: 44,

    borderWidth: 1,

    borderColor: COLORS.navy,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",
  },

  confirmCancelText: {
    color: COLORS.navy,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 11,
  },

  confirmImportButton: {
    flex: 1,

    minHeight: 44,

    backgroundColor: COLORS.green,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",
  },

  confirmImportText: {
    color: COLORS.white,

    fontFamily: "Poppins_600SemiBold",

    fontSize: 11,
  },

  confirmDisabled: {
    opacity: 0.5,
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function StudentsStylesRoute() {
  return null;
}
