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

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useFocusEffect } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { useLiveReload } from "@/hooks/use-live-updates";

import { StatusBar } from "expo-status-bar";

import { SafeAreaView } from "react-native-safe-area-context";

import {
  FadeIn,
  PopIn,
  TabIndicator,
  useSwitchFade,
} from "@/components/motion";
import { DeletableNotice, DeleteHint } from "@/components/deletable-notice";
import {
  Skeleton,
  SkeletonDetails,
  SkeletonList,
} from "@/components/skeleton";
import { API_BASE } from "@/constants/api";

import { useResponsiveStyles } from "./dashboard-styles";
import {
  HomeTabBadge,
  NotificationBadge,
} from "@/components/notification-badge";
import {
  formatNotificationTime,
  markNotificationRead,
  useNotificationCounts,
} from "@/hooks/use-notification-counts";
import { returnToLogin } from "@/hooks/use-auth";

// ==========================================
// TYPES
// ==========================================

type Officer = {
  id: number;
  fullName: string;
  username: string;
  profilePictureUri: string | null;
};

type DashboardStats = {
  totalStudents: number;
  finesRecorded: number;
  todayAmountCentavos: number;
};

type FineActivity = {
  id: number;
  studentName: string;
  profilePictureUri: string | null;
  violationName: string | null;
  amountCentavos: number;
  recordedAt: string | null;
};

type DashboardResponse = {
  success: boolean;
  message?: string;
  user?: Officer;
  stats?: DashboardStats;
  activities?: FineActivity[];
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

// The fine a notification links to (GET /api/fines/:id).
type NoticeFine = {
  id: number;
  fine_reference: string;
  student_name: string;
  student_number: string | null;
  violation_name: string;
  amount_centavos: number;
  status: "UNPAID" | "PAID" | "CANCELLED";
  paid_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
};

type NavigationItem = {
  label: string;
  icon: any;
  route: string | null;
  enabled: boolean;
};

// ==========================================
// NAVIGATION ICONS
// ==========================================

const icons = {
  home: require("../../../assets/icons/dashboard.png"),

  students: require("../../../assets/icons/students.png"),

  scan: require("../../../assets/icons/qr-codeWhite.png"),

  profile: require("../../../assets/icons/user.png"),

  records: require("../../../assets/icons/reports.png"),

  back: require("../../../assets/icons/back_icon.png"),

  notification: require("../../../assets/icons/notification.png"),
};

// ==========================================
// MOBILE NAVIGATION
// ==========================================

const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    icon: icons.home,
    route: "/officer/dashboard",
    enabled: true,
  },

  {
    label: "Students",
    icon: icons.students,
    route: "/officer/student",
    enabled: true,
  },

  {
    label: "Scan",
    icon: icons.scan,
    route: "/officer/qr-scanner",
    enabled: true,
  },

  {
    label: "Profile",
    icon: icons.profile,
    route: "/officer/profile",
    enabled: true,
  },

  {
    label: "Records",
    icon: icons.records,
    route: "/officer/records",
    enabled: true,
  },
];

// ==========================================
// IMAGE URL
// ==========================================

function imageUrl(uri: string | null | undefined): string | null {
  if (!uri) {
    return null;
  }

  if (/^https?:\/\//i.test(uri)) {
    return uri;
  }

  return `${API_BASE.replace(/\/+$/, "")}/${uri.replace(/^\/+/, "")}`;
}

// ==========================================
// AVATAR INITIALS
// ==========================================

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

// ==========================================
// CURRENCY
// ==========================================

function money(centavos: number): string {
  return `₱ ${Number(centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ==========================================
// DATE AND TIME
// ==========================================

function recordedDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  let normalized = value.trim();

  // SQLite CURRENT_TIMESTAMP is UTC.

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
    normalized = normalized.replace(" ", "T") + "Z";
  }

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function dateLabel(value: string | null): string {
  const date = recordedDate(value);

  return date
    ? date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Manila",
      })
    : "Date unavailable";
}

function timeLabel(value: string | null): string {
  const date = recordedDate(value);

  return date
    ? date.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
      })
    : "—";
}

// ==========================================
// AVATAR COMPONENT
// ==========================================

function Avatar({
  uri,
  name,
  large = false,
}: {
  uri: string | null | undefined;

  name: string;

  large?: boolean;
}) {
  const styles = useResponsiveStyles();

  const [failed, setFailed] = useState(false);

  const url = imageUrl(uri);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  return (
    <View style={[styles.avatar, large && styles.avatarLarge]}>
      {url && !failed ? (
        <Image
          source={{
            uri: url,
          }}
          style={styles.avatarImage}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={`${name} profile picture`}
        />
      ) : (
        <Text style={[styles.initials, large && styles.initialsLarge]}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

// ==========================================
// ACTIVITY CARD
// ==========================================

function ActivityCard({ activity }: { activity: FineActivity }) {
  const styles = useResponsiveStyles();

  return (
    <View style={styles.activityCard}>
      <Avatar uri={activity.profilePictureUri} name={activity.studentName} />

      <View style={styles.activityInfo}>
        <Text style={styles.studentName}>
          {activity.studentName || "Student"}
        </Text>

        <Text style={styles.activityDescription}>New fine recorded</Text>

        <Text style={styles.violation}>{activity.violationName || "Fine"}</Text>

        <Text style={styles.timestamp}>{dateLabel(activity.recordedAt)}</Text>
      </View>

      <View style={styles.activityAmountArea}>
        <Text style={styles.activityAmount}>
          {money(activity.amountCentavos)}
        </Text>

        <Text style={styles.timestamp}>{timeLabel(activity.recordedAt)}</Text>
      </View>
    </View>
  );
}

// ==========================================
// FINES OFFICER DASHBOARD
// MOBILE PHONE VIEW ONLY
// ==========================================

export default function OfficerDashboard() {
  const styles = useResponsiveStyles();

  const router = useGuardedRouter();

  // ========================================
  // DASHBOARD STATE
  // ========================================

  const [data, setData] = useState<DashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [accessDenied, setAccessDenied] = useState(false);

  const requestRef = useRef<AbortController | null>(null);

  // ========================================
  // ALL ACTIVITIES MODAL
  // ========================================

  const [showAllActivities, setShowAllActivities] = useState(false);

  // ========================================
  // NOTIFICATIONS
  // ========================================

  const counts = useNotificationCounts();

  const [showNotifications, setShowNotifications] = useState(false);

  const [notices, setNotices] = useState<Notice[]>([]);

  const [noticesLoading, setNoticesLoading] = useState(false);

  const [noticesError, setNoticesError] = useState("");

  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const [noticeFine, setNoticeFine] = useState<NoticeFine | null>(null);

  const [noticeLoading, setNoticeLoading] = useState(false);

  const [noticeError, setNoticeError] = useState("");

  const loadNotices = async () => {
    setNoticesLoading(true);
    setNoticesError("");

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in again.");
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
        throw new Error(body?.message || "Could not load notifications.");
      }

      setNotices(body.notifications as Notice[]);
    } catch (caught) {
      setNoticesError(
        caught instanceof Error ? caught.message : "Could not load notifications.",
      );
    } finally {
      setNoticesLoading(false);
    }
  };

  const openNotifications = () => {
    setSelectedNotice(null);
    setNoticeFine(null);
    setNoticeError("");
    setShowNotifications(true);
    void loadNotices();
  };

  // Only hides the pop-up, so the open notice stays on the card while it
  // fades out; openNotifications starts the next opening from the list.
  const closeNotifications = () => {
    setShowNotifications(false);
  };

  const backToNotices = () => {
    setSelectedNotice(null);
    setNoticeFine(null);
    setNoticeError("");
  };

  // Opens the linked fine; only after it loads is this one notice marked read.
  const openNotice = async (notice: Notice) => {
    setSelectedNotice(notice);
    setNoticeFine(null);
    setNoticeError("");

    if (!notice.fineId) {
      setNoticeError("This notification has no fine to show. It stays unread.");
      return;
    }

    setNoticeLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_BASE}/api/fines/${notice.fineId}`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "ngrok-skip-browser-warning": "true",
        },
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.success || !body.fine) {
        throw new Error(body?.message || "This fine could not be loaded.");
      }

      setNoticeFine(body.fine as NoticeFine);
    } catch (caught) {
      setNoticeError(
        `${caught instanceof Error ? caught.message : "This fine could not be loaded."} The notification stays unread.`,
      );
      return;
    } finally {
      setNoticeLoading(false);
    }

    if (notice.isRead) return;

    try {
      await markNotificationRead(notice.id);

      setNotices((current) =>
        current.map((item) =>
          item.id === notice.id ? { ...item, isRead: true } : item,
        ),
      );
      setSelectedNotice((current) =>
        current?.id === notice.id ? { ...current, isRead: true } : current,
      );
    } catch (caught) {
      setNoticeError(
        caught instanceof Error
          ? caught.message
          : "Could not mark the notification read.",
      );
    }
  };

  const noticeFineStatus = (fine: NoticeFine) =>
    fine.status === "CANCELLED"
      ? "Cancelled"
      : fine.status === "PAID"
        ? "Paid"
        : "Unpaid";

  // ========================================
  // LOAD DASHBOARD
  // ========================================

  // `silent` is a live update: no spinner and no error message on failure.
  const loadDashboard = useCallback(async (silent = false) => {
    requestRef.current?.abort();

    const controller = new AbortController();

    requestRef.current = controller;

    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;

      controller.abort();
    }, 15000);

    if (!silent) {
      setLoading(true);

      setError("");

      setAccessDenied(false);
    }

    try {
      const token = await AsyncStorage.getItem("token");

      if (controller.signal.aborted) {
        return;
      }

      if (!token) {
        setData(null);

        setAccessDenied(true);

        setError("Please log in to access your dashboard.");

        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/officer-dashboard`, {
        headers: {
          Accept: "application/json",

          Authorization: `Bearer ${token}`,

          "ngrok-skip-browser-warning": "true",
        },

        signal: controller.signal,
      });

      const body: DashboardResponse = await response.json();

      if (controller.signal.aborted) {
        return;
      }

      if (response.status === 401 || response.status === 403) {
        setData(null);

        setAccessDenied(true);

        setError(body.message || "Please log in again.");

        return;
      }

      if (
        !response.ok ||
        !body.success ||
        !body.user ||
        !body.stats ||
        !Array.isArray(body.activities)
      ) {
        throw new Error(body.message || "Unable to load your dashboard.");
      }

      setData(body);
    } catch (caught) {
      if (controller.signal.aborted && !timedOut) {
        return;
      }

      if (silent) {
        return;
      }

      setError(
        timedOut
          ? "The server took too long to respond. Please try again."
          : caught instanceof Error &&
              caught.message !== "Network request failed" &&
              !(caught instanceof SyntaxError)
            ? caught.message
            : "Could not load the dashboard. Check your connection and server.",
      );
    } finally {
      clearTimeout(timeout);

      if (requestRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  // ========================================
  // REFRESH WHEN SCREEN IS FOCUSED
  // ========================================

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();

      return () => {
        requestRef.current?.abort();

        requestRef.current = null;
      };
    }, [loadDashboard]),
  );

  // Fines recorded, paid or cancelled show up here without pulling to refresh.
  useLiveReload(["fines", "payments", "refunds"], () => loadDashboard(true));

  // ========================================
  // DISPLAY DATA
  // ========================================

  const officer = data?.user;

  const stats = data?.stats;

  const activities = data?.activities ?? [];

  // Only the newest three appear on
  // the main dashboard.

  const recentActivities = activities.slice(0, 3);

  // The notifications pop-up fades in again when it opens a notice.
  const noticeFade = useSwitchFade(selectedNotice?.id ?? "list");

  const officerName = officer?.fullName || officer?.username || "Fines Officer";

  // ========================================
  // RETURN TO LOGIN
  // ========================================

  const returnToLogin = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "userEmail",
        "userId",
        "userRole",
      ]);

      returnToLogin();
    } catch {
      setError("Unable to clear your session. Please try again.");
    }
  };

  // ========================================
  // BOTTOM NAVIGATION
  // ========================================

  const handleNavigation = (item: NavigationItem) => {
    if (!item.enabled) {
      return;
    }

    if (item.label === "Home") {
      void loadDashboard();

      return;
    }

    if (item.route) {
      router.push(item.route as any);
    }
  };

  // ========================================
  // SCREEN
  // ========================================

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.phone}>
        {/* =================================
            DASHBOARD CONTENT
        ================================= */}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && Boolean(data)}
              onRefresh={() => void loadDashboard()}
              tintColor="#173A73"
              colors={["#173A73"]}
            />
          }
        >
          {/* =================================
              OFFICER HEADER
          ================================= */}

          <View style={styles.header}>
            <Avatar uri={officer?.profilePictureUri} name={officerName} large />

            <View style={styles.greeting}>
              <Text style={styles.hello}>Hello,</Text>

              <Text style={styles.officerName}>
                {officer ? `Officer ${officerName}` : "Fines Officer"}
              </Text>
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

          {/* =================================
              ERROR MESSAGE
          ================================= */}

          {error ? (
            <View style={styles.errorPanel}>
              <Text style={styles.errorText} accessibilityRole="alert">
                {error}
              </Text>

              {data ? (
                <Text style={styles.helper}>
                  Showing your last loaded information.
                </Text>
              ) : null}

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
              >
                <Text style={styles.retryText}>
                  {accessDenied ? "Back to Login" : "Try Again"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* =================================
              TOTAL STUDENTS
              (values pulse until the first load finishes)
          ================================= */}

          <FadeIn style={styles.totalCard}>
            <Text style={styles.cardLabel}>Total Students</Text>

            {loading && !data ? (
              <Skeleton
                width={90}
                height={34}
                radius={8}
                style={styles.valueSkeleton}
              />
            ) : (
              <Text style={styles.totalValue}>
                {stats ? stats.totalStudents.toLocaleString("en-PH") : "—"}
              </Text>
            )}
          </FadeIn>

          {/* =================================
              FINES SUMMARY
          ================================= */}

          <FadeIn style={styles.summaryRow} delay={80}>
            <View style={styles.smallCard}>
              <Text style={styles.smallLabel}>Fines Recorded</Text>

              {loading && !data ? (
                <Skeleton width={56} height={26} radius={8} />
              ) : (
                <Text style={styles.countValue}>
                  {stats ? stats.finesRecorded.toLocaleString("en-PH") : "—"}
                </Text>
              )}
            </View>

            <View style={styles.smallCard}>
              <Text style={styles.smallLabel}>Today’s Fines</Text>

              {loading && !data ? (
                <Skeleton width={96} height={26} radius={8} />
              ) : (
                <Text style={styles.moneyValue}>
                  {stats ? money(stats.todayAmountCentavos) : "—"}
                </Text>
              )}
            </View>
          </FadeIn>

          {/* =================================
              RECENT ACTIVITIES
          ================================= */}

          <Text style={styles.sectionTitle}>Recent Activities</Text>

          {loading && !data ? (
            <SkeletonList
              label="Loading recent activities"
              count={3}
              itemStyle={styles.activityCard}
            />
          ) : null}

          {data && activities.length === 0 ? (
            <FadeIn style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>No recorded fines yet</Text>

              <Text style={styles.helper}>
                Fines you record will appear here.
              </Text>
            </FadeIn>
          ) : null}

          {recentActivities.map((activity, index) => (
            <FadeIn key={activity.id} index={index}>
              <ActivityCard activity={activity} />
            </FadeIn>
          ))}

          {/* =================================
              VIEW ALL ACTIVITIES
          ================================= */}

          {activities.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setShowAllActivities(true)}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text style={styles.viewAllText}>View all activities</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* =================================
            MOBILE BOTTOM NAVIGATION
        ================================= */}

        <SafeAreaView style={styles.bottomArea} edges={["bottom"]}>
          <View style={styles.bottomNavigation}>
            {navigationItems.map((item) => {
              const active = item.label === "Home";

              const disabled = !item.enabled;

              return (
                <TouchableOpacity
                  key={item.label}
                  style={styles.navItem}
                  activeOpacity={0.8}
                  disabled={disabled}
                  onPress={() => handleNavigation(item)}
                  accessibilityRole="tab"
                  accessibilityLabel={
                    disabled ? `${item.label}, coming soon` : item.label
                  }
                  accessibilityState={{
                    selected: active,

                    disabled: disabled,
                  }}
                >
                  <Image
                    source={item.icon}
                    style={[
                      styles.navIcon,

                      disabled && {
                        opacity: 0.45,
                      },
                    ]}
                    resizeMode="contain"
                  />

                  <Text
                    style={[
                      styles.navLabel,

                      disabled && {
                        opacity: 0.45,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <HomeTabBadge label={item.label} />

                  <TabIndicator
                    active={active}
                    style={styles.activeIndicator}
                    hiddenStyle={styles.hiddenIndicator}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      {/* ======================================
          ALL ACTIVITIES MODAL
      ====================================== */}

      <Modal
        visible={showAllActivities}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowAllActivities(false)}
      >
        <View style={styles.modalBackdrop}>
          <PopIn style={styles.modalCard}>
            {/* MODAL HEADER */}

            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setShowAllActivities(false)}
                accessibilityRole="button"
                accessibilityLabel="Close all activities"
              >
                <Image
                  source={icons.back}
                  style={styles.modalBackIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <View style={styles.modalTitleArea}>
                <Text style={styles.modalTitle}>All Activities</Text>

                <Text style={styles.modalSubtitle}>
                  {activities.length.toLocaleString("en-PH")}{" "}
                  {activities.length === 1
                    ? "recorded activity"
                    : "recorded activities"}
                </Text>
              </View>

              <View style={styles.modalHeaderSpacer} />
            </View>

            {/* MODAL ACTIVITIES */}

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {activities.length === 0 ? (
                <View style={styles.modalEmptyPanel}>
                  <Text style={styles.emptyTitle}>No activities yet</Text>

                  <Text style={styles.helper}>
                    Recorded fines will appear here.
                  </Text>
                </View>
              ) : (
                activities.map((activity, index) => (
                  <FadeIn key={activity.id} index={index}>
                    <ActivityCard activity={activity} />
                  </FadeIn>
                ))
              )}
            </ScrollView>
          </PopIn>
        </View>
      </Modal>

      {/* ======================================
          NOTIFICATIONS MODAL
      ====================================== */}

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={selectedNotice ? backToNotices : closeNotifications}
      >
        <View style={styles.modalBackdrop}>
          <PopIn style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={selectedNotice ? backToNotices : closeNotifications}
                accessibilityRole="button"
                accessibilityLabel={
                  selectedNotice ? "Back to notifications" : "Close notifications"
                }
              >
                <Image
                  source={icons.back}
                  style={styles.modalBackIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <View style={styles.modalTitleArea}>
                <Text style={styles.modalTitle}>
                  {selectedNotice ? "Notification" : "Notifications"}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {selectedNotice
                    ? "The fine this notification is about"
                    : counts.total > 0
                      ? `${counts.total} unread`
                      : "Updates on fines you recorded"}
                </Text>
              </View>

              <View style={styles.modalHeaderSpacer} />
            </View>

            {/* Fades in again when moving between the list and a notice. */}
            <Animated.ScrollView
              style={[styles.modalScroll, noticeFade]}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedNotice ? (
                <>
                  <View style={styles.noticeTitleRow}>
                    <Text style={styles.noticeTitle}>{selectedNotice.title}</Text>

                    <Text
                      style={
                        selectedNotice.isRead
                          ? styles.noticeReadLabel
                          : styles.noticeNewLabel
                      }
                    >
                      {selectedNotice.isRead ? "READ" : "NEW"}
                    </Text>
                  </View>

                  <Text style={styles.noticeMessage}>
                    {selectedNotice.message}
                  </Text>

                  <Text style={styles.timestamp}>
                    {formatNotificationTime(selectedNotice.createdAt)}
                  </Text>

                  {noticeLoading ? (
                    <SkeletonDetails label="Loading the fine" rows={5} />
                  ) : noticeFine ? (
                    <View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Reference</Text>
                        <Text style={styles.detailValue}>
                          {noticeFine.fine_reference}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Student</Text>
                        <Text style={styles.detailValue}>
                          {noticeFine.student_name}
                          {noticeFine.student_number
                            ? ` (${noticeFine.student_number})`
                            : ""}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Violation</Text>
                        <Text style={styles.detailValue}>
                          {noticeFine.violation_name}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={styles.detailValue}>
                          {money(noticeFine.amount_centavos)}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={styles.detailValue}>
                          {noticeFineStatus(noticeFine)}
                        </Text>
                      </View>

                      {noticeFine.paid_at && noticeFine.status === "PAID" && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Paid</Text>
                          <Text style={styles.detailValue}>
                            {formatNotificationTime(noticeFine.paid_at)}
                          </Text>
                        </View>
                      )}

                      {noticeFine.cancelled_at && (
                        <>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Cancelled</Text>
                            <Text style={styles.detailValue}>
                              {formatNotificationTime(noticeFine.cancelled_at)}
                            </Text>
                          </View>

                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Reason</Text>
                            <Text style={styles.detailValue}>
                              {noticeFine.cancellation_reason ||
                                "No reason provided."}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  ) : null}

                  {!!noticeError && (
                    <Text style={styles.noticeError} accessibilityRole="alert">
                      {noticeError}
                    </Text>
                  )}

                  {!!noticeError && !!selectedNotice.fineId && (
                    <TouchableOpacity
                      onPress={() => void openNotice(selectedNotice)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.noticeLink}>Try again</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : noticesLoading && notices.length === 0 ? (
                <SkeletonList
                  label="Loading notifications"
                  count={4}
                  avatar={false}
                  itemStyle={styles.noticeCard}
                />
              ) : noticesError ? (
                <View style={styles.modalEmptyPanel}>
                  <Text style={styles.noticeError}>{noticesError}</Text>

                  <TouchableOpacity
                    onPress={() => void loadNotices()}
                    accessibilityRole="button"
                  >
                    <Text style={styles.noticeLink}>Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : notices.length === 0 ? (
                <View style={styles.modalEmptyPanel}>
                  <Text style={styles.emptyTitle}>No notifications yet</Text>

                  <Text style={styles.helper}>
                    You will be told when a fine you recorded is paid or
                    cancelled.
                  </Text>
                </View>
              ) : (
                <>
                <DeleteHint />
                {notices.map((notice, index) => (
                  <FadeIn key={notice.id} index={index}>
                    <DeletableNotice
                      noticeId={notice.id}
                      style={[
                        styles.noticeCard,
                        !notice.isRead && styles.noticeUnread,
                      ]}
                      onOpen={() => void openNotice(notice)}
                      onDeleted={(noticeId) =>
                        setNotices((current) =>
                          current.filter((item) => item.id !== noticeId),
                        )
                      }
                      accessibilityLabel={`${notice.title}. ${notice.isRead ? "Read" : "New"}`}
                    >
                      <View style={styles.noticeTitleRow}>
                        <Text style={styles.noticeTitle}>{notice.title}</Text>

                        <Text
                          style={
                            notice.isRead
                              ? styles.noticeReadLabel
                              : styles.noticeNewLabel
                          }
                        >
                          {notice.isRead ? "READ" : "NEW"}
                        </Text>
                      </View>

                      <Text style={styles.noticeMessage}>{notice.message}</Text>

                      <Text style={styles.timestamp}>
                        {formatNotificationTime(notice.createdAt)}
                      </Text>
                    </DeletableNotice>
                  </FadeIn>
                ))}
                </>
              )}
            </Animated.ScrollView>
          </PopIn>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
