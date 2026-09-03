import {
  StyleSheet,
} from 'react-native';

const COLORS = {
  navy: '#173A73',
  navyDark: '#0C2F64',
  green: '#45B94F',
  lightGreen: '#56C85C',
  red: '#FF2424',
  background: '#E8E8E8',
  white: '#FFFFFF',
  text: '#123266',
  muted: '#8C939F',
  lightBorder: '#DADDE2',
};

export const styles =
  StyleSheet.create({
    // ==========================================
    // SCREEN
    // ==========================================

    screen: {
      flex: 1,

      backgroundColor:
        COLORS.background,

      flexDirection:
        'row',
    },

    // ==========================================
    // SIDEBAR
    // SAME POSITIONING AS STUDENTS MODULE
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

      marginRight:
        10,
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

      borderRadius:
        8,

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
    // SAME SPACING AS STUDENTS MODULE
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
    },

    // ==========================================
    // HEADER
    // ==========================================

    header: {
      marginBottom:
        35,
    },

    pageTitle: {
      fontSize: 27,

      fontWeight:
        '800',

      color:
        COLORS.text,
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
    // TOOLBAR
    // ==========================================

    toolbar: {
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

      alignItems:
        'center',

      gap: 14,

      marginBottom:
        35,

      zIndex: 100,
    },

    // ==========================================
    // SEARCH
    // ==========================================

    searchBox: {
      flexGrow: 1,

      flexBasis: 300,

      maxWidth: 420,

      minHeight: 48,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.navy,

      borderRadius: 12,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        14,
    },

    searchIcon: {
      color:
        '#222222',

      fontSize: 27,

      marginRight:
        10,

      marginTop:
        -4,
    },

    searchInput: {
      flex: 1,

      fontSize: 14,

      color:
        '#333333',

      outlineStyle:
        'none',
    } as any,

    // ==========================================
    // FILTERS
    // ==========================================

    filterWrapper: {
      position:
        'relative',

      width: 150,

      zIndex: 300,
    },

    violationFilterWrapper: {
      width: 205,

      zIndex: 290,
    },

    filterButton: {
      height: 46,

      paddingHorizontal:
        14,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.navy,

      borderRadius: 11,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    filterButtonText: {
      flex: 1,

      color:
        '#333333',

      fontSize: 13,

      fontWeight:
        '600',

      marginRight:
        12,
    },

    filterArrow: {
      color:
        '#111111',

      fontSize: 10,
    },

    dropdownMenu: {
      position:
        'absolute',

      top: 50,

      left: 0,

      right: 0,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        '#C5CAD2',

      borderRadius: 8,

      overflow:
        'hidden',

      zIndex: 1000,

      elevation: 10,

      shadowColor:
        '#000000',

      shadowOpacity:
        0.12,

      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 4,
      },
    },

    violationDropdown: {
      maxHeight: 280,
    },

    dropdownItem: {
      paddingHorizontal:
        14,

      paddingVertical:
        12,

      borderBottomWidth:
        1,

      borderBottomColor:
        '#EEEEEE',
    },

    dropdownItemText: {
      color:
        '#333333',

      fontSize: 12,
    },

    // ==========================================
    // ADD BUTTON
    // ==========================================

    addButton: {
      minHeight: 46,

      backgroundColor:
        COLORS.green,

      borderRadius: 8,

      paddingHorizontal:
        22,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginLeft:
        'auto',
    },

    addButtonText: {
      color:
        COLORS.white,

      fontSize: 13,

      fontWeight:
        '700',
    },

    // ==========================================
    // TABLE CARD
    // ==========================================

    tableCard: {
      width:
        '100%',

      maxWidth:
        1050,

      minHeight:
        470,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        14,

      overflow:
        'hidden',
    },

    table: {
      minWidth:
        1120,

      width:
        '100%',

      paddingBottom:
        20,
    },

    // ==========================================
    // TABLE HEADER
    // ==========================================

    tableHeader: {
      minHeight: 55,

      backgroundColor:
        COLORS.navy,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        10,

      borderTopLeftRadius:
        14,

      borderTopRightRadius:
        14,
    },

    headerCell: {
      color:
        COLORS.white,

      fontSize: 13,

      fontWeight:
        '700',

      paddingHorizontal:
        8,
    },

    // ==========================================
    // COLUMN WIDTHS
    // ==========================================

    fineIdColumn: {
      width: 145,
    },

    violationColumn: {
      width: 180,
    },

    studentColumn: {
      width: 210,
    },

    amountColumn: {
      width: 125,
    },

    officerColumn: {
      width: 180,
    },

    dateColumn: {
      width: 150,
    },

    statusColumn: {
      width: 115,

      textAlign:
        'center',
    },

    // ==========================================
    // TABLE ROW
    // ==========================================

    tableRow: {
      minHeight: 62,

      marginHorizontal:
        10,

      marginTop:
        10,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        '#444444',

      borderRadius: 10,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        6,

      overflow:
        'hidden',
    },

    cell: {
      color:
        '#444444',

      fontSize: 13,

      paddingHorizontal:
        8,
    },

    cellContainer: {
      justifyContent:
        'center',

      paddingHorizontal:
        8,
    },

    // ==========================================
    // ROW TEXT
    // ==========================================

    fineIdText: {
      color:
        COLORS.navy,

      fontWeight:
        '800',
    },

    studentName: {
      color:
        '#333333',

      fontSize: 13,

      fontWeight:
        '600',
    },

    studentNumber: {
      marginTop: 3,

      color:
        COLORS.muted,

      fontSize: 11,
    },

    amountText: {
      color:
        COLORS.navy,

      fontWeight:
        '700',
    },

    // ==========================================
    // STATUS BADGES
    // ==========================================

    statusBadge: {
      alignSelf:
        'flex-start',

      paddingHorizontal:
        12,

      paddingVertical:
        6,

      borderRadius:
        20,
    },

    statusBadgeUnpaid: {
      backgroundColor:
        '#FFEAEA',
    },

    statusBadgePaid: {
      backgroundColor:
        '#E7F8EA',
    },

    statusBadgeCancelled: {
      backgroundColor:
        '#ECEFF4',
    },

    statusText: {
      fontSize: 11,

      fontWeight:
        '800',
    },

    statusTextUnpaid: {
      color:
        '#D32F2F',
    },

    statusTextPaid: {
      color:
        '#2E9D43',
    },

    statusTextCancelled: {
      color:
        '#606775',
    },

    // ==========================================
    // LOADING / ERROR
    // ==========================================

    centerState: {
      minHeight: 400,

      alignItems:
        'center',

      justifyContent:
        'center',

      padding: 30,
    },

    loadingText: {
      color:
        COLORS.muted,

      marginTop: 14,

      fontSize: 13,
    },

    errorText: {
      color:
        COLORS.red,

      fontSize: 13,

      textAlign:
        'center',

      marginBottom: 18,
    },

    retryButton: {
      backgroundColor:
        COLORS.navy,

      paddingHorizontal:
        20,

      paddingVertical:
        10,

      borderRadius: 7,
    },

    retryButtonText: {
      color:
        COLORS.white,

      fontWeight:
        '700',
    },

    // ==========================================
    // EMPTY STATE
    // ==========================================

    emptyTable: {
      minHeight: 350,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    emptyTitle: {
      color:
        COLORS.navy,

      fontSize: 18,

      fontWeight:
        '800',
    },

    emptyText: {
      color:
        COLORS.muted,

      fontSize: 13,

      marginTop: 7,
    },
  });