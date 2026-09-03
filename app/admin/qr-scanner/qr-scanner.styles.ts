import {
  StyleSheet,
} from 'react-native';

const COLORS = {
  navy:
    '#173A73',

  darkNavy:
    '#123266',

  green:
    '#45B94F',

  lightGreen:
    '#56C85C',

  white:
    '#FFFFFF',

  background:
    '#E8E8E8',

  muted:
    '#8C939F',

  red:
    '#D32F2F',

  border:
    '#D8DCE2',
};

export const styles =
  StyleSheet.create({
    // ==========================================
    // SCREEN
    // ==========================================

    screen: {
      flex: 1,

      flexDirection:
        'row',

      backgroundColor:
        COLORS.background,
    },

    // ==========================================
    // SIDEBAR
    // ==========================================

    sidebar: {
      width: 220,

      minHeight:
        '100%',

      backgroundColor:
        COLORS.navy,

      paddingHorizontal:
        28,

      paddingTop:
        30,

      paddingBottom:
        25,
    },

    logoArea: {
      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom:
        35,
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

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        12,

      borderRadius:
        24,
    },

    navItemActive: {
      backgroundColor:
        COLORS.lightGreen,
    },

    navIcon: {
      width: 28,

      color:
        COLORS.white,

      fontSize: 21,

      fontWeight:
        '700',

      textAlign:
        'center',

      marginRight: 10,
    },

    navText: {
      color:
        COLORS.white,

      fontSize: 14,

      fontWeight:
        '600',
    },

    logoutButton: {
      marginTop:
        'auto',

      borderWidth: 1,

      borderColor:
        'rgba(255,255,255,0.5)',

      borderRadius: 8,

      paddingVertical:
        10,

      alignItems:
        'center',
    },

    logoutText: {
      color:
        COLORS.white,

      fontWeight:
        '600',
    },

    // ==========================================
    // MAIN
    // ==========================================

    main: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,

      paddingHorizontal:
        38,

      paddingVertical:
        35,

      paddingBottom:
        60,
    },

    // ==========================================
    // MOBILE NAV
    // ==========================================

    mobileNav: {
      gap: 8,

      paddingBottom:
        24,
    },

    mobileNavItem: {
      backgroundColor:
        COLORS.white,

      borderRadius:
        18,

      paddingHorizontal:
        16,

      paddingVertical:
        8,
    },

    mobileNavItemActive: {
      backgroundColor:
        COLORS.green,
    },

    mobileNavText: {
      color:
        COLORS.navy,

      fontSize: 12,

      fontWeight:
        '700',
    },

    mobileNavTextActive: {
      color:
        COLORS.white,
    },

    // ==========================================
    // HEADER
    // ==========================================

    header: {
      width:
        '100%',

      maxWidth:
        1100,

      alignSelf:
        'center',

      marginBottom:
        28,
    },

    pageTitle: {
      color:
        COLORS.darkNavy,

      fontSize: 27,

      fontWeight:
        '800',
    },

    subtitle: {
      color:
        '#6F7682',

      fontSize: 12,

      marginTop: 5,
    },

    // ==========================================
    // LOADING
    // ==========================================

    loadingCard: {
      width:
        '100%',

      maxWidth:
        1100,

      minHeight:
        400,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        15,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    loadingText: {
      color:
        COLORS.muted,

      fontSize: 12,

      marginTop: 12,
    },

    // ==========================================
    // SCANNER CARD
    // ==========================================

    scannerCard: {
      width:
        '100%',

      maxWidth:
        850,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        15,

      overflow:
        'hidden',

      shadowColor:
        '#000000',

      shadowOpacity:
        0.04,

      shadowRadius:
        6,

      shadowOffset: {
        width: 0,

        height: 2,
      },

      elevation: 2,
    },

    scannerCardHeader: {
      paddingHorizontal:
        24,

      paddingVertical:
        20,
    },

    scannerTitle: {
      color:
        COLORS.darkNavy,

      fontSize: 18,

      fontWeight:
        '800',
    },

    scannerSubtitle: {
      color:
        COLORS.muted,

      fontSize: 11,

      marginTop: 4,
    },

    // ==========================================
    // CUSTOM QR ICON
    // ==========================================

    cameraPlaceholderImage: {
      width: 72,

      height: 72,

      marginBottom:
        18,
    },

    // ==========================================
    // CAMERA
    // ==========================================

    cameraWrapper: {
      width:
        '100%',

      height: 480,

      overflow:
        'hidden',

      backgroundColor:
        '#000000',

      position:
        'relative',
    },

    camera: {
      width:
        '100%',

      height:
        '100%',
    },

    cameraOverlay: {
      ...StyleSheet.absoluteFillObject,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    scanFrame: {
      width: 260,

      height: 260,

      borderWidth: 3,

      borderColor:
        '#FFFFFF',

      borderRadius:
        18,

      backgroundColor:
        'transparent',
    },

    scanInstruction: {
      position:
        'absolute',

      bottom: 35,

      maxWidth:
        330,

      color:
        '#FFFFFF',

      fontSize: 12,

      fontWeight:
        '700',

      textAlign:
        'center',

      backgroundColor:
        'rgba(0,0,0,0.55)',

      paddingHorizontal:
        16,

      paddingVertical:
        9,

      borderRadius:
        18,
    },

    processingOverlay: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor:
        'rgba(0,0,0,0.68)',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    processingText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '700',

      marginTop: 12,
    },

    scanAgainOverlayButton: {
      backgroundColor:
        COLORS.white,

      borderRadius:
        8,

      paddingHorizontal:
        22,

      paddingVertical:
        12,
    },

    scanAgainOverlayText: {
      color:
        COLORS.navy,

      fontSize: 12,

      fontWeight:
        '800',
    },

    // ==========================================
    // WEB / PERMISSION PLACEHOLDER
    // ==========================================

    webCameraPlaceholder: {
      minHeight:
        330,

      backgroundColor:
        '#F5F6F8',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        40,
    },

    cameraState: {
      minHeight:
        330,

      backgroundColor:
        '#F5F6F8',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        40,
    },

    cameraPlaceholderTitle: {
      color:
        COLORS.darkNavy,

      fontSize: 17,

      fontWeight:
        '800',

      textAlign:
        'center',
    },

    cameraPlaceholderText: {
      maxWidth:
        460,

      color:
        COLORS.muted,

      fontSize: 11,

      lineHeight: 17,

      textAlign:
        'center',

      marginTop: 7,
    },

    permissionButton: {
      minWidth:
        160,

      height: 43,

      backgroundColor:
        COLORS.green,

      borderRadius:
        8,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 20,
    },

    permissionButtonText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '800',
    },

    // ==========================================
    // ERROR
    // ==========================================

    errorBox: {
      width:
        '100%',

      maxWidth:
        850,

      alignSelf:
        'center',

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 15,

      backgroundColor:
        '#FFEAEA',

      borderWidth: 1,

      borderColor:
        '#FFB1B1',

      borderRadius: 10,

      paddingHorizontal:
        16,

      paddingVertical:
        14,

      marginTop: 18,
    },

    errorContent: {
      flex: 1,
    },

    errorTitle: {
      color:
        COLORS.red,

      fontSize: 12,

      fontWeight:
        '800',
    },

    errorText: {
      color:
        '#A42B2B',

      fontSize: 11,

      lineHeight: 16,

      marginTop: 3,
    },

    errorResetButton: {
      backgroundColor:
        COLORS.red,

      borderRadius: 7,

      paddingHorizontal:
        14,

      paddingVertical:
        9,
    },

    errorResetText: {
      color:
        COLORS.white,

      fontSize: 10,

      fontWeight:
        '800',
    },

    // ==========================================
    // MANUAL SEARCH
    // ==========================================

    manualCard: {
      width:
        '100%',

      maxWidth:
        850,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        15,

      padding:
        24,

      marginTop:
        22,

      elevation: 1,
    },

    manualTitle: {
      color:
        COLORS.darkNavy,

      fontSize: 16,

      fontWeight:
        '800',
    },

    manualSubtitle: {
      color:
        COLORS.muted,

      fontSize: 11,

      marginTop: 4,

      marginBottom:
        16,
    },

    manualSearchRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 12,
    },

    manualInput: {
      flex: 1,

      minWidth:
        220,

      height: 46,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        '#AEB5C0',

      borderRadius:
        8,

      paddingHorizontal:
        14,

      color:
        '#222222',

      fontSize: 12,

      outlineStyle:
        'none',
    } as any,

    searchButton: {
      minWidth:
        160,

      height: 46,

      backgroundColor:
        COLORS.navy,

      borderRadius:
        8,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        18,
    },

    searchButtonText: {
      color:
        COLORS.white,

      fontSize: 11,

      fontWeight:
        '800',
    },

    buttonDisabled: {
      opacity: 0.45,
    },

    // ==========================================
    // RESULT CARD
    // ==========================================

    resultCard: {
      width:
        '100%',

      maxWidth:
        850,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        15,

      padding:
        26,

      elevation: 2,
    },

    resultHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 15,

      paddingBottom:
        18,

      borderBottomWidth:
        1,

      borderBottomColor:
        '#E7E9EC',
    },

    resultTitle: {
      color:
        COLORS.darkNavy,

      fontSize: 19,

      fontWeight:
        '800',
    },

    resultSubtitle: {
      color:
        COLORS.muted,

      fontSize: 10,

      marginTop: 3,
    },

    verifiedBadge: {
      backgroundColor:
        '#E4F7E8',

      borderRadius:
        18,

      paddingHorizontal:
        13,

      paddingVertical:
        7,
    },

    verifiedBadgeText: {
      color:
        '#2E9D43',

      fontSize: 10,

      fontWeight:
        '800',
    },

    // ==========================================
    // STUDENT RESULT
    // ==========================================

    studentResult: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      alignItems:
        'center',

      gap: 22,

      paddingVertical:
        24,
    },

    studentAvatar: {
      width: 100,

      height: 100,

      borderRadius:
        50,

      backgroundColor:
        COLORS.navy,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    studentAvatarImage: {
      width: 100,

      height: 100,

      borderRadius:
        50,

      backgroundColor:
        '#E7E7E7',
    },

    studentAvatarText: {
      color:
        COLORS.white,

      fontSize: 28,

      fontWeight:
        '800',
    },

    studentDetails: {
      flex: 1,

      minWidth:
        220,
    },

    studentName: {
      color:
        '#111111',

      fontSize: 22,

      fontWeight:
        '800',

      marginBottom:
        6,
    },

    studentMeta: {
      color:
        '#6C737E',

      fontSize: 11,

      lineHeight: 18,
    },

    // ==========================================
    // ACCOUNT STATUS
    // ==========================================

    accountStatusBadge: {
      alignSelf:
        'flex-start',

      minWidth:
        70,

      borderRadius:
        18,

      paddingHorizontal:
        12,

      paddingVertical:
        6,

      alignItems:
        'center',

      marginTop:
        10,
    },

    activeBadge: {
      backgroundColor:
        '#E4F7E8',
    },

    inactiveBadge: {
      backgroundColor:
        '#ECEFF4',
    },

    accountStatusText: {
      fontSize: 10,

      fontWeight:
        '800',
    },

    activeText: {
      color:
        '#2E9D43',
    },

    inactiveText: {
      color:
        '#606775',
    },

    // ==========================================
    // RESULT STATS
    // ==========================================

    resultStatsRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 15,

      paddingVertical:
        18,

      borderTopWidth:
        1,

      borderBottomWidth:
        1,

      borderColor:
        '#E7E9EC',
    },

    resultStat: {
      flex: 1,

      minWidth:
        180,

      backgroundColor:
        '#F7F8FA',

      borderRadius:
        10,

      padding:
        16,
    },

    resultStatLabel: {
      color:
        COLORS.muted,

      fontSize: 10,

      fontWeight:
        '700',

      marginBottom:
        6,
    },

    resultStatValue: {
      color:
        COLORS.navy,

      fontSize: 19,

      fontWeight:
        '800',
    },

    resultOutstanding: {
      color:
        '#D32F2F',

      fontSize: 19,

      fontWeight:
        '800',
    },

    // ==========================================
    // RESULT ACTIONS
    // ==========================================

    resultActions: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      justifyContent:
        'flex-end',

      gap: 10,

      marginTop:
        22,
    },

    secondaryButton: {
      minWidth:
        125,

      height: 44,

      backgroundColor:
        '#ECEEF1',

      borderRadius:
        8,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        15,
    },

    secondaryButtonText: {
      color:
        '#333333',

      fontSize: 11,

      fontWeight:
        '800',
    },

    profileButton: {
      minWidth:
        165,

      height: 44,

      backgroundColor:
        COLORS.navy,

      borderRadius:
        8,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        15,
    },

    profileButtonText: {
      color:
        COLORS.white,

      fontSize: 11,

      fontWeight:
        '800',
    },

    recordFineButton: {
      minWidth:
        145,

      height: 44,

      backgroundColor:
        COLORS.green,

      borderRadius:
        8,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        15,
    },

    recordFineButtonText: {
      color:
        COLORS.white,

      fontSize: 11,

      fontWeight:
        '800',
    },

    inactiveNotice: {
      color:
        COLORS.red,

      fontSize: 10,

      textAlign:
        'right',

      marginTop:
        10,
    },
  });