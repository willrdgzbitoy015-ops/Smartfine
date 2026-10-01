import { Text, View } from "react-native";

import {
  NotificationCounts,
  useNotificationCounts,
} from "@/hooks/use-notification-counts";
import { styles } from "./notification-badge.styles";

type Variant = "sidebar" | "menu" | "tab" | "bell";

export function NotificationBadge({
  count,
  variant,
}: {
  count: number;
  variant: Variant;
}) {
  if (!count || count <= 0) return null;

  const admin = variant === "sidebar" || variant === "menu";

  return (
    <View
      style={[styles.base, styles[variant]]}
      accessibilityLabel={`${count} unread ${count === 1 ? "notification" : "notifications"}`}
    >
      <Text style={admin ? styles.adminText : styles.phoneText}>
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}

// Each Admin module counts only its own notification types.
export function adminModuleCount(label: string, counts: NotificationCounts) {
  if (label === "Fines") return counts.FINE + counts.PAYMENT;
  if (label === "Reports") return counts.reports;
  return 0;
}

function LiveAdminBadge({
  label,
  variant,
}: {
  label: string;
  variant: "sidebar" | "menu";
}) {
  const counts = useNotificationCounts();
  return (
    <NotificationBadge count={adminModuleCount(label, counts)} variant={variant} />
  );
}

// Admin sidebar and phone menu: Fines (FINE + PAYMENT) and Reports.
export function AdminNavBadge({
  label,
  variant = "sidebar",
}: {
  label: string;
  variant?: "sidebar" | "menu";
}) {
  if (label !== "Fines" && label !== "Reports") return null;
  return <LiveAdminBadge label={label} variant={variant} />;
}

function LiveTabBadge() {
  const counts = useNotificationCounts();
  return <NotificationBadge count={counts.total} variant="tab" />;
}

// Student and Officer bottom tabs: the notification bell lives on Home.
export function HomeTabBadge({ label }: { label: string }) {
  if (label !== "Home") return null;
  return <LiveTabBadge />;
}
