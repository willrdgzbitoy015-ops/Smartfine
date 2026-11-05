import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  type StyleProp,
  Text,
  TouchableOpacity,
  View,
  type ViewInstance,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef, releaseCapture } from "react-native-view-shot";

import AppIcon from "@/components/AppIcon";
import { API_BASE } from "@/constants/api";
import { apiFetch } from "@/utils/api-fetch";
import { formatPeso } from "@/utils/format-peso";
import { haptics } from "@/utils/haptics";

import { NAVY, styles } from "./payment-receipt.styles";

// ==========================================
// PAYMENT RECEIPT
// The digital receipt of one successful payment (GCash or cash): a card that
// can be saved as a PNG picture. Used by the Student (Fine Details) and the
// Administrator (Transaction Voucher). The server only sends it to the student
// who paid or an Administrator.
//
//   - Phone: "Save Receipt" puts the picture in the photo gallery,
//     "Share" opens the share sheet.
//   - Web: "Save Receipt" downloads the PNG.
// ==========================================

type Receipt = {
  id: number;
  paymentReference: string;
  studentName: string;
  studentNumber: string;
  fineReference: string;
  violationName: string;
  amountCentavos: number;
  method: "CASH" | "GCASH";
  methodLabel: string;
  gatewayReference: string | null;
  paidAt: string | null;
  confirmedBy: string | null;
  schoolName: string;
  refunded: boolean;
  refundedAt: string | null;
};

type Notice = { kind: "success" | "error"; text: string } | null;

type Way = "saved" | "shared" | "downloaded";

// "Nov 5, 2026, 3:11 PM", in school time. The server stores UTC.
function dateTime(value: string | null) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(text) &&
      !/[zZ]|[+-]\d{2}:?\d{2}$/.test(text)
      ? `${text.replace(" ", "T")}Z`
      : text,
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fileNameOf(receipt: Receipt) {
  return `SmartFine-Receipt-${receipt.paymentReference.replace(/[^A-Za-z0-9_-]/g, "")}.png`;
}

// Only the Log Trail needs to know; a failure here never stops the user.
async function tellServer(paymentId: number, how: Way) {
  try {
    await apiFetch(`${API_BASE}/api/payments/${paymentId}/receipt/saved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ how }),
    });
  } catch {
    // The picture is already saved or shared.
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable>
        {value}
      </Text>
    </View>
  );
}

// ==========================================
// SCREEN
// ==========================================

export function ReceiptModal({
  paymentId,
  onClose,
}: {
  // The payment to show; the screen is closed while this is null.
  paymentId: number | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const cardRef = useRef<ViewInstance | null>(null);

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"save" | "share" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (paymentId === null) {
      return undefined;
    }

    let cancelled = false;

    setReceipt(null);
    setError("");
    setNotice(null);
    setLoading(true);

    (async () => {
      try {
        const response = await apiFetch(
          `${API_BASE}/api/payments/${paymentId}/receipt`,
          {
            headers: { Accept: "application/json" },
          },
        );
        const body = await response.json().catch(() => null);

        if (cancelled) {
          return;
        }

        if (!response.ok || !body?.success || !body.receipt) {
          setError(body?.message || "The receipt could not be loaded.");
        } else {
          setReceipt(body.receipt);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not reach the SmartFine server. Check your connection and try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentId, attempt]);

  // The card as a PNG: a data URI on the web, a temporary file on a phone.
  const capture = useCallback(
    () =>
      captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: Platform.OS === "web" ? "data-uri" : "tmpfile",
      }),
    [],
  );

  const handleSave = async () => {
    if (!receipt || busy) {
      return;
    }

    setBusy("save");
    setNotice(null);

    try {
      if (Platform.OS === "web") {
        const uri = await capture();
        const anchor = document.createElement("a");

        anchor.href = uri;
        anchor.download = fileNameOf(receipt);
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        void tellServer(receipt.id, "downloaded");
        haptics.success();
        setNotice({
          kind: "success",
          text: "Receipt downloaded as a PNG picture.",
        });

        return;
      }

      // Write-only access is enough to add a picture to the gallery.
      const permission = await MediaLibrary.requestPermissionsAsync(true, [
        "photo",
      ]);

      if (!permission.granted) {
        setNotice({
          kind: "error",
          text: "SmartFine needs your permission to save pictures to your gallery. Allow it in your phone's Settings, or use Share to send or keep the receipt another way.",
        });

        return;
      }

      const uri = await capture();

      try {
        await MediaLibrary.Asset.create(uri);
      } finally {
        try {
          releaseCapture(uri);
        } catch {
          // A leftover temporary file is cleaned up by the system.
        }
      }

      void tellServer(receipt.id, "saved");
      haptics.success();
      setNotice({ kind: "success", text: "Receipt saved to your gallery." });
    } catch {
      setNotice({
        kind: "error",
        text: "The receipt could not be saved. Please try again, or use Share instead.",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    if (!receipt || busy) {
      return;
    }

    setBusy("share");
    setNotice(null);

    try {
      if (!(await Sharing.isAvailableAsync())) {
        setNotice({
          kind: "error",
          text: "Sharing is not available on this device.",
        });

        return;
      }

      const uri = await capture();

      try {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          UTI: "public.png",
          dialogTitle: "Share SmartFine receipt",
        });
      } finally {
        try {
          releaseCapture(uri);
        } catch {
          // A leftover temporary file is cleaned up by the system.
        }
      }

      void tellServer(receipt.id, "shared");
    } catch {
      setNotice({
        kind: "error",
        text: "The receipt could not be shared. Please try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  const paidOn = receipt ? dateTime(receipt.paidAt) : "";
  const refundedOn = receipt ? dateTime(receipt.refundedAt) : "";

  return (
    <Modal
      visible={paymentId !== null}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Receipt
          </Text>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close receipt"
          >
            <AppIcon name="close" size="md" color={NAVY} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={NAVY} />
          </View>
        ) : error || !receipt ? (
          <View style={styles.centered}>
            <AppIcon name="failed" size={40} color="#D32F2F" />

            <Text style={styles.errorText}>
              {error || "The receipt could not be loaded."}
            </Text>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { alignSelf: "stretch", marginTop: 16, paddingHorizontal: 24 },
              ]}
              onPress={() => setAttempt((count) => count + 1)}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 16 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Everything inside this frame is the saved picture. */}
            <View ref={cardRef} collapsable={false} style={styles.shot}>
              <View style={styles.card}>
                <View style={styles.checkCircle}>
                  <AppIcon name="check" size={38} color="#FFFFFF" />
                </View>

                <Text style={styles.successTitle}>Payment Successful</Text>

                <Text style={styles.amount}>
                  {formatPeso(receipt.amountCentavos / 100)}
                </Text>

                {!!paidOn && <Text style={styles.paidOn}>{paidOn}</Text>}

                {receipt.refunded && (
                  <>
                    <View style={styles.refundedPill}>
                      <Text style={styles.refundedPillText}>REFUNDED</Text>
                    </View>

                    {!!refundedOn && (
                      <Text style={styles.refundedDate}>
                        Refunded on {refundedOn}
                      </Text>
                    )}
                  </>
                )}

                <View style={styles.divider} />

                <View style={styles.rows}>
                  <Row
                    label="Payment reference"
                    value={receipt.paymentReference}
                  />
                  <Row label="Student" value={receipt.studentName} />
                  <Row label="Student number" value={receipt.studentNumber} />
                  <Row label="Fine reference" value={receipt.fineReference} />
                  <Row label="Violation" value={receipt.violationName} />
                  <Row label="Payment method" value={receipt.methodLabel} />
                  {!!receipt.gatewayReference && (
                    <Row
                      label="PayMongo reference"
                      value={receipt.gatewayReference}
                    />
                  )}
                  {!!paidOn && <Row label="Paid on" value={paidOn} />}
                  {!!receipt.confirmedBy && (
                    <Row label="Received by" value={receipt.confirmedBy} />
                  )}
                </View>

                <View style={styles.divider} />

                <View style={styles.brand}>
                  <View style={styles.logoBadge}>
                    <Image
                      source={require("../../assets/branding/smartfine-logo.png")}
                      style={{
                        position: "absolute",
                        width: 325,
                        height: 325,
                        left: -58,
                        top: -103,
                      }}
                      accessibilityLabel="SmartFine"
                    />
                  </View>

                  {!!receipt.schoolName && (
                    <Text style={styles.schoolName}>{receipt.schoolName}</Text>
                  )}

                  <Text style={styles.footnote}>
                    Computer-generated receipt. No signature needed.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.primaryButton, !!busy && styles.buttonDisabled]}
                onPress={() => void handleSave()}
                disabled={!!busy}
                accessibilityRole="button"
                accessibilityLabel="Save Receipt"
              >
                {busy === "save" ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <AppIcon name="download" size="md" color="#FFFFFF" />
                )}

                <Text style={styles.primaryButtonText}>
                  {busy === "save" ? "Saving..." : "Save Receipt"}
                </Text>
              </TouchableOpacity>

              {Platform.OS !== "web" && (
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    !!busy && styles.buttonDisabled,
                  ]}
                  onPress={() => void handleShare()}
                  disabled={!!busy}
                  accessibilityRole="button"
                  accessibilityLabel="Share Receipt"
                >
                  {busy === "share" ? (
                    <ActivityIndicator color={NAVY} />
                  ) : (
                    <AppIcon name="share" size="md" color={NAVY} />
                  )}

                  <Text style={styles.secondaryButtonText}>
                    {busy === "share" ? "Preparing..." : "Share"}
                  </Text>
                </TouchableOpacity>
              )}

              {!!notice && (
                <Text
                  style={[
                    styles.message,
                    notice.kind === "success"
                      ? styles.messageSuccess
                      : styles.messageError,
                  ]}
                  accessibilityLiveRegion="polite"
                >
                  {notice.text}
                </Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ==========================================
// BUTTON
// "View Receipt", the same on both screens.
// ==========================================

export function ViewReceiptButton({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      style={[styles.viewButton, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View Receipt"
    >
      <AppIcon name="fines" size="sm" color={NAVY} />

      <Text style={styles.viewButtonText}>View Receipt</Text>
    </TouchableOpacity>
  );
}
