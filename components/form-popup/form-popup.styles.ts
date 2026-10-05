import { StyleSheet } from "react-native";

const NAVY = "#173A73";
const TEXT = "#123266";
const MUTED = "#7E8794";
const GREEN = "#45B94F";
const RED = "#D32F2F";

export const styles = StyleSheet.create({
  // ==========================================
  // LAYOUT
  // ==========================================
  columns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  column: {
    flexGrow: 1,
    flexBasis: 380,
    minWidth: 0,
    gap: 18,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  section: {
    borderWidth: 1,
    borderColor: "#E5E9F0",
    borderRadius: 12,
    padding: 18,
    paddingBottom: 6,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: { color: TEXT, fontSize: 15, fontWeight: "800", marginBottom: 4 },
  sectionDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  readOnly: {
    width: "100%",
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 8,
    backgroundColor: "#ECEFF3",
    paddingHorizontal: 13,
  },
  readOnlyText: { color: TEXT, fontSize: 13, fontWeight: "800" },
  readOnlyPlaceholder: { color: "#A0A7B2", fontSize: 13 },
  hint: { color: MUTED, fontSize: 10, lineHeight: 15, marginTop: 5 },
  disabled: { opacity: 0.55 },

  // ==========================================
  // CHOICES
  // ==========================================
  select: {
    width: "100%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 8,
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 13,
  },
  selectOpen: { borderColor: NAVY, backgroundColor: "#FFFFFF" },
  selectText: { flex: 1, color: "#333840", fontSize: 13, fontWeight: "600" },
  selectPlaceholder: { flex: 1, color: "#A0A7B2", fontSize: 13 },
  selectArrow: { color: NAVY, fontSize: 10 },
  options: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  optionsScroll: { maxHeight: 220 },
  option: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  optionSelected: { backgroundColor: "#EAF1FB" },
  optionTitle: { color: TEXT, fontSize: 13, fontWeight: "700" },
  optionSubtitle: { color: MUTED, fontSize: 11, marginTop: 2 },
  optionEmpty: { color: MUTED, fontSize: 12, padding: 13 },
  checkOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 10,
    padding: 13,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  checkOptionOn: { borderColor: NAVY, backgroundColor: "#F4F8FE" },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#9AA3B0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkBoxOn: { borderColor: NAVY, backgroundColor: NAVY },
  checkBoxMark: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  checkText: { flex: 1 },
  checkTitle: { color: TEXT, fontSize: 13, fontWeight: "800" },
  checkDescription: { color: "#4A5668", fontSize: 12, lineHeight: 18, marginTop: 2 },

  // ==========================================
  // STATUS SWITCH
  // ==========================================
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
  },
  statusLabel: { color: "#3F434A", fontSize: 12, fontWeight: "700" },
  statusValue: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  statusActive: { color: "#2E9D43" },
  statusInactive: { color: RED },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#C9D0DA",
    padding: 3,
    justifyContent: "center",
  },
  switchTrackOn: { backgroundColor: GREEN },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },
  switchThumbOn: { alignSelf: "flex-end" },

  // ==========================================
  // PROFILE PICTURE
  // ==========================================
  photo: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#E5E9F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 84, height: 84 },
  avatarText: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  photoText: { flexGrow: 1, flexBasis: 220, minWidth: 0 },
  photoTitle: { color: TEXT, fontSize: 14, fontWeight: "800" },
  photoActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  photoConfirm: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F3B7B7",
    backgroundColor: "#FFF4F4",
  },
  photoConfirmText: { color: "#9F1D1D", fontSize: 12, fontWeight: "700" },
  smallButton: {
    minHeight: 36,
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C8CFD9",
    backgroundColor: "#FFFFFF",
  },
  smallPrimary: { backgroundColor: NAVY, borderColor: NAVY },
  smallDanger: { backgroundColor: RED, borderColor: RED },
  smallDangerOutline: { borderColor: RED },
  smallText: { color: NAVY, fontSize: 11, fontWeight: "800" },
  smallTextLight: { color: "#FFFFFF" },
  smallTextDanger: { color: RED },

  // ==========================================
  // BANNERS
  // ==========================================
  banner: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  bannerError: { backgroundColor: "#FFF0EE", borderColor: "#F6C9C2" },
  bannerWarning: { backgroundColor: "#FFF7E8", borderColor: "#F0C38E" },
  bannerInfo: { backgroundColor: "#EEF3FA", borderColor: "#C9D7EC" },
  bannerTitle: { color: TEXT, fontSize: 13, fontWeight: "800", marginBottom: 2 },
  bannerTitleError: { color: "#B42318" },
  bannerTitleWarning: { color: "#875000" },
  bannerText: { color: "#4A5668", fontSize: 12, lineHeight: 18 },

  // ==========================================
  // SUCCESS
  // ==========================================
  success: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 8 },
  successCheck: { marginBottom: 14 },
  // Saved with a problem (for example a picture that did not upload).
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E7F8EA",
    borderWidth: 2,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successIconWarning: { backgroundColor: "#FFF4DE", borderColor: "#E0A23B" },
  successMark: { color: "#2E9D43", fontSize: 28, fontWeight: "900" },
  successMarkWarning: { color: "#A86400" },
  successTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  successLine: {
    color: "#4A5668",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  successWarning: { width: "100%", maxWidth: 520, marginTop: 16 },
});
