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
    '#8C939F',

  red:
    '#D32F2F',

  border:
    '#DADDE2',
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
        25,
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
        '600',
    },

    mobileNavTextActive: {
      color:
        COLORS.white,
    },

    // ==========================================
    // PAGE HEADER
    // ==========================================

    pageHeader: {
      width:
        '100%',

      maxWidth:
        1050,

      alignSelf:
        'center',

      marginBottom:
        28,
    },

    backButton: {
      alignSelf:
        'flex-start',

      minHeight: 46,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        10,

      borderWidth:
        1,

      borderColor:
        '#CCD1D8',

      paddingHorizontal:
        16,

      marginBottom:
        22,
    },

    backIcon: {
      color:
        COLORS.navy,

      fontSize: 30,

      fontWeight:
        '700',

      lineHeight: 32,

      marginRight: 7,
    },

    backText: {
      color:
        COLORS.navy,

      fontSize: 13,

      fontWeight:
        '800',
    },

    pageTitle: {
      color:
        COLORS.text,

      fontSize: 27,

      fontWeight:
        '800',
    },

    pageSubtitle: {
      color:
        '#6F7682',

      fontSize: 12,

      marginTop: 5,
    },

    // ==========================================
    // PROFILE CARD
    // ==========================================

    profileCard: {
      width:
        '100%',

      maxWidth:
        1050,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        15,

      paddingHorizontal:
        30,

      paddingVertical:
        28,

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

    profileTop: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      alignItems:
        'center',

      gap: 20,
    },

    avatar: {
      width: 82,

      height: 82,

      borderRadius:
        50,

      backgroundColor:
        COLORS.navy,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    avatarText: {
      color:
        COLORS.white,

      fontSize: 27,

      fontWeight:
        '800',
    },

    profileHeading: {
      flex: 1,

      minWidth:
        220,
    },

    officerName: {
      color:
        COLORS.text,

      fontSize: 23,

      fontWeight:
        '800',
    },

    employeeNumber: {
      color:
        '#657080',

      fontSize: 12,

      fontWeight:
        '700',

      marginTop: 4,
    },

    // ==========================================
    // PROFILE ACTIONS
    // ==========================================

    profileActions: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      alignItems:
        'center',

      justifyContent:
        'flex-end',

      gap: 10,
    },

    editButton: {
      minWidth:
        150,

      height: 44,

      backgroundColor:
        COLORS.navy,

      borderRadius: 8,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        18,
    },

    editButtonText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '800',
    },

    deleteButton: {
      minWidth:
        150,

      height: 44,

      backgroundColor:
        COLORS.red,

      borderRadius: 8,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        18,
    },

    deleteButtonDisabled: {
      opacity: 0.5,
    },

    deleteButtonText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '800',
    },

    // ==========================================
    // OFFICER STATUS
    // ==========================================

    statusBadge: {
      alignSelf:
        'flex-start',

      minWidth:
        74,

      paddingHorizontal:
        12,

      paddingVertical:
        6,

      borderRadius:
        20,

      alignItems:
        'center',

      marginTop: 9,
    },

    activeBadge: {
      backgroundColor:
        '#E5F7E8',
    },

    inactiveBadge: {
      backgroundColor:
        '#ECEFF4',
    },

    statusBadgeText: {
      fontSize: 10,

      fontWeight:
        '800',
    },

    activeStatusText: {
      color:
        '#2E9D43',
    },

    inactiveStatusText: {
      color:
        '#606775',
    },

    divider: {
      height: 1,

      backgroundColor:
        '#E3E5E8',

      marginVertical:
        28,
    },

    // ==========================================
    // DETAILS
    // ==========================================

    detailsGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 22,
    },

    detailItem: {
      width:
        '30%',

      minWidth:
        220,

      flexGrow: 1,

      backgroundColor:
        '#F7F8FA',

      borderRadius:
        10,

      paddingHorizontal:
        16,

      paddingVertical:
        14,
    },

    detailLabel: {
      color:
        COLORS.muted,

      fontSize: 10,

      fontWeight:
        '700',

      marginBottom: 6,
    },

    detailValue: {
      color:
        '#333333',

      fontSize: 12,

      fontWeight:
        '600',
    },

    detailValueStrong: {
      color:
        COLORS.navy,

      fontSize: 13,

      fontWeight:
        '800',
    },

    // ==========================================
    // SUMMARY
    // ==========================================

    summaryRow: {
      width:
        '100%',

      maxWidth:
        1050,

      alignSelf:
        'center',

      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 20,

      marginTop:
        24,
    },

    summaryCard: {
      flex: 1,

      minWidth:
        230,

      minHeight:
        115,

      backgroundColor:
        COLORS.white,

      borderRadius:
        14,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding:
        20,

      shadowColor:
        '#000000',

      shadowOpacity:
        0.04,

      shadowRadius:
        5,

      shadowOffset: {
        width: 0,

        height: 2,
      },

      elevation: 2,
    },

    summaryLabel: {
      color:
        '#6E7682',

      fontSize: 11,

      fontWeight:
        '700',

      marginBottom: 8,
    },

    summaryValue: {
      color:
        COLORS.navy,

      fontSize: 27,

      fontWeight:
        '800',
    },

    summaryValueGreen: {
      color:
        COLORS.green,

      fontSize: 27,

      fontWeight:
        '800',
    },

    // ==========================================
    // HISTORY
    // ==========================================

    historyCard: {
      width:
        '100%',

      maxWidth:
        1050,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        14,

      marginTop:
        24,

      overflow:
        'hidden',

      shadowColor:
        '#000000',

      shadowOpacity:
        0.04,

      shadowRadius:
        5,

      shadowOffset: {
        width: 0,

        height: 2,
      },

      elevation: 2,
    },

    historyHeaderBar: {
      paddingHorizontal:
        24,

      paddingVertical:
        20,
    },

    historyTitle: {
      color:
        COLORS.text,

      fontSize: 17,

      fontWeight:
        '800',
    },

    historySubtitle: {
      color:
        COLORS.muted,

      fontSize: 10,

      marginTop: 4,
    },

    historyTable: {
      minWidth:
        1000,
    },

    // ==========================================
    // TABLE HEADER
    // ==========================================

    tableHeader: {
      minHeight:
        55,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.navy,

      paddingHorizontal:
        20,
    },

    headerCell: {
      color:
        COLORS.white,

      fontSize: 10,

      fontWeight:
        '800',

      textTransform:
        'uppercase',
    },

    // ==========================================
    // TABLE ROW
    // ==========================================

    historyRow: {
      minHeight:
        70,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,

      paddingHorizontal:
        20,

      borderBottomWidth:
        1,

      borderBottomColor:
        '#ECEEF1',
    },

    bodyCell: {
      color:
        '#333333',

      fontSize: 11,

      paddingRight:
        10,
    },

    // ==========================================
    // COLUMNS
    // ==========================================

    referenceColumn: {
      width: 150,
    },

    studentColumn: {
      width: 190,
    },

    violationColumn: {
      width: 210,
    },

    dateColumn: {
      width: 145,
    },

    amountColumn: {
      width: 130,
    },

    statusColumn: {
      width: 130,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    referenceText: {
      color:
        COLORS.navy,

      fontWeight:
        '800',

      textDecorationLine:
        'underline',
    },

    studentName: {
      color:
        '#222222',

      fontSize: 11,

      fontWeight:
        '700',
    },

    studentNumber: {
      color:
        COLORS.muted,

      fontSize: 9,

      marginTop: 3,
    },

    amountText: {
      color:
        COLORS.navy,

      fontWeight:
        '800',
    },

    // ==========================================
    // FINE STATUS
    // ==========================================

    fineStatusBadge: {
      minWidth:
        78,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        10,

      paddingVertical:
        6,

      borderRadius:
        20,
    },

    fineStatusText: {
      fontSize: 10,

      fontWeight:
        '800',
    },

    // ==========================================
    // EMPTY HISTORY
    // ==========================================

    emptyHistory: {
      minHeight:
        180,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    emptyHistoryText: {
      color:
        COLORS.muted,

      fontSize: 11,
    },

    // ==========================================
    // LOADING / ERROR
    // ==========================================

    centerState: {
      width:
        '100%',

      maxWidth:
        1050,

      minHeight:
        420,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        14,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding:
        30,
    },

    stateText: {
      color:
        COLORS.muted,

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

      borderRadius: 8,

      paddingHorizontal:
        20,

      paddingVertical:
        10,
    },

    retryText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '800',
    },
  });