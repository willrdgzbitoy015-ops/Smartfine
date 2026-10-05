import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Sits directly under the long-pressed notice.
  confirm: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F3B7B7",
    backgroundColor: "#FFF4F4",
  },
  confirmText: { flexGrow: 1, flexBasis: 180, minWidth: 0 },
  confirmTitle: { color: "#9F1D1D", fontSize: 13, fontWeight: "800" },
  confirmHint: { color: "#7A5A5A", fontSize: 11, lineHeight: 16, marginTop: 2 },
  error: { color: "#B42318", fontSize: 11, lineHeight: 16, marginTop: 4 },
  actions: { flexDirection: "row", gap: 8, marginLeft: "auto" },
  button: {
    minWidth: 76,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  keepButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C8CFD9",
  },
  deleteButton: { backgroundColor: "#D32F2F" },
  busy: { opacity: 0.7 },
  keepText: { color: "#173A73", fontSize: 12, fontWeight: "800" },
  deleteText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  hint: {
    color: "#7D8999",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
});
