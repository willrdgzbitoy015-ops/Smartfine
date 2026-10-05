import { useCallback, useRef, useState } from "react";

import {
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { type Href, useFocusEffect } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";

import { StatusBar } from "expo-status-bar";

import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { FadeIn, TabIndicator } from "@/components/motion";
import { SkeletonList } from "@/components/skeleton";
import { API_BASE } from "@/constants/api";
import { haptics } from "@/utils/haptics";

import { useResponsiveStyles } from "./records.styles";
import { HomeTabBadge } from "@/components/notification-badge";

// ==========================================
// TYPES
// ==========================================

type Filter = "ALL" | "UNPAID" | "PAID";

type Fine = {
  id: number;
  officer_id: number;
  fine_reference: string;

  student_name: string;
  student_number: string;

  grade_level?: string | null;
  section?: string | null;

  violation_name: string;
  amount_centavos: number;

  status: string;

  recordedAt?: string | null;
  created_at?: string | null;
  paid_at?: string | null;

  transaction_id?: string | null;
};

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "ALL" },
  { label: "Unpaid", value: "UNPAID" },
  { label: "Paid", value: "PAID" },
];

const NAV_ITEMS = [
  {
    label: "Home",
    route: "/officer/dashboard",
    icon: require("../../../assets/icons/dashboard.png"),
  },
  {
    label: "Students",
    route: "/officer/student",
    icon: require("../../../assets/icons/students.png"),
  },
  {
    label: "Scan",
    route: "/officer/qr-scanner",
    icon: require("../../../assets/icons/qr-codeWhite.png"),
  },
  {
    label: "Profile",
    route: "/officer/profile",
    icon: require("../../../assets/icons/user.png"),
  },
  {
    label: "Records",
    route: "/officer/records",
    icon: require("../../../assets/icons/reports.png"),
  },
];

// ==========================================
// FORMATTING
// ==========================================

function money(centavos: number) {
  const amount = Number(centavos);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `₱ ${(amount / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseTimestamp(value?: string | null) {
  if (!value) return null;

  let normalized = value.trim();

  // A date-only value has no recorded time.
  // Interpret it as a Philippine calendar date.
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized += "T00:00:00+08:00";
  } else if (
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(normalized)
  ) {
    // SQLite CURRENT_TIMESTAMP is UTC.
    normalized = normalized.replace(" ", "T") + "Z";
  }

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function dateLabel(value?: string | null) {
  const date = parseTimestamp(value);

  if (!date) return "Unavailable";

  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeLabel(value?: string | null) {
  if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return "";
  }

  const date = parseTimestamp(value);

  if (!date) return "";

  return date.toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function statusLabel(value: string) {
  return String(value || "UNKNOWN")
    .trim()
    .toUpperCase();
}

// ==========================================
// SCREEN
// ==========================================

export default function OfficerRecordsScreen() {
  const styles = useResponsiveStyles();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  const [records, setRecords] = useState<Fine[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const requestRef = useRef<AbortController | null>(null);

  const loadRecords = useCallback(async (refresh = false) => {
    requestRef.current?.abort();

    const controller = new AbortController();
    requestRef.current = controller;

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    try {
      const stored = await AsyncStorage.multiGet([
        "token",
        "userId",
        "userRole",
      ]);

      const values = Object.fromEntries(stored);

      const token = values.token;
      const officerId = Number(values.userId);

      if (
        !token ||
        !Number.isInteger(officerId) ||
        officerId <= 0 ||
        values.userRole !== "FINES_OFFICER"
      ) {
        throw new Error(
          "Your officer session is unavailable. Please sign in again.",
        );
      }

      const response = await fetch(`${API_BASE}/api/fines`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        signal: controller.signal,
      });

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The server returned an unexpected response. Check your API connection.",
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load recorded fines.");
      }

      if (!Array.isArray(data.fines)) {
        throw new Error("The server did not return a valid fines list.");
      }

      const officerRecords = (data.fines as Fine[])
        .filter((fine) => Number(fine.officer_id) === officerId)
        .sort((a, b) => {
          const first =
            parseTimestamp(a.recordedAt || a.created_at)?.getTime() || 0;

          const second =
            parseTimestamp(b.recordedAt || b.created_at)?.getTime() || 0;

          return second - first || Number(b.id) - Number(a.id);
        });

      if (!controller.signal.aborted) {
        setRecords(officerRecords);
      }
    } catch (err) {
      if (requestRef.current !== controller) return;

      if (controller.signal.aborted && !timedOut) return;

      setError(
        timedOut
          ? "The request timed out. Check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Could not load recorded fines.",
      );
    } finally {
      clearTimeout(timeout);

      if (requestRef.current === controller) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRecords();

      return () => {
        requestRef.current?.abort();
        requestRef.current = null;
      };
    }, [loadRecords]),
  );

  const visibleRecords = records.filter((fine) => {
    return filter === "ALL" || statusLabel(fine.status) === filter;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.phone}>
        <View style={styles.header}>
          <Text style={styles.title}>My Recorded{"\n"}Fines</Text>

          <View style={styles.filters}>
            {FILTERS.map((item) => {
              const active = filter === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  activeOpacity={0.75}
                  onPress={() => {
                    if (!active) {
                      haptics.selection();
                    }

                    setFilter(item.value);
                  }}
                  style={styles.filterTouch}
                >
                  <View
                    style={[
                      styles.filterButton,
                      active && styles.filterButtonActive,
                    ]}
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
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadRecords(true)}
              tintColor="#173A73"
              colors={["#173A73"]}
            />
          }
        >
          {!!error && (
            <View style={styles.errorPanel}>
              <Text style={styles.errorText}>{error}</Text>

              <TouchableOpacity
                accessibilityRole="button"
                style={styles.retryButton}
                onPress={() => void loadRecords()}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && records.length === 0 ? (
            <SkeletonList
              label="Loading recorded fines"
              count={4}
              avatar={false}
              itemStyle={styles.card}
            />
          ) : (
            <>
              {visibleRecords.map((fine, index) => {
                const status = statusLabel(fine.status);

                const recordedAt = fine.recordedAt || fine.created_at;
                const recordedTime = timeLabel(recordedAt);

                const gradeAndSection = [fine.grade_level, fine.section]
                  .filter(Boolean)
                  .join(" - ");

                return (
                  <FadeIn key={fine.id} index={index} style={styles.card}>
                    <View style={styles.details}>
                      <Text style={styles.studentName}>
                        {fine.student_name}
                      </Text>

                      <Text style={styles.studentMeta}>
                        {gradeAndSection ? `${gradeAndSection} | ` : ""}
                        ID: {fine.student_number || "Unavailable"}
                      </Text>

                      {!!fine.transaction_id && (
                        <Text style={styles.transactionText}>
                          Transaction ID: {fine.transaction_id}
                        </Text>
                      )}

                      <Text style={styles.violation}>
                        {fine.violation_name}
                      </Text>

                      <Text style={styles.recordedDate}>
                        Date Recorded: {dateLabel(recordedAt)}
                      </Text>

                      {!!recordedTime && (
                        <Text style={styles.recordedTime}>{recordedTime}</Text>
                      )}
                    </View>

                    <View style={styles.amountArea}>
                      <Text
                        style={[
                          styles.status,
                          status === "PAID" && styles.paid,
                          status === "UNPAID" && styles.unpaid,
                          status === "CANCELLED" && styles.cancelled,
                        ]}
                      >
                        {status}
                      </Text>

                      <Text style={styles.amount}>
                        {money(fine.amount_centavos)}
                      </Text>

                      {status === "PAID" && (
                        <View style={styles.paidDateArea}>
                          <Text style={styles.paidDate}>Date Paid:</Text>
                          <Text style={styles.paidDate}>
                            {dateLabel(fine.paid_at)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </FadeIn>
                );
              })}

              {!loading && !error && visibleRecords.length === 0 && (
                <FadeIn style={styles.emptyPanel}>
                  <Text style={styles.emptyTitle}>
                    {filter === "ALL"
                      ? "No recorded fines yet"
                      : `No ${filter.toLowerCase()} fines`}
                  </Text>

                  <Text style={styles.helperText}>
                    {filter === "ALL"
                      ? "Fines you record will appear here."
                      : "Try another filter to view your records."}
                  </Text>
                </FadeIn>
              )}
            </>
          )}
        </ScrollView>

        <View style={[styles.bottomArea, { paddingBottom: insets.bottom }]}>
          <View style={styles.bottomNavigation}>
            {NAV_ITEMS.map((item) => {
              const active = item.label === "Records";

              return (
                <TouchableOpacity
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: active }}
                  activeOpacity={0.75}
                  style={styles.navItem}
                  onPress={() => {
                    if (!active) {
                      router.replace(item.route as Href);
                    }
                  }}
                >
                  <Image
                    source={item.icon}
                    style={styles.navIcon}
                    resizeMode="contain"
                  />

                  <Text style={styles.navLabel}>{item.label}</Text>
                  <HomeTabBadge label={item.label} />

                  <TabIndicator
                    active={active}
                    style={styles.activeIndicator}
                    hiddenStyle={styles.hiddenIndicator}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
