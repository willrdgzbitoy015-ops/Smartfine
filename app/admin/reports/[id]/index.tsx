import { useEffect, useState } from "react";

import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";
import { AdminNavBadge } from "@/components/notification-badge";
import { FadeIn } from "@/components/motion";
import { SkeletonProfile } from "@/components/skeleton";

import LogoutModal from "@/components/logout-modal";
import WarningModal from "@/components/warningmodal";

import { styles } from "./report-detail.styles";

// ==========================================
// TYPES
// ==========================================

type PaymentDetail = {
  id: number;

  payment_reference: string | null;

  payment_method: string | null;

  payment_method_label: string | null;

  payment_status: string | null;

  payment_status_label: string | null;

  is_cashier_payment: boolean;

  amount_centavos: number;

  amount: number;

  reference_number: string | null;

  gateway_transaction_id: string | null;

  gateway_reference: string | null;

  student_id: number;

  student_number: string | null;

  student_username: string | null;

  student_first_name: string | null;

  student_middle_name: string | null;

  student_last_name: string | null;

  student_name: string | null;

  fine_id: number;

  fine_reference: string | null;

  fine_status: string | null;

  fine_issued_at: string | null;

  violation_code: string | null;

  violation_name: string | null;

  confirmed_by: number | null;

  confirmed_by_name: string | null;

  confirmed_by_username: string | null;

  confirmed_by_role: string | null;

  payment_notes: string | null;

  created_at: string | null;

  confirmed_at: string | null;

  paid_at: string | null;

  transaction_date: string | null;

  status_message: string | null;
};

type PaymentDetailResponse = {
  success: boolean;

  payment?: PaymentDetail;

  message?: string;
};

type NavItem = {
  label: string;

  route: string;
};

// ==========================================
// DETAILED PAYMENT REPORT
// ==========================================

export default function DetailedPaymentReport() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // ==========================================
  // PAYMENT ID
  // ==========================================

  const rawId = params.id;

  const paymentId = Array.isArray(rawId) ? rawId[0] : rawId;

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [payment, setPayment] = useState<PaymentDetail | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ==========================================
  // LOGOUT MODAL
  // ==========================================

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==========================================
  // WARNING MODAL
  // ==========================================

  const [showWarningModal, setShowWarningModal] = useState(false);

  const [warningTitle, setWarningTitle] = useState("");

  const [warningMessage, setWarningMessage] = useState("");

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: NavItem[] = [
    {
      label: "Dashboard",

      route: "/admin/dashboard",
    },

    {
      label: "Students",

      route: "/admin/students",
    },

    {
      label: "Fines",

      route: "/admin/fines",
    },

    {
      label: "QR Scanner",

      route: "/admin/qr-scanner",
    },

    {
      label: "Reports",

      route: "/admin/reports",
    },

    {
      label: "Settings",

      route: "/admin/settings",
    },

    {
      label: "Officers",

      route: "/admin/officers",
    },
  ];

  // ==========================================
  // LOAD PAYMENT DETAIL
  // ==========================================

  const loadPayment = async () => {
    if (!paymentId) {
      setError("Payment transaction ID is missing.");

      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      setError("");

      const response = await fetch(
        `${API_BASE}/api/reports/payments/${paymentId}`,
      );

      const data: PaymentDetailResponse = await response.json();

      console.log("Detailed payment report response:", data);

      if (!response.ok || !data.success || !data.payment) {
        setPayment(null);

        setError(data.message || "Failed to load payment transaction.");

        return;
      }

      setPayment(data.payment);
    } catch (error) {
      console.error("Detailed payment report error:", error);

      setPayment(null);

      setError("Could not connect to the SmartFine server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [paymentId]);

  // ==========================================
  // BACK TO REPORTS
  // ==========================================

  const handleBackToReports = () => {
    router.replace("/admin/reports" as any);
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleNavigation = (item: NavItem) => {
    router.push(item.route as any);
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
  // PERFORM LOGOUT
  // ==========================================

  const performLogout = async () => {
    try {
      setLogoutLoading(true);

      await logout();

      setShowLogoutModal(false);

      router.replace("/login" as any);
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
  // CONTENT
  // ==========================================

  const renderContent = () => {
    // ======================================
    // LOADING
    // ======================================

    if (loading) {
      return (
        <SkeletonProfile
          label="Loading transaction details"
          sections={2}
          style={styles.skeleton}
        />
      );
    }

    // ======================================
    // ERROR
    // ======================================

    if (error || !payment) {
      return (
        <View style={styles.centerState}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>

          <Text style={styles.errorTitle}>Unable to Load Transaction</Text>

          <Text style={styles.errorText}>
            {error || "Payment transaction not found."}
          </Text>

          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryButton} onPress={loadPayment}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backReportsOutlineButton}
              onPress={handleBackToReports}
            >
              <Text style={styles.backReportsOutlineText}>Back to Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ======================================
    // STATUS
    // ======================================

    const normalizedStatus = getNormalizedPaymentStatus(payment);

    const statusLabel = getStatusLabel(normalizedStatus);

    const isPaid = normalizedStatus === "PAID";

    const isPending = normalizedStatus === "PENDING";

    const isCancelled = normalizedStatus === "CANCELLED";

    const isFailed = normalizedStatus === "FAILED";

    // ======================================
    // STUDENT DISPLAY
    // ======================================

    const studentDisplay = payment.student_name || "Unknown Student";

    const studentNumber =
      payment.student_number || payment.student_username || "No Student ID";

    // ======================================
    // FINE DISPLAY
    // ======================================

    const fineDisplay = payment.fine_reference || `Fine #${payment.fine_id}`;

    const violationDisplay = payment.violation_name
      ? ` (${payment.violation_name})`
      : "";

    // ======================================
    // MESSAGE
    // ======================================

    const statusMessage =
      payment.status_message ||
      getFallbackStatusMessage(payment, normalizedStatus);

    return (
      <>
        {/* ==================================
              VOUCHER
          ================================== */}

        <View style={styles.voucherCard}>
          {/* ==================================
                VOUCHER HEADER
            ================================== */}

          <View style={styles.voucherHeader}>
            <Text style={styles.voucherTitle}>Transaction Voucher</Text>

            <View
              style={[
                styles.statusBadge,

                isPaid && styles.statusBadgePaid,

                isPending && styles.statusBadgePending,

                isCancelled && styles.statusBadgeCancelled,

                isFailed && styles.statusBadgeFailed,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,

                  isPaid && styles.statusTextPaid,

                  isPending && styles.statusTextPending,

                  isCancelled && styles.statusTextCancelled,

                  isFailed && styles.statusTextFailed,
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ==================================
                DETAILS GRID
            ================================== */}

          <View style={styles.detailsGrid}>
            {/* TRANSACTION ID */}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>TRANSACTION ID</Text>

              <Text style={styles.detailValueStrong}>
                {payment.payment_reference || `PAY-${payment.id}`}
              </Text>
            </View>

            {/* STUDENT */}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>STUDENT</Text>

              <Text style={styles.detailValueStrong}>{studentDisplay}</Text>

              <Text style={styles.detailSecondary}>ID: {studentNumber}</Text>
            </View>

            {/* AMOUNT */}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>PAYMENT AMOUNT</Text>

              <Text
                style={[
                  styles.amountValue,

                  isPaid ? styles.amountPaid : styles.amountDefault,
                ]}
              >
                {formatMoney(payment.amount)}
              </Text>
            </View>

            {/* PAYMENT METHOD */}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>PAYMENT METHOD</Text>

              <View
                style={
                  payment.is_cashier_payment
                    ? styles.cashierMethodBadge
                    : styles.onlineMethodBadge
                }
              >
                <Text
                  style={
                    payment.is_cashier_payment
                      ? styles.cashierMethodText
                      : styles.onlineMethodText
                  }
                >
                  {payment.payment_method_label ||
                    formatPaymentMethod(payment.payment_method)}
                </Text>
              </View>
            </View>

            {/* REFERENCE NUMBER */}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>REFERENCE NUMBER</Text>

              <Text style={styles.detailValueStrong}>
                {payment.reference_number || payment.payment_reference || "—"}
              </Text>
            </View>

            {/* DATE */}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>DATE & TIME</Text>

              <Text style={styles.detailValueStrong}>
                {formatDateTime(payment.transaction_date)}
              </Text>
            </View>

            {/* FINE REFERENCE */}

            <View style={[styles.detailItem, styles.fullWidthDetail]}>
              <Text style={styles.detailLabel}>FINE REFERENCE</Text>

              <Text style={styles.fineReferenceValue}>
                {fineDisplay}
                {violationDisplay}
              </Text>
            </View>

            {/* CASHIER CONFIRMED BY */}

            {payment.is_cashier_payment && payment.confirmed_by_name && (
              <View style={[styles.detailItem, styles.fullWidthDetail]}>
                <Text style={styles.detailLabel}>CONFIRMED BY</Text>

                <Text style={styles.detailValueStrong}>
                  {payment.confirmed_by_name}
                </Text>
              </View>
            )}

            {/* PAYMENT NOTES */}

            {payment.payment_notes && (
              <View style={[styles.detailItem, styles.fullWidthDetail]}>
                <Text style={styles.detailLabel}>PAYMENT NOTES</Text>

                <Text style={styles.notesText}>{payment.payment_notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* ==================================
                STATUS MESSAGE
            ================================== */}

          <View style={styles.statusMessageRow}>
            <View
              style={[
                styles.statusMessageIcon,

                isPaid && styles.statusMessageIconPaid,

                isPending && styles.statusMessageIconPending,

                isCancelled && styles.statusMessageIconCancelled,

                isFailed && styles.statusMessageIconFailed,
              ]}
            >
              <Text
                style={[
                  styles.statusMessageIconText,

                  isPaid && styles.statusMessageIconTextPaid,

                  isPending && styles.statusMessageIconTextPending,

                  isCancelled && styles.statusMessageIconTextCancelled,

                  isFailed && styles.statusMessageIconTextFailed,
                ]}
              >
                {isPaid ? "✓" : isPending ? "○" : "×"}
              </Text>
            </View>

            <Text style={styles.statusMessageText}>{statusMessage}</Text>
          </View>
        </View>

        {/* ==================================
              BACK BUTTON
          ================================== */}

        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={styles.backToReportsButton}
            onPress={handleBackToReports}
          >
            <Text style={styles.backToReportsButtonText}>Back to Reports</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

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
              source={require("../../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.navigation}>
            {navItems.map((item) => {
              const active = item.label === "Reports";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => handleNavigation(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.navIcon}>
                    {getMenuSymbol(item.label)}
                  </Text>

                  <Text style={styles.navText}>{item.label}</Text>
                  <AdminNavBadge label={item.label} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ==================================
              LOGOUT
          ================================== */}

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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
                const active = item.label === "Reports";

                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.mobileNavItem,

                      active && styles.mobileNavItemActive,
                    ]}
                    onPress={() => handleNavigation(item)}
                  >
                    <Text
                      style={[
                        styles.mobileNavText,

                        active && styles.mobileNavTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <AdminNavBadge label={item.label} variant="menu" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ==================================
              PAGE HEADER
          ================================== */}

          <View style={styles.pageHeader}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={handleBackToReports}
            >
              <Image
                source={require("../../../../assets/icons/back_icon.png")}
                style={styles.headerBackIcon}
                resizeMode="contain"
              />

              <Text style={styles.headerBackText}>Reports</Text>
            </TouchableOpacity>

            <Text style={styles.pageTitle}>Detailed Report</Text>

            <Text style={styles.pageSubtitle}>
              View complete payment transaction information
            </Text>
          </View>

          {/* The loaded page fades in after the placeholder. */}
          <FadeIn key={loading ? "loading" : "content"}>
            {renderContent()}
          </FadeIn>
        </ScrollView>
      </View>

      {/* ======================================
          LOGOUT MODAL
      ====================================== */}

      <LogoutModal
        visible={showLogoutModal}
        loading={logoutLoading}
        onCancel={handleCancelLogout}
        onConfirm={performLogout}
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
    </View>
  );
}

// ==========================================
// PAYMENT STATUS
// ==========================================

function getNormalizedPaymentStatus(payment: PaymentDetail) {
  if (payment.paid_at) {
    return "PAID";
  }

  const status = String(payment.payment_status || "PENDING")
    .trim()
    .toUpperCase();

  if (status === "PAID" || status === "COMPLETED" || status === "SUCCESS") {
    return "PAID";
  }

  if (status === "CANCELLED") {
    return "CANCELLED";
  }

  if (status === "FAILED") {
    return "FAILED";
  }

  return "PENDING";
}

// ==========================================
// STATUS LABEL
// ==========================================

function getStatusLabel(status: string) {
  switch (status) {
    case "PAID":
      return "Paid";

    case "CANCELLED":
      return "Cancelled";

    case "FAILED":
      return "Failed";

    default:
      return "Pending";
  }
}

// ==========================================
// FALLBACK STATUS MESSAGE
// ==========================================

function getFallbackStatusMessage(payment: PaymentDetail, status: string) {
  if (payment.is_cashier_payment) {
    if (status === "PAID") {
      return "This payment was received and confirmed at the cashier.";
    }

    if (status === "CANCELLED") {
      return "This cashier payment request was cancelled.";
    }

    return "Waiting for payment and confirmation at the cashier.";
  }

  if (status === "PAID") {
    return "This payment was completed successfully.";
  }

  if (status === "CANCELLED") {
    return "This payment transaction was cancelled.";
  }

  if (status === "FAILED") {
    return "This payment transaction was not completed successfully.";
  }

  return "This payment transaction is awaiting completion.";
}

// ==========================================
// PAYMENT METHOD
// ==========================================

function formatPaymentMethod(method: string | null | undefined) {
  if (!method) {
    return "Not specified";
  }

  const normalized = String(method).trim().toUpperCase();

  if (
    normalized === "CASHIER" ||
    normalized === "CASH" ||
    normalized === "PAY_AT_CASHIER"
  ) {
    return "Pay at Cashier";
  }

  if (normalized === "GCASH") {
    return "GCash";
  }

  return String(method)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

// ==========================================
// MONEY
// ==========================================

function formatMoney(amount: number | null | undefined) {
  return `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,

    maximumFractionDigits: 2,
  })}`;
}

// ==========================================
// DATE & TIME
// ==========================================

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "long",

    day: "numeric",

    year: "numeric",

    hour: "numeric",

    minute: "2-digit",

    hour12: true,
  });
}

// ==========================================
// SIDEBAR SYMBOLS
// ==========================================

function getMenuSymbol(label: string) {
  switch (label) {
    case "Dashboard":
      return "⌂";

    case "Students":
      return "◎";

    case "Fines":
      return "▤";

    case "QR Scanner":
      return "▦";

    case "Reports":
      return "▧";

    case "Settings":
      return "⚙";

    case "Officers":
      return "●";

    default:
      return "•";
  }
}
