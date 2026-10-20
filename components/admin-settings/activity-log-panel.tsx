import { useCallback, useEffect, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Href } from "expo-router";

import { FadeIn } from "@/components/motion";
import { Pagination } from "@/components/pagination";
import { SkeletonList } from "@/components/skeleton";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { useLiveReload } from "@/hooks/use-live-updates";
import { haptics } from "@/utils/haptics";

import { styles, TAG_COLORS } from "./activity-log.styles";
import { adminRequest, PopupButton } from "./form";
import { SectionCard } from "./section-card";

type Entry = {
  id: number;
  action: string;
  category: string;
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
  { key: "FINES", label: "Fines" },
  { key: "PAYMENTS", label: "Payments" },
  { key: "ACCOUNTS", label: "Accounts" },
  { key: "FINE_TYPES", label: "Fine Types" },
  { key: "SYSTEM", label: "System" },
];

const CATEGORY_LABELS: Record<string, string> = {
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

function when(value: string) {
  const text = String(value || "").trim();
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)
    ? `${text.replace(" ", "T")}Z`
    : text;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return text;

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

// ==========================================
// ACTIVITY LOG PANEL
// ==========================================

// Who changed what, newest first: fines recorded, edited and cancelled, cash
// received, refunds, accounts and fine types. Read-only.
export function ActivityLogPanel() {
  const router = useGuardedRouter();

  const [category, setCategory] = useState("ALL");
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

      const query = new URLSearchParams({
        category,
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
        setError(data.message || "Could not load the activity log.");
      }

      setLoading(false);
      setRefreshing(false);
    },
    [category, search, page],
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
  useLiveReload(["fines", "payments", "refunds", "people", "settings"], () =>
    load(true),
  );

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
      title="Activity Log"
      description="Every change to fines, payments, refunds, accounts and fine types: who did it and when. Entries can't be edited or deleted."
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

      <TextInput
        style={styles.search}
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search by fine ID, name or action"
        placeholderTextColor="#94A3B8"
        autoCapitalize="none"
        accessibilityLabel="Search the activity log"
      />

      {loading && entries.length === 0 ? (
        <SkeletonList label="Loading the activity log" count={5} avatar={false} />
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
            {search || category !== "ALL" ? "No matching entries" : "No activity yet"}
          </Text>
          <Text style={styles.messageText}>
            {search || category !== "ALL"
              ? "Try another filter or search."
              : "Changes made from now on are listed here."}
          </Text>
        </View>
      ) : (
        <FadeIn key={`${category}|${search}|${page}`}>
          {entries.map((entry) => {
            const [color, background] = TAG_COLORS[entry.category] || TAG_COLORS.SYSTEM;
            const role = roleLabel(entry.actor?.role);

            return (
              <View key={entry.id} style={styles.entry}>
                <View style={styles.entryTop}>
                  <Text style={[styles.tag, { color, backgroundColor: background }]}>
                    {CATEGORY_LABELS[entry.category] || entry.category}
                  </Text>
                  <Text style={styles.time}>{when(entry.createdAt)}</Text>
                </View>

                <Text style={styles.description}>{entry.description}</Text>

                <Text style={styles.actor}>
                  {entry.actor
                    ? `By ${entry.actor.name}${role ? ` · ${role}` : ""}`
                    : "By the system"}
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
