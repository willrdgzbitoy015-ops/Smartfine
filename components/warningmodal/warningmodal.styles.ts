import { StyleSheet } from "react-native";

const COLORS = {
  navy: "#173A73",
  red: "#D32F2F",
  white: "#FFFFFF",
  message: "#64789B",
  warningBackground: "#FDECEC",
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
    maxWidth: 440,

    backgroundColor: COLORS.white,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: "#555555",

    paddingTop: 26,
    paddingHorizontal: 34,
    paddingBottom: 30,

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
  // WARNING ICON
  // ==========================================

  warningMark: {
    marginBottom: 17,
  },

  // ==========================================
  // TITLE
  // ==========================================

  title: {
    color: COLORS.navy,

    fontSize: 25,
    fontWeight: "800",

    textAlign: "center",

    marginBottom: 18,
  },

  // ==========================================
  // MESSAGE
  // ==========================================

  message: {
    width: "100%",

    color: COLORS.message,

    fontSize: 14,
    lineHeight: 22,

    textAlign: "center",

    marginBottom: 30,
  },

  // ==========================================
  // OK BUTTON
  // ==========================================

  okButton: {
    width: 135,
    height: 43,

    backgroundColor: COLORS.navy,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",
  },

  okButtonText: {
    color: COLORS.white,

    fontSize: 15,
    fontWeight: "700",
  },
});
