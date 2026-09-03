import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Image,
  Alert,
  Platform,
} from 'react-native';

import {
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
} from './fines.styles';

// ==========================================
// TYPES
// ==========================================

type Fine = {
  id: number;

  fine_reference: string;

  student_id: number;

  student_number:
    | string
    | null;

  student_username:
    | string
    | null;

  student_name: string;

  violation_type_id: number;

  violation_code:
    | string
    | null;

  violation_name: string;

  amount_centavos: number;

  amount: number;

  remarks:
    | string
    | null;

  officer_id:
    | number
    | null;

  officer_name: string;

  issued_at: string;

  paid_at:
    | string
    | null;

  cancelled_at:
    | string
    | null;

  cancellation_reason:
    | string
    | null;

  status: string;
};

type ViolationType = {
  id: number;

  violation_code:
    | string
    | null;

  violation_name: string;

  amount_centavos: number;

  amount: number;
};

type NavItem = {
  label: string;
  route: string;
  icon?: any;
};

// ==========================================
// FINES DIRECTORY SCREEN
// ==========================================

export default function FinesDirectory() {
  const router =
    useRouter();

  const { logout } =
    useAuth();

  const { width } =
    useWindowDimensions();

  const isTablet =
    width >= 768;

  // ==========================================
  // DATA
  // ==========================================

  const [
    fines,
    setFines,
  ] = useState<Fine[]>([]);

  const [
    violationTypes,
    setViolationTypes,
  ] = useState<
    ViolationType[]
  >([]);

  // ==========================================
  // FILTERS
  // ==========================================

  const [
    searchText,
    setSearchText,
  ] = useState('');

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState('ALL');

  const [
    selectedViolationId,
    setSelectedViolationId,
  ] = useState<
    number | null
  >(null);

  const [
    statusMenuOpen,
    setStatusMenuOpen,
  ] = useState(false);

  const [
    violationMenuOpen,
    setViolationMenuOpen,
  ] = useState(false);

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  // ==========================================
  // NAVIGATION ITEMS
  //
  // Keep this order the same as Students.
  // ==========================================

  const navItems: NavItem[] = [
    {
      label:
        'Dashboard',

      route:
        '/admin/dashboard',

      icon:
        require('../../../assets/icons/dashboard.png'),
    },

    {
      label:
        'Students',

      route:
        '/admin/students',

      icon:
        require('../../../assets/icons/students.png'),
    },

    {
      label:
        'Fines',

      route:
        '/admin/fines',

      icon:
        require('../../../assets/icons/fines.png'),
    },

    {
      label:
        'QR Scanner',

      route:
        '/admin/qr-scanner',

      icon:
        require('../../../assets/icons/qr-codeWhite.png'),
    },

    {
      label:
        'Reports',

      route:
        '/admin/reports',

      icon:
        require('../../../assets/icons/reports.png'),
    },

    {
      label:
        'Settings',

      route:
        '/admin/settings',

      icon:
        require('../../../assets/icons/settings.png'),
    },

    {
      label:
        'Officers',

      route:
        '/admin/officers',

      icon:
        require('../../../assets/icons/officers.png'),
    },
  ];

  // ==========================================
  // LOAD PAGE
  // ==========================================

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData =
    async () => {
      try {
        setLoading(true);

        setErrorMessage('');

        const [
          finesResponse,
          violationsResponse,
        ] =
          await Promise.all([
            fetch(
              `${API_BASE}/api/fines`
            ),

            fetch(
              `${API_BASE}/api/fines/options/violations`
            ),
          ]);

        const finesData =
          await finesResponse.json();

        const violationsData =
          await violationsResponse.json();

        // ======================================
        // FINES ERROR
        // ======================================

        if (
          !finesResponse.ok ||
          !finesData.success
        ) {
          throw new Error(
            finesData.message ||
              'Failed to load fines.'
          );
        }

        // ======================================
        // VIOLATION TYPES ERROR
        // ======================================

        if (
          !violationsResponse.ok ||
          !violationsData.success
        ) {
          throw new Error(
            violationsData.message ||
              'Failed to load violation types.'
          );
        }

        // ======================================
        // SAVE DATA
        // ======================================

        setFines(
          finesData.fines || []
        );

        setViolationTypes(
          violationsData.violations ||
            []
        );
      } catch (error) {
        console.error(
          'Load fines directory error:',
          error
        );

        setErrorMessage(
          'Could not connect to the SmartFine server.'
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================
  // FILTER FINES
  // ==========================================

  const filteredFines =
    useMemo(() => {
      const search =
        searchText
          .trim()
          .toLowerCase();

      return fines.filter(
        (fine) => {
          // ==================================
          // SEARCH
          // ==================================

          if (search) {
            const searchable =
              [
                fine.fine_reference,

                fine.student_number,

                fine.student_username,

                fine.student_name,

                fine.violation_name,

                fine.officer_name,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            if (
              !searchable.includes(
                search
              )
            ) {
              return false;
            }
          }

          // ==================================
          // STATUS FILTER
          // ==================================

          if (
            selectedStatus !==
            'ALL'
          ) {
            if (
              String(
                fine.status
              ).toUpperCase() !==
              selectedStatus
            ) {
              return false;
            }
          }

          // ==================================
          // VIOLATION FILTER
          // ==================================

          if (
            selectedViolationId !==
            null
          ) {
            if (
              Number(
                fine.violation_type_id
              ) !==
              selectedViolationId
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      fines,
      searchText,
      selectedStatus,
      selectedViolationId,
    ]);

  // ==========================================
  // SELECTED VIOLATION LABEL
  // ==========================================

  const selectedViolationName =
    useMemo(() => {
      if (
        selectedViolationId ===
        null
      ) {
        return 'Violation Type';
      }

      const violation =
        violationTypes.find(
          (item) =>
            item.id ===
            selectedViolationId
        );

      return (
        violation?.violation_name ||
        'Violation Type'
      );
    }, [
      violationTypes,
      selectedViolationId,
    ]);

  // ==========================================
  // OPEN ADD FINE
  // ==========================================

  const handleAddFine =
    () => {
      router.push(
        '/admin/fines/add' as any
      );
    };

  // ==========================================
  // OPEN FINE DETAILS
  // ==========================================

  const handleOpenFine = (
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
      await logout();

      router.replace(
        '/login'
      );
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

        if (confirmed) {
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
  // MONEY
  // ==========================================

  const formatMoney = (
    amount: number
  ) => {
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
  };

  // ==========================================
  // DATE
  // ==========================================

  const formatDate = (
    value: string
  ) => {
    if (!value) {
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
          'short',

        day:
          'numeric',

        year:
          'numeric',
      }
    );
  };

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <View
      style={
        styles.screen
      }
    >
      {/* ======================================
          SIDEBAR
          SAME STRUCTURE AS STUDENTS
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
              source={require('../../../assets/branding/smartfineNoBG.png')}
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
                  'Fines';

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
                    <View
                      style={
                        styles.navIconContainer
                      }
                    >
                      <Image
                        source={
                          item.icon
                        }
                        style={
                          styles.navImageIcon
                        }
                        resizeMode="contain"
                      />
                    </View>

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
                    'Fines';

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
                        router.push(
                          item.route as any
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
              HEADER
          ================================== */}

          <View
            style={
              styles.header
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              Fines Directory
            </Text>
          </View>

          {/* ==================================
              TOOLBAR
          ================================== */}

          <View
            style={
              styles.toolbar
            }
          >
            {/* SEARCH */}

            <View
              style={
                styles.searchBox
              }
            >
              <Text
                style={
                  styles.searchIcon
                }
              >
                ⌕
              </Text>

              <TextInput
                style={
                  styles.searchInput
                }
                value={
                  searchText
                }
                onChangeText={
                  setSearchText
                }
                placeholder="Search student name or Fine ID"
                placeholderTextColor="#8C939F"
              />
            </View>

            {/* ==================================
                STATUS FILTER
            ================================== */}

            <View
              style={
                styles.filterWrapper
              }
            >
              <TouchableOpacity
                style={
                  styles.filterButton
                }
                onPress={() => {
                  setStatusMenuOpen(
                    !statusMenuOpen
                  );

                  setViolationMenuOpen(
                    false
                  );
                }}
              >
                <Text
                  style={
                    styles.filterButtonText
                  }
                >
                  {selectedStatus ===
                  'ALL'
                    ? 'All Status'
                    : formatStatus(
                        selectedStatus
                      )}
                </Text>

                <Text
                  style={
                    styles.filterArrow
                  }
                >
                  ▼
                </Text>
              </TouchableOpacity>

              {statusMenuOpen && (
                <View
                  style={
                    styles.dropdownMenu
                  }
                >
                  {[
                    'ALL',
                    'UNPAID',
                    'PAID',
                    'CANCELLED',
                  ].map(
                    (
                      status
                    ) => (
                      <TouchableOpacity
                        key={
                          status
                        }
                        style={
                          styles.dropdownItem
                        }
                        onPress={() => {
                          setSelectedStatus(
                            status
                          );

                          setStatusMenuOpen(
                            false
                          );
                        }}
                      >
                        <Text
                          style={
                            styles.dropdownItemText
                          }
                        >
                          {status ===
                          'ALL'
                            ? 'All Status'
                            : formatStatus(
                                status
                              )}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}
            </View>

            {/* ==================================
                VIOLATION FILTER
            ================================== */}

            <View
              style={[
                styles.filterWrapper,

                styles.violationFilterWrapper,
              ]}
            >
              <TouchableOpacity
                style={
                  styles.filterButton
                }
                onPress={() => {
                  setViolationMenuOpen(
                    !violationMenuOpen
                  );

                  setStatusMenuOpen(
                    false
                  );
                }}
              >
                <Text
                  style={
                    styles.filterButtonText
                  }
                  numberOfLines={
                    1
                  }
                >
                  {
                    selectedViolationName
                  }
                </Text>

                <Text
                  style={
                    styles.filterArrow
                  }
                >
                  ▼
                </Text>
              </TouchableOpacity>

              {violationMenuOpen && (
                <View
                  style={[
                    styles.dropdownMenu,

                    styles.violationDropdown,
                  ]}
                >
                  <TouchableOpacity
                    style={
                      styles.dropdownItem
                    }
                    onPress={() => {
                      setSelectedViolationId(
                        null
                      );

                      setViolationMenuOpen(
                        false
                      );
                    }}
                  >
                    <Text
                      style={
                        styles.dropdownItemText
                      }
                    >
                      All Violations
                    </Text>
                  </TouchableOpacity>

                  {violationTypes.map(
                    (
                      violation
                    ) => (
                      <TouchableOpacity
                        key={
                          violation.id
                        }
                        style={
                          styles.dropdownItem
                        }
                        onPress={() => {
                          setSelectedViolationId(
                            violation.id
                          );

                          setViolationMenuOpen(
                            false
                          );
                        }}
                      >
                        <Text
                          style={
                            styles.dropdownItemText
                          }
                        >
                          {
                            violation.violation_name
                          }
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}
            </View>

            {/* ==================================
                ADD FINE
            ================================== */}

            <TouchableOpacity
              style={
                styles.addButton
              }
              onPress={
                handleAddFine
              }
            >
              <Text
                style={
                  styles.addButtonText
                }
              >
                + Add Fine
              </Text>
            </TouchableOpacity>
          </View>

          {/* ==================================
              TABLE CARD
          ================================== */}

          <View
            style={
              styles.tableCard
            }
          >
            {/* ==================================
                LOADING
            ================================== */}

            {loading ? (
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
                    styles.loadingText
                  }
                >
                  Loading fines...
                </Text>
              </View>
            ) : errorMessage ? (
              /* ==================================
                  ERROR
              ================================== */

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
                  {
                    errorMessage
                  }
                </Text>

                <TouchableOpacity
                  style={
                    styles.retryButton
                  }
                  onPress={
                    loadPageData
                  }
                >
                  <Text
                    style={
                      styles.retryButtonText
                    }
                  >
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ==================================
                  TABLE
              ================================== */

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  true
                }
              >
                <View
                  style={
                    styles.table
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

                        styles.fineIdColumn,
                      ]}
                    >
                      Fine ID
                    </Text>

                    <Text
                      style={[
                        styles.headerCell,

                        styles.violationColumn,
                      ]}
                    >
                      Violation Type
                    </Text>

                    <Text
                      style={[
                        styles.headerCell,

                        styles.studentColumn,
                      ]}
                    >
                      Student Name
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

                        styles.officerColumn,
                      ]}
                    >
                      Officer
                    </Text>

                    <Text
                      style={[
                        styles.headerCell,

                        styles.dateColumn,
                      ]}
                    >
                      Date Issued
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

                  {/* ==================================
                      EMPTY STATE
                  ================================== */}

                  {filteredFines.length ===
                  0 ? (
                    <View
                      style={
                        styles.emptyTable
                      }
                    >
                      <Text
                        style={
                          styles.emptyTitle
                        }
                      >
                        No fines found
                      </Text>

                      <Text
                        style={
                          styles.emptyText
                        }
                      >
                        No fine records match the current filters.
                      </Text>
                    </View>
                  ) : (
                    /* ==================================
                        FINE ROWS
                    ================================== */

                    filteredFines.map(
                      (
                        fine
                      ) => (
                        <TouchableOpacity
                          key={
                            fine.id
                          }
                          style={
                            styles.tableRow
                          }
                          onPress={() =>
                            handleOpenFine(
                              fine.id
                            )
                          }
                        >
                          {/* FINE ID */}

                          <Text
                            style={[
                              styles.cell,

                              styles.fineIdColumn,

                              styles.fineIdText,
                            ]}
                          >
                            {
                              fine.fine_reference
                            }
                          </Text>

                          {/* VIOLATION */}

                          <Text
                            style={[
                              styles.cell,

                              styles.violationColumn,
                            ]}
                          >
                            {
                              fine.violation_name
                            }
                          </Text>

                          {/* STUDENT */}

                          <View
                            style={[
                              styles.cellContainer,

                              styles.studentColumn,
                            ]}
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
                                fine.student_number ||
                                ''
                              }
                            </Text>
                          </View>

                          {/* AMOUNT */}

                          <Text
                            style={[
                              styles.cell,

                              styles.amountColumn,

                              styles.amountText,
                            ]}
                          >
                            {formatMoney(
                              fine.amount
                            )}
                          </Text>

                          {/* OFFICER */}

                          <Text
                            style={[
                              styles.cell,

                              styles.officerColumn,
                            ]}
                          >
                            {
                              fine.officer_name
                            }
                          </Text>

                          {/* DATE */}

                          <Text
                            style={[
                              styles.cell,

                              styles.dateColumn,
                            ]}
                          >
                            {formatDate(
                              fine.issued_at
                            )}
                          </Text>

                          {/* STATUS */}

                          <View
                            style={[
                              styles.cellContainer,

                              styles.statusColumn,
                            ]}
                          >
                            <View
                              style={[
                                styles.statusBadge,

                                getStatusBadgeStyle(
                                  fine.status
                                ),
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,

                                  getStatusTextStyle(
                                    fine.status
                                  ),
                                ]}
                              >
                                {formatStatus(
                                  fine.status
                                )}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      )
                    )
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ==========================================
// FORMAT STATUS
// ==========================================

function formatStatus(
  status: string
) {
  const value =
    String(
      status || ''
    ).toUpperCase();

  switch (value) {
    case 'PAID':
      return 'Paid';

    case 'CANCELLED':
      return 'Cancelled';

    case 'UNPAID':
      return 'Unpaid';

    default:
      return status;
  }
}

// ==========================================
// STATUS BADGE STYLE
// ==========================================

function getStatusBadgeStyle(
  status: string
) {
  const value =
    String(
      status || ''
    ).toUpperCase();

  switch (value) {
    case 'PAID':
      return styles.statusBadgePaid;

    case 'CANCELLED':
      return styles.statusBadgeCancelled;

    default:
      return styles.statusBadgeUnpaid;
  }
}

// ==========================================
// STATUS TEXT STYLE
// ==========================================

function getStatusTextStyle(
  status: string
) {
  const value =
    String(
      status || ''
    ).toUpperCase();

  switch (value) {
    case 'PAID':
      return styles.statusTextPaid;

    case 'CANCELLED':
      return styles.statusTextCancelled;

    default:
      return styles.statusTextUnpaid;
  }
}
