import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_BASE } from "@/constants/api";

import LogoutModal from "@/components/logout-modal";

import { styles } from "./dashboard.styles";

// ==========================================
// TYPES
// ==========================================

type DashboardStats = {
  totalStudents: number;
  unpaidFines: number;
  todayCollection: number;
  paidFines: number;
};

type NavItem = {
  label: string;
  route?: string;
  icon?: any;
};

type SummaryCard = {
  label: string;
  value: string;
  type: "normal" | "danger" | "success" | "money";
};

type Activity = {
  id: number;
  name: string;
  description: string;
  amount: number;
  created_at: string;
  activity_type: "paid" | "fine";
  details: string;
};

type AdminProfile = {
  profilePictureUri: string | null;
};

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
  // DASHBOARD STATS
  // ==========================================

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    unpaidFines: 0,
    todayCollection: 0,
    paidFines: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  // ==========================================
  // RECENT ACTIVITIES
  // ==========================================

  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // ==========================================
  // ADMIN PROFILE
  // ==========================================

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  const [adminImageFailed, setAdminImageFailed] = useState(false);

  // ==========================================
  // REAL-TIME DATE AND TIME
  // ==========================================

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = currentDateTime.toLocaleString("en-US", {
    weekday: "long",

    month: "short",

    day: "numeric",

    year: "numeric",

    hour: "numeric",

    minute: "2-digit",

    second: "2-digit",

    hour12: true,
  });

  // ==========================================
  // LOAD DASHBOARD STATS
  // ==========================================

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);

      const response = await fetch(`${API_BASE}/api/dashboard/stats`);

      const data = await response.json();

      console.log("Dashboard stats response:", data);

      if (!response.ok || !data.success) {
        console.error("Failed to load dashboard stats:", data);

        return;
      }

      setStats(data.stats);
    } catch (error) {
      console.error("Dashboard stats connection error:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  // ==========================================
  // LOAD RECENT ACTIVITIES
  // ==========================================

  useEffect(() => {
    loadRecentActivities();
  }, []);

  const loadRecentActivities = async () => {
    try {
      setActivitiesLoading(true);

      const response = await fetch(
        `${API_BASE}/api/dashboard/recent-activities`,
      );

      const data = await response.json();

      console.log("Recent activities response:", data);

      if (!response.ok || !data.success) {
        console.error("Failed to load recent activities:", data);

        return;
      }

      setRecentActivities(data.activities);
    } catch (error) {
      console.error("Recent activities connection error:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // ==========================================
  // LOAD ADMIN PROFILE
  // ==========================================

  useEffect(() => {
    loadAdminProfile();
  }, []);

  const loadAdminProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        console.log("Admin dashboard profile: token not found.");

        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log("Admin dashboard profile response:", data);

      if (!response.ok || !data.success || !data.user) {
        console.error("Failed to load admin profile:", data);

        return;
      }

      setAdminProfile(data.user);

      setAdminImageFailed(false);
    } catch (error) {
      console.error("Admin profile connection error:", error);
    }
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
  // SUMMARY CARDS
  // ==========================================

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Students",

      value: statsLoading ? "..." : String(stats.totalStudents),

      type: "success",
    },

    {
      label: "Unpaid Fines",

      value: statsLoading ? "..." : String(stats.unpaidFines),

      type: "danger",
    },

    {
      label: "Today's Collection",

      value: statsLoading
        ? "..."
        : `₱ ${Number(stats.todayCollection).toFixed(2)}`,

      type: "money",
    },

    {
      label: "Paid Fines",

      value: statsLoading ? "..." : String(stats.paidFines),

      type: "success",
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
  // VIEW ACTIVITIES
  // ==========================================

  const handleViewActivities = () => {
    router.push("/admin/fines" as any);
  };

  // ==========================================
  // OPEN LOGOUT MODAL
  // ==========================================

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // ==========================================
  // CANCEL LOGOUT
  // ==========================================

  const handleCancelLogout = () => {
    if (logoutLoading) {
      return;
    }

    setShowLogoutModal(false);
  };

  // ==========================================
  // CONFIRM LOGOUT
  // ==========================================

  const performLogout = async () => {
    try {
      setLogoutLoading(true);

      console.log("Logout confirmation accepted.");

      await logout();

      console.log("Admin logged out successfully.");

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
          {/* ==================================
              SMARTFINE LOGO
          ================================== */}

          <View style={styles.logoArea}>
            <Image
              source={require("../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          {/* ==================================
              NAVIGATION
          ================================== */}

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
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ==================================
              LOGOUT BUTTON
          ================================== */}

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
        >
          {/* ==================================
              HEADER
          ================================== */}

          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>Dashboard</Text>

              <Text style={styles.dateText}>{formattedDateTime}</Text>
            </View>

            <View style={styles.profileArea}>
              <View style={styles.profileTextArea}>
                <Text style={styles.adminName}>WILL R. BITOY</Text>

                <Text style={styles.adminRole}>Administrator</Text>
              </View>

              {/* ==================================
                  ADMIN PROFILE PICTURE
              ================================== */}

              <View style={styles.avatar}>
                {adminProfilePictureUrl && !adminImageFailed ? (
                  <Image
                    source={{
                      uri: adminProfilePictureUrl,
                    }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={() => setAdminImageFailed(true)}
                  />
                ) : (
                  <Text style={styles.avatarText}>WB</Text>
                )}
              </View>
            </View>
          </View>

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
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ==================================
              SUMMARY CARDS
          ================================== */}

          <View style={styles.cardsContainer}>
            {summaryCards.map((card) => (
              <View
                key={card.label}
                style={[
                  styles.summaryCard,

                  card.type === "danger" && styles.cardDanger,

                  card.type === "success" && styles.cardSuccess,

                  card.type === "money" && styles.cardMoney,
                ]}
              >
                <Text style={styles.cardLabel}>{card.label}</Text>

                <Text
                  style={[
                    styles.cardValue,

                    card.type === "danger" && styles.valueDanger,

                    card.type === "success" && styles.valueSuccess,

                    card.type === "money" && styles.valueMoney,
                  ]}
                >
                  {card.value}
                </Text>
              </View>
            ))}
          </View>

          {/* ==================================
              RECENT ACTIVITIES
          ================================== */}

          <View style={styles.activityPanel}>
            <Text style={styles.activityTitle}>Recent Activities</Text>

            <View style={styles.activityList}>
              {activitiesLoading ? (
                <Text style={styles.activityDetails}>
                  Loading recent activities...
                </Text>
              ) : recentActivities.length === 0 ? (
                <Text style={styles.activityDetails}>
                  No recent activities yet.
                </Text>
              ) : (
                recentActivities.map((activity) => (
                  <View
                    key={`${activity.activity_type}-${activity.id}`}
                    style={styles.activityItem}
                  >
                    <View style={styles.activityTextArea}>
                      <Text style={styles.activityDescription}>
                        <Text style={styles.activityName}>{activity.name}</Text>{" "}
                        {activity.description}
                      </Text>

                      <Text style={styles.activityDetails}>
                        {formatActivityTime(activity.created_at)} •{" "}
                        {activity.details}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.activityAmount,

                        activity.activity_type === "paid"
                          ? styles.amountPaid
                          : styles.amountFine,
                      ]}
                    >
                      ₱{Number(activity.amount).toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={styles.viewActivitiesButton}
              onPress={handleViewActivities}
              activeOpacity={0.8}
            >
              <Text style={styles.viewActivitiesText}>View all activities</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

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

// ==========================================
// ACTIVITY RECORDED TIME
// ==========================================

function formatActivityTime(value: string | null | undefined) {
  if (!value) {
    return "--";
  }

  try {
    let normalized = value.trim();

    // SQLite CURRENT_TIMESTAMP:
    // YYYY-MM-DD HH:MM:SS
    // is UTC.
    //
    // Convert it into an ISO UTC value
    // before displaying Philippine time.

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
      normalized = normalized.replace(" ", "T") + "Z";
    }

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",

      minute: "2-digit",

      hour12: true,

      timeZone: "Asia/Manila",
    });
  } catch {
    return value;
  }
}
