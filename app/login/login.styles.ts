import { StyleSheet } from 'react-native';

const COLORS = {
  navy: '#173A73',
  navyDark: '#082B52',
  card: '#405C88',
  green: '#45B94F',
  lime: '#8ED000',
  white: '#FFFFFF',
  textDark: '#333333',
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },

  container: {
    flexGrow: 1,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabletContainer: {
    flexDirection: 'row',
    paddingHorizontal: 70,
    paddingVertical: 50,
    gap: 80,
  },

  phoneContainer: {
    flexDirection: 'column',
    paddingHorizontal: 22,
    paddingVertical: 35,
  },

  brandSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandTablet: {
    width: '45%',
  },

  brandPhone: {
    width: '100%',
    marginBottom: 28,
  },

  brandLogo: {
    resizeMode: 'contain',
  },

  brandLogoTablet: {
    width: 320,
    height: 190,
  },

  brandLogoPhone: {
    width: 280,
    height: 165,
  },

  tagline: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '600',
  },

  taglineTablet: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },

  taglinePhone: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  loginSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginTablet: {
    width: '42%',
  },

  loginPhone: {
    width: '100%',
  },

  loginCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    alignItems: 'center',
  },

  loginCardTablet: {
    width: 330,
    paddingHorizontal: 28,
    paddingVertical: 30,
  },

  loginCardPhone: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  smallLogoBox: {
    width: 95,
    height: 95,
    backgroundColor: COLORS.navyDark,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  smallLogo: {
    width: 78,
    height: 78,
    resizeMode: 'contain',
  },

  welcomeText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  loginTitle: {
    color: '#59E264',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 18,
  },

  input: {
    width: '100%',
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 5,
    paddingHorizontal: 14,
    color: COLORS.textDark,
    fontSize: 12,
    marginBottom: 12,
  },

  passwordContainer: {
    width: '100%',
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    color: COLORS.textDark,
    fontSize: 12,
  },

  showButton: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
  },

  showText: {
    color: COLORS.navyDark,
    fontSize: 10,
    fontWeight: '700',
  },

  optionsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  errorBox: {
  width: '100%',
  backgroundColor: '#FFF1F1',
  borderWidth: 1,
  borderColor: '#D32F2F',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginTop: 10,
  marginBottom: 4,
},

errorTitle: {
  fontSize: 13,
  fontWeight: '700',
  color: '#D32F2F',
  marginBottom: 3,
},

errorMessage: {
  fontSize: 11,
  color: '#8A1C1C',
  lineHeight: 16,
},

  checkbox: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.white,
    borderRadius: 1,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: COLORS.green,
  },

  checkmark: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '800',
  },

  rememberText: {
    color: COLORS.white,
    fontSize: 9,
  },

  forgotText: {
    color: '#50E564',
    fontSize: 9,
    fontWeight: '600',
  },

  loginButton: {
    width: '60%',
    height: 40,
    backgroundColor: COLORS.green,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  securityText: {
    color: COLORS.white,
    fontSize: 8,
    marginTop: 10,
    textAlign: 'center',
  },
});