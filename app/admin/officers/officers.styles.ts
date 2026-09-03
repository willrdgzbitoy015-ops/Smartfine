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

  text:
    '#123266',

  muted:
    '#8C939F',

  border:
    '#DADDE2',

  red:
    '#D32F2F',
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
    },

    // ==========================================
    // MOBILE NAVIGATION
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
        35,
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
    // TOOLBAR
    // ==========================================

    toolbar: {
      width:
        '100%',

      maxWidth:
        1100,

      alignSelf:
        'center',

      flexDirection:
        'row',

      flexWrap:
        'wrap',

      alignItems:
        'center',

      gap: 12,

      marginBottom:
        28,

      zIndex:
        500,
    },

    // ==========================================
    // SEARCH
    // ==========================================

    searchContainer: {
      flex: 1,

      minWidth: 260,

      maxWidth: 390,

      height: 44,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        9,

      borderWidth:
        1,

      borderColor:
        '#D2D6DC',

      paddingHorizontal:
        13,
    },

    searchIcon: {
      color:
        COLORS.muted,

      fontSize: 20,

      marginRight: 8,
    },

    searchInput: {
      flex: 1,

      height:
        '100%',

      color:
        '#222222',

      fontSize: 12,

      outlineStyle:
        'none',
    } as any,

    // ==========================================
    // FILTERS
    // ==========================================

    filterWrapper: {
      width: 145,

      position:
        'relative',

      zIndex:
        900,
    },

    areaFilterWrapper: {
      width: 175,

      zIndex:
        800,
    },

    filterButton: {
      width:
        '100%',

      height: 44,

      backgroundColor:
        COLORS.white,

      borderWidth:
        1,

      borderColor:
        '#D2D6DC',

      borderRadius:
        9,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      paddingHorizontal:
        13,

      gap: 8,
    },

    filterText: {
      flex: 1,

      color:
        '#333333',

      fontSize: 11,

      fontWeight:
        '600',
    },

    filterArrow: {
      color:
        '#555555',

      fontSize: 9,

      fontWeight:
        '800',
    },

    filterMenu: {
      position:
        'absolute',

      top: 48,

      left: 0,

      right: 0,

      backgroundColor:
        COLORS.white,

      borderWidth:
        1.5,

      borderColor:
        COLORS.navy,

      borderRadius:
        8,

      overflow:
        'hidden',

      zIndex:
        9999,

      elevation:
        30,

      shadowColor:
        '#000000',

      shadowOpacity:
        0.18,

      shadowRadius:
        10,

      shadowOffset: {
        width: 0,

        height: 5,
      },
    },

    filterOption: {
      minHeight: 42,

      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,

      paddingHorizontal:
        13,

      borderBottomWidth:
        1,

      borderBottomColor:
        '#E6E8EB',
    },

    filterOptionText: {
      color:
        COLORS.text,

      fontSize: 11,

      fontWeight:
        '600',
    },

    // ==========================================
    // ADD OFFICER
    // ==========================================

    addButton: {
      height: 44,

      backgroundColor:
        COLORS.green,

      borderRadius:
        9,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        20,
    },

    addButtonText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '800',
    },

    // ==========================================
    // TABLE CARD
    // ==========================================

    tableCard: {
      width:
        '100%',

      maxWidth:
        1100,

      minHeight:
        480,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius:
        14,

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

    // ==========================================
    // LOADING / ERROR
    // ==========================================

    centerState: {
      minHeight:
        420,

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
        '700',
    },

    // ==========================================
    // TABLE
    // ==========================================

    table: {
      minWidth:
        1120,
    },

    // ==========================================
    // NAVY TABLE HEADER
    // ==========================================

    tableHeader: {
      minHeight:
        58,

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

      fontSize: 11,

      fontWeight:
        '800',

      textTransform:
        'uppercase',
    },

    // ==========================================
    // COLUMNS
    // ==========================================

    employeeColumn: {
      width: 125,
    },

    nameColumn: {
      width: 190,
    },

    areaColumn: {
      width: 160,
    },

    emailColumn: {
      width: 210,
    },

    contactColumn: {
      width: 150,
    },

    finesColumn: {
      width: 125,

      textAlign:
        'center',
    },

    statusColumn: {
      width: 120,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    // ==========================================
    // OFFICER ROW
    // ==========================================

    officerRow: {
      minHeight:
        70,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        20,

      backgroundColor:
        COLORS.white,

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
        12,
    },

    employeeNumber: {
      color:
        COLORS.navy,

      fontWeight:
        '800',
    },

    officerName: {
      color:
        '#222222',

      fontSize: 12,

      fontWeight:
        '700',

      paddingRight:
        12,
    },

    usernameText: {
      color:
        COLORS.muted,

      fontSize: 9,

      marginTop: 4,
    },

    finesRecorded: {
      color:
        COLORS.navy,

      fontWeight:
        '800',
    },

    // ==========================================
    // STATUS
    // ==========================================

    statusBadge: {
      minWidth:
        72,

      paddingHorizontal:
        10,

      paddingVertical:
        6,

      borderRadius:
        20,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    activeBadge: {
      backgroundColor:
        '#E7F8EA',
    },

    inactiveBadge: {
      backgroundColor:
        '#ECEFF4',
    },

    statusText: {
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

    // ==========================================
    // EMPTY
    // ==========================================

    emptyRow: {
      minHeight:
        300,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    emptyText: {
      color:
        COLORS.muted,

      fontSize: 12,
    },

    // ==========================================
    // TABLE FOOTER
    // ==========================================

    tableFooter: {
      minHeight:
        58,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      paddingHorizontal:
        22,

      borderTopWidth:
        1,

      borderTopColor:
        '#E6E8EB',

      backgroundColor:
        '#FAFAFB',
    },

    totalOfficersText: {
      color:
        COLORS.text,

      fontSize: 11,

      fontWeight:
        '800',
    },

    visibleOfficersText: {
      color:
        COLORS.muted,

      fontSize: 10,

      fontWeight:
        '600',
    },
  });