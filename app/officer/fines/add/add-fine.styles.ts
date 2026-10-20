import { card, OFFICER, OFFICER_COLUMN } from "@/constants/officer-theme";
import { useOfficerLayout } from "@/hooks/use-officer-layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: OFFICER.background,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: OFFICER_COLUMN,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 23,
    height: 23,
    tintColor: OFFICER.navyDeep,
    transform: [{ rotate: "180deg" }],
  },
  headerSpacer: {
    width: 44,
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: OFFICER.navyDeep,
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
  },

  // The three-step strip under the header.
  steps: {
    marginBottom: 18,
  },

  // A short explanation under a field.
  fieldHint: {
    color: OFFICER.muted,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
    marginTop: -8,
    marginBottom: 16,
  },

  // The student the fine is for, as a card.
  studentRow: {
    ...card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginBottom: 22,
    width: "100%",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: OFFICER.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  initials: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 19,
  },
  studentText: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    color: OFFICER.navyDeep,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
  },
  studentMeta: {
    color: OFFICER.muted,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 17,
  },
  form: {
    width: "100%",
    marginTop: 4,
  },
  label: {
    color: OFFICER.text,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    marginBottom: 6,
  },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: OFFICER.lineStrong,
    borderRadius: 12,
    backgroundColor: OFFICER.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  fieldText: {
    flex: 1,
    color: OFFICER.text,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    textAlign: "left",
  },
  // Shown until a violation has been chosen.
  placeholder: {
    color: OFFICER.faint,
  },
  chevron: {
    width: 11,
    height: 11,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: OFFICER.muted,
    transform: [{ rotate: "45deg" }],
    marginLeft: 10,
    marginTop: -5,
  },
  amount: {
    color: OFFICER.navyDeep,
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    textAlign: "left",
  },
  description: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: OFFICER.lineStrong,
    borderRadius: 12,
    backgroundColor: OFFICER.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: OFFICER.text,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "left",
    textAlignVertical: "top",
  },
  actions: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 12,
    marginTop: 32,
    marginBottom: 24,
  },
  button: {
    width: "100%",
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: OFFICER.navyDeep,
    shadowColor: "#123266",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: OFFICER.lineStrong,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    textAlign: "center",
    flexShrink: 1,
  },
  cancelText: {
    color: OFFICER.navyDeep,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    textAlign: "center",
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  loading: {
    paddingVertical: 70,
    alignItems: "center",
  },
  // Placeholders while the student loads.
  skeletonGap: {
    marginTop: 8,
  },
  skeletonField: {
    marginTop: 16,
  },
  error: {
    color: OFFICER.red,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  helper: {
    color: OFFICER.muted,
    fontFamily: "Poppins_300Light",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11, 22, 44, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  modalContent: {
    padding: 22,
    gap: 10,
  },
  modalTitle: {
    color: OFFICER.navyDeep,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 19,
    textAlign: "center",
    marginBottom: 14,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: OFFICER.line,
    borderRadius: 12,
  },
  optionSelected: {
    backgroundColor: OFFICER.greenSoft,
    borderColor: OFFICER.green,
  },
  optionName: {
    color: OFFICER.navyDeep,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  optionAmount: {
    color: OFFICER.muted,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  detailLabel: {
    color: OFFICER.muted,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  detailText: {
    color: OFFICER.navyDeep,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  redAmount: {
    color: OFFICER.red,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 19,
  },
  modalActions: {
    gap: 12,
    marginTop: 18,
  },
  successCheck: {
    marginVertical: 10,
  },
  receipt: {
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: OFFICER.line,
    borderRadius: 12,
    marginBottom: 12,
  },
  receiptText: {
    color: OFFICER.navyDeep,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 5,
  },
  successButton: {
    backgroundColor: OFFICER.green,
  },

  // Evidence photos chosen before the fine is recorded.
  evidenceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
  },
  evidenceCount: {
    color: OFFICER.muted,
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    marginBottom: 6,
  },
  evidenceThumbs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  evidenceThumb: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: OFFICER.greySoft,
    borderWidth: 1,
    borderColor: OFFICER.line,
  },
  evidenceThumbSmall: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  evidenceImage: {
    width: "100%",
    height: "100%",
  },
  evidenceRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17, 24, 39, 0.72)",
  },
  evidenceRemoveText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    lineHeight: 16,
  },
  evidenceButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  evidenceButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OFFICER.navy,
    backgroundColor: OFFICER.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  evidenceButtonText: {
    color: OFFICER.navyDeep,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    textAlign: "center",
  },
  uploadStatus: {
    color: OFFICER.muted,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    textAlign: "center",
  },
  // A photo that did not upload after the fine was saved.
  uploadWarning: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F2C86B",
    backgroundColor: "#FFF7E6",
    marginBottom: 12,
  },
  uploadWarningText: {
    color: "#7A5200",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    lineHeight: 18,
  },
  uploadedNote: {
    color: OFFICER.greenText,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});

// Preserves your requested colocated file structure.
// Expo Router still registers this as a blank route.
export default function OfficerAddFineStylesRoute() {
  return null;
}

export function useResponsiveStyles() {
  return useOfficerLayout(styles);
}
