import { StyleSheet } from "react-native";

const NAVY = "#173A73";

export const styles = StyleSheet.create({
  // The strip under a list: how many are showing, and the page buttons.
  bar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#E6E8EB",
    backgroundColor: "#FAFAFB",
  },

  // A phone puts the count above the buttons and centres both.
  barCompact: {
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  summary: {
    color: "#6B7689",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },

  buttons: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },

  buttonsCompact: {
    justifyContent: "center",
  },

  page: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D5DAE1",
    backgroundColor: "#FFFFFF",
  },

  pageActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },

  pageText: {
    color: NAVY,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  pageTextActive: {
    color: "#FFFFFF",
  },

  // "Prev" and "Next" are a little wider than a number.
  step: {
    paddingHorizontal: 14,
  },

  gap: {
    minWidth: 20,
    textAlign: "center",
    color: "#8C939F",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
});
