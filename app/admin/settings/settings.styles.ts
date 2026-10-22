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

  scrollContentPhone: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // ========================================
  // MOBILE NAV
  // ========================================

  mobileNav: {
    gap: 8,
    paddingBottom: 22,
  },

  mobileNavItem: {
    flexDirection: "row",
    alignItems: "center",
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
    marginBottom: 24,
  },

  pageTitle: {
    color: "#123266",
    fontSize: 26,
    fontWeight: "800",
  },

  pageSubtitle: {
    color: "#7E8794",
    fontSize: 12,
    marginTop: 5,
  },

  // ========================================
  // SETTINGS LAYOUT
  // ========================================

  settingsLayout: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },

  settingsLayoutStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  rightColumn: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    gap: 16,
  },

  tabStack: {
    gap: 16,
  },

  resetText: {
    color: "#4A5668",
    fontSize: 13,
    lineHeight: 20,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  textStart: {
    textAlign: "left",
  },

  rowStart: {
    justifyContent: "flex-start",
  },

  // ========================================
  // PROFILE CARD
  // ========================================

  profileCard: {
    width: 300,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E3E8EF",
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
  },

  profileCardStacked: {
    width: "100%",
  },

  profileCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 26,
    paddingVertical: 24,
  },

  avatarWrapper: {
    width: 124,
    height: 124,
    position: "relative",
    marginBottom: 16,
  },

  avatarWrapperRow: {
    marginBottom: 0,
  },

  // Phone-sized profile card.
  profileCardCompact: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },

  avatarWrapperCompact: {
    width: 84,
    height: 84,
  },

  avatarCompact: {
    width: 84,
    height: 84,
    borderRadius: 26,
  },

  avatarInitialsCompact: {
    fontSize: 26,
  },

  cameraButtonCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },

  profileNameCompact: {
    fontSize: 18,
  },

  photoActionsCompact: {
    marginTop: 12,
  },

  avatar: {
    width: 124,
    height: 124,
    borderRadius: 36,
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

  profileDetails: {
    width: "100%",
    alignItems: "center",
  },

  profileDetailsRow: {
    flex: 1,
    width: "auto",
    minWidth: 0,
    alignItems: "flex-start",
  },

  profileName: {
    color: "#123266",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  profileChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },

  roleChip: {
    overflow: "hidden",
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#EAF0FA",
    color: "#173A73",
    fontSize: 10,
    fontWeight: "800",
  },

  activeChip: {
    overflow: "hidden",
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#E7F8EA",
    color: "#2E9D43",
    fontSize: 10,
    fontWeight: "800",
  },

  profileUsername: {
    color: "#8C939F",
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
  },

  profileDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E3E6EA",
    marginVertical: 20,
  },

  dividerRow: {
    marginVertical: 14,
  },

  profileInfoList: {
    width: "100%",
    gap: 14,
  },

  infoListRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 28,
    rowGap: 10,
  },

  profileInfoBlock: {
    width: "100%",
    alignItems: "center",
  },

  infoBlockRow: {
    width: "auto",
    alignItems: "flex-start",
  },

  profileInfoLabel: {
    color: "#9299A3",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },

  profileInfoValue: {
    color: "#3F4650",
    fontSize: 12,
    textAlign: "center",
  },

  photoActions: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 20,
  },

  changePhotoButton: {
    minHeight: 38,
    flexGrow: 1,
    maxWidth: 200,
    borderRadius: 8,
    backgroundColor: "#173A73",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  changePhotoButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  removePhotoButton: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D32F2F",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  removePhotoButtonText: {
    color: "#D32F2F",
    fontSize: 11,
    fontWeight: "700",
  },

  photoHint: {
    color: "#9A9FA8",
    fontSize: 9,
    marginTop: 9,
    textAlign: "center",
  },

  // ========================================
  // TABS
  // ========================================

  tabBarScroll: {
    flexGrow: 0,
  },

  tabBar: {
    flexGrow: 1,
    flexDirection: "row",
    gap: 4,
    padding: 5,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E8EF",
  },

  tab: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 9,
  },

  tabActive: {
    backgroundColor: "#173A73",
  },

  tabIcon: {
    width: 15,
    height: 15,
    tintColor: "#6C7A90",
  },

  tabIconActive: {
    tintColor: "#FFFFFF",
  },

  tabText: {
    color: "#4D5B70",
    fontSize: 12,
    fontWeight: "700",
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  // Unsaved changes on that tab.
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F2A93B",
  },

  // ========================================
  // FORM
  // ========================================

  groupLabel: {
    color: "#7E8794",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  groupLabelGap: {
    marginTop: 6,
  },

  formRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
  },

  formRowLast: {
    marginBottom: 0,
  },

  formField: {
    flex: 1,
    minWidth: 220,
  },

  formFieldThird: {
    flex: 1,
    minWidth: 170,
  },

  inputLabel: {
    color: "#3F434A",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },

  requiredMark: {
    color: "#D32F2F",
  },

  input: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 8,
    backgroundColor: "#F5F7FA",
    color: "#333840",
    fontSize: 13,
    paddingHorizontal: 13,
  },

  // Same 1 px border, so focusing never shifts the layout.
  inputFocused: {
    borderColor: "#173A73",
    backgroundColor: "#FFFFFF",
  },

  readOnlyInput: {
    justifyContent: "center",
    backgroundColor: "#ECEFF3",
  },

  readOnlyText: {
    color: "#7E8794",
    fontSize: 13,
  },

  // The email is shown, not typed: it changes through Change Email.
  inputReadOnly: {
    justifyContent: "center",
    backgroundColor: "#EEF1F5",
  },

  inputReadOnlyText: {
    color: "#6B7689",
    fontSize: 13,
  },

  changeEmailLink: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },

  changeEmailLinkText: {
    color: "#173A73",
    fontSize: 12,
    fontWeight: "700",
  },

  fieldHint: {
    color: "#8C939F",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },

  unsavedText: {
    color: "#B26B00",
    fontSize: 11,
    fontWeight: "700",
    marginRight: "auto",
  },

  infoNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#EEF3FA",
    marginBottom: 16,
  },

  infoNoticeIcon: {
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

  infoNoticeText: {
    flex: 1,
    color: "#536780",
    fontSize: 11,
    lineHeight: 16,
  },

  // ========================================
  // SECURITY
  // ========================================

  securityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  securityText: {
    flex: 1,
    minWidth: 220,
  },

  securityTitle: {
    color: "#30353D",
    fontSize: 13,
    fontWeight: "800",
  },

  securityHint: {
    color: "#7E8794",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
    maxWidth: 480,
  },

  protectionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },

  protectionItemLast: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },

  protectionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E7F8EA",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  protectionCheckText: {
    color: "#2E9D43",
    fontSize: 11,
    fontWeight: "900",
  },

  protectionText: {
    flex: 1,
  },

  protectionTitle: {
    color: "#30353D",
    fontSize: 12,
    fontWeight: "800",
  },

  protectionBody: {
    color: "#7E8794",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  // ========================================
  // FINE TYPE FORM
  // ========================================

  fineTypeFormError: {
    color: "#B42318",
    backgroundColor: "#FFF0EE",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    marginBottom: 16,
  },

  fineDescriptionField: {
    marginBottom: 12,
  },

  fineDescriptionInput: {
    width: "100%",
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#333840",
    fontSize: 13,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  // ========================================
  // AMOUNT
  // ========================================

  amountInputContainer: {
    width: "100%",
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 8,
    backgroundColor: "#F5F7FA",
    overflow: "hidden",
  },

  amountPeso: {
    color: "#173A73",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 13,
    marginRight: 5,
  },

  amountInput: {
    flex: 1,
    height: "100%",
    color: "#333840",
    fontSize: 13,
    paddingRight: 13,
    outlineStyle: "none",
  } as any,

  // ========================================
  // STATUS SELECTOR
  // ========================================

  statusSelector: {
    height: 44,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 8,
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
    fontSize: 12,
    fontWeight: "700",
  },

  statusSelectorTextActive: {
    color: "#FFFFFF",
  },

  statusSelectorTextInactive: {
    color: "#FFFFFF",
  },

  // ========================================
  // FINE TYPES TABLE
  // ========================================

  fineTypesTable: {
    width: "100%",
    minWidth: 570,
    borderWidth: 1,
    borderColor: "#E1E5EB",
    borderRadius: 10,
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
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 10,
  },

  fineTypesTableRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E7E9ED",
  },

  fineTypesTableRowAlt: {
    backgroundColor: "#FAFBFD",
  },

  fineCodeColumn: {
    width: 70,
    paddingHorizontal: 10,
  },

  fineNameColumn: {
    flex: 1,
    minWidth: 150,
    paddingHorizontal: 10,
  },

  fineAmountColumn: {
    width: 92,
    paddingHorizontal: 10,
  },

  fineStatusColumn: {
    width: 90,
    paddingHorizontal: 10,
  },

  fineActionColumn: {
    width: 164,
    paddingHorizontal: 10,
  },

  fineCodeText: {
    color: "#173A73",
    fontSize: 11,
    fontWeight: "800",
  },

  fineNameText: {
    color: "#30353D",
    fontSize: 12,
    fontWeight: "700",
  },

  fineDescriptionText: {
    color: "#8C939F",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },

  fineAmountText: {
    color: "#123266",
    fontSize: 12,
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
    fontSize: 10,
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
    minWidth: 52,
    height: 32,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#173A73",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  editFineTypeText: {
    color: "#173A73",
    fontSize: 10,
    fontWeight: "800",
  },

  fineStatusActionButton: {
    minWidth: 84,
    height: 32,
    borderRadius: 7,
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
    fontSize: 10,
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
    fontSize: 11,
    textAlign: "center",
  },

  fineTypesRetryButton: {
    minWidth: 90,
    height: 32,
    marginTop: 10,
    borderRadius: 7,
    backgroundColor: "#173A73",
    alignItems: "center",
    justifyContent: "center",
  },

  fineTypesRetryText: {
    color: "#FFFFFF",
    fontSize: 10,
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
    fontSize: 12,
    fontWeight: "800",
  },

  fineTypesEmptyText: {
    color: "#8C939F",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },

  // ========================================
  // LOADING / ERROR
  // ========================================

  centerState: {
    minHeight: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: 35,
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
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  retryButton: {
    minWidth: 105,
    height: 40,
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: "#173A73",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});

// ==========================================
// EXPO ROUTER DEFAULT EXPORT
// ==========================================

export default function SettingsStylesRoute() {
  return null;
}
