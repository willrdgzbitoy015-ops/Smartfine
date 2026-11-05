import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",
  white: "#FFFFFF",
  message: "#64789B",
  cancelBorder: "#7A8EAD",
};

export const styles = StyleSheet.create({
  // ==========================================
  // OVERLAY
  // ==========================================

  overlay: {
    flex: 1,

    backgroundColor: "rgba(0, 0, 0, 0.40)",

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 20,
  },

  // ==========================================
  // MODAL CARD
  // ==========================================

  modalCard: {
    width: "100%",
    maxWidth: 415,

    backgroundColor: COLORS.white,

    borderRadius: 8,

    borderWidth: 1,
    borderColor: "#555555",

    paddingTop: 16,
    paddingHorizontal: 30,
    paddingBottom: 36,

    alignItems: "center",

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.2,
    shadowRadius: 10,

    elevation: 12,
  },

  // ==========================================
  // TITLE
  // ==========================================

  title: {
    color: COLORS.navy,

    fontSize: 27,
    fontFamily: "Poppins_700Bold",

    textAlign: "center",

    marginBottom: 30,
  },

  // ==========================================
  // MESSAGE
  // ==========================================

  message: {
    width: "100%",
    maxWidth: 355,

    color: COLORS.message,

    fontSize: 14,
    fontFamily: "Poppins_400Regular",

    lineHeight: 20,

    textAlign: "center",

    marginBottom: 52,
  },

  // ==========================================
  // ERROR
  // ==========================================

  error: {
    width: "100%",
    maxWidth: 355,

    color: "#D32F2F",

    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",

    lineHeight: 19,

    textAlign: "center",

    marginTop: -36,
    marginBottom: 24,
  },

  // ==========================================
  // BUTTON ROW
  // ==========================================

  buttonsRow: {
    width: "100%",
    maxWidth: 300,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",

    gap: 48,
  },

  // ==========================================
  // CANCEL BUTTON
  // ==========================================

  cancelButton: {
    flex: 1,

    height: 43,

    backgroundColor: COLORS.white,

    borderWidth: 2,
    borderColor: COLORS.cancelBorder,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    color: COLORS.navy,

    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },

  // ==========================================
  // LOG OUT BUTTON
  // ==========================================

  logoutButton: {
    flex: 1,

    height: 43,

    backgroundColor: COLORS.navy,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",
  },

  logoutText: {
    color: COLORS.white,

    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },

  // ==========================================
  // DISABLED
  // ==========================================

  disabledButton: {
    opacity: 0.65,
  },
});
