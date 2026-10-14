import { Platform, StyleSheet } from "react-native";

// A frosted-glass card: the page shows through a blurred, navy-tinted panel
// with a hairline light edge and a soft highlight along the top.
//
// iOS and the web blur what is behind the card. Android's blur needs the whole
// app wrapped in a special view, so there the card is a more solid tint
// instead; the text stays readable either way.
const TINT_ALPHA = Platform.OS === "android" ? 0.86 : 0.64;

export const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 24,
    alignItems: "center",
    paddingHorizontal: 12,
  },

  cardWrap: {
    width: "100%",
    maxWidth: 540,
  },

  // Carries the shadow; the card inside clips its own corners.
  shadow: {
    borderRadius: 22,
    shadowColor: "#0B1B3A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  cardPressed: {
    opacity: 0.94,
  },

  // Navy colour over the blur.
  tint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `rgba(14,38,84,${TINT_ALPHA})`,
  },

  // Light catching the top edge of the glass.
  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  // The SmartFine shield, small and centred on its own tile like an app icon.
  // The tile is the logo image's own flat navy, so the shield blends in.
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#091F3B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  // The logo image is 1024 px with the shield in the middle and the wordmark
  // below it. This window shows only the shield (about 26 px wide) and stops
  // above the wordmark.
  iconWindow: {
    width: 31,
    height: 31,
    overflow: "hidden",
  },

  iconImage: {
    position: "absolute",
    width: 172,
    height: 172,
    left: -70.4,
    top: -58.3,
  },

  body: {
    flex: 1,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  title: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },

  time: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },

  message: {
    marginTop: 2,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Poppins_400Regular",
    fontSize: 13.5,
    lineHeight: 19,
  },

  more: {
    marginTop: 3,
    color: "#8FE99A",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
});
