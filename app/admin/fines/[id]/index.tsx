import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/hooks/use-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { styles } from "./fine-profile.styles";
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
export default function FineDetailedView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isCompact = width < 600;
  const rawId = params.id;
  const fineId = Array.isArray(rawId) ? rawId[0] : rawId;
  const [fine, setFine] = useState<Fine | null>(null);
  const [fineUnreadCount, setFineUnreadCount] = useState(0);
  const [paymentUnreadCount, setPaymentUnreadCount] = useState(0);
  const unreadCount = fineUnreadCount + paymentUnreadCount;
  const [notificationStatus, setNotificationStatus] = useState<
    "NEW" | "READ" | null
  >(null);
  const [paymentNotificationStatus, setPaymentNotificationStatus] = useState<"NEW" | "READ" | null>(null);
  const [cashRequestPending, setCashRequestPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningTitle, setWarningTitle] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [markPaidModalVisible, setMarkPaidModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelError, setCancelError] = useState("");
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
  useEffect(() => {
    let mounted = true;
    const loadCount = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const counts = await Promise.all(["FINE", "PAYMENT"].map(async (type) => {
          const response = await fetch(
            `${API_BASE}/api/admin/notifications/unread-count?type=${type}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          const count = Number(data.unreadCount);
          if (!data.success || !Number.isSafeInteger(count) || count < 0) {
            throw new Error("Invalid notification count.");
          }
          return count;
        }));
        if (mounted) {
          setFineUnreadCount(counts[0]);
          setPaymentUnreadCount(counts[1]);
        }
      } catch (error) {
        console.error("Fine detail notification count error:", error);
      }
    };
    loadCount();
    const interval = setInterval(loadCount, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  const markFineNotificationRead = async (openedFineId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      let offset = 0;
      while (true) {
        const response = await fetch(
          `${API_BASE}/api/admin/notifications?limit=100&offset=${offset}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.success || !Array.isArray(data.notifications)) {
          throw new Error("Invalid notification response.");
        }
        const item = data.notifications.find(
          (row: { fineId: number }) => Number(row.fineId) === openedFineId,
        );
        if (item) {
          if (item.isRead) {
            setNotificationStatus("READ");
            setFineUnreadCount(Number(data.unreadCount));
            return;
          }
          setNotificationStatus("NEW");
          const readResponse = await fetch(
            `${API_BASE}/api/admin/notifications/${item.id}/read`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (!readResponse.ok) {
            throw new Error(`HTTP ${readResponse.status}`);
          }
          const result = await readResponse.json();
          if (!result.success) {
            throw new Error("Could not mark notification read.");
          }
          setNotificationStatus("READ");
          const count = Number(result.unreadCount);
          if (Number.isSafeInteger(count) && count >= 0) {
            setFineUnreadCount(count);
          }
          return;
        }
        if (!data.hasMore) return;
        const next = Number(data.nextOffset);
        if (!Number.isSafeInteger(next) || next <= offset) {
          throw new Error("Invalid notification page.");
        }
        offset = next;
      }
    } catch (error) {
      console.error("Mark fine notification read error:", error);
    }
  };
  const markPaymentNotificationsRead = async (openedFineId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      let offset = 0;
      let found = false;
      while (true) {
        const response = await fetch(
          `${API_BASE}/api/admin/notifications?type=PAYMENT&limit=100&offset=${offset}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.success || !Array.isArray(data.notifications)) {
          throw new Error("Invalid payment notifications response.");
        }
        for (const item of data.notifications) {
          if (Number(item.fineId) !== openedFineId) continue;
          found = true;
          if (!item.isRead) {
            setPaymentNotificationStatus("NEW");
            const readResponse = await fetch(
              `${API_BASE}/api/admin/notifications/${item.id}/read?type=PAYMENT`,
              { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
            );
            if (!readResponse.ok) throw new Error(`HTTP ${readResponse.status}`);
            const result = await readResponse.json();
            if (!result.success) throw new Error("Could not mark cash request read.");
            const count = Number(result.unreadCount);
            if (Number.isSafeInteger(count) && count >= 0) setPaymentUnreadCount(count);
          }
        }
        if (!data.hasMore) break;
        const next = Number(data.nextOffset);
        if (!Number.isSafeInteger(next) || next <= offset) throw new Error("Invalid notification page.");
        offset = next;
      }
      if (found) setPaymentNotificationStatus("READ");
    } catch (error) {
      console.error("Mark cash request notification read error:", error);
    }
  };
  const loadPendingCashRequest = async (openedFineId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const response = await fetch(`${API_BASE}/api/payments/cash-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.success || !Array.isArray(data.payments)) throw new Error("Invalid cash requests response.");
      setCashRequestPending(data.payments.some((item: { fineId: number }) => Number(item.fineId) === openedFineId));
    } catch (error) {
      console.error("Load cash request error:", error);
    }
  };
  const loadFine = async () => {
    if (!fineId) return;
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
      void markFineNotificationRead(Number(data.fine.id));
      void markPaymentNotificationsRead(Number(data.fine.id));
      void loadPendingCashRequest(Number(data.fine.id));
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
  const handleBack = () => {
    router.replace("/admin/fines" as any);
  };
  const handleEdit = () => {
    if (!fineId) return;
    router.push(`/admin/fines/${fineId}/edit` as any);
  };
  const handleCancelFine = () => {
    if (!fine) return;
    if (String(fine.status || "").toUpperCase() !== "UNPAID") {
      return;
    }
    setCancellationReason("");
    setCancelError("");
    setCancelModalVisible(true);
  };
  const closeCancelModal = () => {
    if (actionLoading) return;
    setCancelModalVisible(false);
    setCancellationReason("");
    setCancelError("");
  };
  const performCancelFine = async () => {
    if (!fineId || !fine) return;
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
      setCancelModalVisible(false);
      setCancellationReason("");
      setCancelError("");
      await loadFine();
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
  const handleMarkPaid = () => {
    if (!fine) return;
    if (String(fine.status).toUpperCase() !== "UNPAID") {
      return;
    }
    setMarkPaidModalVisible(true);
  };
  const closeMarkPaidModal = () => {
    if (actionLoading) return;
    setMarkPaidModalVisible(false);
  };
  const performMarkPaid = async () => {
    if (!fineId || !fine) return;
    try {
      setActionLoading(true);
      setErrorMessage("");
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Please sign in again to record this payment.");
      }
      const response = await fetch(
        `${API_BASE}/api/payments/cash-collections/${fineId}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({}),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not record the cash payment.");
      }
      setMarkPaidModalVisible(false);
      await loadFine();
      setSuccessTitle("Cash Payment Recorded");
      setSuccessMessage(
        `${fine.fine_reference} was paid in cash. The transaction is saved in Payment Reports.`,
      );
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Record cash payment error:", error);
      setMarkPaidModalVisible(false);
      setWarningTitle("Payment Not Recorded");
      setWarningMessage(
        error instanceof Error
          ? error.message
          : "Could not record the cash payment.",
      );
      setShowWarningModal(true);
    } finally {
      setActionLoading(false);
    }
  };
  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  const handleCancelLogout = () => {
    if (logoutLoading) return;
    setShowLogoutModal(false);
  };
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
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#173A73" />
        <Text style={styles.loadingText}>Loading fine information...</Text>
      </View>
    );
  }
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
  if (!fine) return null;
  const normalizedStatus = String(fine.status || "").toUpperCase();
  const isUnpaid = normalizedStatus === "UNPAID";
  const isPaid = normalizedStatus === "PAID";
  const isCancelled = normalizedStatus === "CANCELLED";
  return (
    <View style={styles.screen}>
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
                  {item.label === "Fines" && unreadCount > 0 && (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isCompact && styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
        >
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
                    {item.label === "Fines" && unreadCount > 0 && (
                      <View style={styles.mobileNavBadge}>
                        <Text style={styles.navBadgeText}>
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          <View style={styles.detailsCard}>
            {cashRequestPending && (
              <View style={styles.cashRequestBanner}>
                <Text style={styles.cashRequestBannerTitle}>Cashier payment requested</Text>
                <Text style={styles.cashRequestBannerText}>
                  The student has requested to pay in person. This fine stays Unpaid until you receive the cash and select Record Cash Payment.
                </Text>
              </View>
            )}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Fine Information #{fine.fine_reference}
                {notificationStatus && (
                  <Text
                    style={
                      notificationStatus === "NEW"
                        ? styles.notificationNew
                        : styles.notificationRead
                    }
                  >
                    {"\n"}
                    {notificationStatus === "NEW"
                      ? "NEW NOTIFICATION"
                      : "NOTIFICATION READ"}
                  </Text>
                )}
                {paymentNotificationStatus && (
                  <Text style={paymentNotificationStatus === "NEW" ? styles.notificationNew : styles.notificationRead}>
                    {"\n"}CASH REQUEST {paymentNotificationStatus}
                  </Text>
                )}
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
              {cashRequestPending && (
                <InfoRow label="Cashier Request" value="Pending — cash has not yet been recorded" />
              )}
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
          {errorMessage !== "" && (
            <View style={styles.actionError}>
              <Text style={styles.actionErrorText}>{errorMessage}</Text>
            </View>
          )}
          <View style={styles.actionRow}>
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
            <TouchableOpacity
              style={[styles.editButton, !isUnpaid && styles.disabledButton]}
              onPress={handleEdit}
              disabled={!isUnpaid || actionLoading}
            >
              <Text style={styles.editButtonText}>Edit Fine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paidButton, !isUnpaid && styles.disabledButton]}
              onPress={handleMarkPaid}
              disabled={!isUnpaid || actionLoading}
            >
              <Text style={styles.paidButtonText}>Record Cash Payment</Text>
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
              {cancellationReason.length}/500
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
      <Modal
        visible={markPaidModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeMarkPaidModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paidModalCard}>
            <View style={styles.paidModalIcon}>
              <Text style={styles.paidModalIconText}>₱</Text>
            </View>
            <Text style={styles.paidModalTitle}>Confirm Cash Received?</Text>
            <Text style={styles.paidModalMessage}>
              Have you received cash for{" "}
              <Text style={styles.paidModalFineReference}>
                {fine.fine_reference}
              </Text>{" "}
              from the student? Confirming will save the payment and mark the
              fine as paid.
            </Text>
            <View style={styles.paidModalAmountBox}>
              <Text style={styles.paidModalAmountLabel}>Amount</Text>
              <Text style={styles.paidModalAmount}>
                {formatMoney(fine.amount)}
              </Text>
            </View>
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
                  <Text style={styles.paidModalConfirmText}>
                    Confirm Payment
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <SuccessModal
        visible={showSuccessModal}
        title={successTitle}
        message={successMessage}
        buttonText="OK"
        onClose={() => setShowSuccessModal(false)}
      />
      <WarningModal
        visible={showWarningModal}
        title={warningTitle}
        message={warningMessage}
        buttonText="OK"
        onClose={() => setShowWarningModal(false)}
      />
      <LogoutModal
        visible={showLogoutModal}
        loading={logoutLoading}
        onCancel={handleCancelLogout}
        onConfirm={performLogout}
      />
    </View>
  );
}
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
function formatMoney(amount: number) {
  return `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
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
