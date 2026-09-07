import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";

import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";

import { styles } from "./fine-profile.styles";

// ==========================================
// TYPES
// ==========================================

type Fine = {
  id: number;

  fine_reference: string;

  student_id: number;

  student_number: string | null;

  student_username: string | null;

  student_first_name: string | null;

  student_middle_name: string | null;

  student_last_name: string | null;

  student_name: string;

  grade_level: string | null;

  section: string | null;

  violation_type_id: number;

  violation_code: string | null;

  violation_name: string;

  violation_description: string | null;

  amount_centavos: number;

  amount: number;

  remarks: string | null;

  officer_id: number | null;

  officer_name: string;

  issued_at: string;

  paid_at: string | null;

  cancelled_at: string | null;

  cancelled_by: number | null;

  cancellation_reason: string | null;

  created_at: string | null;

  updated_at: string | null;

  status: string;
};

type NavItem = {
  label: string;

  route: string;

  icon: any;
};

// ==========================================
// FINE DETAILED VIEW
// ==========================================

export default function FineDetailedView() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const isCompact = width < 600;

  // ==========================================
  // ROUTE ID
  // ==========================================

  const rawId = params.id;

  const fineId = Array.isArray(rawId) ? rawId[0] : rawId;

  // ==========================================
  // FINE DATA
  // ==========================================

  const [fine, setFine] = useState<Fine | null>(null);

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // LOGOUT MODAL
  // ==========================================

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==========================================
  // SUCCESS MODAL
  // ==========================================

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successTitle, setSuccessTitle] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // WARNING MODAL
  // ==========================================

  const [showWarningModal, setShowWarningModal] = useState(false);

  const [warningTitle, setWarningTitle] = useState("");

  const [warningMessage, setWarningMessage] = useState("");

  // ==========================================
  // MARK PAID MODAL
  // ==========================================

  const [markPaidModalVisible, setMarkPaidModalVisible] = useState(false);

  // ==========================================
  // CANCEL FINE MODAL
  // ==========================================

  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const [cancellationReason, setCancellationReason] = useState("");

  const [cancelError, setCancelError] = useState("");

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: NavItem[] = [
    {
      label: "Dashboard",

      route: "/admin/dashboard",

      icon: require("../../../../assets/icons/dashboard.png"),
    },

    {
      label: "Students",

      route: "/admin/students",

      icon: require("../../../../assets/icons/students.png"),
    },

    {
      label: "Fines",

      route: "/admin/fines",

      icon: require("../../../../assets/icons/fines.png"),
    },

    {
      label: "QR Scanner",

      route: "/admin/qr-scanner",

      icon: require("../../../../assets/icons/qr-codeWhite.png"),
    },

    {
      label: "Reports",

      route: "/admin/reports",

      icon: require("../../../../assets/icons/reports.png"),
    },

    {
      label: "Settings",

      route: "/admin/settings",

      icon: require("../../../../assets/icons/settings.png"),
    },

    {
      label: "Officers",

      route: "/admin/officers",

      icon: require("../../../../assets/icons/officers.png"),
    },
  ];

  // ==========================================
  // LOAD FINE
  // ==========================================

  const loadFine = async () => {
    if (!fineId) {
      return;
    }

    try {
      setLoading(true);

      setErrorMessage("");

      const response = await fetch(`${API_BASE}/api/fines/${fineId}`);

      const data = await response.json();

      if (!response.ok || !data.success || !data.fine) {
        setErrorMessage(data.message || "Failed to load fine information.");

        return;
      }

      setFine(data.fine);
    } catch (error) {
      console.error("Load fine details error:", error);

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFine();
  }, [fineId]);

  // ==========================================
  // BACK
  // ==========================================

  const handleBack = () => {
    router.replace("/admin/fines" as any);
  };

  // ==========================================
  // EDIT FINE
  // ==========================================

  const handleEdit = () => {
    if (!fineId) {
      return;
    }

    router.push(`/admin/fines/${fineId}/edit` as any);
  };

  // ==========================================
  // CANCEL FINE
  // ==========================================

  const handleCancelFine = () => {
    if (!fine) {
      return;
    }

    const status = String(fine.status || "").toUpperCase();

    if (status !== "UNPAID") {
      return;
    }

    setCancellationReason("");

    setCancelError("");

    setCancelModalVisible(true);
  };

  // ==========================================
  // CLOSE CANCEL FINE MODAL
  // ==========================================

  const closeCancelModal = () => {
    if (actionLoading) {
      return;
    }

    setCancelModalVisible(false);

    setCancellationReason("");

    setCancelError("");
  };

  // ==========================================
  // PERFORM CANCEL FINE
  // ==========================================

  const performCancelFine = async () => {
    if (!fineId || !fine) {
      return;
    }

    const reason = cancellationReason.trim();

    if (reason.length < 3) {
      setCancelError("Please enter a cancellation reason.");

      return;
    }

    if (reason.length > 500) {
      setCancelError("Cancellation reason must not exceed 500 characters.");

      return;
    }

    try {
      setActionLoading(true);

      setCancelError("");

      setErrorMessage("");

      const storedUserId = await AsyncStorage.getItem("userId");

      const parsedUserId = Number(storedUserId);

      const cancelledBy =
        Number.isInteger(parsedUserId) && parsedUserId > 0
          ? parsedUserId
          : null;

      const response = await fetch(`${API_BASE}/api/fines/${fineId}/cancel`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          cancellationReason: reason,

          cancelledBy,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setCancelError(data.message || "Failed to cancel fine.");

        return;
      }

      // ======================================
      // CLOSE CANCELLATION FORM
      // ======================================

      setCancelModalVisible(false);

      setCancellationReason("");

      setCancelError("");

      // ======================================
      // REFRESH FINE
      // ======================================

      await loadFine();

      // ======================================
      // SUCCESS MODAL
      // ======================================

      setSuccessTitle("Fine Cancelled");

      setSuccessMessage(
        `${fine.fine_reference} has been cancelled successfully.`,
      );

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Cancel fine error:", error);

      setCancelError("Could not connect to the SmartFine server.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // OPEN MARK AS PAID MODAL
  // ==========================================

  const handleMarkPaid = () => {
    if (!fine) {
      return;
    }

    if (String(fine.status).toUpperCase() !== "UNPAID") {
      return;
    }

    setMarkPaidModalVisible(true);
  };

  // ==========================================
  // CLOSE MARK AS PAID MODAL
  // ==========================================

  const closeMarkPaidModal = () => {
    if (actionLoading) {
      return;
    }

    setMarkPaidModalVisible(false);
  };

  // ==========================================
  // PERFORM MARK PAID
  // ==========================================

  const performMarkPaid = async () => {
    if (!fineId || !fine) {
      return;
    }

    try {
      setActionLoading(true);

      setErrorMessage("");

      const response = await fetch(
        `${API_BASE}/api/fines/${fineId}/mark-paid`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({}),
        },
      );

      const data = await response.json();

      // ======================================
      // FAILED
      // ======================================

      if (!response.ok || !data.success) {
        setMarkPaidModalVisible(false);

        setWarningTitle("Mark as Paid");

        setWarningMessage(data.message || "Failed to mark fine as paid.");

        setShowWarningModal(true);

        return;
      }

      // ======================================
      // CLOSE CONFIRMATION
      // ======================================

      setMarkPaidModalVisible(false);

      // ======================================
      // REFRESH FINE
      // ======================================

      await loadFine();

      // ======================================
      // SUCCESS
      // ======================================

      setSuccessTitle("Fine Paid");

      setSuccessMessage(
        `${fine.fine_reference} has been marked as paid successfully.`,
      );

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Mark fine paid error:", error);

      setMarkPaidModalVisible(false);

      setWarningTitle("Connection Error");

      setWarningMessage("Could not connect to the SmartFine server.");

      setShowWarningModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // OPEN LOGOUT
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
  // PERFORM LOGOUT
  // ==========================================

  const performLogout = async () => {
    try {
      setLogoutLoading(true);

      await logout();

      setShowLogoutModal(false);

      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);

      setShowLogoutModal(false);

      setWarningTitle("Logout Error");

      setWarningMessage("Could not log out. Please try again.");

      setShowWarningModal(true);
    } finally {
      setLogoutLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#173A73" />

        <Text style={styles.loadingText}>Loading fine information...</Text>
      </View>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (errorMessage && !fine) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorStateText}>{errorMessage}</Text>

        <TouchableOpacity style={styles.retryButton} onPress={loadFine}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backErrorButton} onPress={handleBack}>
          <Text style={styles.backErrorText}>Back to Fines</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!fine) {
    return null;
  }

  // ==========================================
  // STATUS
  // ==========================================

  const normalizedStatus = String(fine.status || "").toUpperCase();

  const isUnpaid = normalizedStatus === "UNPAID";

  const isPaid = normalizedStatus === "PAID";

  const isCancelled = normalizedStatus === "CANCELLED";

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
          {/* LOGO */}

          <View style={styles.logoArea}>
            <Image
              source={require("../../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          {/* NAVIGATION */}

          <View style={styles.navigation}>
            {navItems.map((item) => {
              const active = item.label === "Fines";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.navIconContainer}>
                    <Image
                      source={item.icon}
                      style={styles.navImageIcon}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={styles.navText}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* LOGOUT */}

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
          MAIN
      ====================================== */}

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,

            isCompact && styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ==================================
              BACK / PAGE TITLE
          ================================== */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to Fines"
          >
            <Image
              source={require("../../../../assets/icons/back_icon.png")}
              style={styles.backIconImage}
              resizeMode="contain"
            />

            <Text
              style={[styles.backText, isCompact && styles.backTextCompact]}
              numberOfLines={1}
            >
              Fine Detailed View
            </Text>
          </TouchableOpacity>

          {/* ==================================
              MOBILE NAV
          ================================== */}

          {!isTablet && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileNav}
            >
              {navItems.map((item) => {
                const active = item.label === "Fines";

                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.mobileNavItem,

                      active && styles.mobileNavItemActive,
                    ]}
                    onPress={() => router.push(item.route as any)}
                  >
                    <Text
                      style={[
                        styles.mobileNavText,

                        active && styles.mobileNavTextActive,
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
              DETAILS CARD
          ================================== */}

          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Fine Information #{fine.fine_reference}
              </Text>

              <View
                style={[
                  styles.statusBadge,

                  isPaid && styles.statusBadgePaid,

                  isUnpaid && styles.statusBadgeUnpaid,

                  isCancelled && styles.statusBadgeCancelled,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,

                    isPaid && styles.statusTextPaid,

                    isUnpaid && styles.statusTextUnpaid,

                    isCancelled && styles.statusTextCancelled,
                  ]}
                >
                  {formatStatus(fine.status)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.informationArea}>
              <InfoRow
                label="Student"
                value={`${fine.student_name} (${
                  fine.student_number || "No Student ID"
                })`}
              />

              {(fine.grade_level || fine.section) && (
                <InfoRow
                  label="Grade / Section"
                  value={[fine.grade_level, fine.section]
                    .filter(Boolean)
                    .join(" - ")}
                />
              )}

              <InfoRow label="Violation Type" value={fine.violation_name} />

              <InfoRow
                label="Amount"
                value={formatMoney(fine.amount)}
                emphasized
              />

              <InfoRow label="Date Issued" value={formatDate(fine.issued_at)} />

              <InfoRow
                label="Issued By"
                value={fine.officer_name || "Unknown"}
              />

              <InfoRow
                label="Notes / Description"
                value={fine.remarks || "No notes provided."}
              />

              {isPaid && fine.paid_at && (
                <InfoRow label="Date Paid" value={formatDate(fine.paid_at)} />
              )}

              {isCancelled && (
                <>
                  <InfoRow
                    label="Date Cancelled"
                    value={formatDate(fine.cancelled_at)}
                  />

                  <InfoRow
                    label="Cancellation Reason"
                    value={
                      fine.cancellation_reason ||
                      "No cancellation reason provided."
                    }
                  />
                </>
              )}
            </View>
          </View>

          {/* ==================================
              ACTION ERROR
          ================================== */}

          {errorMessage !== "" && (
            <View style={styles.actionError}>
              <Text style={styles.actionErrorText}>{errorMessage}</Text>
            </View>
          )}

          {/* ==================================
              ACTIONS
          ================================== */}

          <View style={styles.actionRow}>
            {/* CANCEL FINE */}

            <TouchableOpacity
              style={[
                styles.cancelFineButton,

                !isUnpaid && styles.disabledButton,
              ]}
              onPress={handleCancelFine}
              disabled={!isUnpaid || actionLoading}
            >
              <Text style={styles.cancelFineText}>Cancel Fine</Text>
            </TouchableOpacity>

            {/* EDIT FINE */}

            <TouchableOpacity
              style={[styles.editButton, !isUnpaid && styles.disabledButton]}
              onPress={handleEdit}
              disabled={!isUnpaid || actionLoading}
            >
              <Text style={styles.editButtonText}>Edit Fine</Text>
            </TouchableOpacity>

            {/* MARK PAID */}

            <TouchableOpacity
              style={[styles.paidButton, !isUnpaid && styles.disabledButton]}
              onPress={handleMarkPaid}
              disabled={!isUnpaid || actionLoading}
            >
              <Text style={styles.paidButtonText}>Mark as Paid</Text>
            </TouchableOpacity>
          </View>

          {!isUnpaid && (
            <Text style={styles.completedHint}>
              {isPaid
                ? "This fine has already been paid."
                : "This fine has been cancelled."}
            </Text>
          )}
        </ScrollView>
      </View>

      {/* ======================================
          CANCEL FINE MODAL
      ====================================== */}

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModalCard}>
            <Text style={styles.cancelModalTitle}>Cancel Fine?</Text>

            <Text style={styles.cancelModalMessage}>
              You are about to cancel{" "}
              <Text style={styles.cancelModalFineReference}>
                {fine.fine_reference}
              </Text>
              . This will keep the fine record in SmartFine but mark it as
              cancelled.
            </Text>

            <Text style={styles.cancelReasonLabel}>Cancellation Reason *</Text>

            <TextInput
              style={styles.cancelReasonInput}
              value={cancellationReason}
              onChangeText={(text) => {
                setCancellationReason(text);

                if (cancelError) {
                  setCancelError("");
                }
              }}
              placeholder="Enter the reason for cancelling this fine"
              placeholderTextColor="#8C939F"
              multiline
              maxLength={500}
              textAlignVertical="top"
              editable={!actionLoading}
            />

            <Text style={styles.cancelReasonCounter}>
              {cancellationReason.length}
              /500
            </Text>

            {cancelError !== "" && (
              <View style={styles.cancelModalError}>
                <Text style={styles.cancelModalErrorText}>{cancelError}</Text>
              </View>
            )}

            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={styles.cancelModalBackButton}
                onPress={closeCancelModal}
                disabled={actionLoading}
              >
                <Text style={styles.cancelModalBackText}>Go Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelModalConfirmButton,

                  actionLoading && styles.cancelModalButtonDisabled,
                ]}
                onPress={performCancelFine}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.cancelModalConfirmText}>Cancel Fine</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================
          MARK AS PAID CONFIRMATION MODAL
      ====================================== */}

      <Modal
        visible={markPaidModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeMarkPaidModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paidModalCard}>
            {/* ICON */}

            <View style={styles.paidModalIcon}>
              <Text style={styles.paidModalIconText}>₱</Text>
            </View>

            {/* TITLE */}

            <Text style={styles.paidModalTitle}>Mark as Paid?</Text>

            {/* MESSAGE */}

            <Text style={styles.paidModalMessage}>
              Are you sure you want to mark{" "}
              <Text style={styles.paidModalFineReference}>
                {fine.fine_reference}
              </Text>{" "}
              as paid?
            </Text>

            {/* AMOUNT */}

            <View style={styles.paidModalAmountBox}>
              <Text style={styles.paidModalAmountLabel}>Amount</Text>

              <Text style={styles.paidModalAmount}>
                {formatMoney(fine.amount)}
              </Text>
            </View>

            {/* BUTTONS */}

            <View style={styles.paidModalActions}>
              <TouchableOpacity
                style={styles.paidModalCancelButton}
                onPress={closeMarkPaidModal}
                disabled={actionLoading}
              >
                <Text style={styles.paidModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paidModalConfirmButton,

                  actionLoading && styles.paidModalButtonDisabled,
                ]}
                onPress={performMarkPaid}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.paidModalConfirmText}>Mark as Paid</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================
          SUCCESS MODAL
      ====================================== */}

      <SuccessModal
        visible={showSuccessModal}
        title={successTitle}
        message={successMessage}
        buttonText="OK"
        onClose={() => {
          setShowSuccessModal(false);
        }}
      />

      {/* ======================================
          WARNING MODAL
      ====================================== */}

      <WarningModal
        visible={showWarningModal}
        title={warningTitle}
        message={warningMessage}
        buttonText="OK"
        onClose={() => {
          setShowWarningModal(false);
        }}
      />

      {/* ======================================
          LOGOUT MODAL
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
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text
        style={[styles.infoValue, emphasized && styles.infoValueEmphasized]}
      >
        {value}
      </Text>
    </View>
  );
}

// ==========================================
// FORMAT MONEY
// ==========================================

function formatMoney(amount: number) {
  return `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,

    maximumFractionDigits: 2,
  })}`;
}

// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",

    day: "numeric",

    year: "numeric",
  });
}

// ==========================================
// FORMAT STATUS
// ==========================================

function formatStatus(status: string) {
  switch (String(status || "").toUpperCase()) {
    case "PAID":
      return "Paid";

    case "CANCELLED":
      return "Cancelled";

    case "UNPAID":
      return "Unpaid";

    default:
      return status;
  }
}
