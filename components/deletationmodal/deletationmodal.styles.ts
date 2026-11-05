import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",
  red: "#D32F2F",
  white: "#FFFFFF",
  message: "#64789B",
  cancelBorder: "#7A8EAD",
};

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,

    backgroundColor: "rgba(0, 0, 0, 0.40)",

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 415,

    backgroundColor: COLORS.white,

    borderRadius: 8,

    borderWidth: 1,
    borderColor: "#555555",

    paddingTop: 22,
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

  title: {
    color: COLORS.navy,

    fontSize: 27,
    fontFamily: "Poppins_700Bold",

    textAlign: "center",

    marginBottom: 30,
  },

  message: {
    width: "100%",
    maxWidth: 355,

    color: COLORS.message,

    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 21,

    textAlign: "center",

    marginBottom: 50,
  },

  buttonsRow: {
    width: "100%",
    maxWidth: 300,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",

    gap: 48,
  },

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

  deleteButton: {
    flex: 1,

    height: 43,

    backgroundColor: COLORS.red,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    color: COLORS.white,

    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },

  disabledButton: {
    opacity: 0.6,
  },
});
