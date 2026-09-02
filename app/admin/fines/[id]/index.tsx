import {
  useEffect,
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
  Modal,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import AsyncStorage from
  '@react-native-async-storage/async-storage';

import {
  useAuth,
} from '@/hooks/use-auth';

import {
  API_BASE,
} from '@/constants/api';

import {
  styles,
} from './fine-profile.styles';

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

  student_first_name:
    | string
    | null;

  student_middle_name:
    | string
    | null;

  student_last_name:
    | string
    | null;

  student_name: string;

  grade_level:
    | string
    | null;

  section:
    | string
    | null;

  violation_type_id: number;

  violation_code:
    | string
    | null;

  violation_name: string;

  violation_description:
    | string
    | null;

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

  cancelled_by:
    | number
    | null;

  cancellation_reason:
    | string
    | null;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;

  status: string;
};

type NavItem = {
  label: string;
  route: string;
};

// ==========================================
// FINE DETAILED VIEW
// ==========================================

export default function FineDetailedView() {
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
  // ROUTE ID
  // ==========================================

  const rawId =
    params.id;

  const fineId =
    Array.isArray(rawId)
      ? rawId[0]
      : rawId;

  // ==========================================
  // FINE DATA
  // ==========================================

  const [
    fine,
    setFine,
  ] = useState<Fine | null>(
    null
  );

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  // ==========================================
  // CANCEL FINE MODAL
  // ==========================================

  const [
    cancelModalVisible,
    setCancelModalVisible,
  ] = useState(false);

  const [
    cancellationReason,
    setCancellationReason,
  ] = useState('');

  const [
    cancelError,
    setCancelError,
  ] = useState('');

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
  // LOAD FINE
  // ==========================================

  const loadFine =
    async () => {
      if (!fineId) {
        return;
      }

      try {
        setLoading(true);

        setErrorMessage('');

        const response =
          await fetch(
            `${API_BASE}/api/fines/${fineId}`
          );

        const data =
          await response.json();

        console.log(
          'Fine details response:',
          data
        );

        if (
          !response.ok ||
          !data.success ||
          !data.fine
        ) {
          setErrorMessage(
            data.message ||
              'Failed to load fine information.'
          );

          return;
        }

        setFine(
          data.fine
        );
      } catch (error) {
        console.error(
          'Load fine details error:',
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
  // LOAD ON OPEN
  // ==========================================

  useEffect(() => {
    loadFine();
  }, [fineId]);

  // ==========================================
  // BACK TO FINES DIRECTORY
  // ==========================================

  const handleBack =
    () => {
      router.replace(
        '/admin/fines' as any
      );
    };

  // ==========================================
  // EDIT FINE
  // ==========================================

  const handleEdit =
    () => {
      if (!fineId) {
        return;
      }

      router.push(
        `/admin/fines/${fineId}/edit` as any
      );
    };

  // ==========================================
  // OPEN CANCEL FINE MODAL
  // ==========================================

  const handleCancelFine =
    () => {
      if (!fine) {
        return;
      }

      const status =
        String(
          fine.status || ''
        ).toUpperCase();

      // Only unpaid fines
      // can be cancelled.

      if (
        status !==
        'UNPAID'
      ) {
        return;
      }

      setCancellationReason(
        ''
      );

      setCancelError(
        ''
      );

      setCancelModalVisible(
        true
      );
    };

  // ==========================================
  // CLOSE CANCEL MODAL
  // ==========================================

  const closeCancelModal =
    () => {
      if (
        actionLoading
      ) {
        return;
      }

      setCancelModalVisible(
        false
      );

      setCancellationReason(
        ''
      );

      setCancelError(
        ''
      );
    };

  // ==========================================
  // PERFORM CANCEL FINE
  // ==========================================

  const performCancelFine =
    async () => {
      if (
        !fineId ||
        !fine
      ) {
        return;
      }

      const reason =
        cancellationReason
          .trim();

      // ======================================
      // VALIDATE REASON
      // ======================================

      if (
        reason.length < 3
      ) {
        setCancelError(
          'Please enter a cancellation reason.'
        );

        return;
      }

      if (
        reason.length > 500
      ) {
        setCancelError(
          'Cancellation reason must not exceed 500 characters.'
        );

        return;
      }

      try {
        setActionLoading(
          true
        );

        setCancelError(
          ''
        );

        setErrorMessage(
          ''
        );

        // ======================================
        // GET LOGGED-IN USER ID
        // ======================================

        const storedUserId =
          await AsyncStorage.getItem(
            'userId'
          );

        const parsedUserId =
          Number(
            storedUserId
          );

        const cancelledBy =
          Number.isInteger(
            parsedUserId
          ) &&
          parsedUserId > 0
            ? parsedUserId
            : null;

        // ======================================
        // SEND CANCEL REQUEST
        // ======================================

        const response =
          await fetch(
            `${API_BASE}/api/fines/${fineId}/cancel`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  cancellationReason:
                    reason,

                  cancelledBy,
                }),
            }
          );

        const data =
          await response.json();

        console.log(
          'Cancel fine response:',
          data
        );

        // ======================================
        // BACKEND ERROR
        // ======================================

        if (
          !response.ok ||
          !data.success
        ) {
          setCancelError(
            data.message ||
              'Failed to cancel fine.'
          );

          return;
        }

        // ======================================
        // CLOSE MODAL
        // ======================================

        setCancelModalVisible(
          false
        );

        setCancellationReason(
          ''
        );

        setCancelError(
          ''
        );

        // ======================================
        // SUCCESS
        // ======================================

        if (
          Platform.OS ===
          'web'
        ) {
          window.alert(
            `${fine.fine_reference} has been cancelled successfully.`
          );
        } else {
          Alert.alert(
            'Fine Cancelled',

            `${fine.fine_reference} has been cancelled successfully.`
          );
        }

        // ======================================
        // RELOAD FINE
        // ======================================

        await loadFine();
      } catch (error) {
        console.error(
          'Cancel fine error:',
          error
        );

        setCancelError(
          'Could not connect to the SmartFine server.'
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  // ==========================================
  // MARK FINE AS PAID
  // ==========================================

  const performMarkPaid =
    async () => {
      if (!fineId) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        setErrorMessage('');

        const response =
          await fetch(
            `${API_BASE}/api/fines/${fineId}/mark-paid`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({}),
            }
          );

        const data =
          await response.json();

        console.log(
          'Mark paid response:',
          data
        );

        // ======================================
        // BACKEND ERROR
        // ======================================

        if (
          !response.ok ||
          !data.success
        ) {
          setErrorMessage(
            data.message ||
              'Failed to mark fine as paid.'
          );

          return;
        }

        // ======================================
        // SUCCESS
        // ======================================

        if (
          Platform.OS ===
          'web'
        ) {
          window.alert(
            'Fine marked as paid successfully.'
          );
        } else {
          Alert.alert(
            'Fine Updated',

            'Fine marked as paid successfully.'
          );
        }

        // ======================================
        // RELOAD
        // ======================================

        await loadFine();
      } catch (error) {
        console.error(
          'Mark fine paid error:',
          error
        );

        setErrorMessage(
          'Could not connect to the SmartFine server.'
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  // ==========================================
  // MARK PAID CONFIRMATION
  // ==========================================

  const handleMarkPaid =
    () => {
      if (!fine) {
        return;
      }

      if (
        String(
          fine.status
        ).toUpperCase() !==
        'UNPAID'
      ) {
        return;
      }

      // ======================================
      // WEB
      // ======================================

      if (
        Platform.OS ===
        'web'
      ) {
        const confirmed =
          window.confirm(
            `Mark ${fine.fine_reference} as paid?`
          );

        if (confirmed) {
          performMarkPaid();
        }

        return;
      }

      // ======================================
      // MOBILE
      // ======================================

      Alert.alert(
        'Mark as Paid',

        `Mark ${fine.fine_reference} as paid?`,

        [
          {
            text:
              'Cancel',

            style:
              'cancel',
          },

          {
            text:
              'Mark as Paid',

            onPress:
              performMarkPaid,
          },
        ]
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
          '/login'
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
      // ======================================
      // WEB
      // ======================================

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

      // ======================================
      // MOBILE
      // ======================================

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
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingScreen
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
          Loading fine information...
        </Text>
      </View>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (
    errorMessage &&
    !fine
  ) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <Text
          style={
            styles.errorStateText
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
            loadFine
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

        <TouchableOpacity
          style={
            styles.backErrorButton
          }
          onPress={
            handleBack
          }
        >
          <Text
            style={
              styles.backErrorText
            }
          >
            Back to Fines
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // NO FINE
  // ==========================================

  if (!fine) {
    return null;
  }

  // ==========================================
  // STATUS
  // ==========================================

  const normalizedStatus =
    String(
      fine.status || ''
    ).toUpperCase();

  const isUnpaid =
    normalizedStatus ===
    'UNPAID';

  const isPaid =
    normalizedStatus ===
    'PAID';

  const isCancelled =
    normalizedStatus ===
    'CANCELLED';

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
              activeOpacity={
                0.7
              }
              hitSlop={{
                top: 12,
                bottom: 12,
                left: 12,
                right: 12,
              }}
            >
              <Text
                style={
                  styles.backArrow
                }
              >
                ‹
              </Text>
            </TouchableOpacity>

            <Text
              style={
                styles.pageTitle
              }
            >
              Fine Detailed View
            </Text>
          </View>

          {/* ==================================
              DETAILS CARD
          ================================== */}

          <View
            style={
              styles.detailsCard
            }
          >
            {/* ==================================
                CARD HEADER
            ================================== */}

            <View
              style={
                styles.cardHeader
              }
            >
              <Text
                style={
                  styles.cardTitle
                }
              >
                Fine Information #
                {
                  fine.fine_reference
                }
              </Text>

              {/* STATUS */}

              <View
                style={[
                  styles.statusBadge,

                  isPaid &&
                    styles.statusBadgePaid,

                  isUnpaid &&
                    styles.statusBadgeUnpaid,

                  isCancelled &&
                    styles.statusBadgeCancelled,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,

                    isPaid &&
                      styles.statusTextPaid,

                    isUnpaid &&
                      styles.statusTextUnpaid,

                    isCancelled &&
                      styles.statusTextCancelled,
                  ]}
                >
                  {formatStatus(
                    fine.status
                  )}
                </Text>
              </View>
            </View>

            {/* DIVIDER */}

            <View
              style={
                styles.divider
              }
            />

            {/* ==================================
                INFORMATION
            ================================== */}

            <View
              style={
                styles.informationArea
              }
            >
              {/* STUDENT */}

              <InfoRow
                label="Student"
                value={`${fine.student_name} (${fine.student_number || 'No Student ID'})`}
              />

              {/* GRADE / SECTION */}

              {(fine.grade_level ||
                fine.section) && (
                <InfoRow
                  label="Grade / Section"
                  value={[
                    fine.grade_level,
                    fine.section,
                  ]
                    .filter(Boolean)
                    .join(' - ')}
                />
              )}

              {/* VIOLATION */}

              <InfoRow
                label="Violation Type"
                value={
                  fine.violation_name
                }
              />

              {/* AMOUNT */}

              <InfoRow
                label="Amount"
                value={
                  formatMoney(
                    fine.amount
                  )
                }
                emphasized
              />

              {/* DATE */}

              <InfoRow
                label="Date Issued"
                value={
                  formatDate(
                    fine.issued_at
                  )
                }
              />

              {/* OFFICER */}

              <InfoRow
                label="Issued By"
                value={
                  fine.officer_name ||
                  'Unknown'
                }
              />

              {/* NOTES */}

              <InfoRow
                label="Notes / Description"
                value={
                  fine.remarks ||
                  'No notes provided.'
                }
              />

              {/* ==================================
                  PAID INFORMATION
              ================================== */}

              {isPaid &&
                fine.paid_at && (
                  <InfoRow
                    label="Date Paid"
                    value={
                      formatDate(
                        fine.paid_at
                      )
                    }
                  />
                )}

              {/* ==================================
                  CANCELLED INFORMATION
              ================================== */}

              {isCancelled && (
                <>
                  <InfoRow
                    label="Date Cancelled"
                    value={
                      formatDate(
                        fine.cancelled_at
                      )
                    }
                  />

                  <InfoRow
                    label="Cancellation Reason"
                    value={
                      fine.cancellation_reason ||
                      'No cancellation reason provided.'
                    }
                  />
                </>
              )}
            </View>
          </View>

          {/* ==================================
              ACTION ERROR
          ================================== */}

          {errorMessage !==
            '' && (
            <View
              style={
                styles.actionError
              }
            >
              <Text
                style={
                  styles.actionErrorText
                }
              >
                {
                  errorMessage
                }
              </Text>
            </View>
          )}

          {/* ==================================
              ACTION BUTTONS
          ================================== */}

          <View
            style={
              styles.actionRow
            }
          >
            {/* ==================================
                CANCEL FINE
            ================================== */}

            <TouchableOpacity
              style={[
                styles.cancelFineButton,

                !isUnpaid &&
                  styles.disabledButton,
              ]}
              onPress={
                handleCancelFine
              }
              disabled={
                !isUnpaid ||
                actionLoading
              }
            >
              <Text
                style={
                  styles.cancelFineText
                }
              >
                Cancel Fine
              </Text>
            </TouchableOpacity>

            {/* ==================================
                EDIT FINE
            ================================== */}

            <TouchableOpacity
              style={[
                styles.editButton,

                !isUnpaid &&
                  styles.disabledButton,
              ]}
              onPress={
                handleEdit
              }
              disabled={
                !isUnpaid ||
                actionLoading
              }
            >
              <Text
                style={
                  styles.editButtonText
                }
              >
                Edit Fine
              </Text>
            </TouchableOpacity>

            {/* ==================================
                MARK AS PAID
            ================================== */}

            <TouchableOpacity
              style={[
                styles.paidButton,

                !isUnpaid &&
                  styles.disabledButton,
              ]}
              onPress={
                handleMarkPaid
              }
              disabled={
                !isUnpaid ||
                actionLoading
              }
            >
              {actionLoading &&
              !cancelModalVisible ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.paidButtonText
                  }
                >
                  Mark as Paid
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ==================================
              COMPLETED STATUS MESSAGE
          ================================== */}

          {!isUnpaid && (
            <Text
              style={
                styles.completedHint
              }
            >
              {isPaid
                ? 'This fine has already been paid.'
                : 'This fine has been cancelled.'}
            </Text>
          )}
        </ScrollView>
      </View>

      {/* ======================================
          CANCEL FINE MODAL
      ====================================== */}

      <Modal
        visible={
          cancelModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeCancelModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.cancelModalCard
            }
          >
            {/* ==================================
                TITLE
            ================================== */}

            <Text
              style={
                styles.cancelModalTitle
              }
            >
              Cancel Fine?
            </Text>

            {/* ==================================
                MESSAGE
            ================================== */}

            <Text
              style={
                styles.cancelModalMessage
              }
            >
              You are about to cancel{' '}

              <Text
                style={
                  styles.cancelModalFineReference
                }
              >
                {
                  fine.fine_reference
                }
              </Text>

              . This will keep the fine record in SmartFine but mark it as cancelled.
            </Text>

            {/* ==================================
                REASON LABEL
            ================================== */}

            <Text
              style={
                styles.cancelReasonLabel
              }
            >
              Cancellation Reason *
            </Text>

            {/* ==================================
                REASON INPUT
            ================================== */}

            <TextInput
              style={
                styles.cancelReasonInput
              }
              value={
                cancellationReason
              }
              onChangeText={(
                text
              ) => {
                setCancellationReason(
                  text
                );

                if (
                  cancelError
                ) {
                  setCancelError(
                    ''
                  );
                }
              }}
              placeholder="Enter the reason for cancelling this fine"
              placeholderTextColor="#8C939F"
              multiline
              maxLength={
                500
              }
              textAlignVertical="top"
              editable={
                !actionLoading
              }
            />

            {/* ==================================
                CHARACTER COUNT
            ================================== */}

            <Text
              style={
                styles.cancelReasonCounter
              }
            >
              {
                cancellationReason.length
              }
              /500
            </Text>

            {/* ==================================
                CANCEL ERROR
            ================================== */}

            {cancelError !==
              '' && (
              <View
                style={
                  styles.cancelModalError
                }
              >
                <Text
                  style={
                    styles.cancelModalErrorText
                  }
                >
                  {
                    cancelError
                  }
                </Text>
              </View>
            )}

            {/* ==================================
                MODAL ACTIONS
            ================================== */}

            <View
              style={
                styles.cancelModalActions
              }
            >
              {/* GO BACK */}

              <TouchableOpacity
                style={
                  styles.cancelModalBackButton
                }
                onPress={
                  closeCancelModal
                }
                disabled={
                  actionLoading
                }
              >
                <Text
                  style={
                    styles.cancelModalBackText
                  }
                >
                  Go Back
                </Text>
              </TouchableOpacity>

              {/* CONFIRM CANCEL */}

              <TouchableOpacity
                style={[
                  styles.cancelModalConfirmButton,

                  actionLoading &&
                    styles.cancelModalButtonDisabled,
                ]}
                onPress={
                  performCancelFine
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.cancelModalConfirmText
                    }
                  >
                    Cancel Fine
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// INFORMATION ROW
// ==========================================

function InfoRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <View
      style={
        styles.infoRow
      }
    >
      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,

          emphasized &&
            styles.infoValueEmphasized,
        ]}
      >
        {value}
      </Text>
    </View>
  );
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
        'long',

      day:
        'numeric',

      year:
        'numeric',
    }
  );
}

// ==========================================
// FORMAT STATUS
// ==========================================

function formatStatus(
  status: string
) {
  switch (
    String(
      status || ''
    ).toUpperCase()
  ) {
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