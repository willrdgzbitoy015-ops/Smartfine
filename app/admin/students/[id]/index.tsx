import {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Image,
  Alert,
  Platform,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

import { styles } from './student-profile.styles';

const API_BASE =
  'http://192.168.1.45:3000';

// ==========================================
// TYPES
// ==========================================

type Student = {
  id: number;

  student_id: string;

  first_name: string;
  middle_name: string | null;
  last_name: string;

  full_name: string;

  email: string | null;
  contact_number: string | null;

  grade_level: string | null;
  section: string | null;

  account_status: string;
};

type Fine = {
  id: number;

  violation_name: string;

  amount: number;

  issued_at: string;

  status: 'PAID' | 'UNPAID';

  officer_name: string;
};

type StudentProfileResponse = {
  success: boolean;

  student: Student;

  totals: {
    totalFines: number;

    outstandingBalance: number;

    totalPaid: number;
  };

  fines: Fine[];
};

type NavItem = {
  label: string;
  route: string;
};

// ==========================================
// STUDENT PROFILE
// ==========================================

export default function StudentProfile() {
  const router = useRouter();

  const params =
    useLocalSearchParams();

  const { logout } = useAuth();

  const { width } =
    useWindowDimensions();

  const isTablet =
    width >= 768;

  // ==========================================
  // GET STUDENT ID FROM ROUTE
  // ==========================================

  const rawId =
    params.id;

  const studentId =
    Array.isArray(rawId)
      ? rawId[0]
      : rawId;

  // ==========================================
  // STATE
  // ==========================================

  const [data, setData] =
    useState<StudentProfileResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
    },

    {
      label: 'Students',
      route: '/admin/students',
    },

    {
      label: 'Fines',
      route: '/admin/fines',
    },

    {
      label: 'QR Scanner',
      route: '/admin/qr-scanner',
    },

    {
      label: 'Reports',
      route: '/admin/reports',
    },

    {
      label: 'Settings',
      route: '/admin/settings',
    },

    {
      label: 'Officers',
      route: '/admin/officers',
    },
  ];

  // ==========================================
  // LOAD STUDENT PROFILE
  // ==========================================

  useEffect(() => {
    if (!studentId) {
      return;
    }

    loadStudent();
  }, [studentId]);

  const loadStudent = async () => {
    try {
      setLoading(true);

      setError('');

      const response = await fetch(
        `${API_BASE}/api/students/${studentId}`
      );

      const result =
        await response.json();

      console.log(
        'Student profile response:',
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ||
            'Failed to load student.'
        );

        return;
      }

      setData(result);
    } catch (error) {
      console.error(
        'Student profile connection error:',
        error
      );

      setError(
        'Could not connect to the SmartFine server.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // NAVIGATION HANDLER
  // ==========================================

  const handleNavigation = (
    item: NavItem
  ) => {
    router.push(
      item.route as any
    );
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const performLogout =
    async () => {
      try {
        await logout();

        router.replace('/login');
      } catch (error) {
        console.error(
          'Logout error:',
          error
        );

        if (
          Platform.OS === 'web'
        ) {
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
    // WEB

    if (
      Platform.OS === 'web'
    ) {
      const confirmed =
        window.confirm(
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
          onPress:
            performLogout,
        },
      ]
    );
  };

  // ==========================================
  // QR CODE
  // ==========================================

  const handleQRCode = () => {
    const message =
      'Student QR Code will be added in the QR module.';

    if (
      Platform.OS === 'web'
    ) {
      window.alert(message);
    } else {
      Alert.alert(
        'QR Code',
        message
      );
    }
  };

  // ==========================================
  // EDIT STUDENT
  // ==========================================

  const handleEdit = () => {
    const message =
      'Edit Student will be the next Students module screen.';

    if (
      Platform.OS === 'web'
    ) {
      window.alert(message);
    } else {
      Alert.alert(
        'Edit Student',
        message
      );
    }
  };

  // ==========================================
  // FORMAT GRADE / SECTION
  // ==========================================

  const formatGradeSection = (
    gradeLevel:
      | string
      | null,
    section:
      | string
      | null
  ) => {
    if (
      gradeLevel &&
      section
    ) {
      return `${gradeLevel} - ${section}`;
    }

    if (gradeLevel) {
      return gradeLevel;
    }

    if (section) {
      return section;
    }

    return 'Not Assigned';
  };

  // ==========================================
  // PAGE CONTENT
  // ==========================================

  const renderContent = () => {
    // ======================================
    // LOADING
    // ======================================

    if (loading) {
      return (
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            size="large"
            color="#173A73"
          />

          <Text
            style={
              styles.stateText
            }
          >
            Loading student profile...
          </Text>
        </View>
      );
    }

    // ======================================
    // ERROR
    // ======================================

    if (
      error ||
      !data
    ) {
      return (
        <View
          style={
            styles.centerState
          }
        >
          <Text
            style={
              styles.errorText
            }
          >
            {error ||
              'Student not found.'}
          </Text>
        </View>
      );
    }

    // ======================================
    // STUDENT DATA
    // ======================================

    const {
      student,
      totals,
      fines,
    } = data;

    const initials =
      `${student.first_name?.[0] || ''}${
        student.last_name?.[0] || ''
      }`.toUpperCase();

    const gradeSection =
      formatGradeSection(
        student.grade_level,
        student.section
      );

    const isActive =
      String(
        student.account_status ||
          ''
      ).toUpperCase() ===
      'ACTIVE';

    return (
      <>
        {/* ==================================
            STUDENT PROFILE HEADER
        ================================== */}

        <View
          style={
            styles.profileCard
          }
        >
          {/* AVATAR */}

          <View
            style={
              styles.avatar
            }
          >
            <Text
              style={
                styles.avatarText
              }
            >
              {initials ||
                'ST'}
            </Text>
          </View>

          {/* STUDENT INFORMATION */}

          <View
            style={
              styles.studentInfo
            }
          >
            <Text
              style={
                styles.studentName
              }
            >
              {student.full_name}
            </Text>

            {/* GRADE / SECTION */}

            <Text
              style={
                styles.studentMeta
              }
            >
              Grade / Section:{' '}
              {gradeSection}
            </Text>

            {/* STUDENT ID */}

            <Text
              style={
                styles.studentMeta
              }
            >
              Student ID:{' '}
              {student.student_id}
            </Text>

            {/* EMAIL */}

            <Text
              style={
                styles.studentMeta
              }
            >
              Email:{' '}
              {student.email ||
                'Not provided'}
            </Text>

            {/* CONTACT NUMBER */}

            <Text
              style={
                styles.studentMeta
              }
            >
              Contact Number:{' '}
              {student.contact_number ||
                'Not provided'}
            </Text>

            {/* ACCOUNT STATUS */}

            <Text
              style={
                styles.studentMeta
              }
            >
              Account Status:{' '}
              {isActive
                ? 'Active'
                : student.account_status ||
                  'Unknown'}
            </Text>
          </View>

          {/* PROFILE ACTIONS */}

          <View
            style={
              styles.profileActions
            }
          >
            <TouchableOpacity
              style={
                styles.outlineButton
              }
              onPress={
                handleQRCode
              }
            >
              <Text
                style={
                  styles.outlineButtonText
                }
              >
                ▦ View QR Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.outlineButton
              }
              onPress={
                handleEdit
              }
            >
              <Text
                style={
                  styles.outlineButtonText
                }
              >
                ✎ Edit Information
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================
            SUMMARY CARDS
        ================================== */}

        <View
          style={
            styles.summaryRow
          }
        >
          {/* OUTSTANDING BALANCE */}

          <View
            style={
              styles.summaryCard
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Outstanding Balance
            </Text>

            <Text
              style={
                styles.outstandingValue
              }
            >
              ₱
              {Number(
                totals.outstandingBalance ||
                  0
              ).toFixed(2)}
            </Text>
          </View>

          {/* TOTAL PAID */}

          <View
            style={
              styles.summaryCard
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Total Paid
            </Text>

            <Text
              style={
                styles.paidValue
              }
            >
              ₱
              {Number(
                totals.totalPaid ||
                  0
              ).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* ==================================
            FINES HISTORY
        ================================== */}

        <View
          style={
            styles.historyCard
          }
        >
          {/* TITLE */}

          <View
            style={
              styles.historyTitleBar
            }
          >
            <Text
              style={
                styles.historyTitle
              }
            >
              Recent Violations & Fines History
            </Text>
          </View>

          {/* TABLE */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
          >
            <View
              style={
                styles.historyTable
              }
            >
              {/* TABLE HEADER */}

              <View
                style={
                  styles.historyHeader
                }
              >
                <Text
                  style={[
                    styles.historyHeaderText,
                    styles.violationColumn,
                  ]}
                >
                  Violation Type
                </Text>

                <Text
                  style={[
                    styles.historyHeaderText,
                    styles.dateColumn,
                  ]}
                >
                  Date
                </Text>

                <Text
                  style={[
                    styles.historyHeaderText,
                    styles.amountColumn,
                  ]}
                >
                  Amount
                </Text>

                <Text
                  style={[
                    styles.historyHeaderText,
                    styles.fineStatusColumn,
                  ]}
                >
                  Status
                </Text>

                <Text
                  style={[
                    styles.historyHeaderText,
                    styles.officerColumn,
                  ]}
                >
                  Officer
                </Text>
              </View>

              {/* EMPTY FINES */}

              {fines.length ===
              0 ? (
                <View
                  style={
                    styles.emptyHistory
                  }
                >
                  <Text
                    style={
                      styles.emptyHistoryText
                    }
                  >
                    No fines recorded for this student.
                  </Text>
                </View>
              ) : (
                // ==================================
                // FINES LIST
                // ==================================

                fines.map(
                  (fine) => {
                    const isPaid =
                      fine.status ===
                      'PAID';

                    return (
                      <View
                        key={
                          fine.id
                        }
                        style={
                          styles.historyRow
                        }
                      >
                        {/* VIOLATION */}

                        <Text
                          style={[
                            styles.historyCell,
                            styles.violationColumn,
                            styles.violationText,
                          ]}
                        >
                          {
                            fine.violation_name
                          }
                        </Text>

                        {/* DATE */}

                        <Text
                          style={[
                            styles.historyCell,
                            styles.dateColumn,
                          ]}
                        >
                          {formatDate(
                            fine.issued_at
                          )}
                        </Text>

                        {/* AMOUNT */}

                        <Text
                          style={[
                            styles.historyCell,
                            styles.amountColumn,
                            styles.amountText,
                          ]}
                        >
                          ₱
                          {Number(
                            fine.amount ||
                              0
                          ).toFixed(
                            2
                          )}
                        </Text>

                        {/* STATUS */}

                        <View
                          style={
                            styles.fineStatusColumn
                          }
                        >
                          <View
                            style={[
                              styles.statusBadge,

                              isPaid
                                ? styles.paidBadge
                                : styles.unpaidBadge,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,

                                isPaid
                                  ? styles.paidBadgeText
                                  : styles.unpaidBadgeText,
                              ]}
                            >
                              {isPaid
                                ? 'Paid'
                                : 'Unpaid'}
                            </Text>
                          </View>
                        </View>

                        {/* OFFICER */}

                        <Text
                          style={[
                            styles.historyCell,
                            styles.officerColumn,
                          ]}
                        >
                          {
                            fine.officer_name
                          }
                        </Text>
                      </View>
                    );
                  }
                )
              )}
            </View>
          </ScrollView>
        </View>
      </>
    );
  };

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <View
      style={
        styles.screen
      }
    >
      {/* ======================================
          SIDEBAR
      ====================================== */}

      {isTablet && (
        <View
          style={
            styles.sidebar
          }
        >
          {/* LOGO */}

          <View
            style={
              styles.logoArea
            }
          >
            <Image
              source={require('../../../../assets/branding/smartfineNoBG.png')}
              style={
                styles.smartFineLogo
              }
              resizeMode="contain"
            />
          </View>

          {/* NAVIGATION */}

          <View
            style={
              styles.navigation
            }
          >
            {navItems.map(
              (item) => {
                const active =
                  item.label ===
                  'Students';

                return (
                  <TouchableOpacity
                    key={
                      item.label
                    }
                    style={[
                      styles.navItem,

                      active &&
                        styles.navItemActive,
                    ]}
                    onPress={() =>
                      handleNavigation(
                        item
                      )
                    }
                  >
                    <Text
                      style={
                        styles.navIcon
                      }
                    >
                      {getMenuSymbol(
                        item.label
                      )}
                    </Text>

                    <Text
                      style={
                        styles.navText
                      }
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {/* LOGOUT */}

          <TouchableOpacity
            style={
              styles.logoutButton
            }
            onPress={
              handleLogout
            }
          >
            <Text
              style={
                styles.logoutText
              }
            >
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <View
        style={
          styles.main
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* BACK */}

          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ‹ Student Profile
            </Text>
          </TouchableOpacity>

          {/* ==================================
              MOBILE NAVIGATION
          ================================== */}

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
              {navItems.map(
                (item) => {
                  const active =
                    item.label ===
                    'Students';

                  return (
                    <TouchableOpacity
                      key={
                        item.label
                      }
                      style={[
                        styles.mobileNavItem,

                        active &&
                          styles.mobileNavItemActive,
                      ]}
                      onPress={() =>
                        handleNavigation(
                          item
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.mobileNavText,

                          active &&
                            styles.mobileNavTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          )}

          {/* PAGE CONTENT */}

          {renderContent()}
        </ScrollView>
      </View>
    </View>
  );
}

// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    'en-US',
    {
      month: 'short',

      day: 'numeric',

      year: 'numeric',

      hour: 'numeric',

      minute: '2-digit',

      hour12: true,
    }
  );
}

// ==========================================
// TEMPORARY MENU SYMBOLS
// ==========================================

function getMenuSymbol(
  label: string
) {
  switch (label) {
    case 'Dashboard':
      return '⌂';

    case 'Students':
      return '◎';

    case 'Fines':
      return '▤';

    case 'QR Scanner':
      return '▦';

    case 'Reports':
      return '▧';

    case 'Settings':
      return '⚙';

    case 'Officers':
      return '●';

    default:
      return '•';
  }
}