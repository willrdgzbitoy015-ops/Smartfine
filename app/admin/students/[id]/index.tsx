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
  API_BASE,
} from '@/constants/api';

import {
  styles,
} from './student-profile.styles';

// ==========================================
// TYPES
// ==========================================

type Student = {
  id: number;

  student_id: string;

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

  profile_picture_uri:
    | string
    | null;
};

type Fine = {
  id: number;

  fine_reference?: string;

  violation_name: string;

  amount: number;

  issued_at: string;

  status: string;

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
  // STUDENT ID
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

  const [
    profileImageFailed,
    setProfileImageFailed,
  ] =
    useState(false);

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
    if (
      !studentId
    ) {
      return;
    }

    loadStudent();
  }, [
    studentId,
  ]);

  const loadStudent =
    async () => {
      try {
        setLoading(
          true
        );

        setError('');

        setProfileImageFailed(
          false
        );

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

        setData(
          result
        );
      } catch (error) {
        console.error(
          'Student profile connection error:',
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
  // PROFILE IMAGE URL
  // ==========================================

  const getProfilePictureUrl =
    (
      uri:
        | string
        | null
        | undefined
    ) => {
      if (
        !uri
      ) {
        return null;
      }

      if (
        uri.startsWith(
          'http://'
        ) ||
        uri.startsWith(
          'https://'
        )
      ) {
        return uri;
      }

      return `${API_BASE}${uri}`;
    };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit =
    () => {
      if (
        !studentId
      ) {
        return;
      }

      router.push(
        `/admin/students/${studentId}/edit` as any
      );
    };

  // ==========================================
  // QR CODE
  //
  // REAL QR CODE WILL BE NEXT
  // ==========================================

  const handleQRCode =
    () => {
      const message =
        'Student QR Code will be added next.';

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
        'QR Code',
        message
      );
    };

  // ==========================================
  // OPEN FINE
  // ==========================================

  const handleFinePress =
    (
      fineId: number
    ) => {
      router.push(
        `/admin/fines/${fineId}` as any
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
  // MAIN CONTENT
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

            <TouchableOpacity
              style={
                styles.retryButton
              }
              onPress={
                loadStudent
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
        student,
        totals,
        fines,
      } =
        data;

      // ======================================
      // INITIALS
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
      // PROFILE PHOTO
      // ======================================

      const profilePictureUrl =
        getProfilePictureUrl(
          student.profile_picture_uri
        );

      const showPicture =
        Boolean(
          profilePictureUrl
        ) &&
        !profileImageFailed;

      // ======================================
      // GRADE / SECTION
      // ======================================

      const gradeSection =
        [
          student.grade_level,
          student.section,
        ]
          .filter(
            Boolean
          )
          .join(
            ' - '
          ) ||
        'Not assigned';

      return (
        <>
          {/* ==================================
              COMPACT PROFILE CARD
          ================================== */}

          <View
            style={
              styles.profileCard
            }
          >
            {/* ==================================
                LEFT SIDE
            ================================== */}

            <View
              style={
                styles.profileLeft
              }
            >
              {/* PROFILE PHOTO */}

              {showPicture ? (
                <Image
                  source={{
                    uri:
                      profilePictureUrl!,
                  }}
                  style={
                    styles.avatarImage
                  }
                  resizeMode="cover"
                  onError={() => {
                    setProfileImageFailed(
                      true
                    );
                  }}
                />
              ) : (
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
              )}

              {/* STUDENT DETAILS */}

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

                <Text
                  style={
                    styles.studentMeta
                  }
                >
                  {
                    gradeSection
                  }
                </Text>

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

                <Text
                  style={
                    styles.studentMeta
                  }
                >
                  Email:{' '}
                  {student.email ||
                    'Not provided'}
                </Text>
              </View>
            </View>

            {/* ==================================
                RIGHT SIDE ACTIONS
            ================================== */}

            <View
              style={
                styles.profileActions
              }
            >
              {/* QR */}

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
                    styles.qrIcon
                  }
                >
                  ▦
                </Text>

                <Text
                  style={
                    styles.outlineButtonText
                  }
                >
                  View QR Code
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
                    styles.editIcon
                  }
                >
                  ✎
                </Text>

                <Text
                  style={
                    styles.outlineButtonText
                  }
                >
                  Edit Information
                </Text>
              </TouchableOpacity>
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
                  totals.outstandingBalance ||
                    0
                ).toFixed(
                  2
                )}
              </Text>
            </View>

            {/* PAID */}

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
                ).toFixed(
                  2
                )}
              </Text>
            </View>
          </View>

          {/* ==================================
              HISTORY
          ================================== */}

          <View
            style={
              styles.historyCard
            }
          >
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

                {/* EMPTY */}

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
                  fines.map(
                    (
                      fine
                    ) => {
                      const status =
                        String(
                          fine.status ||
                            ''
                        ).toUpperCase();

                      const isPaid =
                        status ===
                        'PAID';

                      const isCancelled =
                        status ===
                        'CANCELLED';

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

                                isCancelled &&
                                  styles.cancelledBadge,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,

                                  isPaid
                                    ? styles.paidBadgeText
                                    : styles.unpaidBadgeText,

                                  isCancelled &&
                                    styles.cancelledBadgeText,
                                ]}
                              >
                                {formatFineStatus(
                                  status
                                )}
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
                            {fine.officer_name ||
                              'Unknown'}
                          </Text>
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
              (
                item
              ) => {
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
                '/admin/students' as any
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
                (
                  item
                ) => (
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

          {
            renderContent()
          }
        </ScrollView>
      </View>
    </View>
  );
}

// ==========================================
// FINE STATUS
// ==========================================

function formatFineStatus(
  status: string
) {
  switch (
    String(
      status ||
        ''
    ).toUpperCase()
  ) {
    case 'PAID':
      return 'Paid';

    case 'CANCELLED':
      return 'Cancelled';

    case 'WAIVED':
      return 'Waived';

    case 'PENDING':
      return 'Pending';

    default:
      return 'Unpaid';
  }
}

// ==========================================
// DATE
// ==========================================

function formatDate(
  value: string
) {
  if (
    !value
  ) {
    return '—';
  }

  const normalized =
    value.includes(
      'T'
    )
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
// SIDEBAR ICONS
// ==========================================

function getMenuSymbol(
  label: string
) {
  switch (
    label
  ) {
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