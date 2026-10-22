import { useCallback, useEffect, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Href } from "expo-router";

import { FadeIn } from "@/components/motion";
import { Pagination } from "@/components/pagination";
import { SkeletonList } from "@/components/skeleton";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { useLiveReload } from "@/hooks/use-live-updates";
import { haptics } from "@/utils/haptics";
import { formatLogTime as when } from "@/utils/log-time";

import { RESULT_COLORS, styles, TAG_COLORS } from "./activity-log.styles";
import { adminRequest, PopupButton } from "./form";
import { SectionCard } from "./section-card";

type Entry = {
  id: number;
  action: string;
  category: string;
  module: string;
  result: "SUCCESS" | "FAILED" | "DENIED";
  ipAddress: string | null;
  description: string;
  fineId: number | null;
  actor: { id: number | null; name: string; role: string | null } | null;
  createdAt: string;
};

type ActivityResponse = {
  success: boolean;
  message?: string;
  entries?: Entry[];
  total?: number;
  page?: number;
  pageSize?: number;
  pages?: number;
};

const PAGE_SIZE = 20;

const FILTERS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "SECURITY", label: "Security" },
  { key: "ACCOUNTS", label: "Accounts" },
  { key: "FINES", label: "Fines" },
  { key: "PAYMENTS", label: "Payments" },
  { key: "FINE_TYPES", label: "Fine Types" },
  { key: "SYSTEM", label: "System" },
];

const RESULT_FILTERS: { key: string; label: string }[] = [
  { key: "ALL", label: "Any result" },
  { key: "SUCCESS", label: "Success" },
  { key: "FAILED", label: "Failed" },
  { key: "DENIED", label: "Denied" },
];

const RESULT_LABELS: Record<string, string> = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  DENIED: "DENIED",
};

const RANGE_FILTERS: { key: string; label: string; days: number | null }[] = [
  { key: "ALL", label: "Any time", days: null },
  { key: "TODAY", label: "Today", days: 0 },
  { key: "WEEK", label: "Last 7 days", days: 6 },
  { key: "MONTH", label: "Last 30 days", days: 29 },
];

// YYYY-MM-DD on this device's calendar.
function dayText(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function rangeDates(days: number | null) {
  if (days === null) return { from: "", to: "" };

  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);

  return { from: dayText(first), to: dayText(today) };
}

const CATEGORY_LABELS: Record<string, string> = {
  SECURITY: "SECURITY",
  FINES: "FINE",
  PAYMENTS: "PAYMENT",
  ACCOUNTS: "ACCOUNT",
  FINE_TYPES: "FINE TYPE",
  SYSTEM: "SYSTEM",
};

function roleLabel(role: string | null | undefined) {
  if (role === "ADMIN") return "Administrator";
  if (role === "FINES_OFFICER") return "Fines Officer";
  if (role === "STUDENT") return "Student";
  return "";
}

// ==========================================
// ACTIVITY LOG PANEL
// ==========================================

// The Log Trail, newest first: sign-ins and sign-outs, lockouts, verification
// codes, password and email changes, refused requests, account changes and
// the changes to fines, payments and settings. Each entry shows who, what,
// when, the module, the IP address and the result. Read-only.
export function ActivityLogPanel() {
  const router = useGuardedRouter();

  const [category, setCategory] = useState("ALL");
  const [result, setResult] = useState("ALL");
  const [range, setRange] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  // `quiet` is a refresh or live update: keep the list on screen meanwhile.
  const load = useCallback(
    async (quiet = false) => {
      const id = ++requestId.current;

      if (!quiet) setLoading(true);

      const dates = rangeDates(RANGE_FILTERS.find((item) => item.key === range)?.days ?? null);

      const query = new URLSearchParams({
        category,
        result,
        from: dates.from,
        to: dates.to,
        search,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });

      const { ok, data } = await adminRequest<ActivityResponse>(
        `/api/activity-log?${query.toString()}`,
      );

      if (id !== requestId.current) return;

      if (ok) {
        setEntries(data.entries || []);
        setTotal(Number(data.total || 0));
        setPages(Math.max(Number(data.pages || 1), 1));
        setError("");

        // The server moves back to the last page that still exists.
        if (data.page && data.page !== page) setPage(data.page);
      } else if (!quiet) {
        setError(data.message || "Could not load the Log Trail.");
      }

      setLoading(false);
      setRefreshing(false);
    },
    [category, result, range, search, page],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // A search runs a moment after typing stops.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  // New entries appear while the log is open.
  useLiveReload(
    ["fines", "payments", "refunds", "people", "settings", "activity"],
    () => load(true),
  );

  const filtered = category !== "ALL" || result !== "ALL" || range !== "ALL" || !!search;

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const pager = {
    page,
    pageCount: pages,
    pageItems: entries,
    total,
    from: start,
    to: Math.min(start + entries.length - 1, total),
    setPage: (next: number) => setPage(Math.min(Math.max(1, next), pages)),
  };

  return (
    <SectionCard
      title="Log Trail"
      description="Sign-ins and sign-outs, lockouts, verification codes, password and email changes, refused access and every change to accounts, fines, payments and settings: who, what, when, where from and how it went. Entries can't be edited or deleted."
      icon={require("../../assets/icons/reports.png")}
      actions={
        <PopupButton
          label="↻ Refresh"
          busyLabel="Refreshing..."
          variant="outline"
          busy={refreshing}
          disabled={loading || refreshing}
          onPress={() => {
            setRefreshing(true);
            void load(true);
          }}
        />
      }
    >
      <Text style={styles.filterLabel}>TYPE</Text>
      <View style={styles.filters}>
        {FILTERS.map((filter) => {
          const active = filter.key === category;

          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                if (active) return;
                haptics.selection();
                setCategory(filter.key);
                setPage(1);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.filterLabel}>RESULT</Text>
      <View style={styles.filters}>
        {RESULT_FILTERS.map((filter) => {
          const active = filter.key === result;

          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                if (active) return;
                haptics.selection();
                setResult(filter.key);
                setPage(1);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.filterLabel}>DATE</Text>
      <View style={styles.filters}>
        {RANGE_FILTERS.map((filter) => {
          const active = filter.key === range;

          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                if (active) return;
                haptics.selection();
                setRange(filter.key);
                setPage(1);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={styles.search}
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search by person, activity, module or IP address"
        placeholderTextColor="#94A3B8"
        autoCapitalize="none"
        accessibilityLabel="Search the Log Trail"
      />

      {loading && entries.length === 0 ? (
        <SkeletonList label="Loading the Log Trail" count={5} avatar={false} />
      ) : error && entries.length === 0 ? (
        <View style={styles.message}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={() => void load()} accessibilityRole="button">
            <Text style={styles.link}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.message}>
          <Text style={styles.messageTitle}>
            {filtered ? "No matching entries" : "No activity yet"}
          </Text>
          <Text style={styles.messageText}>
            {filtered
              ? "Try another filter or search."
              : "Changes made from now on are listed here."}
          </Text>
        </View>
      ) : (
        <FadeIn key={`${category}|${result}|${range}|${search}|${page}`}>
          {entries.map((entry) => {
            const [color, background] = TAG_COLORS[entry.category] || TAG_COLORS.SYSTEM;
            const [resultColor, resultBackground] =
              RESULT_COLORS[entry.result] || RESULT_COLORS.SUCCESS;
            const role = roleLabel(entry.actor?.role);

            return (
              <View key={entry.id} style={styles.entry}>
                <View style={styles.entryTop}>
                  <View style={styles.tags}>
                    <Text style={[styles.tag, { color, backgroundColor: background }]}>
                      {CATEGORY_LABELS[entry.category] || entry.category}
                    </Text>
                    <Text
                      style={[
                        styles.tag,
                        { color: resultColor, backgroundColor: resultBackground },
                      ]}
                    >
                      {RESULT_LABELS[entry.result] || entry.result}
                    </Text>
                  </View>
                  <Text style={styles.time}>{when(entry.createdAt)}</Text>
                </View>

                <Text style={styles.description}>{entry.description}</Text>

                <Text style={styles.actor}>
                  {entry.actor
                    ? `By ${entry.actor.name}${role ? ` · ${role}` : ""}`
                    : "By the system"}
                </Text>

                <Text style={styles.meta}>
                  {`${entry.module} · ${
                    entry.ipAddress ? `IP ${entry.ipAddress}` : "IP not recorded"
                  }`}
                </Text>

                {entry.fineId !== null && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/admin/fines?fineId=${entry.fineId}` as Href)
                    }
                    accessibilityRole="link"
                    accessibilityLabel={`Open the fine for: ${entry.description}`}
                  >
                    <Text style={styles.link}>Open fine ›</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </FadeIn>
      )}

      <Pagination pager={pager} noun="entries" />

      <Text style={styles.note}>
        Payments made with GCash, student cash requests and refund requests are
        also kept in each payment's own history in Reports.
      </Text>
    </SectionCard>
  );
}
