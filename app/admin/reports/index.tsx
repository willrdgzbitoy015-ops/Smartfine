import {
  useCallback,
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
  RefreshControl,
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
} from './reports.styles';

// ==========================================
// TYPES
// ==========================================

type NavItem = {
  label: string;
  route: string;
  icon?: any;
};

type PaymentSummary = {
  totalCollectedCentavos: number;
  totalCollected: number;

  pendingPaymentsCentavos: number;
  pendingPayments: number;

  todayPaymentCentavos: number;
  todayPayment: number;

  totalCollectedCount: number;
  pendingPaymentCount: number;
  todayPaymentCount: number;
};

type PaymentTransaction = {
  id: number;

  payment_reference:
    | string
    | null;

  payment_method:
    | string
    | null;

  payment_status:
    | string
    | null;

  amount_centavos: number;
  amount: number;

  student_id: number;

  student_number:
    | string
    | null;

  student_name:
    | string
    | null;

  fine_id: number;

  fine_reference:
    | string
    | null;

  violation_name?:
    | string
    | null;

  gateway_transaction_id:
    | string
    | null;

  gateway_reference:
    | string
    | null;

  confirmed_by?:
    | number
    | null;

  confirmed_by_name?:
    | string
    | null;

  payment_notes?:
    | string
    | null;

  created_at:
    | string
    | null;

  confirmed_at:
    | string
    | null;

  paid_at:
    | string
    | null;

  transaction_date:
    | string
    | null;
};

type PaymentReportResponse = {
  success: boolean;

  summary: PaymentSummary;

  transactions:
    PaymentTransaction[];

  totalTransactions: number;

  message?: string;
};

// ==========================================
// EMPTY SUMMARY
// ==========================================

const EMPTY_SUMMARY:
  PaymentSummary = {
    totalCollectedCentavos:
      0,

    totalCollected:
      0,

    pendingPaymentsCentavos:
      0,

    pendingPayments:
      0,

    todayPaymentCentavos:
      0,

    todayPayment:
      0,

    totalCollectedCount:
      0,

    pendingPaymentCount:
      0,

    todayPaymentCount:
      0,
  };

// ==========================================
// PAYMENT REPORTS
// ==========================================

export default function PaymentReports() {
  const router =
    useRouter();

  const { logout } =
    useAuth();

  const { width } =
    useWindowDimensions();

  const isTablet =
    width >= 768;

  // ==========================================
  // REPORT STATE
  // ==========================================

  const [
    summary,
    setSummary,
  ] =
    useState<PaymentSummary>(
      EMPTY_SUMMARY
    );

  const [
    transactions,
    setTransactions,
  ] =
    useState<
      PaymentTransaction[]
    >([]);

  const [
    totalTransactions,
    setTotalTransactions,
  ] =
    useState(0);

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
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

  const navItems:
    NavItem[] = [
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
  // LOAD PAYMENT REPORTS
  // ==========================================

  const loadReports =
    useCallback(
      async (
        isRefresh = false
      ) => {
        try {
          if (
            isRefresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError(
            ''
          );

          const response =
            await fetch(
              `${API_BASE}/api/reports/payments`
            );

          const data:
            PaymentReportResponse =
            await response.json();

          console.log(
            'Payment reports response:',
            data
          );

          if (
            !response.ok ||
            !data.success
          ) {
            setError(
              data.message ||
                'Failed to load payment reports.'
            );

            return;
          }

          setSummary(
            data.summary ||
              EMPTY_SUMMARY
          );

          setTransactions(
            Array.isArray(
              data.transactions
            )
              ? data.transactions
              : []
          );

          setTotalTransactions(
            Number(
              data.totalTransactions ||
                0
            )
          );
        } catch (error) {
          console.error(
            'Payment reports connection error:',
            error
          );

          setError(
            'Could not connect to the SmartFine server.'
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadReports();
  }, [
    loadReports,
  ]);

  // ==========================================
  // OPEN TRANSACTION DETAIL
  // ==========================================

  const handleTransactionPress =
    (
      payment:
        PaymentTransaction
    ) => {
      if (
        !payment.id
      ) {
        return;
      }

      router.push(
        `/admin/reports/${payment.id}` as any
      );
    };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleNavigation =
    (
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
              source={require('../../../assets/branding/smartfineNoBG.png')}
              style={
                styles.smartFineLogo
              }
              resizeMode="contain"
            />
          </View>

          {/* NAV */}

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
                  'Reports';

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
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() =>
                loadReports(
                  true
                )
              }
            />
          }
        >
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
                (
                  item
                ) => {
                  const active =
                    item.label ===
                    'Reports';

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
              HEADER
          ================================== */}

          <View
            style={
              styles.header
            }
          >
            <View>
              <Text
                style={
                  styles.pageTitle
                }
              >
                Payment Reports
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }
              >
                View payment collections and transaction history
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.refreshButton
              }
              onPress={() =>
                loadReports(
                  true
                )
              }
              disabled={
                refreshing
              }
            >
              {refreshing ? (
                <ActivityIndicator
                  size="small"
                  color="#173A73"
                />
              ) : (
                <Text
                  style={
                    styles.refreshButtonText
                  }
                >
                  Refresh
                </Text>
              )}
            </TouchableOpacity>
          </View>

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
                  styles.stateText
                }
              >
                Loading payment reports...
              </Text>
            </View>
          ) : error ? (
            // ==================================
            // ERROR
            // ==================================

            <View
              style={
                styles.centerState
              }
            >
              <Text
                style={
                  styles.errorTitle
                }
              >
                Unable to Load Reports
              </Text>

              <Text
                style={
                  styles.errorText
                }
              >
                {
                  error
                }
              </Text>

              <TouchableOpacity
                style={
                  styles.retryButton
                }
                onPress={() =>
                  loadReports()
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
            <>
              {/* ==================================
                  SUMMARY CARDS
              ================================== */}

              <View
                style={
                  styles.summaryRow
                }
              >
                {/* TOTAL COLLECTED */}

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
                    Total Collected
                  </Text>

                  <Text
                    style={
                      styles.summaryAmountRed
                    }
                    numberOfLines={
                      1
                    }
                    adjustsFontSizeToFit
                  >
                    {formatMoney(
                      summary.totalCollected
                    )}
                  </Text>

                  <Text
                    style={
                      styles.summaryCount
                    }
                  >
                    {summary.totalCollectedCount}{' '}
                    {
                      summary.totalCollectedCount ===
                      1
                        ? 'payment'
                        : 'payments'
                    }
                  </Text>
                </View>

                {/* PENDING */}

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
                    Pending Payments
                  </Text>

                  <Text
                    style={
                      styles.summaryAmountRed
                    }
                    numberOfLines={
                      1
                    }
                    adjustsFontSizeToFit
                  >
                    {formatMoney(
                      summary.pendingPayments
                    )}
                  </Text>

                  <Text
                    style={
                      styles.summaryCount
                    }
                  >
                    {summary.pendingPaymentCount}{' '}
                    pending
                  </Text>
                </View>

                {/* TODAY */}

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
                    Today&apos;s Payment
                  </Text>

                  <Text
                    style={
                      styles.summaryAmountGreen
                    }
                    numberOfLines={
                      1
                    }
                    adjustsFontSizeToFit
                  >
                    {formatMoney(
                      summary.todayPayment
                    )}
                  </Text>

                  <Text
                    style={
                      styles.summaryCount
                    }
                  >
                    {summary.todayPaymentCount}{' '}
                    today
                  </Text>
                </View>
              </View>

              {/* ==================================
                  TRANSACTION CARD
              ================================== */}

              <View
                style={
                  styles.transactionsCard
                }
              >
                {/* CARD TITLE */}

                <View
                  style={
                    styles.transactionsTitleRow
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.transactionsTitle
                      }
                    >
                      Payment Transactions
                    </Text>

                    <Text
                      style={
                        styles.transactionsSubtitle
                      }
                    >
                      Complete SmartFine payment transaction history
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.transactionCount
                    }
                  >
                    {totalTransactions}{' '}
                    {
                      totalTransactions ===
                      1
                        ? 'Transaction'
                        : 'Transactions'
                    }
                  </Text>
                </View>

                {/* ==================================
                    TABLE
                ================================== */}

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator
                  contentContainerStyle={
                    styles.horizontalTableContent
                  }
                >
                  <View
                    style={
                      styles.table
                    }
                  >
                    {/* HEADER */}

                    <View
                      style={
                        styles.tableHeader
                      }
                    >
                      <Text
                        style={[
                          styles.headerCell,
                          styles.transactionColumn,
                        ]}
                      >
                        Transaction ID
                      </Text>

                      <Text
                        style={[
                          styles.headerCell,
                          styles.methodColumn,
                        ]}
                      >
                        Payment Method
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
                          styles.fineColumn,
                        ]}
                      >
                        Fine Reference
                      </Text>

                      <Text
                        style={[
                          styles.headerCell,
                          styles.dateColumn,
                        ]}
                      >
                        Date
                      </Text>
                    </View>

                    {/* ==================================
                        EMPTY
                    ================================== */}

                    {transactions.length ===
                    0 ? (
                      <View
                        style={
                          styles.emptyState
                        }
                      >
                        <View
                          style={
                            styles.emptyIcon
                          }
                        >
                          <Text
                            style={
                              styles.emptyIconText
                            }
                          >
                            ₱
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.emptyTitle
                          }
                        >
                          No payment transactions found
                        </Text>

                        <Text
                          style={
                            styles.emptyText
                          }
                        >
                          Payment transactions will appear here once students begin making payments.
                        </Text>
                      </View>
                    ) : (
                      // ==================================
                      // TRANSACTIONS
                      // ==================================

                      transactions.map(
                        (
                          payment
                        ) => {
                          // If paid_at exists,
                          // always display Paid even if an
                          // older status value was not
                          // updated correctly.

                          const displayStatus =
                            payment.paid_at
                              ? 'PAID'
                              : payment.payment_status;

                          return (
                            <TouchableOpacity
                              key={
                                payment.id
                              }
                              style={
                                styles.transactionRow
                              }
                              activeOpacity={
                                0.7
                              }
                              onPress={() =>
                                handleTransactionPress(
                                  payment
                                )
                              }
                            >
                              {/* ==================================
                                  TRANSACTION
                              ================================== */}

                              <View
                                style={
                                  styles.transactionColumn
                                }
                              >
                                <Text
                                  style={
                                    styles.transactionReference
                                  }
                                  numberOfLines={
                                    1
                                  }
                                >
                                  {payment.payment_reference ||
                                    `PAY-${payment.id}`}
                                </Text>

                                {payment.gateway_transaction_id && (
                                  <Text
                                    style={
                                      styles.gatewayText
                                    }
                                    numberOfLines={
                                      1
                                    }
                                  >
                                    {
                                      payment.gateway_transaction_id
                                    }
                                  </Text>
                                )}
                              </View>

                              {/* ==================================
                                  METHOD
                              ================================== */}

                              <View
                                style={
                                  styles.methodColumn
                                }
                              >
                                <Text
                                  style={
                                    styles.bodyCell
                                  }
                                  numberOfLines={
                                    1
                                  }
                                >
                                  {formatPaymentMethod(
                                    payment.payment_method
                                  )}
                                </Text>

                                <View
                                  style={[
                                    styles.paymentStatusBadge,

                                    getPaymentStatusBadgeStyle(
                                      displayStatus
                                    ),
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.paymentStatusText,

                                      getPaymentStatusTextStyle(
                                        displayStatus
                                      ),
                                    ]}
                                  >
                                    {formatPaymentStatus(
                                      displayStatus
                                    )}
                                  </Text>
                                </View>
                              </View>

                              {/* ==================================
                                  STUDENT
                              ================================== */}

                              <View
                                style={
                                  styles.studentColumn
                                }
                              >
                                <Text
                                  style={
                                    styles.studentName
                                  }
                                  numberOfLines={
                                    1
                                  }
                                >
                                  {payment.student_name ||
                                    'Unknown Student'}
                                </Text>

                                <Text
                                  style={
                                    styles.studentNumber
                                  }
                                  numberOfLines={
                                    1
                                  }
                                >
                                  {payment.student_number ||
                                    'No Student ID'}
                                </Text>
                              </View>

                              {/* ==================================
                                  AMOUNT
                              ================================== */}

                              <Text
                                style={[
                                  styles.bodyCell,
                                  styles.amountColumn,
                                  styles.amountText,
                                ]}
                              >
                                {formatMoney(
                                  payment.amount
                                )}
                              </Text>

                              {/* ==================================
                                  FINE
                              ================================== */}

                              <View
                                style={
                                  styles.fineColumn
                                }
                              >
                                <Text
                                  style={[
                                    styles.bodyCell,
                                    styles.fineReference,
                                  ]}
                                  numberOfLines={
                                    1
                                  }
                                >
                                  {payment.fine_reference ||
                                    `Fine #${payment.fine_id}`}
                                </Text>

                                {payment.violation_name && (
                                  <Text
                                    style={
                                      styles.gatewayText
                                    }
                                    numberOfLines={
                                      1
                                    }
                                  >
                                    {
                                      payment.violation_name
                                    }
                                  </Text>
                                )}
                              </View>

                              {/* ==================================
                                  DATE
                              ================================== */}

                              <Text
                                style={[
                                  styles.bodyCell,
                                  styles.dateColumn,
                                  styles.dateText,
                                ]}
                                numberOfLines={
                                  1
                                }
                              >
                                {formatDate(
                                  payment.transaction_date
                                )}
                              </Text>
                            </TouchableOpacity>
                          );
                        }
                      )
                    )}
                  </View>
                </ScrollView>

                {/* ==================================
                    ROW HELP
                ================================== */}

                {transactions.length >
                  0 && (
                  <Text
                    style={{
                      color:
                        '#8C939F',

                      fontSize:
                        9,

                      textAlign:
                        'center',

                      paddingTop:
                        2,

                      paddingBottom:
                        14,
                    }}
                  >
                    Select a transaction to view its detailed report.
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ==========================================
// MONEY
// ==========================================

function formatMoney(
  amount:
    | number
    | null
    | undefined
) {
  return `₱ ${Number(
    amount ||
      0
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
// DATE
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
}

// ==========================================
// PAYMENT METHOD
// ==========================================

function formatPaymentMethod(
  method:
    | string
    | null
    | undefined
) {
  if (
    !method
  ) {
    return 'Not specified';
  }

  const normalized =
    String(
      method
    )
      .trim()
      .toUpperCase();

  // ========================================
  // CASHIER
  // ========================================

  if (
    normalized ===
      'CASHIER' ||
    normalized ===
      'CASH' ||
    normalized ===
      'PAY_AT_CASHIER'
  ) {
    return 'Pay at Cashier';
  }

  // ========================================
  // GCASH
  // ========================================

  if (
    normalized ===
    'GCASH'
  ) {
    return 'GCash';
  }

  return String(
    method
  )
    .replace(
      /_/g,
      ' '
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character.toUpperCase()
    );
}

// ==========================================
// PAYMENT STATUS
// ==========================================

function formatPaymentStatus(
  status:
    | string
    | null
    | undefined
) {
  if (
    !status
  ) {
    return 'Pending';
  }

  const normalized =
    String(
      status
    )
      .trim()
      .toUpperCase();

  if (
    normalized ===
      'PAID' ||
    normalized ===
      'COMPLETED' ||
    normalized ===
      'SUCCESS'
  ) {
    return 'Paid';
  }

  if (
    normalized ===
    'CANCELLED'
  ) {
    return 'Cancelled';
  }

  if (
    normalized ===
    'FAILED'
  ) {
    return 'Failed';
  }

  return 'Pending';
}

// ==========================================
// STATUS BADGE
// ==========================================

function getPaymentStatusBadgeStyle(
  status:
    | string
    | null
    | undefined
) {
  const normalized =
    String(
      status ||
        'PENDING'
    ).toUpperCase();

  if (
    normalized ===
      'PAID' ||
    normalized ===
      'COMPLETED' ||
    normalized ===
      'SUCCESS'
  ) {
    return {
      backgroundColor:
        '#E5F7E8',
    };
  }

  if (
    normalized ===
    'CANCELLED'
  ) {
    return {
      backgroundColor:
        '#ECEFF4',
    };
  }

  if (
    normalized ===
    'FAILED'
  ) {
    return {
      backgroundColor:
        '#FFEAEA',
    };
  }

  return {
    backgroundColor:
      '#FFF4D6',
  };
}

// ==========================================
// STATUS TEXT
// ==========================================

function getPaymentStatusTextStyle(
  status:
    | string
    | null
    | undefined
) {
  const normalized =
    String(
      status ||
        'PENDING'
    ).toUpperCase();

  if (
    normalized ===
      'PAID' ||
    normalized ===
      'COMPLETED' ||
    normalized ===
      'SUCCESS'
  ) {
    return {
      color:
        '#2E9D43',
    };
  }

  if (
    normalized ===
    'CANCELLED'
  ) {
    return {
      color:
        '#606775',
    };
  }

  if (
    normalized ===
    'FAILED'
  ) {
    return {
      color:
        '#D32F2F',
    };
  }

  return {
    color:
      '#A16A00',
  };
}
