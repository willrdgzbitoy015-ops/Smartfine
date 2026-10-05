import { useOfficerLayout } from "@/hooks/use-officer-layout";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#DADADA",
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    marginBottom: 18,
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
    tintColor: "#111111",
    transform: [{ rotate: "180deg" }],
  },
  headerSpacer: {
    width: 44,
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: "#123266",
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 26,
    width: "100%",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#173A73",
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
    fontSize: 20,
  },
  studentText: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    color: "#111111",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
  },
  studentMeta: {
    color: "#111111",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 16,
  },
  form: {
    width: "100%",
    marginTop: 8,
  },
  label: {
    color: "#111111",
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    marginBottom: 4,
  },
  field: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 14,
  },
  fieldText: {
    flex: 1,
    color: "#555555",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
  chevron: {
    width: 11,
    height: 11,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#111111",
    transform: [{ rotate: "45deg" }],
    marginLeft: 10,
    marginTop: -5,
  },
  amount: {
    color: "#7A89A8",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    textAlign: "center",
  },
  description: {
    minHeight: 118,
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 22,
    color: "#123266",
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    maxWidth: 230,
    alignSelf: "center",
    gap: 18,
    marginTop: 72,
    marginBottom: 24,
  },
  button: {
    width: "100%",
    minHeight: 44,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#123266",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#555555",
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    textAlign: "center",
    flexShrink: 1,
  },
  cancelText: {
    color: "#123266",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
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
    color: "#D32F2F",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  helper: {
    color: "#687386",
    fontFamily: "Poppins_300Light",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
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
    borderRadius: 16,
    overflow: "hidden",
  },
  modalContent: {
    padding: 22,
    gap: 10,
  },
  modalTitle: {
    color: "#123266",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 19,
    textAlign: "center",
    marginBottom: 14,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#D2D7DF",
    borderRadius: 7,
  },
  optionSelected: {
    backgroundColor: "#EDF6EE",
    borderColor: "#45B94F",
  },
  optionName: {
    color: "#123266",
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  optionAmount: {
    color: "#687386",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  detailLabel: {
    color: "#687386",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  detailText: {
    color: "#123266",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  redAmount: {
    color: "#D32F2F",
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
    borderColor: "#D2D7DF",
    borderRadius: 7,
    marginBottom: 12,
  },
  receiptText: {
    color: "#123266",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 5,
  },
  successButton: {
    backgroundColor: "#45B94F",
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
