import { useAuth } from "@/hooks/use-auth";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { useFocusEffect, useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE } from "@/constants/api";

import { AdminModal } from "@/components/admin-modal";
import AdminFineDetails from "@/components/admin-modal/fine-details";
import LogoutModal from "@/components/logout-modal";
import { AdminNavBadge } from "@/components/notification-badge";
import { SummaryCard, SummaryCardRow } from "@/components/summary-card";
import { FadeIn } from "@/components/motion";
import { SkeletonList } from "@/components/skeleton";
import {
  formatNotificationTime,
  refreshNotificationCounts,
} from "@/hooks/use-notification-counts";

import { styles } from "./dashboard.styles";

// ==========================================
// TYPES
// ==========================================

type DashboardStats = {
  totalStudents: number;
  unpaidFines: number;
  unpaidAmountCentavos: number;
  pendingCashRequests: number;
  paidFines: number;
  todayCollectionCentavos: number;
  todayCollectionCount: number;
  totalCollectedCentavos: number;
  totalCollectedCount: number;
};

type NavItem = {
  label: string;
  route?: string;
  icon?: any;
};

type ActivityType =
  | "FINE_ISSUED"
  | "CASH_REQUESTED"
  | "PAYMENT_RECEIVED"
  | "FINE_MARKED_PAID"
  | "FINE_CANCELLED"
  | "STUDENT_ADDED"
  | "OFFICER_ADDED";

type ActivityCategory =
  | "ALL"
  | "FINES"
  | "CASH_REQUESTS"
  | "PAYMENTS"
  | "CANCELLED"
  | "ACCOUNTS";

type Activity = {
  key: string;
  type: ActivityType;
  category: Exclude<ActivityCategory, "ALL">;
  occurredAt: string;
  fineId: number | null;
  fineReference: string | null;
  paymentId: number | null;
  userId: number | null;
  subjectName: string;
  description: string;
  actorName: string | null;
  actorRole: string | null;
  amountCentavos: number | null;
};

type ActivityCounts = Record<ActivityCategory, number>;

type ActivityPage = {
  activities: Activity[];
  counts: ActivityCounts;
  nextOffset: number | null;
};

type AdminProfile = {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  profilePictureUri: string | null;
};

// One pop-up: every activity, or a fine (optionally opened from that list).
type DashboardModal =
  | { view: "all" }
  | { view: "fine"; fineId: number; fromAll: boolean }
  | null;

type SummaryCard = {
  label: string;
  value: string;
  hint: string;
  tone: "attention" | "danger" | "money" | "success" | "info";
  active?: boolean;
  onPress: () => void;
};

// ==========================================
// CONSTANTS
// ==========================================

const EMPTY_STATS: DashboardStats = {
  totalStudents: 0,
  unpaidFines: 0,
  unpaidAmountCentavos: 0,
  pendingCashRequests: 0,
  paidFines: 0,
  todayCollectionCentavos: 0,
  todayCollectionCount: 0,
  totalCollectedCentavos: 0,
  totalCollectedCount: 0,
};

const EMPTY_COUNTS: ActivityCounts = {
  ALL: 0,
  FINES: 0,
  CASH_REQUESTS: 0,
  PAYMENTS: 0,
  CANCELLED: 0,
  ACCOUNTS: 0,
};

const ACTIVITY_LABELS: Record<
  ActivityType,
  { label: string; tone: "red" | "amber" | "green" | "grey" | "blue" }
> = {
  FINE_ISSUED: { label: "Fine issued", tone: "red" },
  CASH_REQUESTED: { label: "Cash request", tone: "amber" },
  PAYMENT_RECEIVED: { label: "Payment", tone: "green" },
  FINE_MARKED_PAID: { label: "Marked paid", tone: "green" },
  FINE_CANCELLED: { label: "Cancelled", tone: "grey" },
  STUDENT_ADDED: { label: "New student", tone: "blue" },
  OFFICER_ADDED: { label: "New officer", tone: "blue" },
};

const ACTIVITY_FILTERS: { key: ActivityCategory; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "FINES", label: "Fines issued" },
  { key: "CASH_REQUESTS", label: "Cash requests" },
  { key: "PAYMENTS", label: "Payments" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "ACCOUNTS", label: "Accounts" },
];

const RECENT_COUNT = 8;
const PAGE_SIZE = 25;

// ==========================================
// HELPERS
// ==========================================

function money(centavos: number) {
  return `₱${(Number(centavos || 0) / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function authHeaders() {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("Please sign in again.");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "ngrok-skip-browser-warning": "true",
  };
}

async function fetchActivities(
  category: ActivityCategory,
  limit: number,
  offset: number,
): Promise<ActivityPage> {
  const response = await fetch(
    `${API_BASE}/api/dashboard/activities?category=${category}&limit=${limit}&offset=${offset}`,
    { headers: await authHeaders() },
  );
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success || !Array.isArray(data.activities)) {
    throw new Error(data?.message || "Could not load activities.");
  }

  return data;
}

function errorText(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  return error.message === "Network request failed"
    ? "Could not connect to the SmartFine server."
    : error.message;
}

// ==========================================
// ACTIVITY ROW
// ==========================================

function ActivityRow({
  activity,
  onPress,
}: {
  activity: Activity;
  onPress: () => void;
}) {
  const meta = ACTIVITY_LABELS[activity.type] ?? {
    label: "Activity",
    tone: "grey",
  };

  const toneStyle = {
    red: styles.toneRed,
    amber: styles.toneAmber,
    green: styles.toneGreen,
    grey: styles.toneGrey,
    blue: styles.toneBlue,
  }[meta.tone];

  const amountStyle =
    activity.category === "PAYMENTS"
      ? styles.amountPaid
      : activity.category === "CASH_REQUESTS"
        ? styles.amountAmber
        : activity.category === "CANCELLED"
          ? styles.amountMuted
          : styles.amountFine;

  const actor = activity.actorName
    ? `${activity.actorRole === "FINES_OFFICER" ? "Officer" : "Admin"} ${activity.actorName}`
    : null;

  return (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${meta.label}: ${activity.subjectName} ${activity.description}`}
    >
      <View style={styles.activityTextArea}>
        <Text style={[styles.activityChip, toneStyle]}>{meta.label}</Text>

        <Text style={styles.activityDescription}>
          <Text style={styles.activityName}>{activity.subjectName}</Text>{" "}
          {activity.description}
        </Text>

        <Text style={styles.activityDetails}>
          {actor ? `By ${actor} • ` : ""}
          {formatNotificationTime(activity.occurredAt)}
        </Text>
      </View>

      {activity.amountCentavos !== null && (
        <Text style={[styles.activityAmount, amountStyle]}>
          {money(activity.amountCentavos)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================

export default function AdminDashboard() {
  const router = useRouter();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const [activeMenu, setActiveMenu] = useState("Dashboard");

  // ==========================================
  // LOGOUT MODAL
  // ==========================================

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==========================================
  // DASHBOARD DATA
  // ==========================================

  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);

  const [statsLoading, setStatsLoading] = useState(true);

  const [statsError, setStatsError] = useState("");

  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  const [activityCounts, setActivityCounts] =
    useState<ActivityCounts>(EMPTY_COUNTS);

  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [activitiesError, setActivitiesError] = useState("");

  // ==========================================
  // ALL ACTIVITIES POP-UP
  // ==========================================

  const [modal, setModal] = useState<DashboardModal>(null);

  const [allCategory, setAllCategory] = useState<ActivityCategory>("ALL");

  const [allActivities, setAllActivities] = useState<Activity[]>([]);

  const [allNextOffset, setAllNextOffset] = useState<number | null>(null);

  const [allLoading, setAllLoading] = useState(false);

  const [allError, setAllError] = useState("");

  // Ignores a slow response after the filter has changed.
  const allRequestRef = useRef(0);

  // A fine changed from the pop-up; the list reloads when shown again.
  const allStaleRef = useRef(false);

  // ==========================================
  // ADMIN PROFILE
  // ==========================================

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const [adminImageFailed, setAdminImageFailed] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);

  // ==========================================
  // PAGE ANIMATIONS
  // ==========================================

  const headerOpacity = useRef(new Animated.Value(0)).current;

  const headerTranslateY = useRef(new Animated.Value(-12)).current;

  const cardAnimations = useRef(
    Array.from({ length: 6 }, () => ({
      opacity: new Animated.Value(0),

      translateY: new Animated.Value(18),
    })),
  ).current;

  const activityOpacity = useRef(new Animated.Value(0)).current;

  const activityTranslateY = useRef(new Animated.Value(18)).current;

  // ==========================================
  // DATE AND TIME (minute precision)
  // ==========================================

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = currentDateTime.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const hour = currentDateTime.getHours();

  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // ==========================================
  // DASHBOARD ENTRANCE ANIMATION
  // ==========================================

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.stagger(
        60,

        cardAnimations.map((animation) =>
          Animated.parallel([
            Animated.timing(animation.opacity, {
              toValue: 1,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),

            Animated.timing(animation.translateY, {
              toValue: 0,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ),
      ),

      Animated.parallel([
        Animated.timing(activityOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(activityTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // ==========================================
  // LOAD DASHBOARD DATA (on every visit)
  // ==========================================

  const loadDashboardStats = useCallback(async () => {
    setStatsError("");

    try {
      const response = await fetch(`${API_BASE}/api/dashboard/stats`, {
        headers: await authHeaders(),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data.stats) {
        throw new Error(
          data?.message || "Failed to load dashboard statistics.",
        );
      }

      setStats({ ...EMPTY_STATS, ...data.stats });
    } catch (error) {
      setStatsError(errorText(error, "Failed to load dashboard statistics."));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadRecentActivities = useCallback(async () => {
    setActivitiesError("");

    try {
      const page = await fetchActivities("ALL", RECENT_COUNT, 0);

      setRecentActivities(page.activities);

      setActivityCounts({ ...EMPTY_COUNTS, ...page.counts });
    } catch (error) {
      setActivitiesError(errorText(error, "Could not load activities."));
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboardStats();

      void loadRecentActivities();
    }, [loadDashboardStats, loadRecentActivities]),
  );

  // Pull down to reload the cards and the activity feed.
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const handlePullRefresh = async () => {
    setPullRefreshing(true);

    await Promise.all([loadDashboardStats(), loadRecentActivities()]);

    setPullRefreshing(false);
  };

  // ==========================================
  // LOAD ADMIN PROFILE
  // ==========================================

  useEffect(() => {
    loadAdminProfile();
  }, []);

  const loadAdminProfile = async () => {
    try {
      setProfileLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.user) {
        console.error("Failed to load admin profile:", data);

        return;
      }

      setAdminProfile(data.user);

      setAdminImageFailed(false);
    } catch (error) {
      console.error("Admin profile connection error:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const adminName = adminProfile
    ? [
        adminProfile.firstName,
        adminProfile.middleName?.trim()
          ? `${adminProfile.middleName.trim()[0]}.`
          : null,
        adminProfile.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  const adminInitials =
    `${adminProfile?.firstName?.[0] ?? ""}${adminProfile?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "AD";

  // ==========================================
  // ALL ACTIVITIES
  // ==========================================

  const loadAllActivities = async (
    category: ActivityCategory,
    offset: number,
  ) => {
    const requestId = ++allRequestRef.current;

    setAllLoading(true);

    setAllError("");

    try {
      const page = await fetchActivities(category, PAGE_SIZE, offset);

      if (requestId !== allRequestRef.current) return;

      setAllActivities((current) =>
        offset === 0 ? page.activities : [...current, ...page.activities],
      );

      setAllNextOffset(page.nextOffset);

      setActivityCounts({ ...EMPTY_COUNTS, ...page.counts });
    } catch (error) {
      if (requestId !== allRequestRef.current) return;

      setAllError(errorText(error, "Could not load activities."));
    } finally {
      if (requestId === allRequestRef.current) {
        setAllLoading(false);
      }
    }
  };

  const showCategory = (category: ActivityCategory) => {
    setAllCategory(category);

    setAllActivities([]);

    setAllNextOffset(null);

    void loadAllActivities(category, 0);
  };

  const handleViewActivities = () => {
    allStaleRef.current = false;

    setModal({ view: "all" });

    showCategory("ALL");
  };

  const backToAllActivities = () => {
    setModal({ view: "all" });

    if (allStaleRef.current) {
      allStaleRef.current = false;

      showCategory(allCategory);
    }
  };

  // Fine activities open the fine here; account activities open the profile.
  const handleActivityPress = (activity: Activity, fromAll: boolean) => {
    if (activity.fineId) {
      setModal({ view: "fine", fineId: activity.fineId, fromAll });

      return;
    }

    if (activity.userId) {
      setModal(null);

      router.push(
        (activity.type === "OFFICER_ADDED"
          ? `/admin/officers/${activity.userId}`
          : `/admin/students/${activity.userId}`) as any,
      );
    }
  };

  const handleFineChanged = () => {
    allStaleRef.current = true;

    void loadDashboardStats();

    void loadRecentActivities();

    void refreshNotificationCounts();
  };

  const handleEditFine = (fineId: number) => {
    setModal(null);

    router.push(`/admin/fines/${fineId}/edit` as any);
  };

  // ==========================================
  // NAVIGATION ITEMS
  // ==========================================

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      route: "/admin/dashboard",
      icon: require("../../../assets/icons/dashboard.png"),
    },

    {
      label: "Students",
      route: "/admin/students",
      icon: require("../../../assets/icons/students.png"),
    },

    {
      label: "Fines",
      route: "/admin/fines",
      icon: require("../../../assets/icons/fines.png"),
    },

    {
      label: "QR Scanner",
      route: "/admin/qr-scanner",
      icon: require("../../../assets/icons/qr-codeWhite.png"),
    },

    {
      label: "Reports",
      route: "/admin/reports",
      icon: require("../../../assets/icons/reports.png"),
    },

    {
      label: "Settings",
      route: "/admin/settings",
      icon: require("../../../assets/icons/settings.png"),
    },

    {
      label: "Officers",
      route: "/admin/officers",
      icon: require("../../../assets/icons/officers.png"),
    },
  ];

  // ==========================================
  // SUMMARY CARDS (each opens its module)
  // ==========================================

  const openFines = (status: string) =>
    router.push({ pathname: "/admin/fines", params: { status } } as any);

  const summaryCards: SummaryCard[] = [
    {
      label: "Pending Cash Requests",
      value: String(stats.pendingCashRequests),
      hint:
        stats.pendingCashRequests > 0
          ? "Waiting at the cashier"
          : "None waiting",
      tone: "attention",
      active: stats.pendingCashRequests > 0,
      onPress: () => openFines("PENDING_CASH"),
    },

    {
      label: "Unpaid Fines",
      value: String(stats.unpaidFines),
      hint: `${money(stats.unpaidAmountCentavos)} outstanding`,
      tone: "danger",
      onPress: () => openFines("UNPAID"),
    },

    {
      label: "Today's Collection",
      value: money(stats.todayCollectionCentavos),
      hint: `${stats.todayCollectionCount} ${stats.todayCollectionCount === 1 ? "payment" : "payments"} today`,
      tone: "money",
      onPress: () => router.push("/admin/reports" as any),
    },

    {
      label: "Total Collected",
      value: money(stats.totalCollectedCentavos),
      hint: `${stats.totalCollectedCount} ${stats.totalCollectedCount === 1 ? "payment" : "payments"} in all`,
      tone: "success",
      onPress: () => router.push("/admin/reports" as any),
    },

    {
      label: "Paid Fines",
      value: String(stats.paidFines),
      hint: "Settled fines",
      tone: "success",
      onPress: () => openFines("PAID"),
    },

    {
      label: "Total Students",
      value: String(stats.totalStudents),
      hint: "Active and inactive accounts",
      tone: "info",
      onPress: () => router.push("/admin/students" as any),
    },
  ];

  const quickActions = [
    {
      label: "Record Fine",
      route: "/admin/fines/add",
      icon: require("../../../assets/icons/fines.png"),
      primary: true,
    },
    {
      label: "Scan Student QR",
      route: "/admin/qr-scanner",
      icon: require("../../../assets/icons/qr-code.png"),
    },
    {
      label: "Add Student",
      route: "/admin/students/add",
      icon: require("../../../assets/icons/students.png"),
    },
    {
      label: "Payment Reports",
      route: "/admin/reports",
      icon: require("../../../assets/icons/wallet.png"),
    },
  ];

  // ==========================================
  // NAVIGATION HANDLER
  // ==========================================

  const handleNavigation = (item: NavItem) => {
    setActiveMenu(item.label);

    if (!item.route) {
      return;
    }

    router.push(item.route as any);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    if (logoutLoading) {
      return;
    }

    setShowLogoutModal(false);
  };

  const performLogout = async () => {
    try {
      setLogoutLoading(true);

      await logout();

      setShowLogoutModal(false);

      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);

      if (Platform.OS === "web") {
        window.alert("Could not log out. Please try again.");
      } else {
        Alert.alert("Logout Error", "Could not log out. Please try again.");
      }
    } finally {
      setLogoutLoading(false);
    }
  };

  // ==========================================
  // ADMIN PROFILE PICTURE URL
  // ==========================================

  const adminProfilePictureUrl = getProfilePictureUrl(
    adminProfile?.profilePictureUri,
  );

  // ==========================================
  // UI
  // ==========================================

  return (
    <View style={styles.screen}>
      {/* ======================================
          SIDEBAR
      ====================================== */}

      {isTablet && (
        <View style={styles.sidebar}>
          <View style={styles.logoArea}>
            <Image
              source={require("../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.navigation}>
            {navItems.map((item) => {
              const isActive = activeMenu === item.label;

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => handleNavigation(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.navIconContainer}>
                    <Image
                      source={item.icon}
                      style={styles.navImageIcon}
                      resizeMode="contain"
                    />
                  </View>

                  <Text
                    style={[styles.navText, isActive && styles.navTextActive]}
                  >
                    {item.label}
                  </Text>
                  <AdminNavBadge label={item.label} />
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={handlePullRefresh}
              tintColor="#173A73"
              colors={["#173A73"]}
            />
          }
        >
          {/* ==================================
              HEADER
          ================================== */}

          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            <View>
              <Text style={styles.pageTitle}>Dashboard</Text>

              <Text style={styles.greetingText}>{greeting}</Text>

              <Text style={styles.dateText}>{formattedDateTime}</Text>
            </View>

            <View style={styles.profileArea}>
              <View style={styles.profileTextArea}>
                {!!adminName && (
                  <Text style={styles.adminName}>
                    {adminName.toUpperCase()}
                  </Text>
                )}

                <Text style={styles.adminRole}>Administrator</Text>
              </View>

              <View style={styles.avatar}>
                {profileLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : adminProfilePictureUrl && !adminImageFailed ? (
                  <Image
                    source={{ uri: adminProfilePictureUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={() => setAdminImageFailed(true)}
                  />
                ) : (
                  <Text style={styles.avatarText}>{adminInitials}</Text>
                )}
              </View>
            </View>
          </Animated.View>

          {/* ==================================
              MOBILE NAVIGATION
          ================================== */}

          {!isTablet && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileNav}
            >
              {navItems.map((item) => {
                const isActive = activeMenu === item.label;

                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.mobileNavItem,
                      isActive && styles.mobileNavItemActive,
                    ]}
                    onPress={() => handleNavigation(item)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.mobileNavText,
                        isActive && styles.mobileNavTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <AdminNavBadge label={item.label} variant="menu" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ==================================
              SUMMARY CARDS
          ================================== */}

          <SummaryCardRow>
            {summaryCards.map((card, index) => (
              <SummaryCard
                key={card.label}
                label={card.label}
                value={card.value}
                hint={card.hint}
                tone={card.tone}
                highlighted={card.active}
                loading={statsLoading}
                onPress={card.onPress}
                animatedStyle={{
                  opacity: cardAnimations[index].opacity,
                  transform: [{ translateY: cardAnimations[index].translateY }],
                }}
              />
            ))}
          </SummaryCardRow>

          {!!statsError && (
            <TouchableOpacity
              style={[styles.viewActivitiesButton, styles.statsError]}
              onPress={() => void loadDashboardStats()}
            >
              <Text style={styles.viewActivitiesText}>
                {statsError} Tap to try again.
              </Text>
            </TouchableOpacity>
          )}

          {/* ==================================
              QUICK ACTIONS
          ================================== */}

          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[
                  styles.quickAction,
                  action.primary && styles.quickActionPrimary,
                ]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Image
                  source={action.icon}
                  style={[
                    styles.quickActionIcon,
                    action.primary && styles.quickActionIconPrimary,
                  ]}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.quickActionText,
                    action.primary && styles.quickActionTextPrimary,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ==================================
              RECENT ACTIVITY
          ================================== */}

          <Animated.View
            style={[
              styles.activityPanel,
              {
                opacity: activityOpacity,
                transform: [{ translateY: activityTranslateY }],
              },
            ]}
          >
            <View style={styles.activityHeader}>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.activityTitle}>Recent Activity</Text>

                <Text style={styles.activitySubtitle}>
                  Fines, cashier requests, payments, cancellations, and new
                  accounts
                </Text>
              </View>

              {activityCounts.ALL > 0 && (
                <TouchableOpacity
                  style={styles.viewActivitiesButton}
                  onPress={handleViewActivities}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewActivitiesText}>
                    View all ({activityCounts.ALL})
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.activityList}>
              {activitiesLoading && recentActivities.length === 0 ? (
                <SkeletonList
                  label="Loading recent activity"
                  count={5}
                  avatar={false}
                  itemStyle={styles.activityItem}
                />
              ) : activitiesError && recentActivities.length === 0 ? (
                <TouchableOpacity
                  style={styles.activityEmptyContainer}
                  onPress={() => void loadRecentActivities()}
                >
                  <Text style={styles.activityEmptyText}>
                    {activitiesError} Tap to try again.
                  </Text>
                </TouchableOpacity>
              ) : recentActivities.length === 0 ? (
                <View style={styles.activityEmptyContainer}>
                  <Text style={styles.activityEmptyText}>
                    No activity recorded yet.
                  </Text>
                </View>
              ) : (
                recentActivities.map((activity, index) => (
                  <FadeIn key={activity.key} index={index}>
                    <ActivityRow
                      activity={activity}
                      onPress={() => handleActivityPress(activity, false)}
                    />
                  </FadeIn>
                ))
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </View>

      {/* ======================================
          ALL ACTIVITIES AND FINE POP-UP
      ====================================== */}

      <AdminModal
        visible={modal !== null}
        title={modal?.view === "all" ? "All activity" : "Fine details"}
        subtitle={
          modal?.view === "all"
            ? `${activityCounts.ALL} activities recorded in SmartFine`
            : "Fine record and actions"
        }
        onClose={() => setModal(null)}
        onBack={
          modal?.view === "fine" && modal.fromAll
            ? backToAllActivities
            : undefined
        }
      >
        {modal?.view === "all" ? (
          <>
            <View style={styles.filterRow}>
              {ACTIVITY_FILTERS.map((filter) => {
                const active = filter.key === allCategory;

                return (
                  <TouchableOpacity
                    key={filter.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => showCategory(filter.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {filter.label} ({activityCounts[filter.key]})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
            >
              {allActivities.map((activity, index) => (
                <FadeIn key={activity.key} index={index}>
                  <ActivityRow
                    activity={activity}
                    onPress={() => handleActivityPress(activity, true)}
                  />
                </FadeIn>
              ))}

              {/* First page: placeholder rows. Later pages: a small spinner. */}
              {allLoading && allActivities.length === 0 ? (
                <SkeletonList
                  label="Loading activity"
                  count={6}
                  avatar={false}
                  itemStyle={styles.activityItem}
                />
              ) : allLoading ? (
                <View style={styles.activityLoadingContainer}>
                  <ActivityIndicator size="small" color="#173A73" />
                </View>
              ) : allError ? (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() =>
                    void loadAllActivities(allCategory, allActivities.length)
                  }
                >
                  <Text style={styles.loadMoreText}>
                    {allError} Tap to try again.
                  </Text>
                </TouchableOpacity>
              ) : allActivities.length === 0 ? (
                <Text style={styles.activityEmptyText}>
                  No activity here yet.
                </Text>
              ) : allNextOffset !== null ? (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() =>
                    void loadAllActivities(allCategory, allNextOffset)
                  }
                >
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.listFooterText}>
                  Showing all {allActivities.length}
                </Text>
              )}
            </ScrollView>
          </>
        ) : modal?.view === "fine" ? (
          <AdminFineDetails
            fineId={modal.fineId}
            onChanged={handleFineChanged}
            onNoticesRead={() => {}}
            onEdit={handleEditFine}
          />
        ) : null}
      </AdminModal>

      {/* ======================================
          LOGOUT CONFIRMATION MODAL
      ====================================== */}

      <LogoutModal
        visible={showLogoutModal}
        loading={logoutLoading}
        onCancel={handleCancelLogout}
        onConfirm={performLogout}
      />
    </View>
  );
}

// ==========================================
// PROFILE PICTURE URL
// ==========================================

function getProfilePictureUrl(uri: string | null | undefined) {
  if (!uri) {
    return null;
  }

  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  return `${API_BASE}${uri}`;
}
