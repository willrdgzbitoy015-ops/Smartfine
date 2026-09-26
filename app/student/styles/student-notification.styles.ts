import { StyleSheet } from "react-native";

export const notificationStyles = StyleSheet.create({
  notificationFilters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  notificationFilter: {
    minHeight: 40,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFC5CE",
  },

  notificationFilterActive: {
    backgroundColor: "#123266",
    borderColor: "#123266",
  },

  notificationFilterText: {
    color: "#123266",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },

  notificationFilterTextActive: {
    color: "#FFFFFF",
  },

  unreadActivityCard: {
    backgroundColor: "#EAF3FF",
    borderColor: "#8FB7EA",
  },

  activityTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  activityReadState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1677E8",
  },

  activityReadText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
  },

  readErrorBox: {
    padding: 12,
    backgroundColor: "#FFF1F0",
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },

  readErrorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#B42318",
  },

  readRetryText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#123266",
  },

  bellBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#E52323",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9,
  },

  fineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  fineReadLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9,
  },

  newLabel: {
    color: "#E52323",
  },

  readLabel: {
    color: "#626975",
  },

  markReadButton: {
    minHeight: 36,
    alignSelf: "flex-start",
    justifyContent: "center",
    marginTop: 2,
  },

  markReadText: {
    color: "#123266",
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
  },

  viewDetailsButton: {
    minHeight: 36,
    alignSelf: "flex-start",
    justifyContent: "center",
  },

  viewDetailsText: {
    color: "#123266",
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    textDecorationLine: "underline",
  },

  detailsOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  detailsCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    padding: 20,
    backgroundColor: "#E8E8E8",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFC5CE",
  },

  detailsTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#123266",
    marginBottom: 10,
  },

  detailsViolation: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#123266",
    marginBottom: 12,
  },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#D0D3D8",
  },

  detailsRemarks: {
    gap: 4,
    paddingVertical: 10,
  },

  detailsLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: "#626975",
  },

  detailsValue: {
    flexShrink: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#111111",
    textAlign: "right",
  },

  detailsReadStatus: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    marginTop: 8,
  },

  detailsCloseButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#123266",
    borderRadius: 8,
  },

  detailsCloseText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#FFFFFF",
  },
});

// Compatibility workaround while this stylesheet lives inside app/.
export default function StudentNotificationStylesRoute() {
  return null;
}
