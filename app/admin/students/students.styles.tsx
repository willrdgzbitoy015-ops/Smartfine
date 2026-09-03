import { StyleSheet } from 'react-native';

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

      flexDirection: 'row',
    },

    // ==========================================
    // SIDEBAR
    // ==========================================

    sidebar: {
      width: 220,

      minHeight: '100%',

      backgroundColor:
        COLORS.navy,

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
      backgroundColor:
        COLORS.lightGreen,
    },

    navIcon: {
      width: 28,

      color: COLORS.white,

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
      color: COLORS.white,

      fontSize: 14,

      fontWeight: '600',
    },

    logoutButton: {
      marginTop: 'auto',

      borderWidth: 1,

      borderColor:
        'rgba(255,255,255,0.5)',

      borderRadius: 8,

      paddingVertical: 10,

      alignItems: 'center',
    },

    logoutText: {
      color: COLORS.white,

      fontWeight: '600',
    },

    // ==========================================
    // MAIN
    // ==========================================

    main: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,

      paddingHorizontal: 38,

      paddingVertical: 35,
    },

    // ==========================================
    // HEADER
    // ==========================================

    header: {
      marginBottom: 35,
    },

    pageTitle: {
      fontSize: 27,

      fontWeight: '800',

      color: COLORS.text,
    },

    // ==========================================
    // MOBILE NAV
    // ==========================================

    mobileNav: {
      gap: 8,

      paddingBottom: 25,
    },

    mobileNavItem: {
      backgroundColor:
        COLORS.white,

      borderRadius: 18,

      paddingHorizontal: 16,

      paddingVertical: 8,
    },

    mobileNavItemActive: {
      backgroundColor:
        COLORS.green,
    },

    mobileNavText: {
      color: COLORS.navy,

      fontSize: 12,

      fontWeight: '600',
    },

    mobileNavTextActive: {
      color: COLORS.white,
    },

    // ==========================================
    // TOOLBAR
    // ==========================================

    toolbar: {
      width: '100%',

      maxWidth: 1050,

      alignSelf: 'center',

      flexDirection: 'row',

      flexWrap: 'wrap',

      alignItems: 'center',

      gap: 14,

      marginBottom: 35,

      zIndex: 100,
    },

    // ==========================================
    // SEARCH
    // ==========================================

    searchContainer: {
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

      flexDirection: 'row',

      alignItems: 'center',

      paddingHorizontal: 14,
    },

    searchIcon: {
      color: '#222222',

      fontSize: 27,

      marginRight: 10,

      marginTop: -4,
    },

    searchInput: {
      flex: 1,

      fontSize: 14,

      color: '#333333',

      outlineStyle: 'none',
    } as any,

    // ==========================================
    // FILTERS
    // ==========================================

    filtersContainer: {
      flexDirection: 'row',

      gap: 12,

      zIndex: 200,
    },

    filterWrapper: {
      position: 'relative',

      zIndex: 300,
    },

    filterButton: {
      minWidth: 125,

      height: 46,

      paddingHorizontal: 14,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.navy,

      borderRadius: 11,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',
    },

    filterText: {
      color: '#333333',

      fontSize: 13,

      fontWeight: '600',

      marginRight: 12,
    },

    filterArrow: {
      color: '#111111',

      fontSize: 10,
    },

    filterMenu: {
      position: 'absolute',

      top: 50,

      left: 0,

      minWidth: 150,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        '#C5CAD2',

      borderRadius: 8,

      overflow: 'hidden',

      zIndex: 1000,

      elevation: 10,
    },

    filterOption: {
      paddingHorizontal: 14,

      paddingVertical: 12,

      borderBottomWidth: 1,

      borderBottomColor:
        '#EEEEEE',
    },

    filterOptionText: {
      color: '#333333',

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

      paddingHorizontal: 22,

      alignItems: 'center',

      justifyContent: 'center',

      marginLeft: 'auto',
    },

    addButtonText: {
      color: COLORS.white,

      fontSize: 13,

      fontWeight: '700',
    },

    // ==========================================
    // TABLE CARD
    // ==========================================

    tableCard: {
      width: '100%',

      maxWidth: 1050,

      minHeight: 470,

      alignSelf: 'center',

      backgroundColor:
        COLORS.white,

      borderRadius: 14,

      overflow: 'visible',
    },

    table: {
      minWidth: 1000,

      width: '100%',
    },

    // ==========================================
    // TABLE HEADER
    // ==========================================

    tableHeader: {
      minHeight: 55,

      backgroundColor:
        COLORS.navy,

      flexDirection: 'row',

      alignItems: 'center',

      paddingHorizontal: 10,

      borderTopLeftRadius: 14,

      borderTopRightRadius: 14,
    },

    headerCell: {
      color: COLORS.white,

      fontSize: 13,

      fontWeight: '700',

      paddingHorizontal: 8,
    },

    // ==========================================
    // COLUMN WIDTHS
    // ==========================================

    selectColumn: {
      width: 42,

      alignItems: 'center',

      justifyContent: 'center',
    },

    studentIdColumn: {
      width: 120,
    },

    nameColumn: {
      width: 200,
    },

    gradeSectionColumn: {
      width: 180,
    },

    totalColumn: {
      width: 120,
    },

    balanceColumn: {
      width: 190,
    },

    statusColumn: {
      width: 105,

      textAlign: 'center',
    },

    // ==========================================
    // STUDENT ROW
    // ==========================================

    studentRow: {
      minHeight: 62,

      marginHorizontal: 10,

      marginTop: 10,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor: '#444444',

      borderRadius: 10,

      flexDirection: 'row',

      alignItems: 'center',

      overflow: 'hidden',
    },

    studentRowSelected: {
      borderColor:
        COLORS.red,

      borderWidth: 2,

      backgroundColor:
        '#FFF8F8',
    },

    rowMain: {
      flex: 1,

      minHeight: 60,

      flexDirection: 'row',

      alignItems: 'center',
    },

    bodyCell: {
      color: '#444444',

      fontSize: 13,

      paddingHorizontal: 8,
    },

    studentName: {
      color: '#333333',

      fontWeight: '600',
    },

    // ==========================================
    // DELETE SELECTOR
    // ==========================================

    selectCircle: {
      width: 21,

      height: 21,

      borderRadius: 11,

      borderWidth: 2,

      borderColor:
        COLORS.red,

      alignItems: 'center',

      justifyContent: 'center',
    },

    selectCircleSelected: {
      backgroundColor:
        COLORS.red,
    },

    selectCheck: {
      color: COLORS.white,

      fontSize: 12,

      fontWeight: '800',
    },

    // ==========================================
    // MONEY
    // ==========================================

    balanceDanger: {
      color: COLORS.red,

      fontWeight: '700',
    },

    balanceZero: {
      color: '#666666',
    },

    // ==========================================
    // STATUS
    // ==========================================

    statusActive: {
      color: COLORS.green,

      fontWeight: '700',
    },

    statusInactive: {
      color: COLORS.red,

      fontWeight: '700',
    },

    statusOther: {
      color: '#666666',

      fontWeight: '700',
    },

    // ==========================================
    // FOOTER
    // ==========================================

    tableFooter: {
      marginTop: 'auto',

      minHeight: 95,

      flexDirection: 'row',

      flexWrap: 'wrap',

      alignItems: 'center',

      justifyContent:
        'space-between',

      gap: 15,

      paddingHorizontal: 24,

      paddingTop: 25,

      paddingBottom: 15,
    },

    totalStudentsText: {
      color: '#666666',

      fontSize: 13,

      fontWeight: '500',
    },

    selectedStudentText: {
      color: COLORS.red,

      fontSize: 11,

      marginTop: 5,

      fontWeight: '600',
    },

    deleteButton: {
      minWidth: 180,

      minHeight: 45,

      backgroundColor:
        COLORS.red,

      borderRadius: 8,

      alignItems: 'center',

      justifyContent: 'center',

      paddingHorizontal: 20,
    },

    deleteButtonDisabled: {
      opacity: 0.45,
    },

    deleteButtonText: {
      color: COLORS.white,

      fontSize: 12,

      fontWeight: '700',
    },

    deleteHint: {
      color: COLORS.muted,

      fontSize: 10,

      textAlign: 'right',

      paddingRight: 24,

      paddingBottom: 18,
    },

    // ==========================================
    // STATES
    // ==========================================

    centerState: {
      minHeight: 400,

      alignItems: 'center',

      justifyContent: 'center',

      padding: 30,
    },

    stateText: {
      color: COLORS.muted,

      marginTop: 14,

      fontSize: 13,
    },

    errorText: {
      color: COLORS.red,

      fontSize: 13,

      textAlign: 'center',

      marginBottom: 18,
    },

    retryButton: {
      backgroundColor:
        COLORS.navy,

      paddingHorizontal: 20,

      paddingVertical: 10,

      borderRadius: 7,
    },

    retryText: {
      color: COLORS.white,

      fontWeight: '700',
    },

    emptyRow: {
      minHeight: 220,

      alignItems: 'center',

      justifyContent: 'center',
    },

    emptyText: {
      color: COLORS.muted,

      fontSize: 14,
    },
  });