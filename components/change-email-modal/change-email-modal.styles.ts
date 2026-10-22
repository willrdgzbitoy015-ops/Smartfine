import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",
  deep: "#123266",
  text: "#1B2437",
  muted: "#6B7689",
  line: "#CBD5E1",
  field: "#F5F7FA",
  green: "#45B94F",
  red: "#D32F2F",
  redSoft: "#FDECEC",
  white: "#FFFFFF",
};

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 24, 46, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "94%",
    padding: 22,
    backgroundColor: COLORS.white,
    borderRadius: 16,
  },

  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    color: COLORS.deep,
    marginBottom: 6,
  },

  centered: {
    textAlign: "center",
  },

  intro: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.muted,
    marginBottom: 14,
  },

  strong: {
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.deep,
  },

  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 4,
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.field,
  },

  fieldRowFocused: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.white,
  },

  input: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: COLORS.text,
  },

  showButton: {
    paddingLeft: 10,
    paddingVertical: 8,
  },

  showText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.navy,
  },

  codeInput: {
    minHeight: 56,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.field,
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    letterSpacing: 10,
    textAlign: "center",
    color: COLORS.deep,
  },

  error: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.redSoft,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.red,
  },

  note: {
    marginBottom: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.muted,
  },

  resendRow: {
    alignItems: "center",
    marginBottom: 12,
  },

  resendText: {
    paddingVertical: 6,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: COLORS.navy,
  },

  resendDisabled: {
    color: COLORS.muted,
  },

  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  button: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.deep,
  },

  buttonOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
  },

  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: COLORS.white,
  },

  buttonOutlineText: {
    color: COLORS.deep,
  },

  disabled: {
    opacity: 0.55,
  },
});
