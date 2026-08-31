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

import {
  useAuth,
} from '@/hooks/use-auth';

import {
  styles,
} from './student-profile.styles';

const API_BASE =
  'http://192.168.1.45:3000';

// ==========================================
// TYPES
// ==========================================

type Student = {
  id: number;

  // Permanent Student ID
  // Example: 2026-0005
  student_id: string;

  // Editable login username
  // Example: wbitoy
  username: string;

  first_name: string;

  middle_name:
    | string
    | null;

  last_name: string;

  full_name: string;

  email:
    | string
    | null;

  contact_number:
    | string
    | null;

  grade_level:
    | string
    | null;

  section:
    | string
    | null;

  account_status: string;
};

type Fine = {
  id: number;

  violation_name: string;

  amount: number;

  issued_at: string;

  status:
    | 'PAID'
    | 'UNPAID';

  officer_name: string;
};

type StudentProfileResponse = {
  success: boolean;

  student: Student;

  totals: {
    totalFines: number;

    outstandingBalance:
      number;

    totalPaid: number;
  };

  fines: Fine[];
};

// ==========================================
// STUDENT PROFILE
// ==========================================

export default function StudentProfile() {
  const router =
    useRouter();

  const params =
    useLocalSearchParams();

  const { logout } =
    useAuth();

  const { width } =
    useWindowDimensions();

  const isTablet =
    width >= 768;

  // ==========================================
  // DATABASE STUDENT ID
  //
  // This is users.id,
  // NOT student_number.
  //
  // Example route:
  // /admin/students/5
  // ==========================================

  const rawId =
    params.id;

  const studentId =
    Array.isArray(rawId)
      ? rawId[0]
      : rawId;

  // ==========================================
  // PROFILE DATA
  // ==========================================

  const [
    data,
    setData,
  ] =
    useState<StudentProfileResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState('');

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems = [
    {
      label:
        'Dashboard',

      route:
        '/admin/dashboard',
    },

    {
      label:
        'Students',

      route:
        '/admin/students',
    },

    {
      label:
        'Fines',

      route:
        '/admin/fines',
    },

    {
      label:
        'QR Scanner',

      route:
        '/admin/qr-scanner',
    },

    {
      label:
        'Reports',

      route:
        '/admin/reports',
    },

    {
      label:
        'Settings',

      route:
        '/admin/settings',
    },

    {
      label:
        'Officers',

      route:
        '/admin/officers',
    },
  ];

  // ==========================================
  // LOAD STUDENT
  // ==========================================

  useEffect(() => {
    if (!studentId) {
      return;
    }

    loadStudent();
  }, [studentId]);

  const loadStudent =
    async () => {
      try {
        setLoading(true);

        setError('');

        const response =
          await fetch(
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
  // LOGOUT
  // ==========================================

  const performLogout =
    async () => {
      try {
        await logout();

        router.replace(
          '/login'
        );
      } catch (error) {
        console.error(
          'Logout error:',
          error
        );

        if (
          Platform.OS ===
          'web'
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
      Platform.OS ===
      'web'
    ) {
      if (
        window.confirm(
          'Are you sure you want to log out?'
        )
      ) {
        performLogout();
      }

      return;
    }

    // MOBILE

    Alert.alert(
      'Log Out',

      'Are you sure you want to log out?',

      [
        {
          text:
            'Cancel',

          style:
            'cancel',
        },

        {
          text:
            'Log Out',

          style:
            'destructive',

          onPress:
            performLogout,
        },
      ]
    );
  };

  // ==========================================
  // QR CODE
  //
  // TEMPORARY UNTIL QR MODULE
  // ==========================================

  const handleQRCode = () => {
    const message =
      'Student QR Code will be added in the QR module.';

    if (
      Platform.OS ===
      'web'
    ) {
      window.alert(
        message
      );
    } else {
      Alert.alert(
        'QR Code',
        message
      );
    }
  };

  // ==========================================
  // EDIT STUDENT
  //
  // NOW CONNECTED TO:
  //
  // /admin/students/[id]/edit
  // ==========================================

  const handleEdit = () => {
    if (!studentId) {
      return;
    }

    router.push(
      `/admin/students/${studentId}/edit` as any
    );
  };

  // ==========================================
  // CONTENT
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

    const {
      student,
      totals,
      fines,
    } = data;

    // ======================================
    // INITIALS
    //
    // Will Bitoy
    // -> WB
    // ======================================

    const initials =
      `${
        student
          .first_name?.[0] ||
        ''
      }${
        student
          .last_name?.[0] ||
        ''
      }`.toUpperCase();

    // ======================================
    // GRADE + SECTION
    // ======================================

    const gradeSection =
      [
        student.grade_level,
        student.section,
      ]
        .filter(Boolean)
        .join(' - ') ||
      'Not assigned';

    const isActive =
      String(
        student.account_status
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
              {initials}
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
              {
                student.full_name
              }
            </Text>

            {/* GRADE / SECTION */}

            <Text
              style={
                styles.studentMeta
              }
            >
              {gradeSection}
            </Text>

            {/* STUDENT ID */}

            <Text
              style={
                styles.studentMeta
              }
            >
              Student ID:{' '}
              {
                student.student_id
              }
            </Text>

            {/* USERNAME */}

            <Text
              style={
                styles.studentMeta
              }
            >
              Username:{' '}
              {
                student.username ||
                'Not provided'
              }
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

            {/* CONTACT */}

            <Text
              style={
                styles.studentMeta
              }
            >
              Contact:{' '}
              {student.contact_number ||
                'Not provided'}
            </Text>

            {/* STATUS */}

            <Text
              style={
                styles.studentMeta
              }
            >
              Status:{' '}
              {isActive
                ? 'Active'
                : 'Inactive'}
            </Text>
          </View>

          {/* ACTIONS */}

          <View
            style={
              styles.profileActions
            }
          >
            {/* VIEW QR */}

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

            {/* EDIT */}

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
          {/* OUTSTANDING */}

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
                totals.outstandingBalance
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
                totals.totalPaid
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

              {/* NO FINES */}

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
                // FINES
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
                            fine.amount
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
  // UI
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
                      router.push(
                        item.route as any
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
                      {
                        item.label
                      }
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
          MAIN
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
              router.push(
                '/admin/students'
              )
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ‹ Students Directory
            </Text>
          </TouchableOpacity>

          {/* ==================================
              MOBILE NAV
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
                (item) => (
                  <TouchableOpacity
                    key={
                      item.label
                    }
                    style={[
                      styles.mobileNavItem,

                      item.label ===
                        'Students' &&
                        styles.mobileNavItemActive,
                    ]}
                    onPress={() =>
                      router.push(
                        item.route as any
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.mobileNavText,

                        item.label ===
                          'Students' &&
                          styles.mobileNavTextActive,
                      ]}
                    >
                      {
                        item.label
                      }
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          )}

          {/* PROFILE CONTENT */}

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
      month:
        'short',

      day:
        'numeric',

      year:
        'numeric',

      hour:
        'numeric',

      minute:
        '2-digit',

      hour12:
        true,
    }
  );
}

// ==========================================
// TEMPORARY SIDEBAR SYMBOLS
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