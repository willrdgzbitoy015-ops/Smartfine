import { StyleSheet } from "react-native";

// SmartFine navy, used for the title, the amount, the values and the buttons.
export const NAVY = "#173A73";
const GREEN = "#1FA45B";
const RED = "#D32F2F";
const MUTED = "#6B7686";

export const styles = StyleSheet.create({
  // The whole screen: soft grey, like a wallet app's receipt page.
  screen: {
    flex: 1,
    backgroundColor: "#EEF1F5",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  headerTitle: {
    color: NAVY,
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },

  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    alignItems: "center",
    paddingTop: 4,
  },

  // The saved picture: the white card on the same soft grey as the screen, so
  // the rounded corners are never transparent.
  shot: {
    width: "100%",
    maxWidth: 452,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#EEF1F5",
  },

  // ---------------------------------------- the card (this is what is saved)
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 28,
    paddingHorizontal: 22,
    paddingBottom: 22,
    alignItems: "center",
    shadowColor: "#0B1B3A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },

  successTitle: {
    marginTop: 14,
    color: NAVY,
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },

  amount: {
    marginTop: 2,
    color: NAVY,
    fontSize: 38,
    lineHeight: 52,
    fontFamily: "Poppins_700Bold",
  },

  paidOn: {
    color: MUTED,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },

  refundedPill: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: RED,
    backgroundColor: "#FDECEC",
  },

  refundedPillText: {
    color: RED,
    fontSize: 12,
    letterSpacing: 1.2,
    fontFamily: "Poppins_700Bold",
  },

  refundedDate: {
    marginTop: 4,
    color: RED,
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },

  divider: {
    alignSelf: "stretch",
    marginVertical: 18,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D5DBE5",
  },

  rows: {
    alignSelf: "stretch",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  rowLabel: {
    width: "40%",
    paddingRight: 10,
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Poppins_400Regular",
  },

  rowValue: {
    flex: 1,
    color: NAVY,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "right",
    fontFamily: "Poppins_600SemiBold",
  },

  // ---------------------------------------- SmartFine and the school
  brand: {
    alignItems: "center",
  },

  // The logo picture has its own dark navy background, so it is shown as a
  // rounded badge (cropped to the logo) rather than on the white card.
  logoBadge: {
    width: 210,
    height: 108,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0A1F3C",
  },

  schoolName: {
    marginTop: 12,
    color: NAVY,
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
  },

  footnote: {
    marginTop: 4,
    color: MUTED,
    fontSize: 10.5,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
  },

  // ---------------------------------------- buttons and messages
  actions: {
    width: "100%",
    maxWidth: 452,
    paddingHorizontal: 16,
    marginTop: 2,
    gap: 10,
  },

  primaryButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: NAVY,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },

  secondaryButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: NAVY,
    backgroundColor: "#FFFFFF",
  },

  secondaryButtonText: {
    color: NAVY,
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  message: {
    marginTop: 4,
    paddingHorizontal: 4,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
  },

  messageSuccess: {
    color: "#177A45",
  },

  messageError: {
    color: RED,
  },

  // "View Receipt" on a paid fine / the Transaction Voucher.
  viewButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: NAVY,
    backgroundColor: "#FFFFFF",
  },

  viewButtonText: {
    color: NAVY,
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  // ---------------------------------------- loading and failure
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  errorText: {
    marginTop: 12,
    color: NAVY,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
  },
});
