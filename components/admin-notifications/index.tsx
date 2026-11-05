import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";

import {
  AdminNoticeList,
  type AdminNotice,
  type AdminNoticeFilter,
} from "@/components/admin-modal";
import { NotificationBadge } from "@/components/notification-badge";
import { API_BASE } from "@/constants/api";
import { useLiveReload } from "@/hooks/use-live-updates";
import {
  refreshNotificationCounts,
  useNotificationCounts,
} from "@/hooks/use-notification-counts";

// ==========================================
// ADMIN NOTIFICATIONS
// The bell on the Administrator's Dashboard: the same bell and red count the
// Student and Officer Home screens have, and a list of every notice (new
// fines, cashier requests, GCash payments to review, refunds, payments
// collected). The count is the same one the Dashboard sidebar item shows.
// ==========================================

export type BellNotice = AdminNotice & {
  notificationType: "FINE" | "PAYMENT" | "SYSTEM" | "ACCOUNT";
  fineId: number | null;
  paymentId: number | null;
};

export const BELL_FILTERS: AdminNoticeFilter<BellNotice>[] = [
  { key: "ALL", label: "All", test: () => true },
  { key: "UNREAD", label: "Unread", test: (notice) => !notice.isRead },
  { key: "FINE", label: "New fines", test: (notice) => notice.notificationType === "FINE" },
  {
    key: "PAYMENT",
    label: "Cash requests",
    test: (notice) => notice.notificationType === "PAYMENT" && !/refund/i.test(notice.title),
  },
  { key: "REFUND", label: "Refunds", test: (notice) => /refund/i.test(notice.title) },
  { key: "COLLECTED", label: "Payments", test: (notice) => notice.title === "Payment Collected" },
];

// The bell button, top right of the Dashboard header.
export function AdminNotificationBell({ onPress }: { onPress: () => void }) {
  const counts = useNotificationCounts();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={
        counts.total > 0
          ? `View notifications, ${counts.total} unread`
          : "View notifications"
      }
    >
      <Image
        source={require("../../assets/icons/notification.png")}
        style={styles.icon}
        resizeMode="contain"
      />

      <NotificationBadge count={counts.total} variant="bell" />
    </TouchableOpacity>
  );
}

// The list inside the Dashboard pop-up. It loads when it opens and follows
// live updates while it is open.
export function AdminNoticesView({
  onOpen,
}: {
  onOpen: (notice: BellNotice) => void;
}) {
  const [notices, setNotices] = useState<BellNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Please sign in again.");
      }

      const response = await fetch(`${API_BASE}/api/notifications?limit=100`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success || !Array.isArray(body.notifications)) {
        throw new Error(body?.message || "Could not load notifications.");
      }

      if (id !== requestId.current) return;

      setNotices(body.notifications as BellNotice[]);
      setError("");
    } catch (caught) {
      if (id !== requestId.current) return;

      setError(caught instanceof Error ? caught.message : "Could not load notifications.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useLiveReload(["fines", "payments", "refunds"], load);

  return (
    <AdminNoticeList
      notices={notices}
      filters={BELL_FILTERS}
      loading={loading}
      error={error}
      onRetry={() => {
        setLoading(true);
        void load();
      }}
      onOpen={onOpen}
      onDelete={(noticeId) => {
        setNotices((current) => current.filter((notice) => notice.id !== noticeId));
        void refreshNotificationCounts();
      }}
      emptyText="No notifications here yet."
    />
  );
}

const styles = StyleSheet.create({
  // Same size and look as the bell on the Student and Officer Home screens.
  button: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE4ED",
    borderRadius: 23,
    shadowColor: "#173A73",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    width: 26,
    height: 26,
    tintColor: "#173A73",
  },
});
