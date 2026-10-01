import { StyleSheet } from "react-native";

// Values follow the Admin dashboard summary cards.
const COLORS = {
  navy: "#173A73",
  navyDark: "#0C2F64",
  green: "#45B94F",
  red: "#FF2424",
  white: "#FFFFFF",
  text: "#123266",
  muted: "#8C939F",
};

export const styles = StyleSheet.create({
  row: {
    width: "100%",
    maxWidth: 1220,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  // Sizes the card within the row (the row may set an exact width).
  slot: {
    flexGrow: 1,
    flexBasis: 170,
    minWidth: 150,
  },
  // The visible card; fills its slot and scales as one piece when pressed.
  card: {
    flex: 1,
    minHeight: 132,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#DCE4ED",
    borderRadius: 14,
    borderTopWidth: 4,
    shadowColor: COLORS.navyDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  // Value sits under the label and the hint at the bottom, so values line
  // up across a row whether or not a card shows the ›.
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    fontSize: 30,
    fontWeight: "800",
    marginTop: 12,
  },
  valueNarrow: {
    fontSize: 24,
  },
  // Takes the value's place while it loads.
  valueSkeleton: {
    marginTop: 14,
    marginBottom: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: "auto",
    paddingTop: 8,
    // Same height with or without the ›, so hints line up too.
    minHeight: 32,
  },
  hint: {
    flex: 1,
    color: "#6B7788",
    fontSize: 11,
  },
  chevron: {
    color: "#A0AAB8",
    fontSize: 18,
    fontWeight: "700",
  },

  // Top border by tone.
  attention: { borderTopColor: "#F0A23A" },
  danger: { borderTopColor: COLORS.red },
  money: { borderTopColor: COLORS.navy },
  success: { borderTopColor: COLORS.green },
  info: { borderTopColor: COLORS.navy },
  neutral: { borderTopColor: "#9AA5B4" },

  // Tinted background while something needs attention.
  attentionHighlight: { backgroundColor: "#FFF7EC", borderColor: "#F4BE75" },
  infoHighlight: { backgroundColor: "#EEF5FF", borderColor: "#9CC0F0" },
  dangerHighlight: { backgroundColor: "#FFF4F4", borderColor: "#F3B7B7" },

  // Value colour by tone.
  attentionValue: { color: "#B26A00" },
  dangerValue: { color: COLORS.red },
  moneyValue: { color: "#00B72A" },
  successValue: { color: "#00B72A" },
  infoValue: { color: COLORS.navy },
  neutralValue: { color: "#5E6776" },
});
