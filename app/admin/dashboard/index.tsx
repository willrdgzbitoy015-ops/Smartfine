import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  Image,
  Platform,
} from 'react-native';

import { useRouter } from 'expo-router';

import { styles } from './dashboard.styles';
import { API_BASE } from '@/constants/api';

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
  type: 'normal' | 'danger' | 'success' | 'money';
};

type Activity = {
  id: number;
  name: string;
  description: string;
  amount: number;
  created_at: string;
  activity_type: 'paid' | 'fine';
  details: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const [activeMenu, setActiveMenu] = useState('Dashboard');

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

  const [recentActivities, setRecentActivities] =
    useState<Activity[]>([]);

  const [activitiesLoading, setActivitiesLoading] =
    useState(true);

  // ==========================================
  // REAL-TIME DATE AND TIME
  // ==========================================

  const [currentDateTime, setCurrentDateTime] =
    useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDateTime =
    currentDateTime.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
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

      const response = await fetch(
        `${API_BASE}/api/dashboard/stats`
      );

      const data = await response.json();

      console.log('Dashboard stats response:', data);

      if (!response.ok || !data.success) {
        console.error(
          'Failed to load dashboard stats:',
          data
        );

        return;
      }

      setStats(data.stats);
    } catch (error) {
      console.error(
        'Dashboard stats connection error:',
        error
      );
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
        `${API_BASE}/api/dashboard/recent-activities`
      );

      const data = await response.json();

      console.log(
        'Recent activities response:',
        data
      );

      if (!response.ok || !data.success) {
        console.error(
          'Failed to load recent activities:',
          data
        );

        return;
      }

      setRecentActivities(data.activities);
    } catch (error) {
      console.error(
        'Recent activities connection error:',
        error
      );
    } finally {
      setActivitiesLoading(false);
    }
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: require('../../../assets/icons/dashboard.png'),
    },
    {
      label: 'Students',
      route: '/admin/students',
      icon: require('../../../assets/icons/students.png'),
    },
    {
      label: 'Fines',
      route: '/admin/fines',
      icon: require('../../../assets/icons/fines.png'),
    },
    {
      label: 'QR Scanner',
      route: '/admin/qr-scanner',
      icon: require('../../../assets/icons/qr-codeWhite.png'),
    },
    {
      label: 'Reports',
      route: '/admin/reports',
      icon: require('../../../assets/icons/reports.png'),
    },
    {
      label: 'Settings',
      route: '/admin/settings',
      icon: require('../../../assets/icons/settings.png'),
    },
    {
      label: 'Officers',
      route: '/admin/officers',
      icon: require('../../../assets/icons/officers.png'),
    },
  ];

  // ==========================================
  // SUMMARY CARDS
  // ==========================================

  const summaryCards: SummaryCard[] = [
    {
      label: 'Total Students',
      value: statsLoading
        ? '...'
        : String(stats.totalStudents),
      type: 'success',
    },
    {
      label: 'Unpaid Fines',
      value: statsLoading
        ? '...'
        : String(stats.unpaidFines),
      type: 'danger',
    },
    {
      label: "Today's Collection",
      value: statsLoading
        ? '...'
        : `₱ ${Number(
            stats.todayCollection
          ).toFixed(2)}`,
      type: 'money',
    },
    {
      label: 'Paid Fines',
      value: statsLoading
        ? '...'
        : String(stats.paidFines),
      type: 'success',
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
    router.push('/admin/fines' as any);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const performLogout = async () => {
    try {
      console.log('Logout button pressed');

      await logout();

      console.log(
        'Admin logged out successfully.'
      );

      router.replace('/login');
    } catch (error) {
      console.error(
        'Logout error:',
        error
      );

      if (Platform.OS === 'web') {
        window.alert(
          'Could not log out. Please try again.'
        );
      } else {
        Alert.alert(
          'Logout Error',
          'Could not log out. Please try again.'
        );
      }
    }
  };

  const handleLogout = () => {
    // WEB / BROWSER
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to log out?'
      );

      if (confirmed) {
        performLogout();
      }

      return;
    }

    // ANDROID / IOS
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <View style={styles.screen}>
      {/* SIDEBAR */}

      {isTablet && (
        <View style={styles.sidebar}>
          {/* SMARTFINE LOGO */}

          <View style={styles.logoArea}>
            <Image
              source={require('../../../assets/branding/smartfineNoBG.png')}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          {/* NAVIGATION */}

          <View style={styles.navigation}>
            {navItems.map((item) => {
              const isActive =
                activeMenu === item.label;

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.navItem,
                    isActive &&
                      styles.navItemActive,
                  ]}
                  onPress={() =>
                    handleNavigation(item)
                  }
                >
                  <View style={styles.navIconContainer}>
                    <Image
                      source={item.icon}
                      style={styles.navImageIcon}
                      resizeMode="contain"
                    />
                  </View>

                  <Text
                    style={[
                      styles.navText,
                      isActive &&
                        styles.navTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* LOGOUT BUTTON */}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MAIN CONTENT */}

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>
                Dashboard
              </Text>

              <Text style={styles.dateText}>
                {formattedDateTime}
              </Text>
            </View>

            <View style={styles.profileArea}>
              <View
                style={styles.profileTextArea}
              >
                <Text style={styles.adminName}>
                  WILL R. BITOY
                </Text>

                <Text style={styles.adminRole}>
                  Administrator
                </Text>
              </View>

              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  WB
                </Text>
              </View>
            </View>
          </View>

          {/* MOBILE NAVIGATION */}

          {!isTablet && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.mobileNav
              }
            >
              {navItems.map((item) => {
                const isActive =
                  activeMenu === item.label;

                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.mobileNavItem,
                      isActive &&
                        styles.mobileNavItemActive,
                    ]}
                    onPress={() =>
                      handleNavigation(item)
                    }
                  >
                    <Text
                      style={[
                        styles.mobileNavText,
                        isActive &&
                          styles.mobileNavTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* SUMMARY CARDS */}

          <View style={styles.cardsContainer}>
            {summaryCards.map((card) => (
              <View
                key={card.label}
                style={[
                  styles.summaryCard,

                  card.type === 'danger' &&
                    styles.cardDanger,

                  card.type === 'success' &&
                    styles.cardSuccess,

                  card.type === 'money' &&
                    styles.cardMoney,
                ]}
              >
                <Text style={styles.cardLabel}>
                  {card.label}
                </Text>

                <Text
                  style={[
                    styles.cardValue,

                    card.type === 'danger' &&
                      styles.valueDanger,

                    card.type === 'success' &&
                      styles.valueSuccess,

                    card.type === 'money' &&
                      styles.valueMoney,
                  ]}
                >
                  {card.value}
                </Text>
              </View>
            ))}
          </View>

          {/* RECENT ACTIVITIES */}

          <View style={styles.activityPanel}>
            <Text style={styles.activityTitle}>
              Recent Activities
            </Text>

            <View style={styles.activityList}>
              {activitiesLoading ? (
                <Text
                  style={styles.activityDetails}
                >
                  Loading recent activities...
                </Text>
              ) : recentActivities.length === 0 ? (
                <Text
                  style={styles.activityDetails}
                >
                  No recent activities yet.
                </Text>
              ) : (
                recentActivities.map(
                  (activity) => (
                    <View
                      key={`${activity.activity_type}-${activity.id}`}
                      style={styles.activityItem}
                    >
                      <View
                        style={
                          styles.activityTextArea
                        }
                      >
                        <Text
                          style={
                            styles.activityDescription
                          }
                        >
                          <Text
                            style={
                              styles.activityName
                            }
                          >
                            {activity.name}
                          </Text>{' '}
                          {activity.description}
                        </Text>

                        <Text
                          style={
                            styles.activityDetails
                          }
                        >
                          {new Date(
                            activity.created_at
                          ).toLocaleString(
                            'en-US',
                            {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            }
                          )}{' '}
                          • {activity.details}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.activityAmount,

                          activity.activity_type ===
                          'paid'
                            ? styles.amountPaid
                            : styles.amountFine,
                        ]}
                      >
                        ₱
                        {Number(
                          activity.amount
                        ).toFixed(2)}
                      </Text>
                    </View>
                  )
                )
              )}
            </View>

            <TouchableOpacity
              style={
                styles.viewActivitiesButton
              }
              onPress={handleViewActivities}
            >
              <Text
                style={
                  styles.viewActivitiesText
                }
              >
                View all activities
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

