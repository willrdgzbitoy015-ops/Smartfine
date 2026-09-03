import {
  StyleSheet,
} from 'react-native';

export const styles =
  StyleSheet.create({
    // ========================================
    // SCREEN
    // ========================================

    screen: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: '#E8E8E8',
    },

    // ========================================
    // SIDEBAR
    // ========================================

    sidebar: {
      width: 220,
      minHeight: '100%',
      backgroundColor: '#173A73',
      paddingHorizontal: 28,
      paddingTop: 30,
      paddingBottom: 25,
    },

    logoArea: {
      alignItems: 'center',
      justifyContent: 'center',
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      borderRadius: 24,
    },

    navItemActive: {
      backgroundColor: '#56C85C',
    },

    navIcon: {
      width: 28,
      color: '#FFFFFF',
      fontSize: 21,
      fontWeight: '700',
      textAlign: 'center',
      marginRight: 10,
    },

    navIconContainer: {
      width: 28,
      height: 28,
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },

    navImageIcon: {
      width: 20,
      height: 20,
    },

    navText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },

    logoutButton: {
      marginTop: 'auto',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },

    logoutText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },

    // ========================================
    // MAIN
    // ========================================

    main: {
      flex: 1,
      backgroundColor: '#E8E8E8',
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
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D3D7DD',
    },

    mobileNavItemActive: {
      backgroundColor: '#56C85C',
      borderColor: '#56C85C',
    },

    mobileNavText: {
      color: '#173A73',
      fontSize: 12,
      fontWeight: '700',
    },

    mobileNavTextActive: {
      color: '#FFFFFF',
    },

    // ========================================
    // PAGE HEADER
    // ========================================

    pageHeader: {
      marginBottom: 28,
    },

    pageTitle: {
      color: '#123266',
      fontSize: 26,
      fontWeight: '800',
    },

    pageSubtitle: {
      color: '#7E8794',
      fontSize: 11,
      marginTop: 5,
    },

    // ========================================
    // SETTINGS LAYOUT
    // ========================================

    settingsLayout: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 28,
    },

    settingsLayoutStacked: {
      flexDirection: 'column',
    },

    // ========================================
    // PROFILE CARD
    // ========================================

    profileCard: {
      width: 320,
      minHeight: 485,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 28,
      paddingVertical: 30,
      alignItems: 'center',
    },

    profileCardStacked: {
      width: '100%',
      minHeight: 0,
    },

    avatarWrapper: {
      width: 132,
      height: 132,
      position: 'relative',
      marginBottom: 17,
    },

    avatar: {
      width: 132,
      height: 132,
      borderRadius: 40,
      backgroundColor: '#E8ECF2',
    },

    avatarFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#173A73',
    },

    avatarInitials: {
      color: '#FFFFFF',
      fontSize: 38,
      fontWeight: '800',
    },

    cameraButton: {
      position: 'absolute',
      right: -4,
      bottom: -3,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#a8bee1',
      borderWidth: 3,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    cameraIcon: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },

    profileName: {
      color: '#123266',
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
    },

    profileRole: {
      color: '#51698A',
      fontSize: 11,
      marginTop: 3,
      textAlign: 'center',
    },

    profileUsername: {
      color: '#8C939F',
      fontSize: 10,
      marginTop: 5,
      textAlign: 'center',
    },

    profileDivider: {
      width: '100%',
      height: 1,
      backgroundColor: '#E3E6EA',
      marginVertical: 24,
    },

    profileInfoBlock: {
      width: '100%',
      marginBottom: 17,
      alignItems: 'center',
    },

    profileInfoLabel: {
      color: '#9299A3',
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 5,
    },

    profileInfoValue: {
      color: '#525861',
      fontSize: 12,
      textAlign: 'center',
    },

    photoActions: {
      width: '100%',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      marginTop: 6,
    },

    changePhotoButton: {
      minHeight: 38,
      flexGrow: 1,
      borderRadius: 7,
      backgroundColor: '#173A73',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },

    changePhotoButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },

    removePhotoButton: {
      minHeight: 38,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: '#D32F2F',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },

    removePhotoButtonText: {
      color: '#D32F2F',
      fontSize: 10,
      fontWeight: '700',
    },

    photoHint: {
      color: '#9A9FA8',
      fontSize: 8,
      marginTop: 9,
      textAlign: 'center',
    },

    // ========================================
    // RIGHT COLUMN
    // ========================================

    rightColumn: {
      flex: 1,
      width: '100%',
      gap: 26,
    },

    sectionTitle: {
      color: '#123266',
      fontSize: 15,
      fontWeight: '800',
      marginLeft: 14,
      marginBottom: 9,
    },

    settingsCard: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 24,
    },

    // ========================================
    // FORM
    // ========================================

    formRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 18,
      marginBottom: 18,
    },

    formField: {
      flex: 1,
      minWidth: 220,
    },

    inputLabel: {
      color: '#3F434A',
      fontSize: 11,
      fontWeight: '700',
      marginBottom: 7,
    },

    input: {
      width: '100%',
      height: 43,
      borderWidth: 1,
      borderColor: '#D8DEE8',
      borderRadius: 7,
      backgroundColor: '#F5F7FA',
      color: '#333840',
      fontSize: 11,
      paddingHorizontal: 13,
    },

    readOnlyInput: {
      justifyContent: 'center',
      backgroundColor: '#ECEFF3',
    },

    readOnlyText: {
      color: '#7E8794',
      fontSize: 11,
    },

    cardActionRow: {
      alignItems: 'flex-end',
      marginTop: 2,
    },

    // ========================================
    // BUTTONS
    // ========================================

    primaryButton: {
      minWidth: 155,
      height: 40,
      borderRadius: 7,
      backgroundColor: '#173A73',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    secondaryButton: {
      minWidth: 135,
      height: 40,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: '#173A73',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 17,
    },

    secondaryButtonText: {
      color: '#173A73',
      fontSize: 10,
      fontWeight: '800',
    },

    cancelButton: {
      minWidth: 90,
      height: 40,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: '#C8CDD5',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 15,
    },

    cancelButtonText: {
      color: '#656C76',
      fontSize: 10,
      fontWeight: '700',
    },

    // ========================================
    // PASSWORD
    // ========================================

    passwordClosedRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 18,
    },

    passwordDescription: {
      flex: 1,
      minWidth: 220,
    },

    passwordTitle: {
      color: '#353A42',
      fontSize: 12,
      fontWeight: '700',
    },

    passwordSubtitle: {
      color: '#8C939F',
      fontSize: 9,
      lineHeight: 15,
      marginTop: 4,
      maxWidth: 430,
    },

    passwordActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 9,
      marginTop: 3,
    },

    // ========================================
    // SYSTEM SETTINGS
    // ========================================

    systemInput: {
      color: '#8C939F',
      backgroundColor: '#ECEFF3',
    },

    systemNotice: {
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 7,
      backgroundColor: '#EEF3FA',
    },

    systemNoticeIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#173A73',
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
      textAlign: 'center',
      lineHeight: 20,
    },

    systemNoticeText: {
      flex: 1,
      color: '#536780',
      fontSize: 9,
      lineHeight: 14,
    },

    // ========================================
    // LOADING / ERROR
    // ========================================

    centerState: {
      minHeight: 420,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 35,
    },

    stateText: {
      color: '#7E8794',
      fontSize: 12,
      marginTop: 14,
    },

    errorTitle: {
      color: '#123266',
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 8,
    },

    errorText: {
      maxWidth: 430,
      color: '#7E8794',
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
    },

    retryButton: {
      minWidth: 105,
      height: 40,
      marginTop: 18,
      borderRadius: 7,
      backgroundColor: '#173A73',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },

    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
  });