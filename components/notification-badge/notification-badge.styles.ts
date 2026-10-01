import { StyleSheet } from "react-native";

// Values match the existing Admin navBadge and Student bellBadge styles.
export const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Admin tablet sidebar: pushed to the end of the nav row.
  sidebar: {
    marginLeft: "auto",
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: "#FF2424",
  },

  // Admin phone menu pill: sits after the label.
  menu: {
    marginLeft: 6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "#FF2424",
  },

  // Student and Officer bottom tabs: over the top-right of the tab icon.
  tab: {
    position: "absolute",
    top: 4,
    left: "50%",
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#E52323",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },

  // Header bell button.
  bell: {
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
  },

  adminText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  phoneText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9,
  },
});
