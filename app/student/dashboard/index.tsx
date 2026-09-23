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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE } from "@/constants/api";
import { styles } from "../styles/student-dashboard.styles";

// ==========================================
// TYPES
// ==========================================

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

// ==========================================
// OFFICIAL ICONS
// ==========================================

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

// ==========================================
// HELPERS
// ==========================================

function money(centavos: number) {
  if (!Number.isFinite(centavos)) return "—";

  return `₱ ${(centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function imageUrl(value?: string | null) {
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

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
    // SQLite CURRENT_TIMESTAMP is stored in UTC.
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

// ==========================================
// ACTIVITY CARD
// ==========================================

function ActivityCard({ activity }: { activity: Activity }) {
  const paid = activity.type === "PAID";

  return (
    <View style={styles.activityCard}>
      <Text
        style={[styles.activityTitle, paid ? styles.greenText : styles.redText]}
      >
        {paid ? "Fine marked paid" : "New Fine Issued"}
      </Text>

      <Text style={styles.activityDescription}>{activity.description}</Text>

      <View style={styles.activityFooter}>
        <Text style={styles.timestamp}>
          {recordedLabel(activity.recordedAt)}
        </Text>

        <Text style={styles.activityAmount}>
          {money(activity.amountCentavos)}
        </Text>
      </View>
    </View>
  );
}

// ==========================================
// STUDENT DASHBOARD
// ==========================================

export default function StudentDashboard() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [activitiesVisible, setActivitiesVisible] = useState(false);

  const requestRef = useRef<AbortController | null>(null);

  // ========================================
  // LOAD DASHBOARD
  // ========================================

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

  // Refresh when returning to the dashboard.
  useFocusEffect(
    useCallback(() => {
      void loadDashboard();

      return () => {
        requestRef.current?.abort();
        requestRef.current = null;
      };
    }, [loadDashboard]),
  );

  // ========================================
  // DISPLAY DATA
  // ========================================

  const name = data?.user.fullName || data?.user.username || "Student";
  const avatar = imageUrl(data?.user.profilePictureUri);

  const outstanding = data?.stats.outstandingAmountCentavos;
  const hasBalance = outstanding !== undefined && outstanding > 0;

  const activities = data?.activities ?? [];
  const recentActivities = activities.slice(0, 3);

  useEffect(() => {
    setImageFailed(false);
  }, [avatar]);

  // ========================================
  // FUTURE MODULES
  // ========================================

  const upcoming = (module: string) => {
    Alert.alert(module, "This feature is not available yet.");
  };

  // ========================================
  // RETURN TO LOGIN
  // ========================================

  const returnToLogin = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "userId",
        "userRole",
        "userEmail",
      ]);

      setActivitiesVisible(false);
      router.replace("/login");
    } catch {
      setError("Unable to clear your session. Please try again.");
    }
  };

  // ========================================
  // SCREEN
  // ========================================

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
          {/* STUDENT HEADER */}

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
              onPress={() => setActivitiesVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="View recent activities"
            >
              <Image
                source={icons.notification}
                style={styles.notificationIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* ERROR */}

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

          {/* INITIAL LOADING */}

          {loading && !data && (
            <View style={styles.loadingPanel}>
              <ActivityIndicator size="large" color="#123266" />
              <Text style={styles.helper}>Loading your dashboard…</Text>
            </View>
          )}

          {/* OUTSTANDING FINE */}

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

          {/* QUICK ACTIONS */}

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

          {/* THREE MOST RECENT ACTIVITIES */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setActivitiesVisible(true)}
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
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </ScrollView>

        {/* BOTTOM NAVIGATION */}

        <SafeAreaView style={styles.bottomArea} edges={["bottom"]}>
          <View style={styles.bottomNavigation}>
            {navigation.map((item) => {
              const active = item.label === "Home";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={styles.navItem}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    if (item.label === "Home") {
                      void loadDashboard();
                    } else if (item.label === "Fines") {
                      router.push("/student/fines");
                    } else {
                      upcoming(item.label);
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

      {/* RECENT ACTIVITIES POPUP */}

      <Modal
        visible={activitiesVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActivitiesVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recent Activities</Text>
            </View>

            <Text style={styles.modalHelper}>
              Your latest fine and payment updates
            </Text>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {!!error && data && (
                <Text style={styles.modalWarning}>
                  Showing your last loaded activities. Close this window and
                  refresh the dashboard to try again.
                </Text>
              )}

              {loading && !data ? (
                <View style={styles.loadingPanel}>
                  <ActivityIndicator size="large" color="#123266" />
                  <Text style={styles.helper}>Loading activities…</Text>
                </View>
              ) : !data ? (
                <Text style={styles.helper}>
                  {error || "Activities are currently unavailable."}
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
                  <ActivityCard key={activity.id} activity={activity} />
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setActivitiesVisible(false)}
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
