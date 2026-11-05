import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

import { Colors } from "@/constants/theme";

// ==========================================
// ICONS
// ==========================================

// The one icon set for SmartFine (Ionicons). Screens ask for an icon by what
// it means, never by its Ionicons name, so the same idea looks the same for
// the Admin, the Officer and the Student. Keys ending in "Active" are the
// filled version shown for the selected tab or menu item.
export const ICONS = {
  // Navigation
  dashboard: "grid-outline",
  dashboardActive: "grid",
  fines: "receipt-outline",
  finesActive: "receipt",
  notifications: "notifications-outline",
  notificationsActive: "notifications",
  reports: "bar-chart-outline",
  reportsActive: "bar-chart",
  profile: "person-circle-outline",
  profileActive: "person-circle",
  students: "people-outline",
  studentsActive: "people",
  officers: "id-card-outline",
  officersActive: "id-card",
  settings: "settings-outline",
  settingsActive: "settings",
  qr: "qr-code-outline",
  qrActive: "qr-code",
  logout: "log-out-outline",

  // Money
  cash: "cash-outline",
  payment: "card-outline",
  wallet: "wallet-outline",

  // Fine and payment status
  pending: "time-outline",
  paid: "checkmark-circle",
  cancelled: "close-circle",

  // Results
  failed: "alert-circle",
  warning: "warning",
  info: "information-circle",

  // Accounts and fields
  user: "person-outline",
  lock: "lock-closed-outline",
  policy: "shield-checkmark-outline",
  eye: "eye-outline",
  eyeOff: "eye-off-outline",
  edit: "create-outline",

  // Actions
  back: "chevron-back",
  close: "close",
  search: "search-outline",
  refresh: "refresh-outline",
  download: "download-outline",
  share: "share-outline",
  import: "cloud-upload-outline",
  check: "checkmark",

  // Directions
  chevronForward: "chevron-forward",
  chevronDown: "chevron-down",
  chevronUp: "chevron-up",
} satisfies Record<string, ComponentProps<typeof Ionicons>["name"]>;

export type IconName = keyof typeof ICONS;

export const ICON_SIZE = { sm: 18, md: 22, lg: 28 } as const;

// ==========================================
// APP ICON
// ==========================================

type AppIconProps = {
  name: IconName;
  size?: keyof typeof ICON_SIZE | number;
  color?: string;
  // Shows the filled "...Active" version when the icon has one, for the
  // selected tab or menu item.
  focused?: boolean;
};

export default function AppIcon({
  name,
  size = "md",
  color = Colors.light.text,
  focused = false,
}: AppIconProps) {
  const activeName = `${name}Active`;

  const iconName: IconName =
    focused && activeName in ICONS ? (activeName as IconName) : name;

  return (
    <Ionicons
      name={ICONS[iconName]}
      size={typeof size === "number" ? size : ICON_SIZE[size]}
      color={color}
      allowFontScaling={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
