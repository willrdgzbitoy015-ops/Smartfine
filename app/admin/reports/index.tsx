import LogoutModal from "@/components/logout-modal";
import WarningModal from "@/components/warningmodal";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/hooks/use-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { styles } from "./reports.styles";
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
  payment_reference: string | null;
  payment_method: string | null;
  payment_status: string | null;
  amount_centavos: number;
  amount: number;
  student_id: number;
  student_number: string | null;
  student_name: string | null;
  fine_id: number;
  fine_reference: string | null;
  violation_name?: string | null;
  gateway_transaction_id: string | null;
  gateway_reference: string | null;
  confirmed_by?: number | null;
  confirmed_by_name?: string | null;
  payment_notes?: string | null;
  created_at: string | null;
  confirmed_at: string | null;
  paid_at: string | null;
  transaction_date: string | null;
};
type PaymentReportResponse = {
  success: boolean;
  summary: PaymentSummary;
  transactions: PaymentTransaction[];
  totalTransactions: number;
  message?: string;
};
// ==========================================
type ReportNotice = {
  id: number;
  title: string;
  message: string;
  paymentId: number;
  isRead: boolean;
  createdAt: string;
};
type PaymentDetail = PaymentTransaction & {
  payment_method_label?: string;
  payment_status_label?: string;
  reference_number?: string | null;
  status_message?: string;
  confirmed_by_name?: string | null;
};
// EMPTY SUMMARY
// ==========================================
const EMPTY_SUMMARY: PaymentSummary = {
  totalCollectedCentavos: 0,
  totalCollected: 0,
  pendingPaymentsCentavos: 0,
  pendingPayments: 0,
  todayPaymentCentavos: 0,
  todayPayment: 0,
  totalCollectedCount: 0,
  pendingPaymentCount: 0,
  todayPaymentCount: 0,
};
// ==========================================
// PAYMENT REPORTS
// ==========================================
export default function PaymentReports() {
  const router = useRouter();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
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
  // REPORT STATE
  // ==========================================
  const [summary, setSummary] = useState<PaymentSummary>(EMPTY_SUMMARY);
  const [notices, setNotices] = useState<ReportNotice[]>([]);
  const [noticeCount, setNoticeCount] = useState(0);
  const [noticeError, setNoticeError] = useState("");
  const [noticeBusy, setNoticeBusy] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailPayment, setDetailPayment] = useState<PaymentDetail | null>(
    null,
  );
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  // ==========================================
  // PAGE STATE
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestInFlight = useRef(false);
  // ==========================================
  // NAVIGATION
  // ==========================================
  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      route: "/admin/dashboard",
      icon: require("../../../assets/icons/dashboard.png"),
    },
    {
      label: "Students",
      route: "/admin/students",
      icon: require("../../../assets/icons/students.png"),
    },
    {
      label: "Fines",
      route: "/admin/fines",
      icon: require("../../../assets/icons/fines.png"),
    },
    {
      label: "QR Scanner",
      route: "/admin/qr-scanner",
      icon: require("../../../assets/icons/qr-codeWhite.png"),
    },
    {
      label: "Reports",
      route: "/admin/reports",
      icon: require("../../../assets/icons/reports.png"),
    },
    {
      label: "Settings",
      route: "/admin/settings",
      icon: require("../../../assets/icons/settings.png"),
    },
    {
      label: "Officers",
      route: "/admin/officers",
      icon: require("../../../assets/icons/officers.png"),
    },
  ];
  // ==========================================
  // LOAD PAYMENT REPORTS
  // ==========================================
  const loadReports = useCallback(async (isRefresh = false) => {
    if (requestInFlight.current) {
      return;
    }
    requestInFlight.current = true;
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      if (!isRefresh) {
        setError("");
      }
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Please sign in again.");
      const [response, activityResponse] = await Promise.all([
        fetch(`${API_BASE}/api/reports/payments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/reports/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (activityResponse.ok) {
        const activity = await activityResponse.json();
        if (activity.success) {
          setNotices(activity.notifications || []);
          setNoticeCount(activity.unreadCount || 0);
          setNoticeError("");
        } else setNoticeError(activity.message || "Could not load activity.");
      } else setNoticeError("Could not load payment activity.");
      const data: PaymentReportResponse = await response.json();
      console.log("Payment reports response:", data);
      // ======================================
      // FAILED
      // ======================================
      if (!response.ok || !data.success) {
        const message = data.message || "Failed to load payment reports.";
        if (isRefresh) {
          setWarningTitle("Refresh Failed");
          setWarningMessage(message);
          setShowWarningModal(true);
        } else {
          setError(message);
        }
        return;
      }
      // ======================================
      // SUMMARY
      // ======================================
      setSummary(data.summary || EMPTY_SUMMARY);
      // ======================================
      // TRANSACTIONS
      // ======================================
      setTransactions(
        Array.isArray(data.transactions) ? data.transactions : [],
      );
      setTotalTransactions(Number(data.totalTransactions || 0));
    } catch (error) {
      console.error("Payment reports connection error:", error);
      if (isRefresh) {
        setWarningTitle("Refresh Failed");
        setWarningMessage("Could not connect to the SmartFine server.");
        setShowWarningModal(true);
      } else {
        setError(
          error instanceof Error && error.message === "Please sign in again."
            ? error.message
            : "Could not connect to the SmartFine server.",
        );
      }
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    loadReports();
  }, [loadReports]);
  // ==========================================
  // OPEN TRANSACTION DETAIL
  // ==========================================
  const openPaymentDetail = async (paymentId: number) => {
    if (detailLoading) return;
    setDetailVisible(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailPayment(null);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch(
        `${API_BASE}/api/reports/payments/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (!response.ok || !data.success || !data.payment)
        throw new Error(data.message || "Could not load transaction details.");
      setDetailPayment(data.payment);
      // Only mark the matching report notification read after detail succeeds.
      const notice = notices.find(
        (item) => Number(item.paymentId) === paymentId && !item.isRead,
      );
      if (notice) {
        const readResponse = await fetch(
          `${API_BASE}/api/reports/notifications/${notice.id}/read`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (readResponse.ok) {
          setNotices((current) =>
            current.map((item) =>
              item.id === notice.id ? { ...item, isRead: true } : item,
            ),
          );
          setNoticeCount((count) => Math.max(0, count - 1));
        }
      }
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Could not load transaction details.",
      );
    } finally {
      setDetailLoading(false);
    }
  };
  const markAllRead = async () => {
    if (noticeBusy || !noticeCount) return;
    setNoticeBusy(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/api/reports/notifications/read-all`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Could not mark activity read.");
      setNotices((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
      setNoticeCount(0);
    } catch {
      setWarningTitle("Activity Unavailable");
      setWarningMessage("Could not mark activity as read. Please try again.");
      setShowWarningModal(true);
    } finally {
      setNoticeBusy(false);
    }
  };
  const handleTransactionPress = (payment: PaymentTransaction) => {
    if (payment.id) void openPaymentDetail(payment.id);
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
              source={require("../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>
          {/* NAVIGATION */}
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadReports(true)}
              colors={["#173A73"]}
              tintColor="#173A73"
            />
          }
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
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {/* ==================================
              HEADER
          ================================== */}
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>Payment Reports</Text>
              <Text style={styles.pageSubtitle}>
                View payment collections and transaction history
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => loadReports(true)}
              disabled={loading || refreshing}
            >
              {refreshing ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#173A73" />
                  <Text style={[styles.refreshButtonText, { marginLeft: 8 }]}>
                    Refreshing...
                  </Text>
                </View>
              ) : (
                <Text style={styles.refreshButtonText}>Refresh</Text>
              )}
            </TouchableOpacity>
          </View>
          {/* ==================================
              LOADING
          ================================== */}
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#173A73" />
              <Text style={styles.stateText}>Loading payment reports...</Text>
            </View>
          ) : error ? (
            // ==================================
            // ERROR
            // ==================================
            <View style={styles.centerState}>
              <Text style={styles.errorTitle}>Unable to Load Reports</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadReports()}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ==================================
                  SUMMARY CARDS
              ================================== */}
              <View style={styles.noticeCard}>
                <View style={styles.noticeHeading}>
                  <View style={styles.noticeHeadingText}>
                    <Text style={styles.noticeTitle}>
                      Recent payment activity
                    </Text>
                    <Text style={styles.noticeSubtitle}>
                      Confirmed cash collections appear here.
                    </Text>
                  </View>
                  {noticeCount > 0 && (
                    <Text style={styles.noticeBadge}>{noticeCount} new</Text>
                  )}
                  {noticeCount > 0 && (
                    <TouchableOpacity
                      onPress={markAllRead}
                      disabled={noticeBusy}
                    >
                      <Text style={styles.noticeAction}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {noticeError ? (
                  <Text style={styles.noticeEmpty}>{noticeError}</Text>
                ) : notices.length === 0 ? (
                  <Text style={styles.noticeEmpty}>
                    No confirmed payments yet.
                  </Text>
                ) : (
                  notices.map((notice) => (
                    <TouchableOpacity
                      key={notice.id}
                      onPress={() => openPaymentDetail(notice.paymentId)}
                      disabled={noticeBusy}
                      style={[
                        styles.noticeRow,
                        !notice.isRead && styles.noticeUnread,
                      ]}
                    >
                      <View style={styles.noticeBody}>
                        <Text style={styles.noticeItemTitle}>
                          {notice.title}
                        </Text>
                        <Text style={styles.noticeMessage}>
                          {notice.message}
                        </Text>
                        <Text style={styles.noticeDate}>
                          {formatDate(notice.createdAt)}
                        </Text>
                      </View>
                      <Text
                        style={
                          notice.isRead
                            ? styles.noticeReadLabel
                            : styles.noticeNewLabel
                        }
                      >
                        {notice.isRead ? "READ" : "NEW"}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
              <View style={styles.summaryRow}>
                {/* TOTAL COLLECTED */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Collected</Text>
                  <Text
                    style={styles.summaryAmountRed}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatMoney(summary.totalCollected)}
                  </Text>
                  <Text style={styles.summaryCount}>
                    {summary.totalCollectedCount}{" "}
                    {summary.totalCollectedCount === 1 ? "payment" : "payments"}
                  </Text>
                </View>
                {/* PENDING */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Pending Payments</Text>
                  <Text
                    style={styles.summaryAmountRed}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatMoney(summary.pendingPayments)}
                  </Text>
                  <Text style={styles.summaryCount}>
                    {summary.pendingPaymentCount} pending
                  </Text>
                </View>
                {/* TODAY */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Today&apos;s Payment</Text>
                  <Text
                    style={styles.summaryAmountGreen}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatMoney(summary.todayPayment)}
                  </Text>
                  <Text style={styles.summaryCount}>
                    {summary.todayPaymentCount} today
                  </Text>
                </View>
              </View>
              {/* ==================================
                  TRANSACTIONS CARD
              ================================== */}
              <View style={styles.transactionsCard}>
                {/* CARD TITLE */}
                <View style={styles.transactionsTitleRow}>
                  <View>
                    <Text style={styles.transactionsTitle}>
                      Payment Transactions
                    </Text>
                    <Text style={styles.transactionsSubtitle}>
                      Complete SmartFine payment transaction history
                    </Text>
                  </View>
                  <Text style={styles.transactionCount}>
                    {totalTransactions}{" "}
                    {totalTransactions === 1 ? "Transaction" : "Transactions"}
                  </Text>
                </View>
                {/* ==================================
                    TABLE
                ================================== */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator
                  contentContainerStyle={styles.horizontalTableContent}
                >
                  <View style={styles.table}>
                    {/* TABLE HEADER */}
                    <View style={styles.tableHeader}>
                      <Text
                        style={[styles.headerCell, styles.transactionColumn]}
                      >
                        Transaction ID
                      </Text>
                      <Text style={[styles.headerCell, styles.methodColumn]}>
                        Payment Method
                      </Text>
                      <Text style={[styles.headerCell, styles.studentColumn]}>
                        Student Name
                      </Text>
                      <Text style={[styles.headerCell, styles.amountColumn]}>
                        Amount
                      </Text>
                      <Text style={[styles.headerCell, styles.fineColumn]}>
                        Fine Reference
                      </Text>
                      <Text style={[styles.headerCell, styles.dateColumn]}>
                        Date
                      </Text>
                    </View>
                    {/* ==================================
                        EMPTY STATE
                    ================================== */}
                    {transactions.length === 0 ? (
                      <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                          <Text style={styles.emptyIconText}>₱</Text>
                        </View>
                        <Text style={styles.emptyTitle}>
                          No payment transactions found
                        </Text>
                        <Text style={styles.emptyText}>
                          Payment transactions will appear here once students
                          begin making payments.
                        </Text>
                      </View>
                    ) : (
                      // ==================================
                      // TRANSACTIONS
                      // ==================================
                      transactions.map((payment) => {
                        // ==================================
                        // DISPLAY STATUS
                        // ==================================
                        const displayStatus = payment.paid_at
                          ? "PAID"
                          : payment.payment_status;
                        const reportNotice = notices.find(
                          (item) =>
                            Number(item.paymentId) === Number(payment.id),
                        );
                        return (
                          <TouchableOpacity
                            key={payment.id}
                            style={[
                              styles.transactionRow,
                              reportNotice &&
                                !reportNotice.isRead &&
                                styles.transactionUnread,
                            ]}
                            activeOpacity={0.7}
                            onPress={() => handleTransactionPress(payment)}
                          >
                            {/* ==================================
                                  TRANSACTION
                              ================================== */}
                            <View style={styles.transactionColumn}>
                              <Text
                                style={styles.transactionReference}
                                numberOfLines={1}
                              >
                                {payment.payment_reference ||
                                  `PAY-${payment.id}`}
                              </Text>
                              {payment.gateway_transaction_id && (
                                <Text
                                  style={styles.gatewayText}
                                  numberOfLines={1}
                                >
                                  {payment.gateway_transaction_id}
                                </Text>
                              )}
                              {reportNotice && (
                                <Text
                                  style={
                                    reportNotice.isRead
                                      ? styles.rowReadLabel
                                      : styles.rowNewLabel
                                  }
                                >
                                  {reportNotice.isRead ? "READ" : "NEW"}
                                </Text>
                              )}
                            </View>
                            {/* ==================================
                                  METHOD
                              ================================== */}
                            <View style={styles.methodColumn}>
                              <Text style={styles.bodyCell} numberOfLines={1}>
                                {formatPaymentMethod(payment.payment_method)}
                              </Text>
                              <View
                                style={[
                                  styles.paymentStatusBadge,
                                  getPaymentStatusBadgeStyle(displayStatus),
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.paymentStatusText,
                                    getPaymentStatusTextStyle(displayStatus),
                                  ]}
                                >
                                  {formatPaymentStatus(displayStatus)}
                                </Text>
                              </View>
                            </View>
                            {/* ==================================
                                  STUDENT
                              ================================== */}
                            <View style={styles.studentColumn}>
                              <Text
                                style={styles.studentName}
                                numberOfLines={1}
                              >
                                {payment.student_name || "Unknown Student"}
                              </Text>
                              <Text
                                style={styles.studentNumber}
                                numberOfLines={1}
                              >
                                {payment.student_number || "No Student ID"}
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
                              {formatMoney(payment.amount)}
                            </Text>
                            {/* ==================================
                                  FINE
                              ================================== */}
                            <View style={styles.fineColumn}>
                              <Text
                                style={[styles.bodyCell, styles.fineReference]}
                                numberOfLines={1}
                              >
                                {payment.fine_reference ||
                                  `Fine #${payment.fine_id}`}
                              </Text>
                              {payment.violation_name && (
                                <Text
                                  style={styles.gatewayText}
                                  numberOfLines={1}
                                >
                                  {payment.violation_name}
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
                              numberOfLines={1}
                            >
                              {formatDate(payment.transaction_date)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </ScrollView>
                {/* ==================================
                    ROW HELP
                ================================== */}
                {transactions.length > 0 && (
                  <Text
                    style={{
                      color: "#8C939F",
                      fontSize: 9,
                      textAlign: "center",
                      paddingTop: 2,
                      paddingBottom: 14,
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
      {/* ======================================
          LOGOUT MODAL
      ====================================== */}
      <Modal
        visible={detailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>Transaction details</Text>
                <Text style={styles.detailSubtitle}>
                  Payment record and confirmation
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailVisible(false)}
                style={styles.detailCloseButton}
                accessibilityLabel="Close transaction details"
              >
                <Text style={styles.detailCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {detailLoading ? (
              <View style={styles.detailState}>
                <ActivityIndicator color="#173A73" />
                <Text style={styles.detailHint}>Loading transaction...</Text>
              </View>
            ) : detailError ? (
              <View style={styles.detailState}>
                <Text style={styles.errorTitle}>
                  Unable to load transaction
                </Text>
                <Text style={styles.detailHint}>{detailError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => setDetailVisible(false)}
                >
                  <Text style={styles.retryButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : detailPayment ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailContent}
              >
                <View style={styles.detailStatusRow}>
                  <Text style={styles.detailAmount}>
                    {formatMoney(detailPayment.amount)}
                  </Text>
                  <Text
                    style={[
                      styles.detailStatus,
                      detailPayment.paid_at
                        ? styles.detailPaid
                        : styles.detailPending,
                    ]}
                  >
                    {detailPayment.payment_status_label ||
                      formatPaymentStatus(detailPayment.payment_status)}
                  </Text>
                </View>
                <Text style={styles.detailHint}>
                  {detailPayment.status_message || "Payment transaction"}
                </Text>
                <View style={styles.detailDivider} />
                <View style={styles.detailGrid}>
                  <View style={styles.detailField}>
                    <Text style={styles.detailLabel}>TRANSACTION ID</Text>
                    <Text style={styles.detailValue} selectable>
                      {detailPayment.payment_reference ||
                        `PAY-${detailPayment.id}`}
                    </Text>
                  </View>
                  <View style={styles.detailField}>
                    <Text style={styles.detailLabel}>STUDENT</Text>
                    <Text style={styles.detailValue}>
                      {detailPayment.student_name || "Unknown Student"}
                    </Text>
                    <Text style={styles.detailHint}>
                      {detailPayment.student_number || "No Student ID"}
                    </Text>
                  </View>
                  <View style={styles.detailField}>
                    <Text style={styles.detailLabel}>PAYMENT METHOD</Text>
                    <Text style={styles.detailValue}>
                      {detailPayment.payment_method_label ||
                        formatPaymentMethod(detailPayment.payment_method)}
                    </Text>
                  </View>
                  <View style={styles.detailField}>
                    <Text style={styles.detailLabel}>REFERENCE NUMBER</Text>
                    <Text style={styles.detailValue} selectable>
                      {detailPayment.reference_number ||
                        detailPayment.payment_reference ||
                        "—"}
                    </Text>
                  </View>
                  <View style={styles.detailField}>
                    <Text style={styles.detailLabel}>FINE</Text>
                    <Text style={styles.detailValue}>
                      {detailPayment.fine_reference ||
                        `Fine #${detailPayment.fine_id}`}
                    </Text>
                    {!!detailPayment.violation_name && (
                      <Text style={styles.detailHint}>
                        {detailPayment.violation_name}
                      </Text>
                    )}
                  </View>
                  <View style={styles.detailField}>
                    <Text style={styles.detailLabel}>DATE & TIME</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(detailPayment.transaction_date)}
                    </Text>
                  </View>
                  {!!detailPayment.confirmed_by_name && (
                    <View style={styles.detailField}>
                      <Text style={styles.detailLabel}>CONFIRMED BY</Text>
                      <Text style={styles.detailValue}>
                        {detailPayment.confirmed_by_name}
                      </Text>
                    </View>
                  )}
                  {!!detailPayment.payment_notes && (
                    <View style={styles.detailField}>
                      <Text style={styles.detailLabel}>NOTES</Text>
                      <Text style={styles.detailValue}>
                        {detailPayment.payment_notes}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
// MONEY
// ==========================================
function formatMoney(amount: number | null | undefined) {
  return `₱ ${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
// ==========================================
// DATE
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
// ==========================================
// PAYMENT METHOD
// ==========================================
function formatPaymentMethod(method: string | null | undefined) {
  if (!method) {
    return "Not specified";
  }
  const normalized = String(method).trim().toUpperCase();
  // ========================================
  // CASHIER
  // ========================================
  if (
    normalized === "CASHIER" ||
    normalized === "CASH" ||
    normalized === "PAY_AT_CASHIER"
  ) {
    return "Pay at Cashier";
  }
  // ========================================
  // GCASH
  // ========================================
  if (normalized === "GCASH") {
    return "GCash";
  }
  return String(method)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
// ==========================================
// PAYMENT STATUS
// ==========================================
function formatPaymentStatus(status: string | null | undefined) {
  if (!status) {
    return "Pending";
  }
  const normalized = String(status).trim().toUpperCase();
  if (
    normalized === "PAID" ||
    normalized === "COMPLETED" ||
    normalized === "SUCCESS"
  ) {
    return "Paid";
  }
  if (normalized === "CANCELLED") {
    return "Cancelled";
  }
  if (normalized === "FAILED") {
    return "Failed";
  }
  return "Pending";
}
// ==========================================
// STATUS BADGE
// ==========================================
function getPaymentStatusBadgeStyle(status: string | null | undefined) {
  const normalized = String(status || "PENDING").toUpperCase();
  if (
    normalized === "PAID" ||
    normalized === "COMPLETED" ||
    normalized === "SUCCESS"
  ) {
    return {
      backgroundColor: "#E5F7E8",
    };
  }
  if (normalized === "CANCELLED") {
    return {
      backgroundColor: "#ECEFF4",
    };
  }
  if (normalized === "FAILED") {
    return {
      backgroundColor: "#FFEAEA",
    };
  }
  return {
    backgroundColor: "#FFF4D6",
  };
}
// ==========================================
// STATUS TEXT
// ==========================================
function getPaymentStatusTextStyle(status: string | null | undefined) {
  const normalized = String(status || "PENDING").toUpperCase();
  if (
    normalized === "PAID" ||
    normalized === "COMPLETED" ||
    normalized === "SUCCESS"
  ) {
    return {
      color: "#2E9D43",
    };
  }
  if (normalized === "CANCELLED") {
    return {
      color: "#606775",
    };
  }
  if (normalized === "FAILED") {
    return {
      color: "#D32F2F",
    };
  }
  return {
    color: "#A16A00",
  };
}
