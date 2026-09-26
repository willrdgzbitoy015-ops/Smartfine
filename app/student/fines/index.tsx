import { useCallback, useRef, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE } from "@/constants/api";
import { styles } from "../styles/student-fines.styles";
import { notificationStyles } from "../styles/student-notification.styles";

type FineStatus = "UNPAID" | "PAID" | "PENDING";

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

type FinesResponse = {
  success: boolean;
  message?: string;
  fines: Fine[];
  summary: {
    outstandingAmountCentavos: number;
    payableAmountCentavos: number;
  };
};

const filters: { label: string; value: FineStatus }[] = [
  { label: "Unpaid", value: "UNPAID" },
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
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

  if (Number.isNaN(date.getTime())) return "Date unavailable";

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
  const router = useRouter();

  const [data, setData] = useState<FinesResponse | null>(null);
  const [filter, setFilter] = useState<FineStatus>("UNPAID");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);

  const requestRef = useRef<AbortController | null>(null);

  const loadFines = useCallback(async () => {
    requestRef.current?.abort();

    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(true);
    setError("");
    setAccessDenied(false);

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

      const text = await response.text();

      if (requestRef.current !== controller) return;
      if (controller.signal.aborted) return;

      if (response.status === 401 || response.status === 403) {
        setData(null);
        setAccessDenied(true);
      }

      let body: FinesResponse;

      try {
        body = JSON.parse(text);
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

        if (timedOut) {
          setError("The request timed out. Please try again.");
        }
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFines();

      return () => {
        requestRef.current?.abort();
        requestRef.current = null;
      };
    }, [loadFines]),
  );

  const visibleFines =
    data?.fines.filter((fine) => fine.status === filter) ?? [];
  const outstanding = data?.summary.outstandingAmountCentavos;
  const payable = data?.summary.payableAmountCentavos ?? 0;

  const markFineRead = async (fineId: number) => {
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
                  ? { ...fine, isRead: true, readAt: body.readAt }
                  : fine,
              ),
            }
          : current,
      );

      setSelectedFine((current) =>
        current?.id === fineId
          ? { ...current, isRead: true, readAt: body.readAt }
          : current,
      );
    } catch (caught) {
      Alert.alert(
        "Unable to update",
        caught instanceof Error ? caught.message : "Please try again.",
      );
    }
  };

  const openFineDetails = (fine: Fine) => {
    setSelectedFine(fine);

    if (!fine.isRead) {
      void markFineRead(fine.id);
    }
  };

  const paymentNotAvailable = () => {
    Alert.alert(
      "Payment",
      "Payment processing is not available yet. No payment has been submitted.",
    );
  };

  const returnToLogin = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "userId",
        "userRole",
        "userEmail",
      ]);

      router.replace("/login");
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
                style={styles.filterTouch}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(item.value)}
              >
                <View
                  style={[styles.filterButton, active && styles.filterActive]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
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
              onRefresh={() => void loadFines()}
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
                    void returnToLogin();
                  } else {
                    void loadFines();
                  }
                }}
              >
                <Text style={styles.retryText}>
                  {accessDenied ? "Back to Login" : "Try Again"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && !data ? (
            <View style={styles.loadingPanel}>
              <ActivityIndicator size="large" color="#123266" />
              <Text style={styles.helper}>Loading your fines…</Text>
            </View>
          ) : (
            <>
              {visibleFines.map((fine) => (
                <View key={fine.id} style={styles.fineCard}>
                  <View style={styles.fineInfo}>
                    <View style={notificationStyles.fineTitleRow}>
                      <Text style={styles.violation}>{fine.violationName}</Text>

                      <Text
                        style={[
                          notificationStyles.fineReadLabel,
                          fine.isRead
                            ? notificationStyles.readLabel
                            : notificationStyles.newLabel,
                        ]}
                      >
                        {fine.isRead ? "READ" : "NEW"}
                      </Text>
                    </View>

                    {!fine.isRead && (
                      <TouchableOpacity
                        style={notificationStyles.markReadButton}
                        onPress={() => void markFineRead(fine.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Mark ${fine.violationName} as read`}
                      >
                        <Text style={notificationStyles.markReadText}>
                          Mark as read
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={notificationStyles.viewDetailsButton}
                      onPress={() => openFineDetails(fine)}
                      accessibilityRole="button"
                      accessibilityLabel={`View details for ${fine.violationName}`}
                    >
                      <Text style={notificationStyles.viewDetailsText}>
                        View details
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.reference}>{fine.fineReference}</Text>

                    <Text style={styles.timestamp}>
                      {dateLabel(fine.recordedAt)}
                    </Text>

                    {fine.status === "PAID" && fine.paidAt && (
                      <Text style={styles.paidDate}>
                        Paid: {dateLabel(fine.paidAt)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.amountArea}>
                    <Text style={styles.amount}>
                      {money(fine.amountCentavos)}
                    </Text>

                    {fine.status === "UNPAID" ? (
                      <TouchableOpacity
                        style={styles.payTouch}
                        accessibilityRole="button"
                        accessibilityLabel={`Pay ${fine.violationName}`}
                        onPress={paymentNotAvailable}
                      >
                        <View style={styles.payButton}>
                          <Text style={styles.payText}>Pay</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <Text
                        style={[
                          styles.status,
                          fine.status === "PAID"
                            ? styles.paidStatus
                            : styles.pendingStatus,
                        ]}
                      >
                        {fine.status === "PAID" ? "Paid" : "Pending"}
                      </Text>
                    )}
                  </View>
                </View>
              ))}

              {data && visibleFines.length === 0 && (
                <View style={styles.emptyPanel}>
                  <Text style={styles.emptyTitle}>
                    No {filter.toLowerCase()} fines
                  </Text>

                  <Text style={styles.helper}>
                    {filter === "UNPAID"
                      ? "You have no unpaid fines in this list."
                      : filter === "PAID"
                        ? "Fines marked paid will appear here."
                        : "No fines are currently marked pending."}
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Outstanding</Text>

            <Text style={styles.totalAmount}>
              {outstanding !== undefined ? money(outstanding) : "—"}
            </Text>

            {data && outstanding === 0 && (
              <Text style={styles.totalHelper}>No outstanding balance</Text>
            )}

            {data && outstanding !== undefined && outstanding > payable && (
              <Text style={styles.totalHelper}>
                Includes pending fines. Pending fines cannot be paid again here.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.payNowButton,
                (!data || payable <= 0) && styles.disabled,
              ]}
              disabled={!data || payable <= 0}
              onPress={paymentNotAvailable}
              accessibilityRole="button"
            >
              <Text style={styles.payNowText}>PAY NOW</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <SafeAreaView style={styles.bottomArea} edges={["bottom"]}>
          <View style={styles.bottomNavigation}>
            {navigation.map((item) => {
              const active = item.label === "Fines";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={styles.navItem}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    if (item.label === "Home") {
                      router.replace("/student/dashboard");
                    } else if (active) {
                      void loadFines();
                    } else {
                      Alert.alert(
                        item.label,
                        "This feature is not available yet.",
                      );
                    }
                  }}
                >
                  <Image
                    source={item.icon}
                    style={styles.navIcon}
                    resizeMode="contain"
                  />

                  <Text style={styles.navLabel}>{item.label}</Text>

                  <View
                    style={[
                      styles.indicator,
                      !active && styles.hiddenIndicator,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>

      <Modal
        visible={selectedFine !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFine(null)}
      >
        <View style={notificationStyles.detailsOverlay}>
          <View style={notificationStyles.detailsCard}>
            <Text style={notificationStyles.detailsTitle}>Fine Details</Text>

            {selectedFine && (
              <>
                <Text style={notificationStyles.detailsViolation}>
                  {selectedFine.violationName}
                </Text>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Reference</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {selectedFine.fineReference}
                  </Text>
                </View>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Amount</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {money(selectedFine.amountCentavos)}
                  </Text>
                </View>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Status</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {selectedFine.status}
                  </Text>
                </View>

                <View style={notificationStyles.detailsRow}>
                  <Text style={notificationStyles.detailsLabel}>Issued</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {dateLabel(selectedFine.recordedAt)}
                  </Text>
                </View>

                {selectedFine.paidAt && (
                  <View style={notificationStyles.detailsRow}>
                    <Text style={notificationStyles.detailsLabel}>Paid</Text>
                    <Text style={notificationStyles.detailsValue}>
                      {dateLabel(selectedFine.paidAt)}
                    </Text>
                  </View>
                )}

                <View style={notificationStyles.detailsRemarks}>
                  <Text style={notificationStyles.detailsLabel}>Remarks</Text>
                  <Text style={notificationStyles.detailsValue}>
                    {selectedFine.remarks || "No additional remarks."}
                  </Text>
                </View>

                <Text
                  style={[
                    notificationStyles.detailsReadStatus,
                    selectedFine.isRead
                      ? notificationStyles.readLabel
                      : notificationStyles.newLabel,
                  ]}
                >
                  {selectedFine.isRead ? "READ" : "NEW"}
                </Text>
              </>
            )}

            <TouchableOpacity
              style={notificationStyles.detailsCloseButton}
              onPress={() => setSelectedFine(null)}
              accessibilityRole="button"
            >
              <Text style={notificationStyles.detailsCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
