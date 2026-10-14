import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Href, router } from "expo-router";
import { useEffect, useState } from "react";

import { API_BASE } from "@/constants/api";
import { onLiveLifecycle, subscribeLive } from "@/hooks/use-live-updates";
import { haptics } from "@/utils/haptics";
import { playNoticeSound } from "@/utils/notice-sound";

// A banner that drops from the top of the screen when a new notice arrives
// while the app is open, so the user does not have to open the bell to find
// out. It follows the live updates: when the server announces a change, the
// newest notices are read, and any that arrived since the app was opened (and
// are worth interrupting for) are shown.
export type BannerNotice = {
  id: number;
  title: string;
  message: string;
  fineId: number | null;
  // Other new notices that arrived together with this one.
  more: number;
};

type Role = "STUDENT" | "FINES_OFFICER" | "ADMIN";

// Notices that pop up for each role. Every other notice only changes the
// badge, so a screen is not interrupted for things nobody has to act on.
const POPUP_TITLES: Record<Role, readonly string[]> = {
  STUDENT: [
    "New Fine Issued",
    "Payment Recorded",
    "Payment Received",
    "Fine Cancelled",
    "Refund Approved",
    "Refund Request Declined",
    "Refund Completed",
  ],
  FINES_OFFICER: ["Fine Paid", "Fine Cancelled", "Fine Refunded"],
  ADMIN: [
    "Cashier Payment Requested",
    "GCash Payment Needs Review",
    "Refund Requested",
    "Refund Failed",
  ],
};

const SHOW_MS = 5000;

// Signals that arrive together cause one look at the notices.
const CHECK_DELAY_MS = 350;

const subscribers = new Set<(notice: BannerNotice | null) => void>();

let current: BannerNotice | null = null;
let lastSeenId: number | null = null;
let seenToken: string | null = null;
let checking = false;
let checkAgain = false;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let checkTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;

function publish(notice: BannerNotice | null) {
  current = notice;

  subscribers.forEach((notify) => notify(notice));
}

export function dismissNoticeBanner() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  publish(null);
}

function show(notice: BannerNotice) {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }

  publish(notice);

  haptics.selection();

  playNoticeSound();

  hideTimer = setTimeout(dismissNoticeBanner, SHOW_MS);
}

type NoticeRow = {
  id: number;
  title: string;
  message: string;
  fineId: number | null;
  isRead: boolean;
};

async function fetchRecentNotices(token: string): Promise<NoticeRow[] | null> {
  try {
    const response = await fetch(`${API_BASE}/api/notifications?limit=10`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    });

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.success || !Array.isArray(body.notifications)) {
      return null;
    }

    return body.notifications.map((row: Record<string, unknown>) => ({
      id: Number(row.id),
      title: String(row.title ?? ""),
      message: String(row.message ?? ""),
      fineId: Number(row.fineId) > 0 ? Number(row.fineId) : null,
      isRead: row.isRead === true,
    }));
  } catch {
    return null;
  }
}

// The first look after a sign-in only notes the newest notice, so what was
// already waiting never pops up. Later looks show what arrived since.
async function checkForNewNotices() {
  if (checking) {
    checkAgain = true;
    return;
  }

  checking = true;

  try {
    do {
      checkAgain = false;

      const token = await AsyncStorage.getItem("token");
      const role = (await AsyncStorage.getItem("userRole")) as Role | null;

      if (!token || !role) {
        resetNoticeBanner();
        return;
      }

      if (token !== seenToken) {
        seenToken = token;
        lastSeenId = null;
        dismissNoticeBanner();
      }

      const rows = await fetchRecentNotices(token);

      if (!rows) {
        break;
      }

      const newest = rows.reduce((max, row) => Math.max(max, row.id), 0);

      if (lastSeenId === null) {
        lastSeenId = newest;
        continue;
      }

      const seen = lastSeenId;
      const popTitles = POPUP_TITLES[role] ?? [];

      const fresh = rows.filter(
        (row) => row.id > seen && !row.isRead && popTitles.includes(row.title),
      );

      lastSeenId = Math.max(seen, newest);

      if (fresh.length > 0) {
        const top = fresh.reduce((best, row) => (row.id > best.id ? row : best));

        show({
          id: top.id,
          title: top.title,
          message: top.message,
          fineId: top.fineId,
          more: fresh.length - 1,
        });
      }
    } while (checkAgain);
  } finally {
    checking = false;
  }
}

function resetNoticeBanner() {
  seenToken = null;
  lastSeenId = null;

  dismissNoticeBanner();
}

function scheduleCheck() {
  if (checkTimer) {
    clearTimeout(checkTimer);
  }

  checkTimer = setTimeout(() => {
    checkTimer = null;

    void checkForNewNotices();
  }, CHECK_DELAY_MS);
}

// Connects the banner to the live updates, once for the whole app.
function startNoticeBanner() {
  if (started) {
    return;
  }

  started = true;

  subscribeLive(scheduleCheck);

  // A new sign-in is read straight away to note what is already there; a
  // sign-out clears the banner.
  onLiveLifecycle((running) => {
    if (running) {
      void checkForNewNotices();
    } else {
      resetNoticeBanner();
    }
  });
}

// Takes the user to the notice's own screen.
export async function openBannerNotice(notice: BannerNotice) {
  const role = await AsyncStorage.getItem("userRole");

  dismissNoticeBanner();

  if (role === "ADMIN") {
    router.navigate({
      pathname: "/admin/fines",
      params: notice.fineId ? { fineId: String(notice.fineId) } : {},
    } as Href);

    return;
  }

  router.navigate(
    (role === "FINES_OFFICER" ? "/officer/records" : "/student/fines") as Href,
  );
}

export function useNoticeBanner() {
  const [notice, setNotice] = useState<BannerNotice | null>(current);

  useEffect(() => {
    startNoticeBanner();

    subscribers.add(setNotice);
    setNotice(current);

    return () => {
      subscribers.delete(setNotice);
    };
  }, []);

  return notice;
}
