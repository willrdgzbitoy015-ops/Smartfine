import { StyleSheet } from "react-native";

// Sizes the bar's animation maths depends on (see index.tsx).
export const BAR_PADDING = 6;
export const BUBBLE = 42;

export const styles = StyleSheet.create({
  // Lifts the bar off the screen edge: space around it, the page behind.
  wrap: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },

  bar: {
    flexDirection: "row",
    paddingHorizontal: BAR_PADDING,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E4EAF4",
    backgroundColor: "#FFFFFF",
    shadowColor: "#173A73",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },

  // The filled circle that slides to the active tab.
  bubble: {
    position: "absolute",
    top: 8,
    left: 0,
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: "#173A73",
    shadowColor: "#173A73",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 9,
    elevation: 4,
  },

  item: {
    flex: 1,
    alignItems: "center",
    minHeight: 64,
  },

  itemDisabled: {
    opacity: 0.45,
  },

  iconWrap: {
    width: BUBBLE,
    height: BUBBLE,
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    width: 22,
    height: 22,
  },

  // The same icon in white, shown on the circle; it fades over the grey one.
  iconOn: {
    position: "absolute",
    tintColor: "#FFFFFF",
  },

  iconOff: {
    tintColor: "#8A97AB",
  },

  labelBox: {
    height: 15,
    marginTop: 3,
    alignSelf: "stretch",
    alignItems: "center",
  },

  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },

  labelOff: {
    color: "#8A97AB",
  },

  labelOn: {
    position: "absolute",
    left: 0,
    right: 0,
    color: "#173A73",
    fontFamily: "Poppins_600SemiBold",
  },
});
