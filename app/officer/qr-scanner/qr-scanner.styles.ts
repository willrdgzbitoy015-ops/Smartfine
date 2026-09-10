import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  scanScreen: {
    flex: 1,
    backgroundColor: "#123266",
  },

  scanContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingTop: 30,
    paddingBottom: 28,
  },

  scanArea: {
    flex: 1,
    minHeight: 340,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 28,
  },

  cameraFrame: {
    width: "100%",
    maxWidth: 240,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#0C2F64",
  },
  camera: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  cameraPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  frameBorder: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#45B94F",
    borderRadius: 12,
  },

  qrIcon: {
    width: 55,
    height: 55,
    opacity: 0.65,
  },

  scanInstruction: {
    maxWidth: 290,
    marginTop: 18,
    color: "#FFFFFF",
    fontFamily: "Poppins_300Light",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  supportText: {
    maxWidth: 290,
    marginTop: 12,
    color: "#D5DFEF",
    fontFamily: "Poppins_300Light",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  permissionButton: {
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#173A73",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  scanError: {
    maxWidth: 310,
    marginTop: 16,
    color: "#FFD5D5",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  scanActions: {
    width: "100%",
    maxWidth: 270,
    alignSelf: "center",
    gap: 12,
    paddingTop: 18,
  },

  button: {
    width: "100%",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
  },

  confirmButton: {
    backgroundColor: "#123266",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },

  cancelButton: {
    backgroundColor: "#D32F2F",
  },

  textButton: {
    minHeight: 44,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  linkText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    textAlign: "center",
    textDecorationLine: "underline",
  },

  disabled: {
    opacity: 0.45,
  },

  manualPanel: {
    width: "100%",
    paddingTop: 6,
  },

  manualLabel: {
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    marginBottom: 8,
  },

  manualInput: {
    minHeight: 46,
    backgroundColor: "#FFFFFF",
    color: "#123266",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    borderRadius: 6,
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  manualSearchButton: {
    backgroundColor: "#45B94F",
  },

  resultScreen: {
    flex: 1,
    backgroundColor: "#E8E8E8",
  },

  resultContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 65,
    paddingBottom: 36,
  },

  successCircle: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: "#00C900",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  successIcon: {
    width: 75,
    height: 75,
    tintColor: "#E8E8E8",
  },

  identifiedTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 17,
    color: "#00AE16",
    textAlign: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    overflow: "hidden",
    backgroundColor: "#173A73",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitials: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 25,
    color: "#FFFFFF",
  },

  studentName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#161616",
    textAlign: "center",
    marginBottom: 8,
  },

  studentDetails: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#161616",
    textAlign: "center",
  },

  inactiveNotice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#D32F2F",
    textAlign: "center",
    marginTop: 18,
  },

  resultError: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#D32F2F",
    textAlign: "center",
    marginTop: 14,
  },

  resultActions: {
    width: "100%",
    maxWidth: 270,
    gap: 12,
    marginTop: 60,
  },

  addFineButton: {
    backgroundColor: "#123266",
  },

  resultCancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#777777",
  },

  resultCancelText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#123266",
  },
});

// Keeps your requested colocated screen/styles structure.
// Expo Router will register this as a blank route.
export default function OfficerQRScannerStylesRoute() {
  return null;
}
