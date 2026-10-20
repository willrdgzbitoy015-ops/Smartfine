import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  FadeIn,
  PopIn,
  useRetainedValue,
} from "@/components/motion";
import { FineTrail } from "@/components/fine-trail";
import { FailedMark } from "@/components/result-mark";
import { SuccessCheck } from "@/components/success-check";
import { Skeleton, SkeletonGroup } from "@/components/skeleton";
import { API_BASE } from "@/constants/api";
import { useActionLock } from "@/hooks/use-action-lock";
import { useLiveReload } from "@/hooks/use-live-updates";
import {
  RefundedNote,
  RefundRequestModal,
  StudentRefundSection,
  useStudentRefunds,
} from "@/components/refunds/student-refunds";
import { haptics } from "@/utils/haptics";
import { styles } from "../styles/student-fines.styles";
import { notificationStyles } from "../styles/student-notification.styles";
import { refreshNotificationCounts } from "@/hooks/use-notification-counts";
import { returnToLogin } from "@/hooks/use-auth";

import { CountUp } from "@/components/count-up";
import { FloatingTabBar } from "@/components/floating-tab-bar";
type FineStatus = "UNPAID" | "PAID" | "PENDING";

type FineFilter = FineStatus | "CANCELLED";

type CancelledFine = {
  id: number;
  fineReference: string;
  violationName: string;
  amountCentavos: number;
  recordedAt: string | null;
  cancelledAt: string | null;
  cancelledCashRequestReference: string | null;
  remarks?: string | null;
};

type Fine = {
  id: number;
  fineReference: string;
  violationName: string;
  amountCentavos: number;
  recordedAt: string | null;
  paidAt: string | null;
  remarks: string | null;
  status: FineStatus;
  isRead: number | boolean;
  readAt: string | null;
};

// The Fine Details pop-up also opens cancelled fines.
type DetailsFine = Omit<Fine, "status"> & {
  status: FineStatus | "CANCELLED";
  cancelledAt?: string | null;
};

type FinesResponse = {
  success: boolean;
  message?: string;
  fines: Fine[];
  cancelledFines?: CancelledFine[];
  summary: {
    outstandingAmountCentavos: number;
    payableAmountCentavos: number;
  };
};

type CashRequest = {
  id: number;
  paymentReference: string;
  fineId: number;
  fineReference: string;
  amountCentavos: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  createdAt: string;
  paidAt: string | null;
};

type OnlinePayment = {
  id: number;
  paymentReference: string;
  fineId: number;
  amountCentavos: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  createdAt: string;
  paidAt: string | null;
  needsReview: boolean;
  checkoutUrl: string | null;
};

// After the GCash checkout, PayMongo's page links back to this app route.
const PAYMENT_RETURN_PATH = "payment-return";

// Checks after returning from GCash: up to 6 tries, 2 seconds apart.
const CONFIRM_ATTEMPTS = 6;
const CONFIRM_INTERVAL_MS = 2000;

// Signed-in JSON request; throws the server's message on failure.
async function apiRequest(path: string, init: RequestInit = {}) {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("Please sign in again.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "Something went wrong. Please try again.");
  }

  return body;
}

const filters: { label: string; value: FineFilter }[] = [
  { label: "Unpaid", value: "UNPAID" },
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
  { label: "Cancelled", value: "CANCELLED" },
];

const navigation = [
  {
    label: "Home",
    icon: require("../../../assets/icons/dashboard.png"),
  },
  {
    label: "Fines",
    icon: require("../../../assets/icons/fines.png"),
  },
  {
    label: "My QR",
    icon: require("../../../assets/icons/qr-codeWhite.png"),
  },
  {
    label: "Profile",
    icon: require("../../../assets/icons/user.png"),
  },
];

function money(centavos: number) {
  return `₱ ${(centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dateLabel(value: string | null) {
  if (!value) return "Date unavailable";

  const text = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text);

  const normalized = dateOnly
    ? `${text}T00:00:00+08:00`
    : /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text)
      ? text.replace(" ", "T") + "Z"
      : text;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  if (dateOnly) {
    return date.toLocaleDateString("en-PH", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function StudentFinesScreen() {
  const router = useGuardedRouter();

  // Saving, paying and changing records run once per tap.
  const runLocked = useActionLock();

  const [data, setData] = useState<FinesResponse | null>(null);
  const [filter, setFilter] = useState<FineFilter>("UNPAID");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedFine, setSelectedFine] = useState<DetailsFine | null>(null);
  const [readError, setReadError] = useState<{
    fineId: number;
    message: string;
  } | null>(null);

  const [cashRequests, setCashRequests] = useState<CashRequest[]>([]);
  const [cashError, setCashError] = useState("");
  const [cashFine, setCashFine] = useState<Fine | null>(null);
  const [requestingFineId, setRequestingFineId] = useState<number | null>(null);
  const [cashFeedback, setCashFeedback] = useState<{
    title: string;
    message: string;
    // Shows the success check above the title.
    success?: boolean;
    // Shows the failed mark above the title.
    failed?: boolean;
  } | null>(null);

  // GCash through PayMongo
  const [onlinePayments, setOnlinePayments] = useState<OnlinePayment[]>([]);
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [onlineTestMode, setOnlineTestMode] = useState(false);
  const [gcashFine, setGcashFine] = useState<Fine | null>(null);

  // Refund requests for paid fines.
  const studentRefunds = useStudentRefunds();
  const loadRefunds = studentRefunds.load;
  const [refundFine, setRefundFine] = useState<Fine | null>(null);
  const [startingGcashFineId, setStartingGcashFineId] = useState<number | null>(
    null,
  );
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<number | null>(
    null,
  );
  // What the progress pop-up says while a GCash request is running.
  const [paymentBusy, setPaymentBusy] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Pop-ups keep showing their record while they fade out.
  const shownSelectedFine = useRetainedValue(selectedFine);
  const shownCashFine = useRetainedValue(cashFine);
  const shownGcashFine = useRetainedValue(gcashFine);
  const shownCashFeedback = useRetainedValue(cashFeedback);

  const requestRef = useRef<AbortController | null>(null);
  const cashRequestRef = useRef<AbortController | null>(null);

  // `silent` is a live update: no spinner and no error message on failure.
  const loadFines = useCallback(async (silent = false) => {
    requestRef.current?.abort();

    const controller = new AbortController();
    requestRef.current = controller;

    if (!silent) {
      setLoading(true);
      setError("");
      setAccessDenied(false);
    }

    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    try {
      const token = await AsyncStorage.getItem("token");

      if (requestRef.current !== controller) return;
      if (controller.signal.aborted) return;

      if (!token) {
        setData(null);
        setAccessDenied(true);
        throw new Error("Please sign in to view your fines.");
      }

      const response = await fetch(`${API_BASE}/api/fines/my-fines`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        signal: controller.signal,
      });

      const raw = await response.text();

      if (requestRef.current !== controller) return;
      if (controller.signal.aborted) return;

      if (response.status === 401 || response.status === 403) {
        setData(null);
        setAccessDenied(true);
      }

      let body: FinesResponse;

      try {
        body = JSON.parse(raw);
      } catch {
        throw new Error(
          "Unexpected server response. Check the backend connection.",
        );
      }

      if (!response.ok || !body?.success) {
        throw new Error(body?.message || "Could not load your fines.");
      }

      if (
        !Array.isArray(body.fines) ||
        !body.summary ||
        !Number.isFinite(body.summary.outstandingAmountCentavos) ||
        !Number.isFinite(body.summary.payableAmountCentavos)
      ) {
        throw new Error("The server returned incomplete fines data.");
      }

      setData(body);
    } catch (caught) {
      if (requestRef.current !== controller) return;
      if (controller.signal.aborted && !timedOut) return;
      if (silent) return;

      setError(
        timedOut
          ? "The request timed out. Please try again."
          : caught instanceof Error
            ? caught.message
            : "Could not load your fines.",
      );
    } finally {
      clearTimeout(timeout);

      if (requestRef.current === controller) {
        setLoading(false);

        if (timedOut && !silent) {
          setError("The request timed out. Please try again.");
        }
      }
    }
  }, []);

  const loadCashRequests = useCallback(async (silent = false) => {
    cashRequestRef.current?.abort();

    const controller = new AbortController();
    cashRequestRef.current = controller;

    if (!silent) {
      setCashError("");
    }

    try {
      const token = await AsyncStorage.getItem("token");

      if (controller.signal.aborted || cashRequestRef.current !== controller) {
        return;
      }

      if (!token) {
        setCashRequests([]);
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/payments/cash-requests/me`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          signal: controller.signal,
        },
      );

      const body = await response.json();

      if (controller.signal.aborted || cashRequestRef.current !== controller) {
        return;
      }

      if (!response.ok || !body?.success || !Array.isArray(body.payments)) {
        throw new Error(
          body?.message || "Could not load cash request statuses.",
        );
      }

      setCashRequests(body.payments);
    } catch (caught) {
      if (
        controller.signal.aborted ||
        cashRequestRef.current !== controller ||
        silent
      ) {
        return;
      }

      setCashError(
        caught instanceof Error
          ? caught.message
          : "Could not load cash request statuses.",
      );
    }
  }, []);

  // GCash payments and whether online payment is switched on.
  const loadOnlinePayments = useCallback(async (silent = false) => {
    try {
      const body = await apiRequest("/api/payments/online/me");

      setOnlineEnabled(Boolean(body.enabled));
      setOnlineTestMode(Boolean(body.testMode));
      setOnlinePayments(Array.isArray(body.payments) ? body.payments : []);
    } catch {
      // Cashier payments still work without online payment. A failed live
      // update keeps what is on screen.
      if (!silent) {
        setOnlineEnabled(false);
      }
    }
  }, []);

  const refresh = useCallback(() => {
    void loadFines();
    void loadCashRequests();
    void loadOnlinePayments();
    void loadRefunds();
  }, [loadFines, loadCashRequests, loadOnlinePayments, loadRefunds]);

  // A fine recorded, paid, cancelled or refunded elsewhere appears here at
  // once, without pulling down to refresh.
  useLiveReload(["fines", "payments", "refunds"], () =>
    Promise.all([
      loadFines(true),
      loadCashRequests(true),
      loadOnlinePayments(true),
      loadRefunds(),
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      refresh();

      return () => {
        requestRef.current?.abort();
        requestRef.current = null;
        cashRequestRef.current?.abort();
        cashRequestRef.current = null;
      };
    }, [refresh]),
  );

  const pendingCashRequest = (fineId: number) =>
    cashRequests.find(
      (request) => request.fineId === fineId && request.status === "PENDING",
    );

  const pendingOnlinePayment = (fineId: number) =>
    onlinePayments.find(
      (payment) => payment.fineId === fineId && payment.status === "PENDING",
    );

  // Asks the server, which asks PayMongo, whether the payment went through.
  // Returning from the checkout page alone never marks a fine paid.
  const confirmOnlinePayment = async (
    paymentId: number,
    attempts = CONFIRM_ATTEMPTS,
  ) => {
    setConfirmingPaymentId(paymentId);
    setPaymentBusy({
      title: "Confirming your payment",
      message: "Checking with PayMongo. This takes a few seconds.",
    });

    try {
      let payment: OnlinePayment | null = null;

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const body = await apiRequest(`/api/payments/online/${paymentId}`);

        payment = body.payment;

        if (payment?.status !== "PENDING" || attempt === attempts - 1) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, CONFIRM_INTERVAL_MS));
      }

      refresh();
      void refreshNotificationCounts();

      if (payment?.status === "SUCCESS" && !payment.needsReview) {
        haptics.success();
        setCashFeedback({
          success: true,
          title: "Payment Confirmed",
          message:
            "PayMongo confirmed your GCash payment. Your fine is now paid.",
        });
      } else if (payment?.status === "SUCCESS") {
        setCashFeedback({
          title: "Payment Received",
          message:
            "Your GCash payment was received, but the school needs to review it. You will be notified.",
        });
      } else if (payment?.status === "PENDING") {
        setCashFeedback({
          title: "Not Confirmed Yet",
          message:
            "PayMongo has not confirmed this payment yet. If you finished paying in GCash, tap Check payment on the fine in a moment. Your fine stays unpaid until it is confirmed.",
        });
      } else {
        setCashFeedback({
          failed: true,
          title: "Payment Not Completed",
          message:
            "No GCash payment was made. You can try again or pay at the cashier.",
        });
      }
    } catch (caught) {
      haptics.error();
      setCashFeedback({
        failed: true,
        title: "Could Not Check Payment",
        message:
          caught instanceof Error
            ? caught.message
            : "Please check your connection and try again.",
      });
    } finally {
      setConfirmingPaymentId(null);
      setPaymentBusy(null);
    }
  };

  // Opens PayMongo's GCash page, then confirms the result on return.
  const openCheckout = async (checkoutUrl: string, paymentId: number) => {
    if (Platform.OS === "web") {
      await WebBrowser.openBrowserAsync(checkoutUrl).catch(() => null);

      setCashFeedback({
        title: "Finish in the New Tab",
        message:
          "Complete the GCash payment in the new tab, then tap Check payment on this fine.",
      });
      void loadOnlinePayments();
      return;
    }

    // On phones this returns when the student comes back to the app.
    await WebBrowser.openAuthSessionAsync(
      checkoutUrl,
      Linking.createURL(PAYMENT_RETURN_PATH),
    ).catch(() => null);

    await confirmOnlinePayment(paymentId);
  };

  const startGcashPayment = (fine: Fine) =>
    runLocked(async () => {
      setGcashFine(null);
      setStartingGcashFineId(fine.id);

      try {
        const body = await apiRequest("/api/payments/online/checkout", {
          method: "POST",
          body: JSON.stringify({
            fineId: fine.id,
            returnUrl: Linking.createURL(PAYMENT_RETURN_PATH),
          }),
        });

        void loadOnlinePayments();
        setStartingGcashFineId(null);

        await openCheckout(body.checkoutUrl, body.payment.id);
      } catch (caught) {
        haptics.error();
        setCashFeedback({
          failed: true,
          title: "GCash Unavailable",
          message:
            caught instanceof Error
              ? caught.message
              : "GCash checkout could not be opened. Please try again.",
        });
      } finally {
        setStartingGcashFineId(null);
      }
    });

  const cancelOnlinePayment = async (payment: OnlinePayment) => {
    setConfirmingPaymentId(payment.id);
    setPaymentBusy({
      title: "Cancelling GCash payment",
      message: "Closing the checkout with PayMongo.",
    });

    try {
      await apiRequest(`/api/payments/online/${payment.id}/cancel`, {
        method: "POST",
      });

      setCashFeedback({
        title: "GCash Payment Cancelled",
        message: "No payment was made. You can pay again at any time.",
      });
    } catch (caught) {
      haptics.error();
      setCashFeedback({
        failed: true,
        title: "Could Not Cancel",
        message:
          caught instanceof Error ? caught.message : "Please try again.",
      });
    } finally {
      setConfirmingPaymentId(null);
      setPaymentBusy(null);
      refresh();
    }
  };

  // The GCash part of an unpaid fine's card.
  const renderGcashActions = (fine: Fine) => {
    if (fine.status !== "UNPAID" || !onlineEnabled) {
      return null;
    }

    const open = pendingOnlinePayment(fine.id);
    const busy = confirmingPaymentId !== null || startingGcashFineId !== null;

    if (open) {
      return (
        <View style={styles.gcashPending}>
          <Text style={styles.gcashPendingTitle}>
            GCash payment in progress
          </Text>
          <Text style={styles.gcashPendingText}>
            Your fine stays unpaid until PayMongo confirms the payment.
          </Text>

          <View style={styles.gcashPendingActions}>
            <TouchableOpacity
              style={styles.gcashOutlineButton}
              onPress={() => void confirmOnlinePayment(open.id, 1)}
              disabled={busy}
              accessibilityRole="button"
            >
              {confirmingPaymentId === open.id ? (
                <ActivityIndicator size="small" color="#0B63E5" />
              ) : (
                <Text style={styles.gcashOutlineText}>Check payment</Text>
              )}
            </TouchableOpacity>

            {!!open.checkoutUrl && (
              <TouchableOpacity
                style={styles.gcashSmallButton}
                onPress={() => void openCheckout(open.checkoutUrl!, open.id)}
                disabled={busy}
                accessibilityRole="button"
              >
                <Text style={styles.gcashButtonText}>Continue in GCash</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.gcashCancelLink}
            onPress={() => void cancelOnlinePayment(open)}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.gcashCancelText}>Cancel GCash payment</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.gcashButton, busy && { opacity: 0.6 }]}
        onPress={() => setGcashFine(fine)}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`Pay ${fine.violationName} with GCash`}
      >
        {startingGcashFineId === fine.id ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.gcashButtonText}>Pay with GCash</Text>
        )}
      </TouchableOpacity>
    );
  };

  const visibleFines =
    data?.fines.filter((fine) => {
      if (filter === "CANCELLED") {
        return false;
      }

      const cashPending = !!pendingCashRequest(fine.id);

      if (filter === "PENDING") {
        return (
          fine.status === "PENDING" || (fine.status === "UNPAID" && cashPending)
        );
      }

      if (filter === "UNPAID") {
        return fine.status === "UNPAID" && !cashPending;
      }

      return fine.status === "PAID";
    }) ?? [];

  const cancelledFines =
    filter === "CANCELLED" ? (data?.cancelledFines ?? []) : [];
  const listCount = visibleFines.length + cancelledFines.length;

  const outstanding = data?.summary.outstandingAmountCentavos;
  const payable = data?.summary.payableAmountCentavos ?? 0;

  const submitCashRequest = (fine: Fine) =>
    runLocked(async () => {
      if (requestingFineId !== null || fine.status !== "UNPAID") {
        return;
      }

      try {
        setRequestingFineId(fine.id);

        const token = await AsyncStorage.getItem("token");

        if (!token) {
          throw new Error("Please sign in again.");
        }

        const response = await fetch(`${API_BASE}/api/payments/cash-requests`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ fineId: fine.id }),
        });

        const body = await response.json();

        if (!response.ok || !body?.success || !body.payment) {
          throw new Error(body?.message || "Could not save your cash request.");
        }

        const payment: CashRequest = {
          id: Number(body.payment.id),
          paymentReference: String(body.payment.paymentReference),
          fineId: fine.id,
          fineReference: fine.fineReference,
          amountCentavos: fine.amountCentavos,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          paidAt: null,
        };

        setCashRequests((current) => [
          payment,
          ...current.filter(
            (item) => item.fineId !== fine.id || item.status !== "PENDING",
          ),
        ]);

        haptics.success();
        setCashFine(null);
        setCashFeedback({
          success: true,
          title: "Cash Request Saved",
          message:
            `Bring ${money(fine.amountCentavos)} to the cashier or student treasurer. ` +
            `Show fine ${fine.fineReference} and payment reference ${payment.paymentReference}. ` +
            "Your fine stays unpaid until the cash is received and confirmed.",
        });
      } catch (caught) {
        haptics.error();
        setCashFine(null);
        setCashFeedback({
          failed: true,
          title: "Request Not Confirmed",
          message:
            caught instanceof Error
              ? caught.message
              : "Refresh your fines before trying again.",
        });
      } finally {
        setRequestingFineId(null);
      }
    });

  const markFineRead = async (fineId: number) => {
    setReadError(null);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE}/api/fines/my-fines/${fineId}/read`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      const body = await response.json();

      if (!response.ok || !body?.success) {
        throw new Error(body?.message || "Could not mark this fine as read.");
      }

      setData((current) =>
        current
          ? {
              ...current,
              fines: current.fines.map((fine) =>
                fine.id === fineId
                  ? {
                      ...fine,
                      isRead: true,
                      readAt: body.readAt,
                    }
                  : fine,
              ),
            }
          : current,
      );

      setSelectedFine((current) =>
        current?.id === fineId
          ? {
              ...current,
              isRead: true,
              readAt: body.readAt,
            }
          : current,
      );

      // Reading the fine also reads its New Fine Issued notification.
      void refreshNotificationCounts();
    } catch (caught) {
      // Shown on the fine's card and in its details (no system dialog).
      setReadError({
        fineId,
        message:
          caught instanceof Error
            ? caught.message
            : "Could not mark this fine as read.",
      });
    }
  };

  // The read-mark error for one fine, with a way to try again.
  const renderReadError = (fineId: number) =>
    readError?.fineId === fineId ? (
      <View style={notificationStyles.readErrorBox}>
        <Text style={notificationStyles.readErrorText}>{readError.message}</Text>
        <TouchableOpacity
          onPress={() => void markFineRead(fineId)}
          accessibilityRole="button"
        >
          <Text style={notificationStyles.readRetryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  const openFineDetails = (fine: Fine) => {
    setSelectedFine(fine);

    if (!fine.isRead) {
      void markFineRead(fine.id);
    }
  };

  const openCancelledDetails = (fine: CancelledFine) => {
    setSelectedFine({
      ...fine,
      remarks: fine.remarks ?? null,
      paidAt: null,
      status: "CANCELLED",
      isRead: true,
      readAt: null,
    });
  };

  // Clears the session, then the shared returnToLogin() opens the login screen.
  const leaveToLogin = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "userId",
        "userRole",
        "userEmail",
      ]);

      returnToLogin();
    } catch {
      setError("Unable to clear your session. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.phone}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/student/dashboard")}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
          >
            <Image
              source={require("../../../assets/icons/back_icon.png")}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.title}>My Fines</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.filters}>
          {filters.map((item) => {
            const active = item.value === filter;

            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.filterButton, active && styles.filterActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  if (!active) {
                    haptics.selection();
                  }

                  setFilter(item.value);
                }}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && data !== null}
              onRefresh={refresh}
              tintColor="#123266"
              colors={["#123266"]}
            />
          }
        >
          {!!error && (
            <View style={styles.errorPanel}>
              <Text style={styles.errorText}>{error}</Text>

              {data && (
                <Text style={styles.helper}>
                  Showing your last loaded information.
                </Text>
              )}

              <TouchableOpacity
                style={styles.retryButton}
                disabled={loading}
                onPress={() => {
                  if (accessDenied) {
                    void leaveToLogin();
                  } else {
                    refresh();
                  }
                }}
                accessibilityRole="button"
              >
                <Text style={styles.retryText}>
                  {accessDenied ? "Back to Login" : "Try Again"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && !data ? (
            // Placeholders in the shape of the total and the fine cards.
            <SkeletonGroup label="Loading your fines">
              <View style={styles.totalCard}>
                <Skeleton width="42%" height={11} onDark />
                <Skeleton
                  width="55%"
                  height={34}
                  radius={8}
                  onDark
                  style={styles.skeletonGap}
                />
                <Skeleton
                  width="68%"
                  height={11}
                  onDark
                  style={styles.skeletonGap}
                />
              </View>

              {[0, 1, 2].map((index) => (
                <View key={index} style={[styles.fineCard, styles.skeletonCard]}>
                  <Skeleton width="58%" height={15} />
                  <Skeleton width="42%" height={11} style={styles.skeletonGap} />
                  <Skeleton width="32%" height={11} style={styles.skeletonGap} />
                  <View style={styles.fineDivider} />
                  <View style={styles.fineSummary}>
                    <Skeleton width={96} height={26} radius={8} />
                    <Skeleton width={72} height={24} radius={12} />
                  </View>
                </View>
              ))}
            </SkeletonGroup>
          ) : (
            <>
              <FadeIn style={styles.totalCard}>
                <Text style={styles.totalLabel}>TOTAL OUTSTANDING</Text>

                {outstanding !== undefined ? (
                  <CountUp
                    value={outstanding}
                    format={money}
                    style={styles.totalAmount}
                  />
                ) : (
                  <Text style={styles.totalAmount}>—</Text>
                )}

                <Text style={styles.totalHelper}>
                  {data && outstanding === 0
                    ? "You have no outstanding balance."
                    : data && outstanding !== undefined && outstanding > payable
                      ? "Includes pending fines."
                      : "Your current unpaid fine balance."}
                </Text>
              </FadeIn>

              <FadeIn style={styles.paymentNote} delay={60}>
                <Text style={styles.paymentNoteTitle}>
                  {onlineEnabled ? "How to pay" : "Pay at the cashier"}
                </Text>

                <Text style={styles.paymentNoteText}>
                  {onlineEnabled
                    ? "Pay with GCash online, or request to pay in cash and bring the amount to the cashier or student treasurer. A cashier request is not a payment."
                    : "Request to pay an unpaid fine in cash, then bring the amount to the cashier or student treasurer. A request is not a payment. Online payment is not available yet."}
                </Text>

                {!!cashError && (
                  <Text style={styles.paymentNoteText}>
                    Cash request status unavailable: {cashError}
                  </Text>
                )}
              </FadeIn>

              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>
                  {filter === "PENDING"
                    ? "Pending Payments / Fines"
                    : `${filters.find((item) => item.value === filter)?.label} Fines`}
                </Text>

                <Text style={styles.listCount}>
                  {listCount} {listCount === 1 ? "fine" : "fines"}
                </Text>
              </View>

              {visibleFines.map((fine, index) => (
                <FadeIn key={fine.id} index={index} style={styles.fineCard}>
                  <View style={styles.fineHeader}>
                    <Text style={styles.violation}>{fine.violationName}</Text>

                    <View
                      style={[
                        styles.readBadge,
                        fine.isRead
                          ? styles.readBadgeRead
                          : styles.readBadgeNew,
                      ]}
                    >
                      <Text
                        style={[
                          styles.readBadgeText,
                          fine.isRead
                            ? styles.readBadgeTextRead
                            : styles.readBadgeTextNew,
                        ]}
                      >
                        {fine.isRead ? "READ" : "NEW"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.reference}>
                    Reference: {fine.fineReference}
                  </Text>

                  <Text style={styles.timestamp}>
                    Issued {dateLabel(fine.recordedAt)}
                  </Text>

                  {fine.status === "PAID" && fine.paidAt && (
                    <Text style={styles.paidDate}>
                      Paid {dateLabel(fine.paidAt)}
                    </Text>
                  )}

                  {fine.status === "UNPAID" && pendingCashRequest(fine.id) && (
                    <Text style={styles.reference}>
                      Cash request pending ·{" "}
                      {pendingCashRequest(fine.id)?.paymentReference}
                    </Text>
                  )}

                  <View style={styles.fineDivider} />

                  <View style={styles.fineSummary}>
                    <View style={styles.amountArea}>
                      <Text style={styles.amountLabel}>Amount</Text>

                      <Text style={styles.amount}>
                        {money(fine.amountCentavos)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        fine.status === "PAID"
                          ? styles.statusPaid
                          : fine.status === "PENDING" ||
                              pendingCashRequest(fine.id)
                            ? styles.statusPending
                            : styles.statusUnpaid,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          fine.status === "PAID"
                            ? styles.statusTextPaid
                            : fine.status === "PENDING" ||
                                pendingCashRequest(fine.id)
                              ? styles.statusTextPending
                              : styles.statusTextUnpaid,
                        ]}
                      >
                        {fine.status === "PAID"
                          ? "Paid"
                          : pendingCashRequest(fine.id)
                            ? "Cash requested"
                            : fine.status === "PENDING"
                              ? "Pending"
                              : "Unpaid"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() => openFineDetails(fine)}
                      accessibilityRole="button"
                      accessibilityLabel={`View details for ${fine.violationName}`}
                    >
                      <Text style={styles.detailsButtonText}>View details</Text>
                    </TouchableOpacity>

                    {!fine.isRead && (
                      <TouchableOpacity
                        style={styles.markReadButton}
                        onPress={() => void markFineRead(fine.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Mark ${fine.violationName} as read`}
                      >
                        <Text style={styles.markReadText}>Mark as read</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {renderReadError(fine.id)}

                  {renderGcashActions(fine)}

                  {fine.status === "PAID" && (
                    <StudentRefundSection
                      refund={studentRefunds.latestRefund(fine.id)}
                      payment={studentRefunds.paymentFor(fine.id)}
                      onRequest={() => setRefundFine(fine)}
                      onChanged={() => {
                        void loadRefunds();
                        void loadFines();
                      }}
                    />
                  )}

                  {fine.status === "UNPAID" && !pendingCashRequest(fine.id) && (
                    <TouchableOpacity
                      style={notificationStyles.detailsCloseButton}
                      onPress={() => setCashFine(fine)}
                      disabled={requestingFineId !== null}
                      accessibilityRole="button"
                      accessibilityLabel={`Request cash payment for ${fine.violationName}`}
                    >
                      <Text style={notificationStyles.detailsCloseText}>
                        {requestingFineId === fine.id
                          ? "Saving..."
                          : "Pay at Cashier"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </FadeIn>
              ))}

              {cancelledFines.map((fine, index) => (
                <FadeIn key={fine.id} index={index} style={styles.fineCard}>
                  <View style={styles.fineHeader}>
                    <Text style={styles.violation}>{fine.violationName}</Text>
                  </View>

                  <Text style={styles.reference}>
                    Reference: {fine.fineReference}
                  </Text>

                  <Text style={styles.timestamp}>
                    Issued {dateLabel(fine.recordedAt)}
                  </Text>

                  <Text style={styles.timestamp}>
                    Cancelled {dateLabel(fine.cancelledAt)}
                  </Text>

                  {!!fine.cancelledCashRequestReference && (
                    <Text style={styles.reference}>
                      Cash request cancelled ·{" "}
                      {fine.cancelledCashRequestReference}
                    </Text>
                  )}

                  <View style={styles.fineDivider} />

                  <View style={styles.fineSummary}>
                    <View style={styles.amountArea}>
                      <Text style={styles.amountLabel}>Amount</Text>

                      <Text style={styles.amount}>
                        {money(fine.amountCentavos)}
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, styles.statusCancelled]}>
                      <Text
                        style={[styles.statusText, styles.statusTextCancelled]}
                      >
                        Cancelled
                      </Text>
                    </View>
                  </View>

                  {studentRefunds.completedRefund(fine.id) ? (
                    <RefundedNote refund={studentRefunds.completedRefund(fine.id)!} />
                  ) : (
                    <Text style={styles.helper}>
                      This fine was cancelled. No payment is needed.
                    </Text>
                  )}

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() => openCancelledDetails(fine)}
                      accessibilityRole="button"
                      accessibilityLabel={`View details for ${fine.violationName}`}
                    >
                      <Text style={styles.detailsButtonText}>View details</Text>
                    </TouchableOpacity>
                  </View>
                </FadeIn>
              ))}

              {data && listCount === 0 && (
                <FadeIn style={styles.emptyPanel}>
                  <Text style={styles.emptyTitle}>
                    No {filter.toLowerCase()} fines
                  </Text>

                  <Text style={styles.helper}>
                    {filter === "UNPAID"
                      ? "You have no unpaid fines."
                      : filter === "PAID"
                        ? "Paid fines will appear here."
                        : filter === "CANCELLED"
                          ? "Cancelled fines will appear here."
                          : "No pending cash requests or fines."}
                  </Text>
                </FadeIn>
              )}
            </>
          )}
        </ScrollView>

        <FloatingTabBar
          items={navigation}
          active="Fines"
          onSelect={(item) => {
            if (item.label === "Home") {
              router.replace("/student/dashboard");
            } else if (item.label === "Fines") {
              refresh();
            } else if (item.label === "My QR") {
              router.push("/student/qr");
            } else if (item.label === "Profile") {
              router.push("/student/profile");
            }
          }}
        />
      </View>

      <Modal
        visible={selectedFine !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFine(null)}
      >
        <View style={notificationStyles.detailsOverlay}>
          <PopIn style={notificationStyles.detailsCard}>
            <Text style={notificationStyles.detailsTitle}>Fine Details</Text>

            {shownSelectedFine && (
              <ScrollView
                style={notificationStyles.detailsScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={notificationStyles.detailsViolation}>
                  {shownSelectedFine.violationName}
                </Text>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Reference</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {shownSelectedFine.fineReference}
                  </Text>
                </View>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Amount</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {money(shownSelectedFine.amountCentavos)}
                  </Text>
                </View>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Status</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {shownSelectedFine.status === "CANCELLED"
                      ? "Cancelled — no payment needed"
                      : pendingCashRequest(shownSelectedFine.id)
                        ? "Unpaid — cash requested"
                        : shownSelectedFine.status}
                  </Text>
                </View>

                {pendingCashRequest(shownSelectedFine.id) && (
                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>
                      Cash request
                    </Text>
                    <Text style={notificationStyles.detailsValue}>
                      Pending ·{" "}
                      {pendingCashRequest(shownSelectedFine.id)?.paymentReference}
                    </Text>
                  </View>
                )}

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Issued</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {dateLabel(shownSelectedFine.recordedAt)}
                  </Text>
                </View>

                {shownSelectedFine.paidAt && (
                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>Paid</Text>
                    <Text style={notificationStyles.detailsValue}>
                      {dateLabel(shownSelectedFine.paidAt)}
                    </Text>
                  </View>
                )}

                {!!shownSelectedFine.cancelledAt && (
                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>Cancelled</Text>
                    <Text style={notificationStyles.detailsValue}>
                      {dateLabel(shownSelectedFine.cancelledAt)}
                    </Text>
                  </View>
                )}

                <View style={notificationStyles.detailsRemarks}>
                  <Text style={notificationStyles.detailsLabel}>Remarks</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {shownSelectedFine.remarks || "No additional remarks."}
                  </Text>
                </View>

                {renderReadError(shownSelectedFine.id)}

                {/* Who recorded, collected or cancelled it, and the evidence. */}
                <FineTrail fineId={shownSelectedFine.id} />

                {shownSelectedFine.status !== "CANCELLED" && (
                  <Text
                    style={[
                      notificationStyles.detailsReadStatus,
                      shownSelectedFine.isRead
                        ? notificationStyles.readLabel
                        : notificationStyles.newLabel,
                    ]}
                  >
                    {shownSelectedFine.isRead ? "READ" : "NEW"}
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={notificationStyles.detailsCloseButton}
              onPress={() => setSelectedFine(null)}
              accessibilityRole="button"
            >
              <Text style={notificationStyles.detailsCloseText}>Close</Text>
            </TouchableOpacity>
          </PopIn>
        </View>
      </Modal>

      <Modal
        visible={cashFine !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (requestingFineId === null) {
            setCashFine(null);
          }
        }}
      >
        <View style={notificationStyles.detailsOverlay}>
          <PopIn style={notificationStyles.detailsCard}>
            <Text style={notificationStyles.detailsTitle}>Pay at Cashier</Text>

            {shownCashFine && (
              <>
                <Text style={notificationStyles.detailsViolation}>
                  {shownCashFine.violationName}
                </Text>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Fine</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {shownCashFine.fineReference}
                  </Text>
                </View>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Amount</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {money(shownCashFine.amountCentavos)}
                  </Text>
                </View>

                <Text style={styles.helper}>
                  This saves a cash payment request. Your fine remains unpaid
                  until the cashier or student treasurer receives the cash and
                  confirms it.
                </Text>

                <TouchableOpacity
                  style={notificationStyles.detailsCloseButton}
                  disabled={requestingFineId !== null}
                  onPress={() => {
                    if (cashFine) void submitCashRequest(cashFine);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={notificationStyles.detailsCloseText}>
                    {requestingFineId === shownCashFine.id
                      ? "Saving request..."
                      : "Request Cash Payment"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.markReadButton}
              disabled={requestingFineId !== null}
              onPress={() => setCashFine(null)}
              accessibilityRole="button"
            >
              <Text style={styles.markReadText}>Cancel</Text>
            </TouchableOpacity>
          </PopIn>
        </View>
      </Modal>

      {/* REFUND REQUEST */}
      <RefundRequestModal
        fine={refundFine}
        payment={refundFine ? studentRefunds.paymentFor(refundFine.id) : null}
        onClose={() => setRefundFine(null)}
        onSubmitted={() => {
          void loadRefunds();
          void refreshNotificationCounts();
        }}
      />

      {/* GCASH: CONFIRM BEFORE LEAVING THE APP */}
      <Modal
        visible={gcashFine !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setGcashFine(null)}
      >
        <View style={notificationStyles.detailsOverlay}>
          <PopIn style={notificationStyles.detailsCard}>
            <Text style={notificationStyles.detailsTitle}>Pay with GCash</Text>

            {shownGcashFine && (
              <>
                <Text style={notificationStyles.detailsViolation}>
                  {shownGcashFine.violationName}
                </Text>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Fine</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {shownGcashFine.fineReference}
                  </Text>
                </View>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Amount</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {money(shownGcashFine.amountCentavos)}
                  </Text>
                </View>

                {onlineTestMode && (
                  <Text style={styles.gcashTestBadge}>
                    TEST MODE · no real money is charged
                  </Text>
                )}

                <Text style={styles.gcashNote}>
                  You will pay on PayMongo&apos;s secure GCash page. Your fine is
                  marked paid only after SmartFine confirms the payment with
                  PayMongo.
                  {pendingCashRequest(shownGcashFine.id)
                    ? " Your cashier request is closed once the payment is confirmed."
                    : ""}
                </Text>

                <TouchableOpacity
                  style={styles.gcashButton}
                  onPress={() => {
                    if (gcashFine) void startGcashPayment(gcashFine);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.gcashButtonText}>Continue to GCash</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.markReadButton}
              onPress={() => setGcashFine(null)}
              accessibilityRole="button"
            >
              <Text style={styles.markReadText}>Cancel</Text>
            </TouchableOpacity>
          </PopIn>
        </View>
      </Modal>

      {/* One pop-up shows the GCash progress, then the result, so two
          pop-ups never swap at the same moment. */}
      <Modal
        visible={cashFeedback !== null || paymentBusy !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!paymentBusy) {
            setCashFeedback(null);
          }
        }}
      >
        <View style={notificationStyles.detailsOverlay}>
          <PopIn style={notificationStyles.detailsCard}>
            {paymentBusy ? (
              <View
                style={styles.verifyingBox}
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={paymentBusy.title}
              >
                <ActivityIndicator size="large" color="#0B63E5" />
                <Text style={notificationStyles.detailsTitle}>
                  {paymentBusy.title}
                </Text>
                <Text style={styles.helper}>{paymentBusy.message}</Text>
              </View>
            ) : (
              <>
                {shownCashFeedback?.success ? <SuccessCheck delay={80} /> : null}
                {shownCashFeedback?.failed ? <FailedMark delay={80} /> : null}

                <Text
                  style={[
                    notificationStyles.detailsTitle,
                    (shownCashFeedback?.success || shownCashFeedback?.failed) &&
                      styles.centered,
                  ]}
                >
                  {shownCashFeedback?.title}
                </Text>

                <Text
                  style={[
                    styles.helper,
                    (shownCashFeedback?.success || shownCashFeedback?.failed) &&
                      styles.centered,
                  ]}
                >
                  {shownCashFeedback?.message}
                </Text>

                <TouchableOpacity
                  style={notificationStyles.detailsCloseButton}
                  onPress={() => setCashFeedback(null)}
                  accessibilityRole="button"
                >
                  <Text style={notificationStyles.detailsCloseText}>OK</Text>
                </TouchableOpacity>
              </>
            )}
          </PopIn>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
