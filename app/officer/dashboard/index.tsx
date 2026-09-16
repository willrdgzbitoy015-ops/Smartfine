import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
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

import { useResponsiveStyles } from "./dashboard-styles";

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

  const router = useRouter();

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
  // LOAD DASHBOARD
  // ========================================

  const loadDashboard = useCallback(async () => {
    requestRef.current?.abort();

    const controller = new AbortController();

    requestRef.current = controller;

    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;

      controller.abort();
    }, 15000);

    setLoading(true);

    setError("");

    setAccessDenied(false);

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

  // ========================================
  // DISPLAY DATA
  // ========================================

  const officer = data?.user;

  const stats = data?.stats;

  const activities = data?.activities ?? [];

  // Only the newest three appear on
  // the main dashboard.

  const recentActivities = activities.slice(0, 3);

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

      router.replace("/login" as any);
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
              INITIAL LOADING
          ================================= */}

          {loading && !data ? (
            <View style={styles.loadingPanel}>
              <ActivityIndicator size="large" color="#173A73" />

              <Text style={styles.helper}>Loading your dashboard…</Text>
            </View>
          ) : null}

          {/* =================================
              TOTAL STUDENTS
          ================================= */}

          <View style={styles.totalCard}>
            <Text style={styles.cardLabel}>Total Students</Text>

            <Text style={styles.totalValue}>
              {stats ? stats.totalStudents.toLocaleString("en-PH") : "—"}
            </Text>
          </View>

          {/* =================================
              FINES SUMMARY
          ================================= */}

          <View style={styles.summaryRow}>
            <View style={styles.smallCard}>
              <Text style={styles.smallLabel}>Fines Recorded</Text>

              <Text style={styles.countValue}>
                {stats ? stats.finesRecorded.toLocaleString("en-PH") : "—"}
              </Text>
            </View>

            <View style={styles.smallCard}>
              <Text style={styles.smallLabel}>Today’s Fines</Text>

              <Text style={styles.moneyValue}>
                {stats ? money(stats.todayAmountCentavos) : "—"}
              </Text>
            </View>
          </View>

          {/* =================================
              RECENT ACTIVITIES
          ================================= */}

          <Text style={styles.sectionTitle}>Recent Activities</Text>

          {data && activities.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>No recorded fines yet</Text>

              <Text style={styles.helper}>
                Fines you record will appear here.
              </Text>
            </View>
          ) : null}

          {recentActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
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

                  <View
                    style={[
                      styles.activeIndicator,

                      !active && styles.hiddenIndicator,
                    ]}
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
          <SafeAreaView style={styles.modalCard}>
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
                activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
