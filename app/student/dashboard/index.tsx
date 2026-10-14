import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  FadeIn,
  PopIn,
  PressableScale,
  TabIndicator,
  useRetainedValue,
  useSwitchFade,
} from "@/components/motion";
import { DeletableNotice, DeleteHint } from "@/components/deletable-notice";
import {
  Skeleton,
  SkeletonDetails,
  SkeletonGroup,
  SkeletonList,
} from "@/components/skeleton";
import { API_BASE } from "@/constants/api";
import { styles } from "../styles/student-dashboard.styles";
import { notificationStyles } from "../styles/student-notification.styles";
import {
  HomeTabBadge,
  NewFinesBadge,
  NotificationBadge,
} from "@/components/notification-badge";
import {
  formatNotificationTime,
  markNotificationRead,
  refreshNotificationCounts,
  useNotificationCounts,
} from "@/hooks/use-notification-counts";
import { returnToLogin } from "@/hooks/use-auth";

type StudentUser = {
  id: number;
  fullName: string;
  username: string;
  profilePictureUri: string | null;
};

type Activity = {
  id: string;
  type: "FINE" | "PAID";
  description: string;
  amountCentavos: number;
  recordedAt: string | null;
};

type FineRecord = {
  id: number;
  fineReference: string;
  violationName: string;
  amountCentavos: number;
  recordedAt: string | null;
  paidAt: string | null;
  remarks: string | null;
  status: "UNPAID" | "PAID" | "PENDING";
  isRead: number | boolean;
  readAt: string | null;
};

type DashboardData = {
  success: boolean;
  message?: string;
  user: StudentUser;
  stats: {
    totalAmountCentavos: number;
    paidAmountCentavos: number;
    outstandingAmountCentavos: number;
    unpaidCount: number;
  };
  activities: Activity[];
};

type Notice = {
  id: number;
  notificationType: "FINE" | "PAYMENT" | "SYSTEM" | "ACCOUNT";
  title: string;
  message: string;
  fineId: number | null;
  isRead: boolean;
  createdAt: string;
};

// The fine a notification links to, including cancelled and paid fines.
type NoticeFine = {
  id: number;
  fineReference: string;
  violationName: string;
  amountCentavos: number;
  recordedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  remarks: string | null;
  status: "UNPAID" | "PAID" | "PENDING" | "CANCELLED";
  cashRequestReference: string | null;
  cashRequestStatus: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | null;
};

type ModalMode = "notifications" | "notice" | "activities" | "details" | null;

type NotificationFilter = "ALL" | "UNREAD" | "READ";

const icons = {
  home: require("../../../assets/icons/dashboard.png"),
  fines: require("../../../assets/icons/fines.png"),
  qr: require("../../../assets/icons/qr-codeWhite.png"),
  profile: require("../../../assets/icons/user.png"),
  notification: require("../../../assets/icons/notification.png"),
  wallet: require("../../../assets/icons/wallet.png"),
};

const navigation = [
  { label: "Home", icon: icons.home },
  { label: "Fines", icon: icons.fines },
  { label: "My QR", icon: icons.qr },
  { label: "Profile", icon: icons.profile },
];

function money(centavos: number) {
  if (!Number.isFinite(centavos)) return "—";

  return `₱ ${(centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function imageUrl(value?: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  return `${API_BASE.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "ST"
  );
}

function recordedLabel(value: string | null) {
  if (!value) return "Date unavailable";

  const trimmed = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  let normalized = trimmed;

  if (dateOnly) {
    normalized = `${trimmed}T00:00:00+08:00`;
  } else if (
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(trimmed)
  ) {
    normalized = trimmed.replace(" ", "T") + "Z";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  if (dateOnly) {
    return date.toLocaleDateString("en-PH", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function ActivityCard({
  activity,
  onPress,
  isRead,
}: {
  activity: Activity;
  onPress: () => void;
  isRead: boolean | null;
}) {
  const paid = activity.type === "PAID";

  return (
    <TouchableOpacity
      style={[
        styles.activityCard,
        isRead === false && notificationStyles.unreadActivityCard,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${activity.description}`}
    >
      <View style={notificationStyles.activityTitleRow}>
        <Text
          style={[
            styles.activityTitle,
            paid ? styles.greenText : styles.redText,
          ]}
        >
          {paid ? "Fine paid" : "Fine issued"}
        </Text>

        {isRead !== null && (
          <View style={notificationStyles.activityReadState}>
            {isRead === false && <View style={notificationStyles.unreadDot} />}
            <Text
              style={[
                notificationStyles.activityReadText,
                isRead
                  ? notificationStyles.readLabel
                  : notificationStyles.newLabel,
              ]}
            >
              {isRead ? "READ" : "NEW"}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.activityDescription}>{activity.description}</Text>

      <View style={styles.activityFooter}>
        <Text style={styles.timestamp}>
          {recordedLabel(activity.recordedAt)}
        </Text>
        <Text style={styles.activityAmount}>
          {money(activity.amountCentavos)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function StudentDashboard() {
  const router = useGuardedRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [notificationFilter, setNotificationFilter] =
    useState<NotificationFilter>("ALL");
  const [fineRecords, setFineRecords] = useState<FineRecord[]>([]);
  const [selectedFine, setSelectedFine] = useState<FineRecord | null>(null);
  const [readError, setReadError] = useState("");

  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticesError, setNoticesError] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // The pop-up keeps showing its view while it fades out.
  const shownModalMode = useRetainedValue(modalMode);
  const shownSelectedFine = useRetainedValue(selectedFine);
  const shownSelectedNotice = useRetainedValue(selectedNotice);
  const [noticeFine, setNoticeFine] = useState<NoticeFine | null>(null);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeError, setNoticeError] = useState("");
  const counts = useNotificationCounts();

  const markingReadRef = useRef(new Set<number>());
  const requestRef = useRef<AbortController | null>(null);

  const loadDashboard = useCallback(async () => {
    requestRef.current?.abort();

    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(true);
    setError("");
    setAccessDenied(false);

    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    try {
      const token = await AsyncStorage.getItem("token");

      if (requestRef.current !== controller || controller.signal.aborted) {
        return;
      }

      if (!token) {
        setData(null);
        setAccessDenied(true);
        throw new Error("Please sign in to view your dashboard.");
      }

      const response = await fetch(`${API_BASE}/api/auth/student-dashboard`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        signal: controller.signal,
      });

      const raw = await response.text();

      if (requestRef.current !== controller || controller.signal.aborted) {
        return;
      }

      if (response.status === 401 || response.status === 403) {
        setData(null);
        setAccessDenied(true);
      }

      let body: DashboardData;

      try {
        body = JSON.parse(raw);
      } catch {
        throw new Error(
          "Unexpected server response. Check that the backend is running.",
        );
      }

      if (!response.ok || !body?.success) {
        throw new Error(body?.message || "Could not load your dashboard.");
      }

      if (
        !body.user ||
        !body.stats ||
        !Number.isFinite(body.stats.outstandingAmountCentavos) ||
        !Number.isFinite(body.stats.unpaidCount) ||
        !Array.isArray(body.activities)
      ) {
        throw new Error("The server returned incomplete dashboard data.");
      }

      try {
        const finesResponse = await fetch(`${API_BASE}/api/fines/my-fines`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          signal: controller.signal,
        });

        const finesBody = await finesResponse.json();

        if (
          !finesResponse.ok ||
          !finesBody?.success ||
          !Array.isArray(finesBody.fines)
        ) {
          throw new Error("Could not load fine details.");
        }

        if (requestRef.current !== controller || controller.signal.aborted) {
          return;
        }

        setFineRecords(finesBody.fines as FineRecord[]);
      } catch {
        // Balance and activities can still load.
      }

      setData(body);
    } catch (caught) {
      if (requestRef.current !== controller) return;
      if (controller.signal.aborted && !timedOut) return;

      setError(
        timedOut
          ? "The request timed out. Please try again."
          : caught instanceof Error
            ? caught.message
            : "Could not load your dashboard.",
      );
    } finally {
      clearTimeout(timeout);

      if (requestRef.current === controller) {
        setLoading(false);

        if (timedOut) {
          setError("The request timed out. Please try again.");
        }
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();

      return () => {
        requestRef.current?.abort();
        requestRef.current = null;
      };
    }, [loadDashboard]),
  );

  const closeModal = () => {
    setModalMode(null);
    setSelectedFine(null);
    setReadError("");
    setSelectedNotice(null);
    setNoticeFine(null);
    setNoticeError("");
  };

  const markFineRead = async (fineId: number) => {
    if (markingReadRef.current.has(fineId)) return;

    markingReadRef.current.add(fineId);

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Please sign in again.");
      }

      const response = await fetch(
        `${API_BASE}/api/fines/my-fines/${fineId}/read`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      const raw = await response.text();

      let body: {
        success?: boolean;
        message?: string;
        readAt?: string;
      };

      try {
        body = JSON.parse(raw);
      } catch {
        throw new Error(
          "The read-status API returned a webpage. Restart the backend and check POST /api/fines/my-fines/:id/read.",
        );
      }

      if (!response.ok || !body?.success) {
        throw new Error(body?.message || "Could not mark the fine as read.");
      }

      setReadError("");

      setFineRecords((current) =>
        current.map((fine) =>
          fine.id === fineId
            ? {
                ...fine,
                isRead: true,
                readAt: body.readAt ?? null,
              }
            : fine,
        ),
      );

      setSelectedFine((current) =>
        current?.id === fineId
          ? {
              ...current,
              isRead: true,
              readAt: body.readAt ?? null,
            }
          : current,
      );

      // Reading the fine also reads its New Fine Issued notification.
      void refreshNotificationCounts();
    } catch (caught) {
      setReadError(
        caught instanceof Error ? caught.message : "Please try again.",
      );
    } finally {
      markingReadRef.current.delete(fineId);
    }
  };

  const openFine = (fine: FineRecord) => {
    setSelectedFine(fine);
    setReadError("");
    setModalMode("details");

    if (!fine.isRead) {
      void markFineRead(fine.id);
    }
  };

  const openActivity = (activity: Activity) => {
    const match = /^(?:fine|paid)-(\d+)$/.exec(activity.id);
    const fineId = match ? Number(match[1]) : NaN;

    const fine = fineRecords.find((item) => item.id === fineId);

    if (!fine) {
      closeModal();
      router.push("/student/fines");
      return;
    }

    openFine(fine);
  };

  const loadNotices = async () => {
    setNoticesLoading(true);
    setNoticesError("");

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Please sign in again.");
      }

      const response = await fetch(`${API_BASE}/api/notifications?limit=50`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success || !Array.isArray(body.notifications)) {
        throw new Error(body?.message || "Could not load your notifications.");
      }

      setNotices(body.notifications as Notice[]);
    } catch (caught) {
      setNoticesError(
        caught instanceof Error
          ? caught.message
          : "Could not load your notifications.",
      );
    } finally {
      setNoticesLoading(false);
    }
  };

  const openNotifications = () => {
    setSelectedFine(null);
    setSelectedNotice(null);
    setNoticeFine(null);
    setNoticeError("");
    setNotificationFilter("ALL");
    setModalMode("notifications");
    void loadNotices();
  };

  const backToNotifications = () => {
    setSelectedNotice(null);
    setNoticeFine(null);
    setNoticeError("");
    setReadError("");
    setModalMode("notifications");
  };

  // Marks only this notification read, after its fine has loaded.
  const markNoticeRead = async (notice: Notice) => {
    try {
      await markNotificationRead(notice.id);
      setReadError("");

      setNotices((current) =>
        current.map((item) =>
          item.id === notice.id ? { ...item, isRead: true } : item,
        ),
      );
      setSelectedNotice((current) =>
        current?.id === notice.id ? { ...current, isRead: true } : current,
      );

      // The server also marks the fine read in My Fines for this notice.
      if (notice.title === "New Fine Issued" && notice.fineId) {
        setFineRecords((current) =>
          current.map((fine) =>
            fine.id === notice.fineId ? { ...fine, isRead: true } : fine,
          ),
        );
      }
    } catch (caught) {
      setReadError(
        caught instanceof Error ? caught.message : "Please try again.",
      );
    }
  };

  const openNotice = async (notice: Notice) => {
    setSelectedNotice(notice);
    setNoticeFine(null);
    setNoticeError("");
    setReadError("");
    setModalMode("notice");

    if (!notice.fineId) {
      setNoticeError(
        "This notification has no fine to show. It stays unread.",
      );
      return;
    }

    setNoticeLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Please sign in again.");
      }

      const response = await fetch(
        `${API_BASE}/api/fines/my-fines/${notice.fineId}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success || !body.fine) {
        throw new Error(body?.message || "This fine could not be loaded.");
      }

      setNoticeFine(body.fine as NoticeFine);

      if (!notice.isRead) {
        await markNoticeRead(notice);
      }
    } catch (caught) {
      setNoticeError(
        `${caught instanceof Error ? caught.message : "This fine could not be loaded."} The notification stays unread.`,
      );
    } finally {
      setNoticeLoading(false);
    }
  };

  const noticeFineStatus = (fine: NoticeFine) => {
    if (fine.status === "CANCELLED") return "Cancelled — no payment needed";
    if (fine.status === "PAID") return "Paid";
    if (fine.cashRequestStatus === "PENDING") return "Unpaid — cash requested";
    return fine.status === "PENDING" ? "Pending" : "Unpaid";
  };

  const cashRequestLabel = (fine: NoticeFine) => {
    if (!fine.cashRequestReference || !fine.cashRequestStatus) return null;

    const status =
      fine.cashRequestStatus === "SUCCESS"
        ? "Paid"
        : fine.cashRequestStatus === "CANCELLED"
          ? "Cancelled"
          : fine.cashRequestStatus === "FAILED"
            ? "Failed"
            : "Pending";

    return `${status} · ${fine.cashRequestReference}`;
  };

  const name = data?.user.fullName || data?.user.username || "Student";
  const avatar = imageUrl(data?.user.profilePictureUri);
  const outstanding = data?.stats.outstandingAmountCentavos;
  const hasBalance = outstanding !== undefined && outstanding > 0;
  const activities = data?.activities ?? [];
  const recentActivities = activities.slice(0, 3);

  const visibleNotifications = notices.filter(
    (notice) =>
      notificationFilter === "ALL" ||
      (notificationFilter === "UNREAD" ? !notice.isRead : notice.isRead),
  );

  const readStatusForActivity = (activity: Activity): boolean | null => {
    const match = /^(?:fine|paid)-(\d+)$/.exec(activity.id);
    const fine = match
      ? fineRecords.find((item) => item.id === Number(match[1]))
      : undefined;

    return fine ? Boolean(fine.isRead) : null;
  };

  useEffect(() => {
    setImageFailed(false);
  }, [avatar]);

  // The pop-up fades in again when it opens another view or record.
  const modalFade = useSwitchFade(
    `${shownModalMode}:${shownSelectedFine?.id ?? ""}:${shownSelectedNotice?.id ?? ""}`,
  );


  const returnToLogin = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "userId",
        "userRole",
        "userEmail",
      ]);

      closeModal();
      returnToLogin();
    } catch {
      setError("Unable to clear your session. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.phone}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && data !== null}
              onRefresh={() => void loadDashboard()}
              tintColor="#123266"
              colors={["#123266"]}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.avatar}>
              {avatar && !imageFailed ? (
                <Image
                  source={{ uri: avatar }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                  accessibilityLabel={`${name} profile picture`}
                />
              ) : (
                <Text style={styles.initials}>{initials(name)}</Text>
              )}
            </View>

            <View style={styles.greeting}>
              <Text style={styles.hello}>Hello,</Text>
              <Text style={styles.studentName}>{name}</Text>
            </View>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={openNotifications}
              accessibilityRole="button"
              accessibilityLabel="View notifications"
            >
              <Image
                source={icons.notification}
                style={styles.notificationIcon}
                resizeMode="contain"
              />

              <NotificationBadge count={counts.total} variant="bell" />
            </TouchableOpacity>
          </View>

          {!!error && (
            <View style={styles.errorPanel}>
              <Text style={styles.errorText} accessibilityRole="alert">
                {error}
              </Text>

              {data && (
                <Text style={styles.helper}>
                  Showing your last loaded information.
                </Text>
              )}

              <TouchableOpacity
                style={styles.retryButton}
                disabled={loading}
                onPress={() => {
                  if (accessDenied) {
                    void returnToLogin();
                  } else {
                    void loadDashboard();
                  }
                }}
                accessibilityRole="button"
              >
                <Text style={styles.retryText}>
                  {accessDenied ? "Back to Login" : "Try Again"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* The balance pulses while the first load is in progress. */}
          <FadeIn style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>Outstanding Fine</Text>

            {loading && !data ? (
              <SkeletonGroup label="Loading your balance">
                <Skeleton
                  width={170}
                  height={36}
                  radius={8}
                  style={styles.balanceSkeleton}
                />
                <Skeleton
                  width={96}
                  height={20}
                  radius={6}
                  style={styles.balanceStatusSkeleton}
                />
              </SkeletonGroup>
            ) : (
              <>
                <Text
                  style={[
                    styles.balanceValue,
                    data && !hasBalance && styles.greenText,
                  ]}
                >
                  {outstanding !== undefined ? money(outstanding) : "—"}
                </Text>

                <Text
                  style={[
                    styles.balanceStatus,
                    data && !hasBalance && styles.greenText,
                  ]}
                >
                  {data
                    ? hasBalance
                      ? "Unpaid"
                      : "No outstanding fines"
                    : " "}
                </Text>
              </>
            )}

            {data && hasBalance && (
              <Text style={styles.balanceHint}>
                {data.stats.unpaidCount} outstanding{" "}
                {data.stats.unpaidCount === 1 ? "fine" : "fines"}
              </Text>
            )}
          </FadeIn>

          <FadeIn style={styles.quickActions} delay={80}>
            <PressableScale
              style={styles.quickCard}
              onPress={() => router.push("/student/fines")}
              accessibilityRole="button"
            >
              <Image
                source={icons.fines}
                style={styles.quickIcon}
                resizeMode="contain"
              />
              <Text style={styles.quickLabel}>My Fines</Text>

              <NewFinesBadge variant="bell" />
            </PressableScale>

            <PressableScale
              style={styles.quickCard}
              onPress={() => router.push("/student/fines")}
              accessibilityRole="button"
            >
              <Image
                source={icons.wallet}
                style={styles.quickIcon}
                resizeMode="contain"
              />
              <Text style={styles.quickLabel}>Payment</Text>
            </PressableScale>
          </FadeIn>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                setSelectedFine(null);
                setModalMode("activities");
              }}
              accessibilityRole="button"
              accessibilityLabel="View all loaded recent activities"
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading && !data && (
            <SkeletonList
              label="Loading recent activities"
              count={3}
              avatar={false}
              itemStyle={styles.activityCard}
            />
          )}

          {data && activities.length === 0 && (
            <FadeIn style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>No recent activities</Text>
              <Text style={styles.helper}>
                Your fine and payment updates will appear here.
              </Text>
            </FadeIn>
          )}

          {recentActivities.map((activity, index) => (
            <FadeIn key={activity.id} index={index}>
              <ActivityCard
                activity={activity}
                isRead={readStatusForActivity(activity)}
                onPress={() => openActivity(activity)}
              />
            </FadeIn>
          ))}
        </ScrollView>

        <SafeAreaView style={styles.bottomArea} edges={["bottom"]}>
          <View style={styles.bottomNavigation}>
            {navigation.map((item) => {
              const active = item.label === "Home";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={styles.navItem}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: active,
                  }}
                  onPress={() => {
                    if (item.label === "Home") {
                      void loadDashboard();
                    } else if (item.label === "Fines") {
                      router.push("/student/fines");
                    } else if (item.label === "My QR") {
                      router.push("/student/qr");
                    } else if (item.label === "Profile") {
                      router.push("/student/profile");
                    }
                  }}
                >
                  <Image
                    source={item.icon}
                    style={styles.navIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.navLabel}>{item.label}</Text>
                  <HomeTabBadge label={item.label} />
                  <TabIndicator
                    active={active}
                    style={styles.indicator}
                    hiddenStyle={styles.hiddenIndicator}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      <Modal
        visible={modalMode !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <PopIn style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {shownModalMode === "details"
                  ? "Fine Details"
                  : shownModalMode === "notifications"
                    ? "Notifications"
                    : shownModalMode === "notice"
                      ? "Notification"
                      : "Recent Activities"}
              </Text>
            </View>

            {shownModalMode === "notifications" ? (
              <View style={notificationStyles.notificationFilters}>
                {(["ALL", "UNREAD", "READ"] as const).map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setNotificationFilter(item)}
                    style={[
                      notificationStyles.notificationFilter,
                      notificationFilter === item &&
                        notificationStyles.notificationFilterActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: notificationFilter === item,
                    }}
                  >
                    <Text
                      style={[
                        notificationStyles.notificationFilterText,
                        notificationFilter === item &&
                          notificationStyles.notificationFilterTextActive,
                      ]}
                    >
                      {item === "ALL"
                        ? "All"
                        : item === "UNREAD"
                          ? "Unread"
                          : "Read"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.modalHelper}>
                {shownModalMode === "details"
                  ? "Your recorded fine information"
                  : shownModalMode === "notice"
                    ? "The fine this notification is about"
                    : "Tap an activity to view its fine details"}
              </Text>
            )}

            {/* Fades in again whenever the pop-up switches view or record. */}
            <Animated.ScrollView
              style={[styles.modalScroll, modalFade]}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {shownModalMode === "details" && shownSelectedFine ? (
                <>
                  <Text style={notificationStyles.detailsViolation}>
                    {shownSelectedFine.violationName}
                  </Text>

                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>
                      Reference
                    </Text>
                    <Text style={notificationStyles.detailsValue}>
                      {shownSelectedFine.fineReference}
                    </Text>
                  </View>

                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>Amount</Text>
                    <Text style={notificationStyles.detailsValue}>
                      {money(shownSelectedFine.amountCentavos)}
                    </Text>
                  </View>

                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>Status</Text>
                    <Text style={notificationStyles.detailsValue}>
                      {shownSelectedFine.status}
                    </Text>
                  </View>

                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>
                      Recorded
                    </Text>
                    <Text style={notificationStyles.detailsValue}>
                      {recordedLabel(shownSelectedFine.recordedAt)}
                    </Text>
                  </View>

                  {shownSelectedFine.paidAt && (
                    <View style={notificationStyles.detailsRow}>
                      <Text style={notificationStyles.detailsLabel}>Paid</Text>
                      <Text style={notificationStyles.detailsValue}>
                        {recordedLabel(shownSelectedFine.paidAt)}
                      </Text>
                    </View>
                  )}

                  <View style={notificationStyles.detailsRemarks}>
                    <Text style={notificationStyles.detailsLabel}>Remarks</Text>
                    <Text style={notificationStyles.detailsValue}>
                      {shownSelectedFine.remarks || "No additional remarks."}
                    </Text>
                  </View>

                  {!!readError && (
                    <View style={notificationStyles.readErrorBox}>
                      <Text style={notificationStyles.readErrorText}>
                        {readError}
                      </Text>
                      <TouchableOpacity
                        onPress={() => void markFineRead(shownSelectedFine.id)}
                        accessibilityRole="button"
                      >
                        <Text style={notificationStyles.readRetryText}>
                          Try again
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <Text
                    style={[
                      notificationStyles.detailsReadStatus,
                      shownSelectedFine.isRead
                        ? notificationStyles.readLabel
                        : notificationStyles.newLabel,
                    ]}
                  >
                    {shownSelectedFine.isRead ? "READ" : "NEW"}
                  </Text>
                </>
              ) : shownModalMode === "notice" && shownSelectedNotice ? (
                <>
                  <Text style={notificationStyles.detailsViolation}>
                    {shownSelectedNotice.title}
                  </Text>

                  <Text style={styles.activityDescription}>
                    {shownSelectedNotice.message}
                  </Text>

                  <Text style={styles.timestamp}>
                    {formatNotificationTime(shownSelectedNotice.createdAt)}
                  </Text>

                  {noticeLoading ? (
                    <SkeletonDetails label="Loading the fine" rows={5} />
                  ) : noticeFine ? (
                    <>
                      <View style={notificationStyles.detailsRow}>
                        <Text style={notificationStyles.detailsLabel}>
                          Violation
                        </Text>
                        <Text style={notificationStyles.detailsValue}>
                          {noticeFine.violationName}
                        </Text>
                      </View>

                      <View style={notificationStyles.detailsRow}>
                        <Text style={notificationStyles.detailsLabel}>
                          Reference
                        </Text>
                        <Text style={notificationStyles.detailsValue}>
                          {noticeFine.fineReference}
                        </Text>
                      </View>

                      <View style={notificationStyles.detailsRow}>
                        <Text style={notificationStyles.detailsLabel}>
                          Amount
                        </Text>
                        <Text style={notificationStyles.detailsValue}>
                          {money(noticeFine.amountCentavos)}
                        </Text>
                      </View>

                      <View style={notificationStyles.detailsRow}>
                        <Text style={notificationStyles.detailsLabel}>
                          Status
                        </Text>
                        <Text style={notificationStyles.detailsValue}>
                          {noticeFineStatus(noticeFine)}
                        </Text>
                      </View>

                      {!!cashRequestLabel(noticeFine) && (
                        <View style={notificationStyles.detailsRow}>
                          <Text style={notificationStyles.detailsLabel}>
                            Cash request
                          </Text>
                          <Text style={notificationStyles.detailsValue}>
                            {cashRequestLabel(noticeFine)}
                          </Text>
                        </View>
                      )}

                      <View style={notificationStyles.detailsRow}>
                        <Text style={notificationStyles.detailsLabel}>
                          Recorded
                        </Text>
                        <Text style={notificationStyles.detailsValue}>
                          {recordedLabel(noticeFine.recordedAt)}
                        </Text>
                      </View>

                      {noticeFine.paidAt && (
                        <View style={notificationStyles.detailsRow}>
                          <Text style={notificationStyles.detailsLabel}>
                            Paid
                          </Text>
                          <Text style={notificationStyles.detailsValue}>
                            {recordedLabel(noticeFine.paidAt)}
                          </Text>
                        </View>
                      )}

                      {noticeFine.cancelledAt && (
                        <View style={notificationStyles.detailsRow}>
                          <Text style={notificationStyles.detailsLabel}>
                            Cancelled
                          </Text>
                          <Text style={notificationStyles.detailsValue}>
                            {recordedLabel(noticeFine.cancelledAt)}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : null}

                  {!!noticeError && (
                    <View style={notificationStyles.readErrorBox}>
                      <Text style={notificationStyles.readErrorText}>
                        {noticeError}
                      </Text>
                      {!!shownSelectedNotice.fineId && (
                        <TouchableOpacity
                          onPress={() => void openNotice(shownSelectedNotice)}
                          accessibilityRole="button"
                        >
                          <Text style={notificationStyles.readRetryText}>
                            Try again
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {!!readError && (
                    <View style={notificationStyles.readErrorBox}>
                      <Text style={notificationStyles.readErrorText}>
                        {readError}
                      </Text>
                      <TouchableOpacity
                        onPress={() => void markNoticeRead(shownSelectedNotice)}
                        accessibilityRole="button"
                      >
                        <Text style={notificationStyles.readRetryText}>
                          Try again
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <Text
                    style={[
                      notificationStyles.detailsReadStatus,
                      shownSelectedNotice.isRead
                        ? notificationStyles.readLabel
                        : notificationStyles.newLabel,
                    ]}
                  >
                    {shownSelectedNotice.isRead ? "READ" : "NEW"}
                  </Text>

                  <TouchableOpacity
                    onPress={backToNotifications}
                    accessibilityRole="button"
                  >
                    <Text style={notificationStyles.readRetryText}>
                      Back to notifications
                    </Text>
                  </TouchableOpacity>
                </>
              ) : shownModalMode === "notifications" ? (
                noticesLoading && notices.length === 0 ? (
                  <SkeletonList
                    label="Loading notifications"
                    count={4}
                    avatar={false}
                    itemStyle={styles.activityCard}
                  />
                ) : noticesError ? (
                  <View style={notificationStyles.readErrorBox}>
                    <Text style={notificationStyles.readErrorText}>
                      {noticesError}
                    </Text>
                    <TouchableOpacity
                      onPress={() => void loadNotices()}
                      accessibilityRole="button"
                    >
                      <Text style={notificationStyles.readRetryText}>
                        Try again
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : visibleNotifications.length === 0 ? (
                  <View style={styles.emptyPanel}>
                    <Text style={styles.emptyTitle}>
                      {notificationFilter === "UNREAD"
                        ? "No unread notifications"
                        : notificationFilter === "READ"
                          ? "No read notifications"
                          : "No notifications yet"}
                    </Text>
                    <Text style={styles.helper}>
                      {notificationFilter === "UNREAD"
                        ? "You are all caught up."
                        : "New fines, payments, and cancellations will appear here."}
                    </Text>
                  </View>
                ) : (
                  <>
                  <DeleteHint />
                  {visibleNotifications.map((notice, index) => (
                    <FadeIn key={notice.id} index={index}>
                      <DeletableNotice
                        noticeId={notice.id}
                        onOpen={() => void openNotice(notice)}
                        onDeleted={(noticeId) =>
                          setNotices((current) =>
                            current.filter((item) => item.id !== noticeId),
                          )
                        }
                        style={[
                          styles.activityCard,
                          !notice.isRead &&
                            notificationStyles.unreadActivityCard,
                        ]}
                        accessibilityLabel={`${notice.title}. ${notice.isRead ? "Read" : "New"}`}
                      >
                        <View style={notificationStyles.activityTitleRow}>
                          <Text
                            style={[
                              styles.activityTitle,
                              notice.notificationType === "PAYMENT"
                                ? styles.greenText
                                : notice.title === "New Fine Issued"
                                  ? styles.redText
                                  : null,
                            ]}
                          >
                            {notice.title}
                          </Text>
                          <View style={notificationStyles.activityReadState}>
                            {!notice.isRead && (
                              <View style={notificationStyles.unreadDot} />
                            )}
                            <Text
                              style={[
                                notificationStyles.activityReadText,
                                notice.isRead
                                  ? notificationStyles.readLabel
                                  : notificationStyles.newLabel,
                              ]}
                            >
                              {notice.isRead ? "READ" : "NEW"}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.activityDescription}>
                          {notice.message}
                        </Text>
                        <View style={styles.activityFooter}>
                          <Text style={styles.timestamp}>
                            {formatNotificationTime(notice.createdAt)}
                          </Text>
                        </View>
                      </DeletableNotice>
                    </FadeIn>
                  ))}
                  </>
                )
              ) : !data ? (
                loading ? (
                  <SkeletonList
                    label="Loading activities"
                    count={3}
                    avatar={false}
                    itemStyle={styles.activityCard}
                  />
                ) : (
                  <Text style={styles.helper}>
                    {error || "Activities are currently unavailable."}
                  </Text>
                )
              ) : activities.length === 0 ? (
                <View style={styles.emptyPanel}>
                  <Text style={styles.emptyTitle}>No recent activities</Text>
                  <Text style={styles.helper}>
                    Updates will appear here when a fine is recorded or marked
                    paid.
                  </Text>
                </View>
              ) : (
                activities.map((activity, index) => (
                  <FadeIn key={activity.id} index={index}>
                    <ActivityCard
                      activity={activity}
                      isRead={readStatusForActivity(activity)}
                      onPress={() => openActivity(activity)}
                    />
                  </FadeIn>
                ))
              )}
            </Animated.ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeModal}
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </PopIn>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
