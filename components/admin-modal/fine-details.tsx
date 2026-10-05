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

type Step =
  | "details"
  | "cancel"
  | "pay"
  | "refund"
  | "approveRefund"
  | "rejectRefund";

type RefundCode = "WRONG_FINE" | "DUPLICATE" | "OTHER";

type RefundRow = {
  id: number;
  refundReference: string;
  paymentId: number;
  amountCentavos: number;
  paymentMethod: "CASH" | "GCASH";
  reasonCode: RefundCode;
  reasonLabel: string;
  reason: string;
  status:
    | "REQUESTED"
    | "WITHDRAWN"
    | "REJECTED"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED";
  requestedByName: string | null;
  requestedByRole: string | null;
  requestedAt: string;
  reviewedByName: string | null;
  reviewNote: string | null;
  gatewayRefundId: string | null;
  failureReason: string | null;
  completedAt: string | null;
};

type RefundPayment = {
  paymentId: number;
  paymentReference: string;
  paymentMethod: "CASH" | "GCASH";
  amountCentavos: number;
  paidAt: string | null;
  refundable: boolean;
  notRefundableReason: string | null;
  refundableUntil: string | null;
};

type RefundInfo = {
  payment: RefundPayment | null;
  refunds: RefundRow[];
  gatewayConfigured: boolean;
};

const REFUND_REASONS: { code: RefundCode; label: string }[] = [
  { code: "WRONG_FINE", label: "Fine issued by mistake" },
  { code: "DUPLICATE", label: "Paid more than once" },
  { code: "OTHER", label: "Other reason" },
];

function pesos(centavos: number) {
  return money(Number(centavos) / 100);
}

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

  // Refunds of this fine's payment.
  const [refundInfo, setRefundInfo] = useState<RefundInfo | null>(null);
  const [refundCode, setRefundCode] = useState<RefundCode | null>(null);
  const [cashReturned, setCashReturned] = useState(false);
  // A refund that was sent but did not go through.
  const [refundProblem, setRefundProblem] = useState("");

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

  const loadRefunds = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/refunds/fine/${fineId}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setRefundInfo({
          payment: data.payment ?? null,
          refunds: Array.isArray(data.refunds) ? data.refunds : [],
          gatewayConfigured: Boolean(data.gatewayConfigured),
        });
      }
    } catch {
      // Refund details are optional; the fine itself still shows.
    }
  }, [fineId]);

  // A different fine starts from its details with fresh state.
  useEffect(() => {
    setFine(null);
    setNotices(null);
    setRefundInfo(null);
    setRefundProblem("");
    setStep("details");
    setReason("");
    setActionError("");
    setSuccess("");
    void loadFine(true);
    void loadRefunds();
  }, [loadFine, loadRefunds]);

  const finishAction = async (message: string) => {
    haptics.success();
    setStep("details");
    setReason("");
    setActionError("");
    setSuccess(message);
    await Promise.all([loadFine(false), loadRefunds()]);
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

  // ========================================
  // REFUNDS
  // ========================================

  const refundRequest = async (path: string, body: object) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Please sign in again.");

    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);

    // A refund PayMongo did not accept comes back saved as FAILED.
    if (data?.refund?.status === "FAILED") {
      return { failed: data.message || "The refund did not go through." };
    }

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || "Could not process the refund.");
    }

    return { message: String(data.message || "Refund updated.") };
  };

  const openRefundStep = (next: Step) => {
    setStep(next);
    setRefundCode(null);
    setReason("");
    setCashReturned(false);
    setActionError("");
  };

  // Shows the result: success above the details, a failure as a warning.
  const finishRefund = async (result: { message?: string; failed?: string }) => {
    if (result.failed) {
      // The saved FAILED refund explains itself in the details banner.
      haptics.error();
      setStep("details");
      setReason("");
      setActionError("");
      setSuccess("");
      setRefundProblem("");
      await Promise.all([loadFine(false), loadRefunds()]);
      onChanged();
      void refreshNotificationCounts();
      return;
    }

    setRefundProblem("");
    await finishAction(result.message || "Refund updated.");
  };

  const performRefund = () =>
    runLocked(async () => {
      const payment = refundInfo?.payment;
      if (!payment) return;

      if (!refundCode) {
        haptics.warning();
        setActionError("Choose why the payment is being refunded.");
        return;
      }

      if (reason.trim().length < 10) {
        haptics.warning();
        setActionError("Explain the refund in at least 10 characters.");
        return;
      }

      if (payment.paymentMethod === "CASH" && !cashReturned) {
        haptics.warning();
        setActionError("Confirm that you returned the cash to the student.");
        return;
      }

      setActionLoading(true);
      setActionError("");

      try {
        await finishRefund(
          await refundRequest("/api/refunds", {
            paymentId: payment.paymentId,
            reasonCode: refundCode,
            reason: reason.trim(),
            cashReturned,
          }),
        );
      } catch (error) {
        haptics.error();
        setActionError(connectionMessage(error, "Could not process the refund."));
      } finally {
        setActionLoading(false);
      }
    });

  const approveRefund = (refund: RefundRow) =>
    runLocked(async () => {
      if (refund.paymentMethod === "CASH" && !cashReturned) {
        haptics.warning();
        setActionError("Confirm that you returned the cash to the student.");
        return;
      }

      setActionLoading(true);
      setActionError("");

      try {
        await finishRefund(
          await refundRequest(`/api/refunds/${refund.id}/approve`, {
            cashReturned,
            note: reason.trim(),
          }),
        );
      } catch (error) {
        haptics.error();
        setActionError(connectionMessage(error, "Could not approve the refund."));
      } finally {
        setActionLoading(false);
      }
    });

  const rejectRefund = (refund: RefundRow) =>
    runLocked(async () => {
      if (reason.trim().length < 5) {
        haptics.warning();
        setActionError("Tell the student why the refund is declined (at least 5 characters).");
        return;
      }

      setActionLoading(true);
      setActionError("");

      try {
        await finishRefund(
          await refundRequest(`/api/refunds/${refund.id}/reject`, {
            note: reason.trim(),
          }),
        );
      } catch (error) {
        haptics.error();
        setActionError(connectionMessage(error, "Could not decline the refund."));
      } finally {
        setActionLoading(false);
      }
    });

  const checkRefund = (refund: RefundRow) =>
    runLocked(async () => {
      setActionLoading(true);

      try {
        await refundRequest(`/api/refunds/${refund.id}/refresh`, {});
        await Promise.all([loadFine(false), loadRefunds()]);
        onChanged();
      } catch (error) {
        setRefundProblem(connectionMessage(error, "Could not check the refund."));
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

  const refundPayment = refundInfo?.payment ?? null;
  const latestRefund = refundInfo?.refunds[0] ?? null;
  const completedRefund =
    refundInfo?.refunds.find((refund) => refund.status === "SUCCEEDED") ?? null;
  const pendingRefund = latestRefund?.status === "REQUESTED" ? latestRefund : null;
  const processingRefund = latestRefund?.status === "PROCESSING" ? latestRefund : null;
  const canRefund =
    Boolean(refundPayment?.refundable) &&
    !(refundPayment?.paymentMethod === "GCASH" && !refundInfo?.gatewayConfigured);

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

  if (step === "refund" || step === "approveRefund" || step === "rejectRefund") {
    const request = step === "refund" ? null : pendingRefund;
    const payment = refundPayment;

    if (!payment || (step !== "refund" && !request)) {
      setStep("details");
      return null;
    }

    const amount = request ? request.amountCentavos : payment.amountCentavos;
    const method = request ? request.paymentMethod : payment.paymentMethod;
    const rejecting = step === "rejectRefund";

    return (
      <FadeIn key={step} style={styles.viewContent} distance={8} duration={220}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.stepTitle}>
            {rejecting
              ? "Decline this refund request?"
              : request
                ? "Approve this refund?"
                : `Refund ${method === "GCASH" ? "the GCash" : "the cash"} payment?`}
          </Text>

          <View style={styles.payAmountBox}>
            <Text style={styles.payAmountLabel}>REFUND AMOUNT</Text>
            <Text style={[styles.payAmount, styles.refundAmount]}>{pesos(amount)}</Text>
          </View>

          {request && (
            <View style={[styles.banner, styles.bannerRefund]}>
              <Text style={[styles.bannerTitle, styles.bannerRefundTitle]}>
                {request.reasonLabel} · requested by {request.requestedByName || "the student"}
              </Text>
              <Text style={styles.bannerText}>{request.reason}</Text>
            </View>
          )}

          {!rejecting && (
            <Text style={styles.stepText}>
              {method === "GCASH"
                ? "PayMongo sends the money back to the student's GCash account. The fine is cancelled once PayMongo confirms the refund; if it fails, the fine stays Paid."
                : "Hand the cash back to the student first. Recording the refund cancels the fine."}
            </Text>
          )}

          {step === "refund" && (
            <>
              <Text style={styles.inputLabel}>Reason *</Text>
              <View style={styles.refundReasons}>
                {REFUND_REASONS.map((item) => {
                  const selected = refundCode === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[styles.filterChip, selected && styles.filterChipActive]}
                      onPress={() => {
                        haptics.selection();
                        setRefundCode(item.code);
                        if (actionError) setActionError("");
                      }}
                      disabled={actionLoading}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selected && styles.filterChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.inputLabel}>
            {rejecting
              ? "Reason for declining (sent to the student) *"
              : step === "refund"
                ? "Explanation *"
                : "Note (optional)"}
          </Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (actionError) setActionError("");
            }}
            placeholder={
              rejecting
                ? "For example: the officer's photo shows you at the gate."
                : step === "refund"
                  ? "Why is this payment being refunded?"
                  : "Anything to note about this refund"
            }
            placeholderTextColor="#8C939F"
            multiline
            maxLength={500}
            textAlignVertical="top"
            editable={!actionLoading}
          />
          <Text style={styles.counter}>{reason.length}/500</Text>

          {!rejecting && method === "CASH" && (
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => {
                haptics.selection();
                setCashReturned((current) => !current);
                if (actionError) setActionError("");
              }}
              disabled={actionLoading}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: cashReturned }}
            >
              <View style={[styles.checkBox, cashReturned && styles.checkBoxOn]}>
                {cashReturned && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>
                I returned {pesos(amount)} in cash to the student.
              </Text>
            </TouchableOpacity>
          )}

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
              rejecting ? styles.buttonCancel : styles.buttonEdit,
              actionLoading && styles.buttonDisabled,
            ]}
            onPress={() =>
              void (rejecting
                ? rejectRefund(request!)
                : request
                  ? approveRefund(request)
                  : performRefund())
            }
            disabled={actionLoading}
            accessibilityState={{ busy: actionLoading, disabled: actionLoading }}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {rejecting
                  ? "Decline Request"
                  : request
                    ? `Approve ${pesos(amount)} Refund`
                    : `Refund ${pesos(amount)}`}
              </Text>
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
          {pendingRefund && (
            <Text style={[styles.badge, styles.badgePending]}>Refund requested</Text>
          )}
          {processingRefund && (
            <Text style={[styles.badge, styles.badgeGcash]}>Refund processing</Text>
          )}
          {completedRefund && (
            <Text style={[styles.badge, styles.badgeRefunded]}>Refunded</Text>
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
                  ? "NEW PAYMENT NOTICE"
                  : "PAYMENT NOTICE READ"}
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

        {gcashReview && !completedRefund && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {fine.online_payment_notes}{" "}
              {canRefund
                ? "Use Refund Payment below to send the money back."
                : "Check this payment in the PayMongo dashboard and refund it if needed."}
            </Text>
          </View>
        )}

        {pendingRefund && (
          <View style={[styles.banner, styles.bannerRefund]}>
            <Text style={[styles.bannerTitle, styles.bannerRefundTitle]}>
              Refund requested · {pesos(pendingRefund.amountCentavos)}
            </Text>
            <Text style={styles.bannerText}>
              {pendingRefund.requestedByName || "The student"} asked for a refund
              ({pendingRefund.reasonLabel}) on {formatDay(pendingRefund.requestedAt)}:{" "}
              {pendingRefund.reason}
            </Text>
          </View>
        )}

        {processingRefund && (
          <View style={[styles.banner, styles.bannerGcash]}>
            <Text style={[styles.bannerTitle, styles.bannerGcashTitle]}>
              Refund processing with PayMongo
            </Text>
            <Text style={[styles.bannerText, styles.bannerGcashText]}>
              {pesos(processingRefund.amountCentavos)} is being sent back to the
              student's GCash account. The fine is cancelled once PayMongo
              confirms the refund.
            </Text>
          </View>
        )}

        {completedRefund && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              Refunded {pesos(completedRefund.amountCentavos)}
              {completedRefund.paymentMethod === "GCASH" ? " to GCash" : " in cash"}
              {completedRefund.completedAt ? ` on ${formatDay(completedRefund.completedAt)}` : ""}
              {completedRefund.reviewedByName ? ` by ${completedRefund.reviewedByName}` : ""}.
            </Text>
          </View>
        )}

        {!completedRefund && latestRefund?.status === "FAILED" && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              The last refund did not go through: {latestRefund.failureReason ||
                "PayMongo could not process it."} The fine is still Paid.
            </Text>
          </View>
        )}

        {!completedRefund && latestRefund?.status === "REJECTED" && (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Refund request declined</Text>
            <Text style={styles.bannerText}>
              {latestRefund.reviewNote || "No note was given."}
            </Text>
          </View>
        )}

        {!!refundProblem && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{refundProblem}</Text>
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
        ) : pendingRefund ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={() => openRefundStep("rejectRefund")}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Decline Refund</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonEdit,
                !canRefund && styles.buttonDisabled,
              ]}
              onPress={() => openRefundStep("approveRefund")}
              disabled={!canRefund}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canRefund }}
            >
              <Text style={styles.buttonText}>Review & Approve</Text>
            </TouchableOpacity>
            {!canRefund && (
              <Text style={styles.footerHint}>
                {refundPayment?.notRefundableReason ||
                  "GCash refunds need online payment to be set up."}
              </Text>
            )}
          </>
        ) : processingRefund ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, actionLoading && styles.buttonDisabled]}
            onPress={() => void checkRefund(processingRefund)}
            disabled={actionLoading}
            accessibilityRole="button"
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#173A73" />
            ) : (
              <Text style={styles.buttonSecondaryText}>Check Refund Status</Text>
            )}
          </TouchableOpacity>
        ) : canRefund && !completedRefund ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonEdit]}
              onPress={() => openRefundStep("refund")}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Refund Payment</Text>
            </TouchableOpacity>
            <Text style={styles.footerHint}>
              {isPaid
                ? "This fine has been paid. Refunding cancels the fine."
                : "This payment was not applied to the fine and can be refunded."}
            </Text>
          </>
        ) : (
          <Text style={styles.footerHint}>
            {completedRefund
              ? "This payment was refunded and the fine is cancelled."
              : isPaid
                ? refundPayment && refundPayment.notRefundableReason
                  ? `This fine has already been paid. ${refundPayment.notRefundableReason}`
                  : "This fine has already been paid."
                : "This fine has been cancelled."}
          </Text>
        )}
      </View>
    </FadeIn>
  );
}
