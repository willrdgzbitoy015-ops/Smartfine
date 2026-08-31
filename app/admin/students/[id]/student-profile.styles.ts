import {
  StyleSheet,
} from 'react-native';

const COLORS = {
  navy: '#173A73',

  green: '#45B94F',

  lightGreen: '#56C85C',

  red: '#FF2424',

  background: '#E8E8E8',

  white: '#FFFFFF',

  text: '#123266',

  muted: '#8C939F',
};

export const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      flexDirection: 'row',

      backgroundColor:
        COLORS.background,
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

      paddingVertical: 32,
    },

    backButton: {
      alignSelf: 'flex-start',

      marginBottom: 30,
    },

    backText: {
      color: COLORS.text,

      fontSize: 25,

      fontWeight: '800',
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
    // PROFILE
    // ==========================================

    profileCard: {
      width: '100%',

      maxWidth: 980,

      alignSelf: 'center',

      backgroundColor:
        COLORS.white,

      borderRadius: 12,

      paddingHorizontal: 28,

      paddingVertical: 22,

      flexDirection: 'row',

      flexWrap: 'wrap',

      alignItems: 'center',

      gap: 20,

      marginBottom: 32,
    },

    avatar: {
      width: 78,

      height: 78,

      borderRadius: 39,

      backgroundColor:
        COLORS.navy,

      alignItems: 'center',

      justifyContent: 'center',
    },

    avatarText: {
      color: COLORS.white,

      fontSize: 22,

      fontWeight: '800',
    },

    studentInfo: {
      flex: 1,

      minWidth: 200,
    },

    studentName: {
      color: '#111111',

      fontSize: 24,

      fontWeight: '700',

      marginBottom: 6,
    },

    studentMeta: {
      color: '#777777',

      fontSize: 13,

      marginTop: 4,
    },

    profileActions: {
      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: 10,
    },

    outlineButton: {
      borderWidth: 1,

      borderColor: '#333333',

      borderRadius: 7,

      paddingHorizontal: 15,

      paddingVertical: 11,
    },

    outlineButtonText: {
      color: '#222222',

      fontSize: 12,

      fontWeight: '700',
    },

    // ==========================================
    // SUMMARY
    // ==========================================

    summaryRow: {
      width: '92%',

      maxWidth: 900,

      alignSelf: 'center',

      flexDirection: 'row',

      flexWrap: 'wrap',

      justifyContent:
        'space-between',

      gap: 25,

      marginBottom: 35,
    },

    summaryCard: {
      flexGrow: 1,

      flexBasis: 300,

      minHeight: 115,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor: '#333333',

      borderRadius: 8,

      paddingHorizontal: 20,

      paddingVertical: 16,
    },

    summaryLabel: {
      color: COLORS.text,

      fontSize: 13,

      fontWeight: '700',

      marginBottom: 14,
    },

    outstandingValue: {
      color: COLORS.red,

      fontSize: 26,

      fontWeight: '800',
    },

    paidValue: {
      color: '#00B72A',

      fontSize: 26,

      fontWeight: '800',
    },

    // ==========================================
    // HISTORY
    // ==========================================

    historyCard: {
      width: '100%',

      maxWidth: 1000,

      minHeight: 330,

      alignSelf: 'center',

      backgroundColor:
        COLORS.white,

      borderRadius: 12,

      overflow: 'hidden',
    },

    historyTitleBar: {
      backgroundColor:
        COLORS.navy,

      minHeight: 52,

      justifyContent: 'center',

      paddingHorizontal: 20,
    },

    historyTitle: {
      color: COLORS.white,

      fontSize: 14,

      fontWeight: '700',
    },

    historyTable: {
      minWidth: 850,

      width: '100%',
    },

    historyHeader: {
      minHeight: 42,

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        '#F2F4F7',

      paddingHorizontal: 14,
    },

    historyHeaderText: {
      color: '#666666',

      fontSize: 11,

      fontWeight: '600',

      paddingHorizontal: 8,
    },

    historyRow: {
      minHeight: 55,

      flexDirection: 'row',

      alignItems: 'center',

      paddingHorizontal: 14,

      borderBottomWidth: 1,

      borderBottomColor:
        '#E4E7EB',
    },

    historyCell: {
      color: '#666666',

      fontSize: 11,

      paddingHorizontal: 8,
    },

    violationColumn: {
      width: 220,
    },

    dateColumn: {
      width: 210,
    },

    amountColumn: {
      width: 120,
    },

    fineStatusColumn: {
      width: 120,

      alignItems: 'center',

      justifyContent: 'center',
    },

    officerColumn: {
      width: 170,
    },

    violationText: {
      color: '#333333',

      fontWeight: '600',
    },

    amountText: {
      color: '#333333',

      fontWeight: '700',
    },

    statusBadge: {
      minWidth: 58,

      paddingHorizontal: 9,

      paddingVertical: 5,

      borderRadius: 14,

      alignItems: 'center',
    },

    paidBadge: {
      backgroundColor:
        '#E9F8E9',
    },

    unpaidBadge: {
      backgroundColor:
        '#FFE8E8',
    },

    statusBadgeText: {
      fontSize: 10,

      fontWeight: '700',
    },

    paidBadgeText: {
      color: COLORS.green,
    },

    unpaidBadgeText: {
      color: COLORS.red,
    },

    emptyHistory: {
      minHeight: 180,

      alignItems: 'center',

      justifyContent: 'center',
    },

    emptyHistoryText: {
      color: COLORS.muted,

      fontSize: 13,
    },

    // ==========================================
    // STATES
    // ==========================================

    centerState: {
      minHeight: 400,

      alignItems: 'center',

      justifyContent: 'center',
    },

    stateText: {
      color: COLORS.muted,

      marginTop: 15,

      fontSize: 13,
    },

    errorText: {
      color: COLORS.red,

      fontSize: 14,

      textAlign: 'center',
    },
  });