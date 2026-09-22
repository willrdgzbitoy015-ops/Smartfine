import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
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
  // ACTIVITIES MODAL
  // ==========================================

  const [showActivitiesModal, setShowActivitiesModal] = useState(false);

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

  const [profileLoading, setProfileLoading] = useState(true);

  // ==========================================
  // PAGE ANIMATIONS
  // ==========================================

  const headerOpacity = useRef(new Animated.Value(0)).current;

  const headerTranslateY = useRef(new Animated.Value(-12)).current;

  const cardAnimations = useRef(
    Array.from({ length: 4 }, () => ({
      opacity: new Animated.Value(0),

      translateY: new Animated.Value(18),
    })),
  ).current;

  const activityOpacity = useRef(new Animated.Value(0)).current;

  const activityTranslateY = useRef(new Animated.Value(18)).current;

  // ==========================================
  // ACTIVITIES MODAL ANIMATION
  // ==========================================

  const activitiesModalOpacity = useRef(new Animated.Value(0)).current;

  const activitiesModalScale = useRef(new Animated.Value(0.96)).current;

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
        80,

        cardAnimations.map((animation) =>
          Animated.parallel([
            Animated.timing(animation.opacity, {
              toValue: 1,

              duration: 280,

              easing: Easing.out(Easing.cubic),

              useNativeDriver: true,
            }),

            Animated.timing(animation.translateY, {
              toValue: 0,

              duration: 280,

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
  // ACTIVITIES POPUP ENTRANCE ANIMATION
  // ==========================================

  useEffect(() => {
    if (!showActivitiesModal) {
      return;
    }

    activitiesModalOpacity.setValue(0);

    activitiesModalScale.setValue(0.96);

    Animated.parallel([
      Animated.timing(activitiesModalOpacity, {
        toValue: 1,

        duration: 180,

        easing: Easing.out(Easing.cubic),

        useNativeDriver: true,
      }),

      Animated.spring(activitiesModalScale, {
        toValue: 1,

        friction: 8,

        tension: 70,

        useNativeDriver: true,
      }),
    ]).start();
  }, [showActivitiesModal]);

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

      setRecentActivities(data.activities || []);
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
      setProfileLoading(true);

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
    } finally {
      setProfileLoading(false);
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

      value: String(stats.totalStudents),

      type: "success",
    },

    {
      label: "Unpaid Fines",

      value: String(stats.unpaidFines),

      type: "danger",
    },

    {
      label: "Today's Collection",

      value: `₱ ${Number(stats.todayCollection).toFixed(2)}`,

      type: "money",
    },

    {
      label: "Paid Fines",

      value: String(stats.paidFines),

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
  // VIEW ALL ACTIVITIES
  // ==========================================

  const handleViewActivities = () => {
    setShowActivitiesModal(true);
  };

  const handleCloseActivities = () => {
    Animated.parallel([
      Animated.timing(activitiesModalOpacity, {
        toValue: 0,

        duration: 140,

        easing: Easing.in(Easing.cubic),

        useNativeDriver: true,
      }),

      Animated.timing(activitiesModalScale, {
        toValue: 0.96,

        duration: 140,

        easing: Easing.in(Easing.cubic),

        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowActivitiesModal(false);
    });
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
        >
          {/* ==================================
              HEADER
          ================================== */}

          <Animated.View
            style={[
              styles.header,

              {
                opacity: headerOpacity,

                transform: [
                  {
                    translateY: headerTranslateY,
                  },
                ],
              },
            ]}
          >
            <View>
              <Text style={styles.pageTitle}>Dashboard</Text>

              <Text style={styles.dateText}>{formattedDateTime}</Text>
            </View>

            <View style={styles.profileArea}>
              <View style={styles.profileTextArea}>
                <Text style={styles.adminName}>WILL R. BITOY</Text>

                <Text style={styles.adminRole}>Administrator</Text>
              </View>

              <View style={styles.avatar}>
                {profileLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : adminProfilePictureUrl && !adminImageFailed ? (
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
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ==================================
              SUMMARY CARDS
          ================================== */}

          <View style={styles.cardsContainer}>
            {summaryCards.map((card, index) => {
              const cardAnimation = cardAnimations[index];

              return (
                <Animated.View
                  key={card.label}
                  style={[
                    styles.summaryCard,

                    card.type === "danger" && styles.cardDanger,

                    card.type === "success" && styles.cardSuccess,

                    card.type === "money" && styles.cardMoney,

                    {
                      opacity: cardAnimation.opacity,

                      transform: [
                        {
                          translateY: cardAnimation.translateY,
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.cardLabel}>{card.label}</Text>

                  {statsLoading ? (
                    <View style={styles.cardLoadingArea}>
                      <ActivityIndicator size="small" color="#173A73" />

                      <Text style={styles.cardLoadingText}>Loading...</Text>
                    </View>
                  ) : (
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
                  )}
                </Animated.View>
              );
            })}
          </View>

          {/* ==================================
              RECENT ACTIVITIES
          ================================== */}

          <Animated.View
            style={[
              styles.activityPanel,

              {
                opacity: activityOpacity,

                transform: [
                  {
                    translateY: activityTranslateY,
                  },
                ],
              },
            ]}
          >
            <Text style={styles.activityTitle}>Recent Activities</Text>

            <View style={styles.activityList}>
              {activitiesLoading ? (
                <View style={styles.activityLoadingContainer}>
                  <ActivityIndicator size="large" color="#173A73" />

                  <Text style={styles.activityLoadingText}>
                    Loading recent activities...
                  </Text>
                </View>
              ) : recentActivities.length === 0 ? (
                <View style={styles.activityEmptyContainer}>
                  <Text style={styles.activityEmptyText}>
                    No recent activities yet.
                  </Text>
                </View>
              ) : (
                recentActivities.slice(0, 5).map((activity) => (
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

            {!activitiesLoading && recentActivities.length > 0 && (
              <TouchableOpacity
                style={styles.viewActivitiesButton}
                onPress={handleViewActivities}
                activeOpacity={0.8}
              >
                <Text style={styles.viewActivitiesText}>
                  View all activities
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </View>

      {/* ======================================
          ALL ACTIVITIES MODAL
      ====================================== */}

      <Modal
        visible={showActivitiesModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseActivities}
      >
        <View style={styles.activitiesModalOverlay}>
          <Animated.View
            style={[
              styles.activitiesModal,

              {
                opacity: activitiesModalOpacity,

                transform: [
                  {
                    scale: activitiesModalScale,
                  },
                ],
              },
            ]}
          >
            {/* HEADER */}

            <View style={styles.activitiesModalHeader}>
              <View style={styles.activitiesModalHeaderText}>
                <Text style={styles.activitiesModalTitle}>
                  All Recent Activities
                </Text>

                <Text style={styles.activitiesModalSubtitle}>
                  Fine and payment activities recorded in SmartFine
                </Text>
              </View>

              <TouchableOpacity
                style={styles.activitiesModalCloseButton}
                onPress={handleCloseActivities}
                activeOpacity={0.8}
              >
                <Text style={styles.activitiesModalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* LIST */}

            <ScrollView
              style={styles.activitiesModalScroll}
              contentContainerStyle={styles.activitiesModalContent}
              showsVerticalScrollIndicator
            >
              {activitiesLoading ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#173A73" />

                  <Text style={styles.activityLoadingText}>
                    Loading activities...
                  </Text>
                </View>
              ) : recentActivities.length === 0 ? (
                <Text style={styles.activitiesModalEmptyText}>
                  No activities recorded yet.
                </Text>
              ) : (
                recentActivities.map((activity) => (
                  <View
                    key={`modal-${activity.activity_type}-${activity.id}`}
                    style={styles.activityItem}
                  >
                    <View style={styles.activityTextArea}>
                      <Text style={styles.activityDescription}>
                        <Text style={styles.activityName}>{activity.name}</Text>{" "}
                        {activity.description}
                      </Text>

                      <Text style={styles.activityDetails}>
                        {formatActivityDate(activity.created_at)} •{" "}
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
            </ScrollView>

            {/* FOOTER */}

            <View style={styles.activitiesModalFooter}>
              <TouchableOpacity
                style={styles.activitiesModalDoneButton}
                onPress={handleCloseActivities}
                activeOpacity={0.8}
              >
                <Text style={styles.activitiesModalDoneText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

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
// ACTIVITY DATE
// ==========================================

function formatActivityDate(value: string | null | undefined) {
  if (!value) {
    return "--";
  }

  try {
    let normalized = value.trim();

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
      normalized = normalized.replace(" ", "T") + "Z";
    }

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-PH", {
      month: "short",

      day: "numeric",

      year: "numeric",

      timeZone: "Asia/Manila",
    });
  } catch {
    return value;
  }
}

// ==========================================
// ACTIVITY TIME
// ==========================================

function formatActivityTime(value: string | null | undefined) {
  if (!value) {
    return "--";
  }

  try {
    let normalized = value.trim();

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
