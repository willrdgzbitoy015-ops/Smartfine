import { StyleSheet } from "react-native";

const C = {
  navy: "#173A73",
  deep: "#123266",
  text: "#1B2437",
  muted: "#6B7689",
  line: "#D8DEE8",
  green: "#2E9D43",
  greenSoft: "#E8F6EA",
  red: "#D32F2F",
  redSoft: "#FDECEC",
  amber: "#9A5B00",
  amberSoft: "#FFF4E0",
  greySoft: "#EEF1F5",
  white: "#FFFFFF",
};

export const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 16,
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },

  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: C.deep,
  },

  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: C.muted,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: C.muted,
  },

  value: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: C.text,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  badgeActive: { color: C.green, backgroundColor: C.greenSoft },
  badgeLocked: { color: C.red, backgroundColor: C.redSoft },
  badgeTimed: { color: C.amber, backgroundColor: C.amberSoft },
  badgeInactive: { color: C.muted, backgroundColor: C.greySoft },

  buttons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  button: {
    minHeight: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.navy,
    backgroundColor: C.white,
  },

  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: C.navy,
  },

  buttonDanger: {
    borderColor: C.red,
  },

  buttonDangerText: {
    color: C.red,
  },

  buttonGreen: {
    borderColor: C.green,
    backgroundColor: C.green,
  },

  buttonGreenText: {
    color: C.white,
  },

  disabled: {
    opacity: 0.5,
  },

  message: {
    padding: 10,
    borderRadius: 10,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    lineHeight: 18,
  },

  messageOk: { color: C.green, backgroundColor: C.greenSoft },
  messageError: { color: C.red, backgroundColor: C.redSoft },

  // ---------- confirmation pop-up ----------

  overlay: {
    flex: 1,
    backgroundColor: "rgba(8, 24, 46, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  dialog: {
    width: "100%",
    maxWidth: 400,
    padding: 22,
    gap: 12,
    borderRadius: 16,
    backgroundColor: C.white,
  },

  dialogTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: C.deep,
  },

  dialogText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: C.muted,
  },

  dialogButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  dialogButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: C.deep,
  },

  dialogButtonDanger: {
    backgroundColor: C.red,
  },

  dialogButtonOutline: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
  },

  dialogButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: C.white,
  },

  dialogButtonOutlineText: {
    color: C.deep,
  },
});
