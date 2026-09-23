import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // ========================================
  // SCREEN
  // ========================================

  screen: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#E8E8E8",
  },

  // ========================================
  // SIDEBAR
  // ========================================

  sidebar: {
    width: 220,
    minHeight: "100%",
    backgroundColor: "#173A73",
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
    backgroundColor: "#56C85C",
  },

  navIcon: {
    width: 28,
    color: "#FFFFFF",
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
    color: "#FFFFFF",
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
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // ========================================
  // MAIN
  // ========================================

  main: {
    flex: 1,
    backgroundColor: "#E8E8E8",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 42,
    paddingTop: 32,
    paddingBottom: 50,
  },

  // ========================================
  // MOBILE NAV
  // ========================================

  mobileNav: {
    gap: 8,
    paddingBottom: 22,
  },

  mobileNavItem: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D3D7DD",
  },

  mobileNavItemActive: {
    backgroundColor: "#56C85C",
    borderColor: "#56C85C",
  },

  mobileNavText: {
    color: "#173A73",
    fontSize: 12,
    fontWeight: "700",
  },

  mobileNavTextActive: {
    color: "#FFFFFF",
  },

  // ========================================
  // PAGE HEADER
  // ========================================

  pageHeader: {
    marginBottom: 28,
  },

  pageTitle: {
    color: "#123266",
    fontSize: 26,
    fontWeight: "800",
  },

  pageSubtitle: {
    color: "#7E8794",
    fontSize: 11,
    marginTop: 5,
  },

  // ========================================
  // SETTINGS LAYOUT
  // ========================================

  settingsLayout: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 28,
  },

  settingsLayoutStacked: {
    flexDirection: "column",
  },

  // ========================================
  // PROFILE CARD
  // ========================================

  profileCard: {
    width: 320,
    minHeight: 485,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 30,
    alignItems: "center",
  },

  profileCardStacked: {
    width: "100%",
    minHeight: 0,
  },

  avatarWrapper: {
    width: 132,
    height: 132,
    position: "relative",
    marginBottom: 17,
  },

  avatar: {
    width: 132,
    height: 132,
    borderRadius: 40,
    backgroundColor: "#E8ECF2",
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#173A73",
  },

  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
  },

  cameraButton: {
    position: "absolute",
    right: -4,
    bottom: -3,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#A8BEE1",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraIcon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  profileName: {
    color: "#123266",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  profileRole: {
    color: "#51698A",
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
  },

  profileUsername: {
    color: "#8C939F",
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
  },

  profileDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E3E6EA",
    marginVertical: 24,
  },

  profileInfoBlock: {
    width: "100%",
    marginBottom: 17,
    alignItems: "center",
  },

  profileInfoLabel: {
    color: "#9299A3",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 5,
  },

  profileInfoValue: {
    color: "#525861",
    fontSize: 12,
    textAlign: "center",
  },

  photoActions: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 6,
  },

  changePhotoButton: {
    minHeight: 38,
    flexGrow: 1,
    borderRadius: 7,
    backgroundColor: "#173A73",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  changePhotoButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  removePhotoButton: {
    minHeight: 38,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#D32F2F",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  removePhotoButtonText: {
    color: "#D32F2F",
    fontSize: 10,
    fontWeight: "700",
  },

  photoHint: {
    color: "#9A9FA8",
    fontSize: 8,
    marginTop: 9,
    textAlign: "center",
  },

  // ========================================
  // RIGHT COLUMN
  // ========================================

  rightColumn: {
    flex: 1,
    width: "100%",
    gap: 26,
  },

  sectionTitle: {
    color: "#123266",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 14,
    marginBottom: 9,
  },

  settingsCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  // ========================================
  // FORM
  // ========================================

  formRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 18,
  },

  formField: {
    flex: 1,
    minWidth: 220,
  },

  inputLabel: {
    color: "#3F434A",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
  },

  input: {
    width: "100%",
    height: 43,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 7,
    backgroundColor: "#F5F7FA",
    color: "#333840",
    fontSize: 11,
    paddingHorizontal: 13,
  },

  readOnlyInput: {
    justifyContent: "center",
    backgroundColor: "#ECEFF3",
  },

  readOnlyText: {
    color: "#7E8794",
    fontSize: 11,
  },

  cardActionRow: {
    alignItems: "flex-end",
    marginTop: 2,
  },

  // ========================================
  // BUTTONS
  // ========================================

  primaryButton: {
    minWidth: 155,
    height: 40,
    borderRadius: 7,
    backgroundColor: "#173A73",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  secondaryButton: {
    minWidth: 135,
    height: 40,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#173A73",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 17,
  },

  secondaryButtonText: {
    color: "#173A73",
    fontSize: 10,
    fontWeight: "800",
  },

  cancelButton: {
    minWidth: 90,
    height: 40,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#C8CDD5",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },

  cancelButtonText: {
    color: "#656C76",
    fontSize: 10,
    fontWeight: "700",
  },

  // ========================================
  // PASSWORD
  // ========================================

  passwordClosedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 18,
  },

  passwordDescription: {
    flex: 1,
    minWidth: 220,
  },

  passwordTitle: {
    color: "#353A42",
    fontSize: 12,
    fontWeight: "700",
  },

  passwordSubtitle: {
    color: "#8C939F",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
    maxWidth: 430,
  },

  passwordActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 3,
  },

  // ========================================
  // FINE TYPES HEADER
  // ========================================

  fineTypesSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 9,
  },

  fineTypesSectionHeading: {
    flex: 1,
    minWidth: 240,
  },

  fineTypesSectionTitle: {
    marginBottom: 3,
  },

  fineTypesDescription: {
    color: "#7E8794",
    fontSize: 9,
    lineHeight: 15,
    marginLeft: 14,
  },

  addFineTypeButton: {
    minHeight: 40,
    borderRadius: 7,
    backgroundColor: "#45B94F",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 17,
  },

  addFineTypeButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  // ========================================
  // FINE TYPE FORM
  // ========================================

  fineTypeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 24, 46, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  fineTypeModalCard: {
    width: "100%",
    maxWidth: 760,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#082B52",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 12,
  },

  fineTypeModalClose: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F3F8",
  },

  fineTypeModalCloseText: {
    color: "#173A73",
    fontSize: 22,
    lineHeight: 25,
  },

  fineTypeModalScroll: {
    flexShrink: 1,
  },

  fineTypeModalScrollContent: {
    paddingBottom: 4,
  },

  fineTypeModalForm: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginBottom: 0,
  },

  fineTypeFormError: {
    color: "#B42318",
    backgroundColor: "#FFF0EE",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    marginBottom: 16,
  },

  fineTypeForm: {
    width: "100%",
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: "#DDE4EE",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 18,
  },

  fineTypeFormHeader: {
    marginBottom: 17,
  },

  fineTypeFormTitle: {
    color: "#123266",
    fontSize: 14,
    fontWeight: "800",
  },

  fineTypeFormSubtitle: {
    color: "#7E8794",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 3,
  },

  fineDescriptionField: {
    marginBottom: 17,
  },

  fineDescriptionInput: {
    width: "100%",
    minHeight: 86,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    color: "#333840",
    fontSize: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  fineTypeFormActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 9,
  },

  // ========================================
  // AMOUNT
  // ========================================

  amountInputContainer: {
    width: "100%",
    height: 43,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 7,
    backgroundColor: "#F5F7FA",
    overflow: "hidden",
  },

  amountPeso: {
    color: "#173A73",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 13,
    marginRight: 5,
  },

  amountInput: {
    flex: 1,
    height: "100%",
    color: "#333840",
    fontSize: 11,
    paddingRight: 13,
    outlineStyle: "none",
  } as any,

  // ========================================
  // STATUS SELECTOR
  // ========================================

  statusSelector: {
    height: 43,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 7,
    backgroundColor: "#F5F7FA",
    overflow: "hidden",
  },

  statusSelectorButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FA",
  },

  statusSelectorButtonActive: {
    backgroundColor: "#45B94F",
  },

  statusSelectorButtonInactive: {
    backgroundColor: "#D32F2F",
  },

  statusSelectorText: {
    color: "#7E8794",
    fontSize: 10,
    fontWeight: "700",
  },

  statusSelectorTextActive: {
    color: "#FFFFFF",
  },

  statusSelectorTextInactive: {
    color: "#FFFFFF",
  },

  // ========================================
  // FINE TYPE NOTICE
  // ========================================

  fineTypeNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 7,
    backgroundColor: "#EEF3FA",
    marginBottom: 18,
  },

  fineTypeNoticeText: {
    flex: 1,
    color: "#536780",
    fontSize: 9,
    lineHeight: 14,
  },

  // ========================================
  // FINE TYPES TABLE
  // ========================================

  fineTypesTable: {
    width: "100%",
    minWidth: 780,
    borderWidth: 1,
    borderColor: "#E1E5EB",
    borderRadius: 9,
    overflow: "hidden",
  },

  fineTypesTableHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#173A73",
  },

  fineTypesHeaderText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    paddingHorizontal: 12,
  },

  fineTypesTableRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E7E9ED",
  },

  fineCodeColumn: {
    width: 100,
    paddingHorizontal: 12,
  },

  fineNameColumn: {
    width: 255,
    paddingHorizontal: 12,
  },

  fineAmountColumn: {
    width: 125,
    paddingHorizontal: 12,
  },

  fineStatusColumn: {
    width: 115,
    paddingHorizontal: 12,
  },

  fineActionColumn: {
    flex: 1,
    minWidth: 185,
    paddingHorizontal: 12,
  },

  fineCodeText: {
    color: "#173A73",
    fontSize: 10,
    fontWeight: "800",
  },

  fineNameText: {
    color: "#30353D",
    fontSize: 10,
    fontWeight: "700",
  },

  fineDescriptionText: {
    color: "#8C939F",
    fontSize: 8,
    lineHeight: 12,
    marginTop: 3,
  },

  fineAmountText: {
    color: "#123266",
    fontSize: 11,
    fontWeight: "800",
  },

  // ========================================
  // STATUS BADGE
  // ========================================

  fineStatusBadge: {
    alignSelf: "flex-start",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  fineStatusActiveBadge: {
    backgroundColor: "#E7F8EA",
  },

  fineStatusInactiveBadge: {
    backgroundColor: "#FFEAEA",
  },

  fineStatusText: {
    fontSize: 8,
    fontWeight: "800",
  },

  fineStatusActiveText: {
    color: "#2E9D43",
  },

  fineStatusInactiveText: {
    color: "#D32F2F",
  },

  // ========================================
  // FINE ACTIONS
  // ========================================

  fineActionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  editFineTypeButton: {
    minWidth: 60,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#173A73",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  editFineTypeText: {
    color: "#173A73",
    fontSize: 8,
    fontWeight: "800",
  },

  fineStatusActionButton: {
    minWidth: 90,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  deactivateFineTypeButton: {
    borderColor: "#D32F2F",
    backgroundColor: "#FFFFFF",
  },

  activateFineTypeButton: {
    borderColor: "#45B94F",
    backgroundColor: "#FFFFFF",
  },

  fineStatusActionText: {
    fontSize: 8,
    fontWeight: "800",
  },

  deactivateFineTypeText: {
    color: "#D32F2F",
  },

  activateFineTypeText: {
    color: "#2E9D43",
  },

  // ========================================
  // FINE TYPES STATES
  // ========================================

  fineTypesLoading: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  fineTypesLoadingText: {
    color: "#7E8794",
    fontSize: 9,
    marginTop: 9,
  },

  fineTypesErrorBox: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF4F4",
    borderRadius: 8,
    padding: 16,
  },

  fineTypesErrorText: {
    color: "#B42318",
    fontSize: 9,
    textAlign: "center",
  },

  fineTypesRetryButton: {
    minWidth: 90,
    height: 32,
    marginTop: 10,
    borderRadius: 6,
    backgroundColor: "#173A73",
    alignItems: "center",
    justifyContent: "center",
  },

  fineTypesRetryText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },

  fineTypesEmpty: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  fineTypesEmptyTitle: {
    color: "#123266",
    fontSize: 11,
    fontWeight: "800",
  },

  fineTypesEmptyText: {
    color: "#8C939F",
    fontSize: 9,
    marginTop: 4,
    textAlign: "center",
  },

  // ========================================
  // SYSTEM SETTINGS
  // ========================================

  systemInput: {
    color: "#8C939F",
    backgroundColor: "#ECEFF3",
  },

  systemNotice: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 7,
    backgroundColor: "#EEF3FA",
  },

  systemNoticeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#173A73",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20,
  },

  systemNoticeText: {
    flex: 1,
    color: "#536780",
    fontSize: 9,
    lineHeight: 14,
  },

  // ========================================
  // LOADING / ERROR
  // ========================================

  centerState: {
    minHeight: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 35,
  },

  stateText: {
    color: "#7E8794",
    fontSize: 12,
    marginTop: 14,
  },

  errorTitle: {
    color: "#123266",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },

  errorText: {
    maxWidth: 430,
    color: "#7E8794",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  retryButton: {
    minWidth: 105,
    height: 40,
    marginTop: 18,
    borderRadius: 7,
    backgroundColor: "#173A73",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function SettingsStylesRoute() {
  return null;
}
