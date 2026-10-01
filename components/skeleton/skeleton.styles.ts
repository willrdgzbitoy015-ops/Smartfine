import { StyleSheet } from "react-native";

const COLORS = {
  block: "#DCE3EC",
  white: "#FFFFFF",
  border: "#E3E9F1",
};

export const styles = StyleSheet.create({
  block: {
    backgroundColor: COLORS.block,
  },
  blockOnDark: {
    backgroundColor: "rgba(255, 255, 255, 0.24)",
  },
  lineGap: {
    marginTop: 8,
  },
  listText: {
    flex: 1,
    minWidth: 0,
  },

  // List cards
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  // Table rows
  tableRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 10,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  tableLead: {
    flex: 2.2,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tableCell: {
    flex: 1,
  },

  // Label and value rows
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  detailValue: {
    maxWidth: "50%",
  },

  // Profile and form cards
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profileRow: {
    marginTop: 14,
  },
  formField: {
    marginTop: 18,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
});
