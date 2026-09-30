import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE } from "@/constants/api";
import { styles } from "../styles/student-dashboard.styles";
import { notificationStyles } from "../styles/student-notification.styles";

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
    unreadFineCount?: number;
  };
  activities: Activity[];
};

type ModalMode = "notifications" | "activities" | "details" | null;

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
          {paid ? "Fine marked paid" : "Fine issued"}
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
  const router = useRouter();

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

        const fines = finesBody.fines as FineRecord[];

        setFineRecords(fines);

        body.stats.unreadFineCount = fines.filter(
          (fine) => !fine.isRead,
        ).length;
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

      setData((current) =>
        current
          ? {
              ...current,
              stats: {
                ...current.stats,
                unreadFineCount: Math.max(
                  0,
                  (current.stats.unreadFineCount ?? 0) - 1,
                ),
              },
            }
          : current,
      );
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

  const name = data?.user.fullName || data?.user.username || "Student";
  const avatar = imageUrl(data?.user.profilePictureUri);
  const outstanding = data?.stats.outstandingAmountCentavos;
  const hasBalance = outstanding !== undefined && outstanding > 0;
  const activities = data?.activities ?? [];
  const recentActivities = activities.slice(0, 3);

  const visibleNotifications = fineRecords.filter(
    (fine) =>
      notificationFilter === "ALL" ||
      (notificationFilter === "UNREAD" ? !fine.isRead : !!fine.isRead),
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

  const upcoming = (module: string) => {
    Alert.alert(module, "This feature is not available yet.");
  };

  const returnToLogin = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "userId",
        "userRole",
        "userEmail",
      ]);

      closeModal();
      router.replace("/login");
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
              onPress={() => {
                setSelectedFine(null);
                setNotificationFilter("ALL");
                setModalMode("notifications");
              }}
              accessibilityRole="button"
              accessibilityLabel="View fine notifications"
            >
              <Image
                source={icons.notification}
                style={styles.notificationIcon}
                resizeMode="contain"
              />

              {!!data?.stats.unreadFineCount &&
                data.stats.unreadFineCount > 0 && (
                  <View style={notificationStyles.bellBadge}>
                    <Text style={notificationStyles.badgeText}>
                      {data.stats.unreadFineCount > 99
                        ? "99+"
                        : data.stats.unreadFineCount}
                    </Text>
                  </View>
                )}
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

          {loading && !data && (
            <View style={styles.loadingPanel}>
              <ActivityIndicator size="large" color="#123266" />
              <Text style={styles.helper}>Loading your dashboard…</Text>
            </View>
          )}

          <View style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>Outstanding Fine</Text>

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
              {data ? (hasBalance ? "Unpaid" : "No outstanding fines") : " "}
            </Text>

            {data && hasBalance && (
              <Text style={styles.balanceHint}>
                {data.stats.unpaidCount} outstanding{" "}
                {data.stats.unpaidCount === 1 ? "fine" : "fines"}
              </Text>
            )}
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
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
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => upcoming("Payment")}
              accessibilityRole="button"
            >
              <Image
                source={icons.wallet}
                style={styles.quickIcon}
                resizeMode="contain"
              />
              <Text style={styles.quickLabel}>Payment</Text>
            </TouchableOpacity>
          </View>

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

          {data && activities.length === 0 && (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>No recent activities</Text>
              <Text style={styles.helper}>
                Your fine and payment updates will appear here.
              </Text>
            </View>
          )}

          {recentActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isRead={readStatusForActivity(activity)}
              onPress={() => openActivity(activity)}
            />
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
                  <View
                    style={[
                      styles.indicator,
                      !active && styles.hiddenIndicator,
                    ]}
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
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === "details"
                  ? "Fine Details"
                  : modalMode === "notifications"
                    ? "Notifications"
                    : "Recent Activities"}
              </Text>
            </View>

            {modalMode === "notifications" ? (
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
                {modalMode === "details"
                  ? "Your recorded fine information"
                  : "Tap an activity to view its fine details"}
              </Text>
            )}

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {modalMode === "details" && selectedFine ? (
                <>
                  <Text style={notificationStyles.detailsViolation}>
                    {selectedFine.violationName}
                  </Text>

                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>
                      Reference
                    </Text>
                    <Text style={notificationStyles.detailsValue}>
                      {selectedFine.fineReference}
                    </Text>
                  </View>

                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>Amount</Text>
                    <Text style={notificationStyles.detailsValue}>
                      {money(selectedFine.amountCentavos)}
                    </Text>
                  </View>

                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>Status</Text>
                    <Text style={notificationStyles.detailsValue}>
                      {selectedFine.status}
                    </Text>
                  </View>

                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>
                      Recorded
                    </Text>
                    <Text style={notificationStyles.detailsValue}>
                      {recordedLabel(selectedFine.recordedAt)}
                    </Text>
                  </View>

                  {selectedFine.paidAt && (
                    <View style={notificationStyles.detailsRow}>
                      <Text style={notificationStyles.detailsLabel}>Paid</Text>
                      <Text style={notificationStyles.detailsValue}>
                        {recordedLabel(selectedFine.paidAt)}
                      </Text>
                    </View>
                  )}

                  <View style={notificationStyles.detailsRemarks}>
                    <Text style={notificationStyles.detailsLabel}>Remarks</Text>
                    <Text style={notificationStyles.detailsValue}>
                      {selectedFine.remarks || "No additional remarks."}
                    </Text>
                  </View>

                  {!!readError && (
                    <View style={notificationStyles.readErrorBox}>
                      <Text style={notificationStyles.readErrorText}>
                        {readError}
                      </Text>
                      <TouchableOpacity
                        onPress={() => void markFineRead(selectedFine.id)}
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
                      selectedFine.isRead
                        ? notificationStyles.readLabel
                        : notificationStyles.newLabel,
                    ]}
                  >
                    {selectedFine.isRead ? "READ" : "NEW"}
                  </Text>
                </>
              ) : modalMode === "notifications" ? (
                visibleNotifications.length === 0 ? (
                  <View style={styles.emptyPanel}>
                    <Text style={styles.emptyTitle}>
                      {notificationFilter === "UNREAD"
                        ? "No unread fines"
                        : notificationFilter === "READ"
                          ? "No read fines"
                          : "No fine notifications"}
                    </Text>
                    <Text style={styles.helper}>
                      {notificationFilter === "UNREAD"
                        ? "You are all caught up."
                        : "Your fine updates will appear here."}
                    </Text>
                  </View>
                ) : (
                  visibleNotifications.map((fine) => (
                    <TouchableOpacity
                      key={fine.id}
                      onPress={() => openFine(fine)}
                      style={[
                        styles.activityCard,
                        !fine.isRead && notificationStyles.unreadActivityCard,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${fine.violationName} fine details`}
                    >
                      <View style={notificationStyles.activityTitleRow}>
                        <Text
                          style={[
                            styles.activityTitle,
                            fine.status === "PAID"
                              ? styles.greenText
                              : styles.redText,
                          ]}
                        >
                          {fine.status === "PAID"
                            ? "Fine marked paid"
                            : "Fine issued"}
                        </Text>
                        <View style={notificationStyles.activityReadState}>
                          {!fine.isRead && (
                            <View style={notificationStyles.unreadDot} />
                          )}
                          <Text
                            style={[
                              notificationStyles.activityReadText,
                              fine.isRead
                                ? notificationStyles.readLabel
                                : notificationStyles.newLabel,
                            ]}
                          >
                            {fine.isRead ? "READ" : "NEW"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.activityDescription}>
                        {fine.violationName}
                      </Text>
                      <View style={styles.activityFooter}>
                        <Text style={styles.timestamp}>
                          {recordedLabel(fine.recordedAt)}
                        </Text>
                        <Text style={styles.activityAmount}>
                          {money(fine.amountCentavos)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )
              ) : !data ? (
                <Text style={styles.helper}>
                  {loading
                    ? "Loading activities…"
                    : error || "Activities are currently unavailable."}
                </Text>
              ) : activities.length === 0 ? (
                <View style={styles.emptyPanel}>
                  <Text style={styles.emptyTitle}>No recent activities</Text>
                  <Text style={styles.helper}>
                    Updates will appear here when a fine is recorded or marked
                    paid.
                  </Text>
                </View>
              ) : (
                activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    isRead={readStatusForActivity(activity)}
                    onPress={() => openActivity(activity)}
                  />
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeModal}
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
