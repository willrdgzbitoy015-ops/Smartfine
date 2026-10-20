import { StyleSheet } from "react-native";

import { OFFICER } from "@/constants/officer-theme";

export const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    gap: 8,
  },

  section: {
    padding: 12,
    gap: 10,
    backgroundColor: OFFICER.surface,
    borderWidth: 1,
    borderColor: OFFICER.line,
    borderRadius: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: OFFICER.navy,
    letterSpacing: 0.3,
  },

  sectionCount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: OFFICER.muted,
  },

  // ---------- People ----------

  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: OFFICER.navy,
  },

  avatarSystem: {
    backgroundColor: OFFICER.greySoft,
  },

  avatarImage: {
    width: 36,
    height: 36,
  },

  avatarText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FFFFFF",
  },

  avatarSystemText: {
    color: OFFICER.grey,
  },

  personText: {
    flex: 1,
    minWidth: 0,
  },

  personLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    color: OFFICER.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  personName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: OFFICER.text,
  },

  personDetail: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: OFFICER.muted,
  },

  reason: {
    marginLeft: 46,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: OFFICER.greySoft,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: OFFICER.text,
  },

  divider: {
    height: 1,
    backgroundColor: OFFICER.line,
  },

  // ---------- Photos ----------

  thumbs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  thumb: {
    width: 76,
    height: 76,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: OFFICER.greySoft,
    borderWidth: 1,
    borderColor: OFFICER.line,
  },

  thumbImage: {
    width: "100%",
    height: "100%",
  },

  thumbFailed: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },

  thumbFailedText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    color: OFFICER.muted,
    textAlign: "center",
  },

  removeBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17, 24, 39, 0.72)",
  },

  removeBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    lineHeight: 15,
    color: "#FFFFFF",
  },

  muted: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: OFFICER.muted,
  },

  removedNote: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: OFFICER.grey,
    fontStyle: "italic",
  },

  confirmBox: {
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: OFFICER.redLine,
    backgroundColor: OFFICER.redSoft,
  },

  confirmText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: OFFICER.text,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },

  button: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: OFFICER.navy,
    backgroundColor: OFFICER.surface,
  },

  buttonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: OFFICER.navy,
  },

  dangerButton: {
    borderColor: OFFICER.red,
    backgroundColor: OFFICER.red,
  },

  dangerButtonText: {
    color: "#FFFFFF",
  },

  disabled: {
    opacity: 0.55,
  },

  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  error: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: OFFICER.red,
  },

  retry: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: OFFICER.navy,
  },

  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  skeletonText: {
    flex: 1,
    gap: 6,
  },

  // ---------- Full-screen viewer ----------

  viewer: {
    flex: 1,
    backgroundColor: "rgba(6, 12, 24, 0.94)",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 14,
  },

  viewerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  viewerCount: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },

  viewerClose: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },

  viewerCloseText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },

  viewerImage: {
    flex: 1,
    width: "100%",
  },

  viewerCaption: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.82)",
    textAlign: "center",
  },

  viewerNav: {
    flexDirection: "row",
    gap: 12,
  },

  viewerNavButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },

  viewerNavText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
});
