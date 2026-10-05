import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { FadeIn, PopIn, useRetainedValue } from "@/components/motion";
import { SuccessCheck } from "@/components/success-check";
import { API_BASE } from "@/constants/api";
import { useActionLock } from "@/hooks/use-action-lock";
import { refreshNotificationCounts } from "@/hooks/use-notification-counts";
import { haptics } from "@/utils/haptics";

import { styles } from "./student-refunds.styles";

// ==========================================
// TYPES
// ==========================================

export type RefundStatus =
  | "REQUESTED"
  | "WITHDRAWN"
  | "REJECTED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED";

export type Refund = {
  id: number;
  refundReference: string;
  paymentId: number;
  fineId: number;
  fineReference: string;
  amountCentavos: number;
  paymentMethod: "CASH" | "GCASH";
  reasonCode: "WRONG_FINE" | "DUPLICATE" | "OTHER";
  reasonLabel: string;
  reason: string;
  status: RefundStatus;
  requestedAt: string;
  reviewNote: string | null;
  failureReason: string | null;
  completedAt: string | null;
};

export type RefundablePayment = {
  paymentId: number;
  paymentReference: string;
  fineId: number;
  paymentMethod: "CASH" | "GCASH";
  amountCentavos: number;
  paidAt: string | null;
  refundable: boolean;
  notRefundableReason: string | null;
  refundableUntil: string | null;
};

type RefundFine = {
  id: number;
  fineReference: string;
  violationName: string;
  amountCentavos: number;
};

const REASONS: { code: Refund["reasonCode"]; label: string; hint: string }[] = [
  {
    code: "WRONG_FINE",
    label: "Fine issued by mistake",
    hint: "For example, the wrong student or a violation you did not commit.",
  },
  {
    code: "DUPLICATE",
    label: "Paid more than once",
    hint: "For example, you paid at the cashier and with GCash.",
  },
  { code: "OTHER", label: "Other reason", hint: "Explain what happened below." },
];

// ==========================================
// HELPERS
// ==========================================

function money(centavos: number) {
  return `₱${(Number(centavos) / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "";

  const text = value.trim();
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(text) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(text)
      ? `${text.replace(" ", "T")}Z`
      : text,
  );

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function methodName(method: string) {
  return method === "GCASH" ? "GCash" : "cash";
}

async function request(path: string, init: RequestInit = {}) {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("Please sign in again.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "Could not reach the SmartFine server.");
  }

  return body;
}

// ==========================================
// DATA
// ==========================================

// The student's refunds and which of their payments can be refunded.
export function useStudentRefunds() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [payments, setPayments] = useState<RefundablePayment[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const body = await request("/api/refunds/me");

      setRefunds(Array.isArray(body.refunds) ? body.refunds : []);
      setPayments(Array.isArray(body.payments) ? body.payments : []);
      setError("");
    } catch (caught) {
      // Refund status is optional; fines and payments still work without it.
      setError(caught instanceof Error ? caught.message : "Refunds are unavailable.");
    }
  }, []);

  // Newest refund for the fine (refunds arrive newest first).
  const latestRefund = (fineId: number) =>
    refunds.find((refund) => refund.fineId === fineId) || null;

  const paymentFor = (fineId: number) =>
    payments.find((payment) => payment.fineId === fineId) || null;

  const completedRefund = (fineId: number) =>
    refunds.find((refund) => refund.fineId === fineId && refund.status === "SUCCEEDED") ||
    null;

  return { refunds, payments, error, load, latestRefund, paymentFor, completedRefund };
}

// ==========================================
// PAID FINE CARD SECTION
// ==========================================

// Refund state and actions under a paid fine.
export function StudentRefundSection({
  refund,
  payment,
  onRequest,
  onChanged,
}: {
  refund: Refund | null;
  payment: RefundablePayment | null;
  onRequest: () => void;
  onChanged: () => void;
}) {
  const runLocked = useActionLock();
  const [busy, setBusy] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [message, setMessage] = useState("");

  // Legacy fines marked paid without a payment record cannot be refunded here.
  if (!payment && !refund) {
    return null;
  }

  const withdraw = () =>
    runLocked(async () => {
      if (!refund) return;

      try {
        setBusy(true);
        setMessage("");
        await request(`/api/refunds/${refund.id}/withdraw`, { method: "POST" });
        haptics.success();
        setConfirmWithdraw(false);
        onChanged();
        void refreshNotificationCounts();
      } catch (caught) {
        haptics.error();
        setMessage(caught instanceof Error ? caught.message : "Could not withdraw the request.");
      } finally {
        setBusy(false);
      }
    });

  const checkStatus = () =>
    runLocked(async () => {
      if (!refund) return;

      try {
        setBusy(true);
        setMessage("");
        const body = await request(`/api/refunds/${refund.id}/refresh`, { method: "POST" });

        if (body.refund?.status === "PROCESSING") {
          setMessage("PayMongo is still processing the refund.");
        }

        onChanged();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not check the refund.");
      } finally {
        setBusy(false);
      }
    });

  const canRequest =
    payment?.refundable === true &&
    (!refund || ["WITHDRAWN", "REJECTED", "FAILED"].includes(refund.status));

  const status = refund?.status;

  return (
    <View style={styles.section}>
      {status === "REQUESTED" && (
        <View style={[styles.state, styles.stateAmber]}>
          <Text style={[styles.stateTitle, styles.amberText]}>Refund requested</Text>
          <Text style={styles.stateText}>
            Waiting for an administrator to review your request for{" "}
            {money(refund!.amountCentavos)}. Your fine stays paid until it is approved.
          </Text>

          {confirmWithdraw ? (
            <FadeIn distance={6} duration={180} style={styles.inlineConfirm}>
              <Text style={styles.stateText}>Withdraw this refund request?</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={() => setConfirmWithdraw(false)}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <Text style={styles.outlineText}>Keep</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.solidButton, styles.dangerButton]}
                  onPress={() => void withdraw()}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  {busy ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.solidText}>Withdraw</Text>
                  )}
                </TouchableOpacity>
              </View>
            </FadeIn>
          ) : (
            <TouchableOpacity
              style={styles.link}
              onPress={() => setConfirmWithdraw(true)}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>Withdraw request</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {status === "PROCESSING" && (
        <View style={[styles.state, styles.stateBlue]}>
          <Text style={[styles.stateTitle, styles.blueText]}>Refund approved</Text>
          <Text style={styles.stateText}>
            PayMongo is sending {money(refund!.amountCentavos)} back to the GCash
            account you paid with. It usually arrives within a day.
          </Text>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => void checkStatus()}
            disabled={busy}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator size="small" color="#0B63E5" />
            ) : (
              <Text style={[styles.outlineText, styles.blueText]}>Check refund status</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {status === "REJECTED" && (
        <View style={[styles.state, styles.stateRed]}>
          <Text style={[styles.stateTitle, styles.redText]}>Refund declined</Text>
          <Text style={styles.stateText}>
            {refund!.reviewNote
              ? `Note from the administrator: ${refund!.reviewNote}`
              : "Your refund request was declined."}
          </Text>
        </View>
      )}

      {status === "FAILED" && (
        <View style={[styles.state, styles.stateRed]}>
          <Text style={[styles.stateTitle, styles.redText]}>Refund not completed</Text>
          <Text style={styles.stateText}>
            The refund could not be completed yet. Your fine is still paid; the
            school will follow up with you.
          </Text>
        </View>
      )}

      {!!message && <Text style={styles.message}>{message}</Text>}

      {canRequest ? (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={onRequest}
          accessibilityRole="button"
          accessibilityLabel="Request a refund for this fine"
        >
          <Text style={styles.requestText}>
            {status === "REJECTED" || status === "FAILED" ? "Request refund again" : "Request refund"}
          </Text>
        </TouchableOpacity>
      ) : !refund && payment && !payment.refundable && payment.notRefundableReason ? (
        <Text style={styles.note}>Refund not available: {payment.notRefundableReason}</Text>
      ) : null}
    </View>
  );
}

// Line shown on a cancelled fine that was refunded.
export function RefundedNote({ refund }: { refund: Refund }) {
  return (
    <View style={[styles.state, styles.stateGreen]}>
      <Text style={[styles.stateTitle, styles.greenText]}>Refunded</Text>
      <Text style={styles.stateText}>
        {money(refund.amountCentavos)} was refunded
        {refund.paymentMethod === "GCASH" ? " to your GCash account" : " in cash"}
        {refund.completedAt ? ` on ${dateLabel(refund.completedAt)}` : ""}. The fine
        was cancelled.
      </Text>
    </View>
  );
}

// ==========================================
// REQUEST POP-UP
// ==========================================

export function RefundRequestModal({
  fine,
  payment,
  onClose,
  onSubmitted,
}: {
  fine: RefundFine | null;
  payment: RefundablePayment | null;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const runLocked = useActionLock();

  const shownFine = useRetainedValue(fine);
  const shownPayment = useRetainedValue(payment);

  const [reasonCode, setReasonCode] = useState<Refund["reasonCode"] | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const visible = fine !== null && payment !== null;

  // Every opening starts with an empty form.
  useEffect(() => {
    if (visible) {
      setReasonCode(null);
      setReason("");
      setError("");
      setDone(false);
    }
  }, [visible, fine?.id]);

  const close = () => {
    if (!saving) {
      onClose();
    }
  };

  const submit = () =>
    runLocked(async () => {
      if (!payment) return;

      if (!reasonCode) {
        haptics.warning();
        setError("Choose why you are asking for a refund.");
        return;
      }

      if (reason.trim().length < 10) {
        haptics.warning();
        setError("Please explain what happened in at least 10 characters.");
        return;
      }

      try {
        setSaving(true);
        setError("");

        await request("/api/refunds", {
          method: "POST",
          body: JSON.stringify({
            paymentId: payment.paymentId,
            reasonCode,
            reason: reason.trim(),
          }),
        });

        haptics.success();
        setDone(true);
        onSubmitted();
      } catch (caught) {
        haptics.error();
        setError(caught instanceof Error ? caught.message : "Could not send the refund request.");
      } finally {
        setSaving(false);
      }
    });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <PopIn style={styles.card} accessibilityViewIsModal>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {done ? (
              <View style={styles.doneArea} accessibilityLiveRegion="polite">
                <SuccessCheck />
                <Text style={styles.title}>Refund Requested</Text>
                <Text style={styles.body}>
                  An administrator will review your request. You will get a
                  notification when it is approved or declined. Your fine stays
                  paid until then.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onClose}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryText}>OK</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Request a Refund</Text>

                {shownFine && shownPayment && (
                  <>
                    <Text style={styles.violation}>{shownFine.violationName}</Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fine</Text>
                      <Text style={styles.detailValue}>{shownFine.fineReference}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount paid</Text>
                      <Text style={styles.detailValue}>
                        {money(shownPayment.amountCentavos)} ({methodName(shownPayment.paymentMethod)})
                      </Text>
                    </View>

                    <Text style={styles.body}>
                      {shownPayment.paymentMethod === "GCASH"
                        ? "If approved, PayMongo sends the money back to the GCash account you paid with."
                        : "If approved, the cashier or student treasurer returns the cash to you."}{" "}
                      The fine is cancelled once the refund is completed.
                    </Text>
                  </>
                )}

                <Text style={styles.fieldLabel}>Why are you asking for a refund?</Text>

                {REASONS.map((item) => {
                  const selected = reasonCode === item.code;

                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[styles.reason, selected && styles.reasonSelected]}
                      onPress={() => {
                        haptics.selection();
                        setReasonCode(item.code);
                        setError("");
                      }}
                      disabled={saving}
                      accessibilityRole="radio"
                      accessibilityState={{ selected, disabled: saving }}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                      <View style={styles.reasonText}>
                        <Text style={styles.reasonLabel}>{item.label}</Text>
                        <Text style={styles.reasonHint}>{item.hint}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <Text style={styles.fieldLabel}>Explain what happened</Text>
                <TextInput
                  style={styles.input}
                  value={reason}
                  onChangeText={(value) => {
                    setReason(value);
                    if (error) setError("");
                  }}
                  placeholder="At least 10 characters"
                  placeholderTextColor="#8C939F"
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  editable={!saving}
                />
                <Text style={styles.counter}>{reason.trim().length}/500</Text>

                {!!error && (
                  <Text style={styles.error} accessibilityLiveRegion="polite">
                    {error}
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, saving && styles.busy]}
                  onPress={() => void submit()}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityState={{ busy: saving, disabled: saving }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryText}>Send Refund Request</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={close}
                  disabled={saving}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </PopIn>
      </View>
    </Modal>
  );
}
