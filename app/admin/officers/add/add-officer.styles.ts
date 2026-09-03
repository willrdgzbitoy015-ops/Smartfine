import {
  StyleSheet,
} from 'react-native';

const COLORS = {
  navy: '#173A73',
  green: '#45B94F',
  lightGreen: '#56C85C',
  white: '#FFFFFF',
  background: '#E8E8E8',
  text: '#123266',
  muted: '#8C939F',
  red: '#D32F2F',
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
        1000,

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

    subtitle: {
      color:
        '#6F7682',

      fontSize: 12,

      marginTop: 5,
    },

    // ==========================================
    // FORM CONTAINER
    // ==========================================

    formContainer: {
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
        'flex-start',

      gap: 25,
    },

    // ==========================================
    // FORM CARD
    // ==========================================

    formCard: {
      flex: 1,

      minWidth:
        320,

      backgroundColor:
        COLORS.white,

      borderRadius:
        14,

      paddingHorizontal:
        28,

      paddingTop:
        25,

      paddingBottom:
        30,

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

    cardTitle: {
      color:
        COLORS.text,

      fontSize: 18,

      fontWeight:
        '800',

      marginBottom:
        24,
    },

    // ==========================================
    // LABEL
    // ==========================================

    label: {
      color:
        '#222222',

      fontSize: 12,

      fontWeight:
        '600',

      marginBottom:
        7,

      marginTop:
        4,
    },

    // ==========================================
    // INPUT
    // ==========================================

    input: {
      width:
        '100%',

      height: 45,

      borderWidth: 1,

      borderColor:
        '#B9BEC7',

      borderRadius: 8,

      backgroundColor:
        COLORS.white,

      paddingHorizontal:
        14,

      color:
        '#222222',

      fontSize: 12,

      marginBottom:
        17,

      outlineStyle:
        'none',
    } as any,

    // ==========================================
    // TWO COLUMN ROW
    // ==========================================

    twoColumnRow: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 14,
    },

    flexField: {
      flex: 1,

      minWidth:
        160,
    },

    // ==========================================
    // READ ONLY
    // ==========================================

    readOnlyBox: {
      width:
        '100%',

      height: 45,

      borderWidth: 1,

      borderColor:
        '#CCD1D8',

      borderRadius: 8,

      backgroundColor:
        '#F2F4F7',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 5,
    },

    readOnlyText: {
      color:
        COLORS.navy,

      fontSize: 13,

      fontWeight:
        '800',
    },

    readOnlyPlaceholder: {
      color:
        COLORS.muted,

      fontSize: 11,

      fontWeight:
        '600',
    },

    helperText: {
      color:
        COLORS.muted,

      fontSize: 10,

      lineHeight: 15,

      marginBottom:
        17,
    },

    // ==========================================
    // PASSWORD
    // ==========================================

    passwordContainer: {
      width:
        '100%',

      height: 45,

      borderWidth: 1,

      borderColor:
        '#B9BEC7',

      borderRadius: 8,

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom:
        5,
    },

    passwordInput: {
      flex: 1,

      height:
        '100%',

      paddingHorizontal:
        14,

      color:
        '#222222',

      fontSize: 12,

      outlineStyle:
        'none',
    } as any,

    passwordToggle: {
      height:
        '100%',

      justifyContent:
        'center',

      paddingHorizontal:
        14,
    },

    passwordToggleText: {
      color:
        COLORS.navy,

      fontSize: 11,

      fontWeight:
        '800',
    },

    // ==========================================
    // STATUS
    // ==========================================

    statusCard: {
      width:
        '100%',

      minHeight:
        72,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      backgroundColor:
        '#F7F8FA',

      borderRadius:
        10,

      paddingHorizontal:
        16,

      marginTop:
        10,
    },

    statusLabel: {
      color:
        '#555D68',

      fontSize: 11,

      fontWeight:
        '600',
    },

    statusValue: {
      fontSize: 13,

      fontWeight:
        '800',

      marginTop: 3,
    },

    statusActive: {
      color:
        COLORS.green,
    },

    statusInactive: {
      color:
        COLORS.red,
    },

    // ==========================================
    // SWITCH
    // ==========================================

    switchTrack: {
      width: 48,

      height: 26,

      borderRadius:
        20,

      backgroundColor:
        '#C7CBD2',

      padding: 3,

      justifyContent:
        'center',
    },

    switchTrackActive: {
      backgroundColor:
        COLORS.green,
    },

    switchThumb: {
      width: 20,

      height: 20,

      borderRadius:
        20,

      backgroundColor:
        COLORS.white,
    },

    switchThumbActive: {
      alignSelf:
        'flex-end',
    },

    statusNote: {
      color:
        COLORS.muted,

      fontSize: 10,

      lineHeight: 15,

      marginTop: 8,
    },

    // ==========================================
    // ERROR
    // ==========================================

    errorBox: {
      width:
        '100%',

      maxWidth:
        1000,

      alignSelf:
        'center',

      backgroundColor:
        '#FFEAEA',

      borderWidth: 1,

      borderColor:
        '#FF9B9B',

      borderRadius: 8,

      paddingHorizontal:
        15,

      paddingVertical:
        11,

      marginTop:
        20,
    },

    errorTitle: {
      color:
        COLORS.red,

      fontSize: 12,

      fontWeight:
        '800',

      marginBottom: 3,
    },

    errorText: {
      color:
        COLORS.red,

      fontSize: 11,

      lineHeight: 16,
    },

    // ==========================================
    // ACTIONS
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

      justifyContent:
        'center',

      gap: 20,

      marginTop:
        35,
    },

    cancelButton: {
      width: 220,

      height: 45,

      backgroundColor:
        '#E2E3E5',

      borderWidth: 1,

      borderColor:
        COLORS.navy,

      borderRadius: 8,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    cancelButtonText: {
      color:
        '#222222',

      fontSize: 12,

      fontWeight:
        '700',
    },

    createButton: {
      width: 220,

      height: 45,

      backgroundColor:
        COLORS.green,

      borderRadius: 8,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    createButtonDisabled: {
      opacity:
        0.5,
    },

    createButtonText: {
      color:
        COLORS.white,

      fontSize: 12,

      fontWeight:
        '800',
    },
  });