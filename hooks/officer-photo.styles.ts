import { useOfficerLayout } from "@/hooks/use-officer-layout";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  photoWrapper: {
    position: "relative",
    alignSelf: "center",
    paddingBottom: 6,
    paddingRight: 6,
  },
  photoButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#ABC4E8",
    alignItems: "center",
    justifyContent: "center",
  },
  photoIcon: { width: 22, height: 22, resizeMode: "contain" },
  photoHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: "#555555",
    textAlign: "center",
    marginTop: 12,
  },
});

export function useOfficerPhotoStyles() {
  return useOfficerLayout(styles);
}
