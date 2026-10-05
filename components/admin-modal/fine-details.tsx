import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { FadeIn } from "@/components/motion";
import { Skeleton, SkeletonGroup } from "@/components/skeleton";
import { API_BASE } from "@/constants/api";
import { useActionLock } from "@/hooks/use-action-lock";
import {
  formatNotificationTime,
  refreshNotificationCounts,
} from "@/hooks/use-notification-counts";
import { haptics } from "@/utils/haptics";
import { styles } from "./admin-modal.styles";

type Fine = {
  id: number;
  fine_reference: string;
  student_number: string | null;
  student_name: string;
  grade_level: string | null;
  section: string | null;
  violation_code: string | null;
  violation_name: string;
  amount: number;
  remarks: string | null;
  officer_name: string;
  issued_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cash_request_reference?: string | null;
  cash_request_status?: string | null;
  online_payment_reference?: string | null;
  online_payment_status?: string | null;
  online_payment_notes?: string | null;
  status: string;
};

type NoticeState = { wasUnread: boolean } | null;

type Step = "details" | "cancel" | "pay";

function money(amount: number) {
  return `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Date-only values stay as dates; timestamps are UTC and shown in PH time.
function formatDay(value: string | null | undefined) {
  if (!value) return "—";
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
      "en-US",
      { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" },
    );
  }
  return formatNotificationTime(text);
}

function connectionMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  return error.message === "Network request failed"
    ? "Could not connect to the SmartFine server."
    : error.message;
}

function Field({
  label,
  value,
  hint,
  emphasized = false,
}: {
  label: string;
  value: string;
  hint?: string | null;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, emphasized && styles.valueEmphasized]}>
        {value}
      </Text>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

// Fine record and its Admin actions, shown inside AdminModal.
export default function AdminFineDetails({
  fineId,
  onChanged,
  onNoticesRead,
  onEdit,
}: {
  fineId: number;
  onChanged: () => void;
  onNoticesRead: () => void;
  onEdit: (fineId: number) => void;
}) {
  const [fine, setFine] = useState<Fine | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notices, setNotices] = useState<{
    FINE: NoticeState;
    PAYMENT: NoticeState;
  } | null>(null);
  const [step, setStep] = useState<Step>("details");
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  // Cancelling and recording cash run once per tap, even on a double tap.
  const runLocked = useActionLock();
  const [success, setSuccess] = useState("");

  // Keeps loadFine tied to the fine ID, not to the parent's callback identity.
  const onNoticesReadRef = useRef(onNoticesRead);
  useEffect(() => {
    onNoticesReadRef.current = onNoticesRead;
  });

  const loadFine = useCallback(
    async (markNotices: boolean) => {
      setLoading(true);
      setLoadError("");

      try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch(`${API_BASE}/api/fines/${fineId}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "ngrok-skip-browser-warning": "true",
          },
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !data.fine) {
          throw new Error(data?.message || "Failed to load fine information.");
        }

        setFine(data.fine);

        // Notices are read only after the fine itself has loaded.
        if (markNotices && token) {
          const read = await fetch(
            `${API_BASE}/api/admin/notifications/fine/${fineId}/read`,
            {
              method: "PATCH",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
                "ngrok-skip-browser-warning": "true",
              },
            },
          );
          const result = await read.json().catch(() => null);

          if (read.ok && result?.success) {
            setNotices(result.notices);
            onNoticesReadRef.current();
            void refreshNotificationCounts();
          }
        }
      } catch (error) {
        setLoadError(
          connectionMessage(error, "Could not connect to the SmartFine server."),
        );
      } finally {
        setLoading(false);
      }
    },
    [fineId],
  );

  // A different fine starts from its details with fresh state.
  useEffect(() => {
    setFine(null);
    setNotices(null);
    setStep("details");
    setReason("");
    setActionError("");
    setSuccess("");
    void loadFine(true);
  }, [loadFine]);

  const finishAction = async (message: string) => {
    haptics.success();
    setStep("details");
    setReason("");
    setActionError("");
    setSuccess(message);
    await loadFine(false);
    onChanged();
    void refreshNotificationCounts();
  };

  const performCancel = () =>
    runLocked(async () => {
      const trimmed = reason.trim();

      if (trimmed.length < 3) {
        haptics.warning();
        setActionError("Please enter a cancellation reason.");
        return;
      }

      setActionLoading(true);
      setActionError("");

      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Please sign in again to cancel this fine.");

        const response = await fetch(`${API_BASE}/api/fines/${fineId}/cancel`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ cancellationReason: trimmed }),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Failed to cancel fine.");
        }

        await finishAction(
          `${fine?.fine_reference ?? "The fine"} was cancelled. Any pending cashier request was cancelled with it.`,
        );
      } catch (error) {
        haptics.error();
        setActionError(connectionMessage(error, "Failed to cancel fine."));
      } finally {
        setActionLoading(false);
      }
    });

  const performPayment = () =>
    runLocked(async () => {
      setActionLoading(true);
      setActionError("");

      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Please sign in again to record this payment.");

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
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Could not record the cash payment.");
        }

        await finishAction(
          `${fine?.fine_reference ?? "The fine"} was paid in cash. The transaction is saved in Payment Reports.`,
        );
      } catch (error) {
        haptics.error();
        setActionError(
          connectionMessage(error, "Could not record the cash payment."),
        );
      } finally {
        setActionLoading(false);
      }
    });

  // Placeholder in the shape of the fine: amount, status, then fields.
  if (loading && !fine) {
    return (
      <SkeletonGroup label="Loading fine information" style={styles.content}>
        <View style={styles.statusRow}>
          <Skeleton width={130} height={30} />
          <Skeleton width={70} height={24} radius={12} />
        </View>
        <Skeleton width="60%" height={11} style={styles.skeletonGap} />
        <View style={styles.divider} />
        <View style={styles.grid}>
          {Array.from({ length: 6 }, (_, index) => (
            <View key={index} style={styles.field}>
              <Skeleton width="35%" height={9} />
              <Skeleton width="72%" height={13} style={styles.skeletonGap} />
            </View>
          ))}
        </View>
      </SkeletonGroup>
    );
  }

  if (!fine) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>Unable to load this fine</Text>
        <Text style={styles.centerHint}>{loadError}</Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => void loadFine(true)}
        >
          <Text style={styles.linkText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = String(fine.status || "").toUpperCase();
  const isUnpaid = status === "UNPAID";
  const isPaid = status === "PAID";
  const isCancelled = status === "CANCELLED";
  const cashStatus = String(fine.cash_request_status || "").toUpperCase();
  // Cash is only awaited while the fine itself is still unpaid.
  const cashPending = isUnpaid && cashStatus === "PENDING";
  const cashCancelled = isCancelled && cashStatus === "CANCELLED";
  const onlineStatus = String(fine.online_payment_status || "").toUpperCase();
  // The student opened a GCash checkout that PayMongo has not confirmed yet.
  const gcashPending = isUnpaid && onlineStatus === "PENDING";
  const paidByGcash = isPaid && onlineStatus === "SUCCESS";
  const gcashReview = String(fine.online_payment_notes || "").startsWith("Needs review");

  // Each step (details, cancel, pay) fades in when it opens.
  if (step === "cancel") {
    return (
      <FadeIn key="cancel" style={styles.viewContent} distance={8} duration={220}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.stepTitle}>Cancel {fine.fine_reference}?</Text>
          <Text style={styles.stepText}>
            The fine stays in SmartFine but is marked cancelled.
            {cashPending
              ? " The student's pending cashier request is cancelled with it."
              : ""}{" "}
            This cannot be undone.
          </Text>
          <Text style={styles.inputLabel}>Cancellation Reason *</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (actionError) setActionError("");
            }}
            placeholder="Enter the reason for cancelling this fine"
            placeholderTextColor="#8C939F"
            multiline
            maxLength={500}
            textAlignVertical="top"
            editable={!actionLoading}
          />
          <Text style={styles.counter}>{reason.length}/500</Text>
          {!!actionError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{actionError}</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => {
              setStep("details");
              setActionError("");
            }}
            disabled={actionLoading}
          >
            <Text style={styles.buttonSecondaryText}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonCancel,
              actionLoading && styles.buttonDisabled,
            ]}
            onPress={performCancel}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Cancel Fine</Text>
            )}
          </TouchableOpacity>
        </View>
      </FadeIn>
    );
  }

  if (step === "pay") {
    return (
      <FadeIn key="pay" style={styles.viewContent} distance={8} duration={220}>
        <ScrollView style={styles.body} contentContainerStyle={styles.content}>
          <View style={styles.payIcon}>
            <Text style={styles.payIconText}>₱</Text>
          </View>
          <Text style={[styles.stepTitle, { textAlign: "center" }]}>
            Confirm Cash Received?
          </Text>
          <Text style={[styles.stepText, { textAlign: "center" }]}>
            Have you received cash for{" "}
            <Text style={styles.stepStrong}>{fine.fine_reference}</Text> from{" "}
            {fine.student_name}? Confirming saves the payment and marks the fine
            as paid.
          </Text>
          <View style={styles.payAmountBox}>
            <Text style={styles.payAmountLabel}>AMOUNT</Text>
            <Text style={styles.payAmount}>{money(fine.amount)}</Text>
          </View>
          {!!actionError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{actionError}</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => {
              setStep("details");
              setActionError("");
            }}
            disabled={actionLoading}
          >
            <Text style={styles.buttonSecondaryText}>Not Yet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonPay,
              actionLoading && styles.buttonDisabled,
            ]}
            onPress={performPayment}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Confirm Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </FadeIn>
    );
  }

  const statusMessage = cashPending
    ? "The student asked to pay at the cashier. Record the payment only after you receive the cash."
    : isUnpaid
      ? "Waiting for payment."
      : isPaid
        ? `Paid ${formatDay(fine.paid_at)}${paidByGcash ? " with GCash" : ""}.`
        : `Cancelled ${formatDay(fine.cancelled_at)}.`;

  return (
    <FadeIn key="details" style={styles.viewContent} distance={8} duration={220}>
      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        {!!success && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        <View style={styles.statusRow}>
          <Text style={styles.amount}>{money(fine.amount)}</Text>
          <Text
            style={[
              styles.badge,
              isPaid
                ? styles.badgePaid
                : isCancelled
                  ? styles.badgeCancelled
                  : styles.badgeUnpaid,
            ]}
          >
            {isPaid ? "Paid" : isCancelled ? "Cancelled" : "Unpaid"}
          </Text>
          {cashPending && (
            <Text style={[styles.badge, styles.badgePending]}>
              Cash requested
            </Text>
          )}
          {gcashPending && (
            <Text style={[styles.badge, styles.badgeGcash]}>
              GCash in progress
            </Text>
          )}
        </View>
        <Text style={styles.hint}>{statusMessage}</Text>

        {!!notices && (notices.FINE || notices.PAYMENT) && (
          <View style={styles.noticeChips}>
            {notices.FINE && (
              <Text
                style={
                  notices.FINE.wasUnread
                    ? styles.noticeChipNew
                    : styles.noticeChipRead
                }
              >
                {notices.FINE.wasUnread ? "NEW FINE NOTICE" : "FINE NOTICE READ"}
              </Text>
            )}
            {notices.PAYMENT && (
              <Text
                style={
                  notices.PAYMENT.wasUnread
                    ? styles.noticeChipNew
                    : styles.noticeChipRead
                }
              >
                {notices.PAYMENT.wasUnread
                  ? "NEW CASH REQUEST"
                  : "CASH REQUEST READ"}
              </Text>
            )}
          </View>
        )}

        {cashPending && (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Cashier payment requested</Text>
            <Text style={styles.bannerText}>
              The student has requested to pay in person. This fine stays
              Unpaid until you receive the cash and select Record Cash Payment.
            </Text>
          </View>
        )}

        {gcashPending && (
          <View style={[styles.banner, styles.bannerGcash]}>
            <Text style={[styles.bannerTitle, styles.bannerGcashTitle]}>
              GCash payment in progress
            </Text>
            <Text style={[styles.bannerText, styles.bannerGcashText]}>
              The student opened a GCash checkout. This fine stays Unpaid
              until PayMongo confirms the payment. Recording a cash payment
              first checks with PayMongo and closes that checkout if it was
              not paid.
            </Text>
          </View>
        )}

        {gcashReview && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {fine.online_payment_notes} Check this payment in the PayMongo
              dashboard and refund it if needed.
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.grid}>
          <Field
            label="STUDENT"
            value={fine.student_name}
            hint={fine.student_number || "No Student ID"}
          />
          {!!(fine.grade_level || fine.section) && (
            <Field
              label="GRADE / SECTION"
              value={[fine.grade_level, fine.section].filter(Boolean).join(" - ")}
            />
          )}
          <Field
            label="VIOLATION"
            value={fine.violation_name}
            hint={fine.violation_code}
          />
          <Field label="DATE ISSUED" value={formatDay(fine.issued_at)} />
          <Field label="ISSUED BY" value={fine.officer_name || "Unknown"} />
          <Field label="NOTES" value={fine.remarks || "No notes provided."} />
          {cashPending && (
            <Field
              label="CASHIER REQUEST"
              value="Pending — cash has not yet been recorded"
              hint={fine.cash_request_reference}
            />
          )}
          {cashCancelled && (
            <Field
              label="CASHIER REQUEST"
              value="Cancelled with this fine — no cash to collect"
              hint={fine.cash_request_reference}
            />
          )}
          {isPaid && (
            <Field label="DATE PAID" value={formatDay(fine.paid_at)} />
          )}
          {paidByGcash && (
            <Field
              label="PAID WITH"
              value="GCash (PayMongo)"
              hint={fine.online_payment_reference}
            />
          )}
          {isCancelled && (
            <>
              <Field
                label="DATE CANCELLED"
                value={formatDay(fine.cancelled_at)}
              />
              <Field
                label="CANCELLATION REASON"
                value={
                  fine.cancellation_reason || "No cancellation reason provided."
                }
              />
            </>
          )}
        </View>

        {!!loadError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isUnpaid ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={() => setStep("cancel")}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Cancel Fine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonEdit,
                cashPending && styles.buttonDisabled,
              ]}
              onPress={() => onEdit(fine.id)}
              disabled={cashPending}
              accessibilityRole="button"
              accessibilityState={{ disabled: cashPending }}
            >
              <Text style={styles.buttonText}>Edit Fine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPay]}
              onPress={() => setStep("pay")}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Record Cash Payment</Text>
            </TouchableOpacity>
            {cashPending && (
              <Text style={styles.footerHint}>
                Editing is locked while a cashier request is pending.
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.footerHint}>
            {isPaid
              ? "This fine has already been paid."
              : "This fine has been cancelled."}
          </Text>
        )}
      </View>
    </FadeIn>
  );
}
