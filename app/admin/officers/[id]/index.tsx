import {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
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
  API_BASE,
} from '@/constants/api';

import {
  styles,
} from './officer-profile.styles';

// ==========================================
// TYPES
// ==========================================

type Officer = {
  id: number;

  officer_profile_id: number;

  employee_number: string;

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

  assigned_area:
    | string
    | null;

  account_status: string;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;
};

type OfficerStats = {
  totalFines: number;

  activeFines: number;
};

type RecentFine = {
  id: number;

  fine_reference: string;

  amount: number;

  issued_at: string;

  fine_status: string;

  student_name: string;

  student_number: string;

  violation_name: string;
};

type OfficerProfileResponse = {
  success: boolean;

  officer: Officer;

  stats: OfficerStats;

  recentFines: RecentFine[];
};

type NavItem = {
  label: string;
  route: string;
};

// ==========================================
// OFFICER PROFILE
// ==========================================

export default function OfficerProfile() {
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
  // OFFICER ID
  // ==========================================

  const rawId =
    params.id;

  const officerId =
    Array.isArray(rawId)
      ? rawId[0]
      : rawId;

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [
    data,
    setData,
  ] =
    useState<OfficerProfileResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState('');

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: NavItem[] = [
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
  // LOAD OFFICER PROFILE
  // ==========================================

  const loadOfficer =
    async () => {
      if (
        !officerId
      ) {
        setError(
          'Officer ID is missing.'
        );

        setLoading(
          false
        );

        return;
      }

      try {
        setLoading(
          true
        );

        setError('');

        const response =
          await fetch(
            `${API_BASE}/api/officers/${officerId}`
          );

        const result =
          await response.json();

        console.log(
          'Officer profile response:',
          result
        );

        if (
          !response.ok ||
          !result.success
        ) {
          setError(
            result.message ||
              'Failed to load officer profile.'
          );

          return;
        }

        setData(
          result
        );
      } catch (error) {
        console.error(
          'Officer profile connection error:',
          error
        );

        setError(
          'Could not connect to the SmartFine server.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  // ==========================================
  // LOAD
  // ==========================================

  useEffect(() => {
    loadOfficer();
  }, [officerId]);

  // ==========================================
  // BACK
  // ==========================================

  const handleBack =
    () => {
      router.replace(
        '/admin/officers' as any
      );
    };

  // ==========================================
  // EDIT OFFICER
  // ==========================================

  const handleEdit =
    () => {
      if (
        !officerId
      ) {
        return;
      }

      router.push(
        `/admin/officers/${officerId}/edit` as any
      );
    };

  // ==========================================
  // DELETE OFFICER
  // ==========================================

  const performDeleteOfficer =
    async () => {
      if (
        !officerId ||
        !data?.officer
      ) {
        return;
      }

      try {
        setDeleting(
          true
        );

        const response =
          await fetch(
            `${API_BASE}/api/officers/${officerId}`,
            {
              method:
                'DELETE',
            }
          );

        const result =
          await response.json();

        console.log(
          'Delete officer response:',
          result
        );

        // ======================================
        // BACKEND ERROR
        // ======================================

        if (
          !response.ok ||
          !result.success
        ) {
          const message =
            result.message ||
            'Could not delete officer.';

          if (
            Platform.OS ===
            'web'
          ) {
            window.alert(
              message
            );

            return;
          }

          Alert.alert(
            'Unable to Delete Officer',

            message
          );

          return;
        }

        // ======================================
        // SUCCESS - WEB
        // ======================================

        if (
          Platform.OS ===
          'web'
        ) {
          window.alert(
            'Officer deleted successfully.'
          );

          router.replace(
            '/admin/officers' as any
          );

          return;
        }

        // ======================================
        // SUCCESS - MOBILE
        // ======================================

        Alert.alert(
          'Officer Deleted',

          'Officer deleted successfully.',

          [
            {
              text:
                'OK',

              onPress: () =>
                router.replace(
                  '/admin/officers' as any
                ),
            },
          ]
        );
      } catch (error) {
        console.error(
          'Delete officer error:',
          error
        );

        const message =
          'Could not connect to the SmartFine server.';

        if (
          Platform.OS ===
          'web'
        ) {
          window.alert(
            message
          );

          return;
        }

        Alert.alert(
          'Unable to Delete Officer',

          message
        );
      } finally {
        setDeleting(
          false
        );
      }
    };

  // ==========================================
  // CONFIRM DELETE
  // ==========================================

  const handleDeleteOfficer =
    () => {
      if (
        !data?.officer
      ) {
        return;
      }

      const officer =
        data.officer;

      const status =
        String(
          officer.account_status ||
            ''
        ).toUpperCase();

      // ======================================
      // ACTIVE OFFICER
      // ======================================

      if (
        status ===
        'ACTIVE'
      ) {
        const message =
          'Active officers cannot be deleted. Edit the officer and set the account status to Inactive first.';

        if (
          Platform.OS ===
          'web'
        ) {
          window.alert(
            message
          );

          return;
        }

        Alert.alert(
          'Officer is Active',

          message
        );

        return;
      }

      // ======================================
      // OFFICER HAS FINE HISTORY
      // ======================================

      if (
        Number(
          data.stats?.totalFines ||
            0
        ) > 0
      ) {
        const message =
          'This officer cannot be permanently deleted because the account already has recorded fines. Keep the officer inactive to preserve SmartFine history.';

        if (
          Platform.OS ===
          'web'
        ) {
          window.alert(
            message
          );

          return;
        }

        Alert.alert(
          'Officer Has Fine Records',

          message
        );

        return;
      }

      // ======================================
      // CONFIRM DELETE
      // ======================================

      const message =
        `Permanently delete ${officer.full_name} (${officer.employee_number})?\n\n` +
        'This action cannot be undone.';

      // ======================================
      // WEB
      // ======================================

      if (
        Platform.OS ===
        'web'
      ) {
        const confirmed =
          window.confirm(
            message
          );

        if (
          confirmed
        ) {
          performDeleteOfficer();
        }

        return;
      }

      // ======================================
      // MOBILE
      // ======================================

      Alert.alert(
        'Delete Officer',

        message,

        [
          {
            text:
              'Cancel',

            style:
              'cancel',
          },

          {
            text:
              'Delete',

            style:
              'destructive',

            onPress:
              performDeleteOfficer,
          },
        ]
      );
    };

  // ==========================================
  // OPEN FINE
  // ==========================================

  const handleFinePress = (
    fineId: number
  ) => {
    router.push(
      `/admin/fines/${fineId}` as any
    );
  };

  // ==========================================
  // SIDEBAR NAVIGATION
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

        router.replace(
          '/login' as any
        );
      } catch (error) {
        console.error(
          'Logout error:',
          error
        );
      }
    };

  const handleLogout =
    () => {
      if (
        Platform.OS ===
        'web'
      ) {
        const confirmed =
          window.confirm(
            'Are you sure you want to log out?'
          );

        if (
          confirmed
        ) {
          performLogout();
        }

        return;
      }

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
  // CONTENT
  // ==========================================

  const renderContent =
    () => {
      // ======================================
      // LOADING
      // ======================================

      if (
        loading
      ) {
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
              Loading officer profile...
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
                'Officer not found.'}
            </Text>

            <TouchableOpacity
              style={
                styles.retryButton
              }
              onPress={
                loadOfficer
              }
            >
              <Text
                style={
                  styles.retryText
                }
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        );
      }

      const {
        officer,
        stats,
        recentFines,
      } =
        data;

      const status =
        String(
          officer.account_status ||
            ''
        ).toUpperCase();

      const isActive =
        status ===
        'ACTIVE';

      const initials =
        `${
          officer.first_name?.[0] ||
          ''
        }${
          officer.last_name?.[0] ||
          ''
        }`.toUpperCase();

      return (
        <>
          {/* ==================================
              PROFILE CARD
          ================================== */}

          <View
            style={
              styles.profileCard
            }
          >
            {/* PROFILE TOP */}

            <View
              style={
                styles.profileTop
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
                  {
                    initials
                  }
                </Text>
              </View>

              {/* NAME */}

              <View
                style={
                  styles.profileHeading
                }
              >
                <Text
                  style={
                    styles.officerName
                  }
                >
                  {
                    officer.full_name
                  }
                </Text>

                <Text
                  style={
                    styles.employeeNumber
                  }
                >
                  {
                    officer.employee_number
                  }
                </Text>

                <View
                  style={[
                    styles.statusBadge,

                    isActive
                      ? styles.activeBadge
                      : styles.inactiveBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,

                      isActive
                        ? styles.activeStatusText
                        : styles.inactiveStatusText,
                    ]}
                  >
                    {isActive
                      ? 'Active'
                      : 'Inactive'}
                  </Text>
                </View>
              </View>

              {/* ==================================
                  ACTIONS
              ================================== */}

              <View
                style={
                  styles.profileActions
                }
              >
                {/* EDIT */}

                <TouchableOpacity
                  style={
                    styles.editButton
                  }
                  onPress={
                    handleEdit
                  }
                  disabled={
                    deleting
                  }
                >
                  <Text
                    style={
                      styles.editButtonText
                    }
                  >
                    ✎ Edit Officer
                  </Text>
                </TouchableOpacity>

                {/* DELETE */}

                <TouchableOpacity
                  style={[
                    styles.deleteButton,

                    deleting &&
                      styles.deleteButtonDisabled,
                  ]}
                  onPress={
                    handleDeleteOfficer
                  }
                  disabled={
                    deleting
                  }
                >
                  {deleting ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text
                      style={
                        styles.deleteButtonText
                      }
                    >
                      Delete Officer
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* DIVIDER */}

            <View
              style={
                styles.divider
              }
            />

            {/* ==================================
                DETAILS
            ================================== */}

            <View
              style={
                styles.detailsGrid
              }
            >
              {/* EMPLOYEE NUMBER */}

              <View
                style={
                  styles.detailItem
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Employee Number
                </Text>

                <Text
                  style={
                    styles.detailValueStrong
                  }
                >
                  {
                    officer.employee_number
                  }
                </Text>
              </View>

              {/* USERNAME */}

              <View
                style={
                  styles.detailItem
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Username
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {
                    officer.username
                  }
                </Text>
              </View>

              {/* ASSIGNED AREA */}

              <View
                style={
                  styles.detailItem
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Assigned Area
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {officer.assigned_area ||
                    'Not assigned'}
                </Text>
              </View>

              {/* EMAIL */}

              <View
                style={
                  styles.detailItem
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Email Address
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {officer.email ||
                    'Not provided'}
                </Text>
              </View>

              {/* CONTACT */}

              <View
                style={
                  styles.detailItem
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Contact Number
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {officer.contact_number ||
                    'Not provided'}
                </Text>
              </View>

              {/* CREATED */}

              <View
                style={
                  styles.detailItem
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Account Created
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {formatDate(
                    officer.created_at
                  )}
                </Text>
              </View>
            </View>
          </View>

          {/* ==================================
              SUMMARY
          ================================== */}

          <View
            style={
              styles.summaryRow
            }
          >
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
                Total Fines Recorded
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {
                  stats.totalFines
                }
              </Text>
            </View>

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
                Active Fine Records
              </Text>

              <Text
                style={
                  styles.summaryValueGreen
                }
              >
                {
                  stats.activeFines
                }
              </Text>
            </View>
          </View>

          {/* ==================================
              RECENT FINES
          ================================== */}

          <View
            style={
              styles.historyCard
            }
          >
            <View
              style={
                styles.historyHeaderBar
              }
            >
              <Text
                style={
                  styles.historyTitle
                }
              >
                Recent Fines Recorded
              </Text>

              <Text
                style={
                  styles.historySubtitle
                }
              >
                Most recent fines recorded by this officer
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
            >
              <View
                style={
                  styles.historyTable
                }
              >
                {/* TABLE HEADER */}

                <View
                  style={
                    styles.tableHeader
                  }
                >
                  <Text
                    style={[
                      styles.headerCell,
                      styles.referenceColumn,
                    ]}
                  >
                    Fine Reference
                  </Text>

                  <Text
                    style={[
                      styles.headerCell,
                      styles.studentColumn,
                    ]}
                  >
                    Student
                  </Text>

                  <Text
                    style={[
                      styles.headerCell,
                      styles.violationColumn,
                    ]}
                  >
                    Violation
                  </Text>

                  <Text
                    style={[
                      styles.headerCell,
                      styles.dateColumn,
                    ]}
                  >
                    Date
                  </Text>

                  <Text
                    style={[
                      styles.headerCell,
                      styles.amountColumn,
                    ]}
                  >
                    Amount
                  </Text>

                  <Text
                    style={[
                      styles.headerCell,
                      styles.statusColumn,
                    ]}
                  >
                    Status
                  </Text>
                </View>

                {/* EMPTY */}

                {recentFines.length ===
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
                      This officer has not recorded any fines yet.
                    </Text>
                  </View>
                ) : (
                  recentFines.map(
                    (fine) => {
                      const fineStatus =
                        normalizeFineStatus(
                          fine.fine_status
                        );

                      return (
                        <TouchableOpacity
                          key={
                            fine.id
                          }
                          style={
                            styles.historyRow
                          }
                          activeOpacity={
                            0.7
                          }
                          onPress={() =>
                            handleFinePress(
                              fine.id
                            )
                          }
                        >
                          {/* REFERENCE */}

                          <Text
                            style={[
                              styles.bodyCell,
                              styles.referenceColumn,
                              styles.referenceText,
                            ]}
                          >
                            {
                              fine.fine_reference
                            }
                          </Text>

                          {/* STUDENT */}

                          <View
                            style={
                              styles.studentColumn
                            }
                          >
                            <Text
                              style={
                                styles.studentName
                              }
                            >
                              {
                                fine.student_name
                              }
                            </Text>

                            <Text
                              style={
                                styles.studentNumber
                              }
                            >
                              {
                                fine.student_number
                              }
                            </Text>
                          </View>

                          {/* VIOLATION */}

                          <Text
                            style={[
                              styles.bodyCell,
                              styles.violationColumn,
                            ]}
                          >
                            {
                              fine.violation_name
                            }
                          </Text>

                          {/* DATE */}

                          <Text
                            style={[
                              styles.bodyCell,
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
                              styles.bodyCell,
                              styles.amountColumn,
                              styles.amountText,
                            ]}
                          >
                            {formatMoney(
                              fine.amount
                            )}
                          </Text>

                          {/* STATUS */}

                          <View
                            style={
                              styles.statusColumn
                            }
                          >
                            <View
                              style={[
                                styles.fineStatusBadge,

                                getFineStatusBadgeStyle(
                                  fineStatus
                                ),
                              ]}
                            >
                              <Text
                                style={[
                                  styles.fineStatusText,

                                  getFineStatusTextStyle(
                                    fineStatus
                                  ),
                                ]}
                              >
                                {getFineStatusLabel(
                                  fineStatus
                                )}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
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

          <View
            style={
              styles.navigation
            }
          >
            {navItems.map(
              (item) => {
                const active =
                  item.label ===
                  'Officers';

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
                      {
                        item.label
                      }
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

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
          {/* MOBILE NAV */}

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
                    'Officers';

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
                        {
                          item.label
                        }
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          )}

          {/* ==================================
              PAGE HEADER
          ================================== */}

          <View
            style={
              styles.pageHeader
            }
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              onPress={
                handleBack
              }
            >
              <Text
                style={
                  styles.backIcon
                }
              >
                ‹
              </Text>

              <Text
                style={
                  styles.backText
                }
              >
                Officers
              </Text>
            </TouchableOpacity>

            <Text
              style={
                styles.pageTitle
              }
            >
              Officer Profile
            </Text>

            <Text
              style={
                styles.pageSubtitle
              }
            >
              View officer account information and fine history
            </Text>
          </View>

          {
            renderContent()
          }
        </ScrollView>
      </View>
    </View>
  );
}

// ==========================================
// NORMALIZE FINE STATUS
// ==========================================

function normalizeFineStatus(
  status: string
) {
  return String(
    status ||
      'UNPAID'
  ).toUpperCase();
}

// ==========================================
// FINE STATUS LABEL
// ==========================================

function getFineStatusLabel(
  status: string
) {
  switch (status) {
    case 'PAID':
      return 'Paid';

    case 'CANCELLED':
      return 'Cancelled';

    case 'PENDING':
      return 'Pending';

    case 'WAIVED':
      return 'Waived';

    default:
      return 'Unpaid';
  }
}

// ==========================================
// FINE STATUS BADGE
// ==========================================

function getFineStatusBadgeStyle(
  status: string
) {
  switch (status) {
    case 'PAID':
      return {
        backgroundColor:
          '#E5F7E8',
      };

    case 'CANCELLED':
      return {
        backgroundColor:
          '#ECEFF4',
      };

    case 'PENDING':
      return {
        backgroundColor:
          '#FFF4D6',
      };

    case 'WAIVED':
      return {
        backgroundColor:
          '#E8F2FF',
      };

    default:
      return {
        backgroundColor:
          '#FFEAEA',
      };
  }
}

// ==========================================
// FINE STATUS TEXT
// ==========================================

function getFineStatusTextStyle(
  status: string
) {
  switch (status) {
    case 'PAID':
      return {
        color:
          '#2E9D43',
      };

    case 'CANCELLED':
      return {
        color:
          '#606775',
      };

    case 'PENDING':
      return {
        color:
          '#A16A00',
      };

    case 'WAIVED':
      return {
        color:
          '#173A73',
      };

    default:
      return {
        color:
          '#D32F2F',
      };
  }
}

// ==========================================
// FORMAT MONEY
// ==========================================

function formatMoney(
  amount: number
) {
  return `₱${Number(
    amount || 0
  ).toLocaleString(
    'en-PH',
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  )}`;
}

// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (
    !value
  ) {
    return '—';
  }

  const normalized =
    value.includes('T')
      ? value
      : value.replace(
          ' ',
          'T'
        );

  const date =
    new Date(
      normalized
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    'en-US',
    {
      month:
        'long',

      day:
        'numeric',

      year:
        'numeric',
    }
  );
}

// ==========================================
// SIDEBAR SYMBOLS
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