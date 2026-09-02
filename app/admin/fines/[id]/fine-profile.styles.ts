import {
  StyleSheet,
} from 'react-native';

const COLORS = {
  navy:
    '#173A73',

  green:
    '#45B94F',

  lightGreen:
    '#56C85C',

  red:
    '#FF2424',

  background:
    '#E8E8E8',

  white:
    '#FFFFFF',

  text:
    '#123266',

  muted:
    '#8C939F',

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
    // LOADING / ERROR
    // ==========================================

    loadingScreen: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.background,

      padding: 30,
    },

    loadingText: {
      color:
        COLORS.muted,

      fontSize: 13,

      marginTop: 14,
    },

    errorStateText: {
      color:
        COLORS.red,

      fontSize: 14,

      textAlign:
        'center',

      marginBottom: 20,
    },

    retryButton: {
      backgroundColor:
        COLORS.navy,

      paddingHorizontal:
        24,

      paddingVertical:
        11,

      borderRadius: 8,
    },

    retryButtonText: {
      color:
        COLORS.white,

      fontWeight:
        '700',
    },

    backErrorButton: {
      marginTop: 15,

      padding:
        8,
    },

    backErrorText: {
      color:
        COLORS.navy,

      fontSize: 13,

      fontWeight:
        '700',
    },

    // ==========================================
    // SIDEBAR
    // SAME POSITIONING AS STUDENTS / FINES
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

    /// ==========================================
// PAGE HEADER
// ==========================================

pageHeader: {
  width: '100%',

  maxWidth: 1080,

  alignSelf: 'center',

  flexDirection: 'row',

  alignItems: 'center',

  marginBottom: 35,
},

backButton: {
  width: 52,

  height: 52,

  borderRadius: 12,

  alignItems: 'center',

  justifyContent: 'center',

  marginRight: 12,

  backgroundColor: '#FFFFFF',

  borderWidth: 1,

  borderColor: '#DADDE2',
},

backArrow: {
  color: '#111111',

  fontSize: 42,

  fontWeight: '500',

  lineHeight: 44,

  marginTop: -3,
},

pageTitle: {
  color: '#123266',

  fontSize: 27,

  fontWeight: '800',
},

    // ==========================================
    // DETAILS CARD
    // ==========================================

    detailsCard: {
      width:
        '100%',

      maxWidth:
        1000,

      minHeight:
        350,

      alignSelf:
        'center',

      backgroundColor:
        COLORS.white,

      borderRadius: 14,

      paddingHorizontal:
        30,

      paddingVertical:
        28,

      shadowColor:
        '#000000',

      shadowOpacity:
        0.04,

      shadowRadius: 6,

      shadowOffset: {
        width: 0,
        height: 2,
      },

      elevation: 2,
    },

    // ==========================================
    // CARD HEADER
    // ==========================================

    cardHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 15,
    },

    cardTitle: {
      flex: 1,

      color:
        COLORS.text,

      fontSize: 18,

      fontWeight:
        '800',
    },

    divider: {
      height: 1,

      backgroundColor:
        '#E2E5EA',

      marginTop: 22,

      marginBottom: 24,
    },
    
    // ==========================================
// CANCEL FINE MODAL
// ==========================================

modalOverlay: {
  flex: 1,

  backgroundColor:
    'rgba(0, 0, 0, 0.45)',

  alignItems:
    'center',

  justifyContent:
    'center',

  padding: 20,
},

cancelModalCard: {
  width: '100%',

  maxWidth: 520,

  backgroundColor:
    '#FFFFFF',

  borderRadius: 16,

  paddingHorizontal: 28,

  paddingVertical: 26,

  shadowColor:
    '#000000',

  shadowOpacity: 0.2,

  shadowRadius: 14,

  shadowOffset: {
    width: 0,
    height: 6,
  },

  elevation: 20,
},

cancelModalTitle: {
  color:
    '#173A73',

  fontSize: 22,

  fontWeight:
    '800',

  marginBottom: 10,
},

cancelModalMessage: {
  color:
    '#5E6673',

  fontSize: 13,

  lineHeight: 20,

  marginBottom: 22,
},

cancelModalFineReference: {
  color:
    '#173A73',

  fontWeight:
    '800',
},

cancelReasonLabel: {
  color:
    '#222222',

  fontSize: 13,

  fontWeight:
    '700',

  marginBottom: 8,
},

cancelReasonInput: {
  width: '100%',

  minHeight: 105,

  borderWidth: 1,

  borderColor:
    '#AEB4BE',

  borderRadius: 9,

  backgroundColor:
    '#FFFFFF',

  paddingHorizontal: 14,

  paddingVertical: 12,

  color:
    '#222222',

  fontSize: 13,

  outlineStyle:
    'none',
} as any,

cancelReasonCounter: {
  color:
    '#8C939F',

  fontSize: 10,

  textAlign:
    'right',

  marginTop: 5,
},

cancelModalError: {
  marginTop: 12,

  backgroundColor:
    '#FFEAEA',

  borderWidth: 1,

  borderColor:
    '#FF9B9B',

  borderRadius: 7,

  paddingHorizontal: 12,

  paddingVertical: 9,
},

cancelModalErrorText: {
  color:
    '#D32F2F',

  fontSize: 11,
},

cancelModalActions: {
  flexDirection:
    'row',

  justifyContent:
    'flex-end',

  flexWrap:
    'wrap',

  gap: 12,

  marginTop: 25,
},

cancelModalBackButton: {
  minWidth: 125,

  height: 44,

  borderWidth: 1,

  borderColor:
    '#173A73',

  borderRadius: 8,

  backgroundColor:
    '#FFFFFF',

  alignItems:
    'center',

  justifyContent:
    'center',

  paddingHorizontal: 18,
},

cancelModalBackText: {
  color:
    '#173A73',

  fontSize: 12,

  fontWeight:
    '700',
},

cancelModalConfirmButton: {
  minWidth: 145,

  height: 44,

  borderRadius: 8,

  backgroundColor:
    '#FF2424',

  alignItems:
    'center',

  justifyContent:
    'center',

  paddingHorizontal: 18,
},

cancelModalConfirmText: {
  color:
    '#FFFFFF',

  fontSize: 12,

  fontWeight:
    '800',
},

cancelModalButtonDisabled: {
  opacity: 0.5,
},
    // ==========================================
    // STATUS
    // ==========================================

    statusBadge: {
      paddingHorizontal:
        13,

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
    // INFORMATION
    // ==========================================

    informationArea: {
      width:
        '100%',

      maxWidth: 750,
    },

    infoRow: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      marginBottom:
        18,
    },

    infoLabel: {
      width: 170,

      color:
        '#626874',

      fontSize: 13,

      fontWeight:
        '500',
    },

    infoValue: {
      flex: 1,

      color:
        '#292929',

      fontSize: 13,

      fontWeight:
        '600',

      lineHeight: 19,
    },

    infoValueEmphasized: {
      color:
        COLORS.navy,

      fontWeight:
        '800',
    },

    // ==========================================
    // ACTION ERROR
    // ==========================================

    actionError: {
      width:
        '100%',

      maxWidth:
        1000,

      alignSelf:
        'center',

      marginTop: 18,

      paddingHorizontal:
        15,

      paddingVertical:
        11,

      borderWidth: 1,

      borderColor:
        '#FF9A9A',

      borderRadius: 8,

      backgroundColor:
        '#FFEAEA',
    },

    actionErrorText: {
      color:
        '#D32F2F',

      fontSize: 12,

      textAlign:
        'center',
    },

    // ==========================================
    // ACTION BUTTONS
    // ==========================================

    actionRow: {
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

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 12,

      marginTop: 55,
    },

    cancelFineButton: {
      minWidth: 135,

      height: 44,

      backgroundColor:
        COLORS.red,

      borderRadius: 7,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        20,
    },

    cancelFineText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '800',
    },

    editButton: {
      minWidth: 110,

      height: 44,

      backgroundColor:
        COLORS.navy,

      borderRadius: 7,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        20,
    },

    editButtonText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '800',
    },

    paidButton: {
      minWidth: 145,

      height: 44,

      backgroundColor:
        COLORS.green,

      borderRadius: 7,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        20,
    },

    paidButtonText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '800',
    },

    disabledButton: {
      opacity: 0.4,
    },

    completedHint: {
      color:
        COLORS.muted,

      fontSize: 11,

      textAlign:
        'center',

      marginTop: 12,
    },
  });

  