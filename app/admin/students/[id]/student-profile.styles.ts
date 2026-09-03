import {
  StyleSheet,
} from 'react-native';

const COLORS = {
  navy:
    '#173A73',

  text:
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
    '#777777',

  red:
    '#FF2424',
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
    // BACK
    // ==========================================

    backButton: {
      width:
        '100%',

      maxWidth:
        1080,

      alignSelf:
        'center',

      marginBottom:
        26,
    },

    backText: {
      color:
        COLORS.text,

      fontSize: 19,

      fontWeight:
        '800',
    },

    // ==========================================
    // MOBILE NAV
    // ==========================================

    mobileNav: {
      gap: 8,

      marginBottom:
        20,
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
    // PROFILE CARD
    // COMPACT LIKE PROTOTYPE
    // ==========================================

    profileCard: {
      width:
        '100%',

      maxWidth:
        1080,

      minHeight:
        150,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        12,

      paddingHorizontal:
        28,

      paddingVertical:
        22,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 25,

      shadowColor:
        '#000000',

      shadowOpacity:
        0.02,

      shadowRadius:
        3,

      shadowOffset: {
        width: 0,

        height: 1,
      },

      elevation: 1,
    },

    // ==========================================
    // PROFILE LEFT
    // ==========================================

    profileLeft: {
      flex: 1,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 28,

      minWidth:
        400,
    },

    // ==========================================
    // AVATAR
    // ==========================================

    avatar: {
      width: 96,

      height: 96,

      borderRadius:
        48,

      backgroundColor:
        COLORS.navy,

      alignItems:
        'center',

      justifyContent:
        'center',

      flexShrink:
        0,
    },

    avatarImage: {
      width: 96,

      height: 96,

      borderRadius:
        48,

      backgroundColor:
        '#E2E2E2',

      flexShrink:
        0,
    },

    avatarText: {
      color:
        COLORS.white,

      fontSize: 27,

      fontWeight:
        '800',
    },

    // ==========================================
    // STUDENT INFORMATION
    // ==========================================

    studentInfo: {
      flex: 1,

      justifyContent:
        'center',
    },

    studentName: {
      color:
        '#111111',

      fontSize: 25,

      fontWeight:
        '800',

      marginBottom:
        8,
    },

    studentMeta: {
      color:
        COLORS.muted,

      fontSize: 13,

      lineHeight: 21,
    },

    // ==========================================
    // ACTION BUTTONS
    // ==========================================

    profileActions: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'flex-end',

      flexWrap:
        'wrap',

      gap: 12,
    },

    outlineButton: {
      minWidth:
        145,

      height: 48,

      borderWidth: 1,

      borderColor:
        '#222222',

      borderRadius:
        8,

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        16,
    },

    outlineButtonText: {
      color:
        '#111111',

      fontSize: 12,

      fontWeight:
        '800',
    },

    qrIcon: {
      color:
        '#111111',

      fontSize: 17,

      fontWeight:
        '800',

      marginRight: 7,
    },

    editIcon: {
      color:
        '#111111',

      fontSize: 18,

      fontWeight:
        '800',

      marginRight: 7,
    },

    // ==========================================
    // SUMMARY
    // ==========================================

    summaryRow: {
      width:
        '100%',

      maxWidth:
        1000,

      alignSelf:
        'center',

      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 25,

      marginTop:
        30,
    },

    summaryCard: {
      flex: 1,

      minWidth:
        280,

      minHeight:
        130,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        '#333333',

      borderRadius:
        8,

      paddingHorizontal:
        24,

      paddingVertical:
        22,

      justifyContent:
        'center',
    },

    summaryLabel: {
      color:
        '#111111',

      fontSize: 13,

      fontWeight:
        '800',

      marginBottom:
        15,
    },

    outstandingValue: {
      color:
        '#E52323',

      fontSize: 26,

      fontWeight:
        '800',
    },

    paidValue: {
      color:
        '#00A21B',

      fontSize: 26,

      fontWeight:
        '800',
    },

    // ==========================================
    // HISTORY CARD
    // ==========================================

    historyCard: {
      width:
        '100%',

      maxWidth:
        1100,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        12,

      marginTop:
        30,

      overflow:
        'hidden',
    },

    historyTitleBar: {
      minHeight:
        58,

      justifyContent:
        'center',

      backgroundColor:
        COLORS.navy,

      paddingHorizontal:
        24,
    },

    historyTitle: {
      color:
        COLORS.white,

      fontSize: 15,

      fontWeight:
        '800',
    },

    // ==========================================
    // HISTORY TABLE
    // ==========================================

    historyTable: {
      minWidth:
        1000,
    },

    historyHeader: {
      minHeight:
        48,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        '#F1F2F4',

      paddingHorizontal:
        24,
    },

    historyHeaderText: {
      color:
        '#333333',

      fontSize: 11,

      fontWeight:
        '700',
    },

    historyRow: {
      minHeight:
        62,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        24,

      backgroundColor:
        COLORS.white,

      borderBottomWidth:
        1,

      borderBottomColor:
        '#E5E5E5',
    },

    historyCell: {
      color:
        '#555555',

      fontSize: 11,
    },

    violationColumn: {
      width: 240,
    },

    dateColumn: {
      width: 230,
    },

    amountColumn: {
      width: 140,
    },

    fineStatusColumn: {
      width: 140,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    officerColumn: {
      width: 190,
    },

    violationText: {
      color:
        '#222222',

      fontWeight:
        '600',
    },

    amountText: {
      color:
        '#222222',

      fontWeight:
        '800',
    },

    // ==========================================
    // STATUS
    // ==========================================

    statusBadge: {
      minWidth:
        67,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        18,

      paddingVertical:
        5,

      paddingHorizontal:
        10,
    },

    statusBadgeText: {
      fontSize: 10,

      fontWeight:
        '800',
    },

    paidBadge: {
      backgroundColor:
        '#E3F5E7',
    },

    paidBadgeText: {
      color:
        '#2E9D43',
    },

    unpaidBadge: {
      backgroundColor:
        '#FFE5E5',
    },

    unpaidBadgeText: {
      color:
        '#E52323',
    },

    cancelledBadge: {
      backgroundColor:
        '#ECEFF4',
    },

    cancelledBadgeText: {
      color:
        '#606775',
    },

    // ==========================================
    // EMPTY HISTORY
    // ==========================================

    emptyHistory: {
      minHeight:
        150,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    emptyHistoryText: {
      color:
        '#8C939F',

      fontSize: 11,
    },

    // ==========================================
    // STATES
    // ==========================================

    centerState: {
      width:
        '100%',

      maxWidth:
        1080,

      minHeight:
        350,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        12,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding:
        30,
    },

    stateText: {
      color:
        '#8C939F',

      fontSize: 12,

      marginTop: 12,
    },

    errorText: {
      color:
        COLORS.red,

      fontSize: 12,

      textAlign:
        'center',

      marginBottom:
        18,
    },

    retryButton: {
      backgroundColor:
        COLORS.navy,

      paddingHorizontal:
        20,

      paddingVertical:
        10,

      borderRadius: 8,
    },

    retryText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '800',
    },
  });