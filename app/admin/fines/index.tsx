import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/hooks/use-auth";
import { API_BASE } from "@/constants/api";
import LogoutModal from "@/components/logout-modal";
import WarningModal from "@/components/warningmodal";
import { styles } from "./fines.styles";
// ==========================================
// TYPES
// ==========================================
type Fine = {
  id: number;
  fine_reference: string;
  student_id: number;
  student_number: string | null;
  student_username: string | null;
  student_name: string;
  violation_type_id: number;
  violation_code: string | null;
  violation_name: string;
  amount_centavos: number;
  amount: number;
  remarks: string | null;
  officer_id: number | null;
  officer_name: string;
  issued_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  status: string;
};
type ViolationType = {
  id: number;
  violation_code: string | null;
  violation_name: string;
  amount_centavos: number;
  amount: number;
};
type NavItem = {
  label: string;
  route: string;
  icon?: any;
};
// ==========================================
// FINES DIRECTORY SCREEN
// ==========================================
export default function FinesDirectory() {
  const router = useRouter();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  // ==========================================
  // LOGOUT MODAL
  // ==========================================
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  // ==========================================
  // WARNING MODAL
  // ==========================================
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningTitle, setWarningTitle] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  // ==========================================
  // DATA
  // ==========================================
  const [fines, setFines] = useState<Fine[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  // ==========================================
  // FILTERS
  // ==========================================
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedViolationId, setSelectedViolationId] = useState<number | null>(
    null,
  );
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [violationMenuOpen, setViolationMenuOpen] = useState(false);
  // ==========================================
  // PAGE STATE
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [fineNotifications, setFineNotifications] = useState<Record<number, { id: number; isRead: boolean }>>({});
  const [paymentNotifications, setPaymentNotifications] = useState<Record<number, { id: number; isRead: boolean }>>({});
  const [pendingFineIds, setPendingFineIds] = useState<Set<number>>(new Set());
  const [focusVersion, setFocusVersion] = useState(0);
  useFocusEffect(useCallback(() => {
    setFocusVersion((current) => current + 1);
  }, []));
  // ==========================================
  // NAVIGATION ITEMS
  // ==========================================
  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      route: "/admin/dashboard",
      icon: require("../../../assets/icons/dashboard.png"),
    },
    {
      label: "Students",
      route: "/admin/students",
      icon: require("../../../assets/icons/students.png"),
    },
    {
      label: "Fines",
      route: "/admin/fines",
      icon: require("../../../assets/icons/fines.png"),
    },
    {
      label: "QR Scanner",
      route: "/admin/qr-scanner",
      icon: require("../../../assets/icons/qr-codeWhite.png"),
    },
    {
      label: "Reports",
      route: "/admin/reports",
      icon: require("../../../assets/icons/reports.png"),
    },
    {
      label: "Settings",
      route: "/admin/settings",
      icon: require("../../../assets/icons/settings.png"),
    },
    {
      label: "Officers",
      route: "/admin/officers",
      icon: require("../../../assets/icons/officers.png"),
    },
  ];
  // ==========================================
  // LOAD PAGE
  // ==========================================
  useEffect(() => {
    loadPageData(true);
  }, []);
  useEffect(() => {
    let mounted = true;
    let fetching = false;
    const loadNotifications = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          if (mounted) {
            setUnreadCount(0);
            setFineNotifications({});
            setPaymentNotifications({});
            setPendingFineIds(new Set());
          }
          return;
        }
        const fetchType = async (type: "FINE" | "PAYMENT") => {
          const byFine: Record<number, { id: number; isRead: boolean }> = {};
          let offset = 0;
          let count = 0;
          while (true) {
          const response = await fetch(
            `${API_BASE}/api/admin/notifications?type=${type}&limit=100&offset=${offset}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (!data.success || !Array.isArray(data.notifications)) {
            throw new Error("Invalid notification response.");
          }
          if (offset === 0) count = Number(data.unreadCount);
          for (const item of data.notifications) {
            const fineId = Number(item.fineId);
            if (Number.isSafeInteger(fineId) && fineId > 0 && !byFine[fineId]) {
              byFine[fineId] = { id: Number(item.id), isRead: item.isRead === true };
            }
          }
          if (!data.hasMore) break;
          const next = Number(data.nextOffset);
          if (!Number.isSafeInteger(next) || next <= offset) {
            throw new Error("Invalid notification page.");
          }
          offset = next;
          }
          return { byFine, count };
        };
        const [fineResult, paymentResult, pendingResponse] = await Promise.all([
          fetchType("FINE"),
          fetchType("PAYMENT"),
          fetch(`${API_BASE}/api/payments/cash-requests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!pendingResponse.ok) throw new Error(`HTTP ${pendingResponse.status}`);
        const pendingData = await pendingResponse.json();
        if (!pendingData.success || !Array.isArray(pendingData.payments)) {
          throw new Error("Invalid cash request response.");
        }
        if (mounted) {
          setFineNotifications(fineResult.byFine);
          setPaymentNotifications(paymentResult.byFine);
          setPendingFineIds(new Set(pendingData.payments.map((row: { fineId: number }) => Number(row.fineId))));
          if (Number.isSafeInteger(fineResult.count) && Number.isSafeInteger(paymentResult.count)) {
            setUnreadCount(fineResult.count + paymentResult.count);
          }
        }
      } catch (error) {
        console.error("Fine notification list error:", error);
      } finally {
        fetching = false;
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [focusVersion]);
  const loadPageData = async (showFullLoader = false) => {
    if (loading && !showFullLoader) {
      return;
    }
    if (refreshing) {
      return;
    }
    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setErrorMessage("");
      const [finesResponse, violationsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/fines`),
        fetch(`${API_BASE}/api/fines/options/violations`),
      ]);
      const finesData = await finesResponse.json();
      const violationsData = await violationsResponse.json();
      // ======================================
      // FINES ERROR
      // ======================================
      if (!finesResponse.ok || !finesData.success) {
        throw new Error(finesData.message || "Failed to load fines.");
      }
      // ======================================
      // VIOLATION TYPES ERROR
      // ======================================
      if (!violationsResponse.ok || !violationsData.success) {
        throw new Error(
          violationsData.message || "Failed to load violation types.",
        );
      }
      // ======================================
      // SAVE DATA
      // ======================================
      setFines(finesData.fines || []);
      setViolationTypes(violationsData.violations || []);
    } catch (error: any) {
      console.error("Load fines directory error:", error);
      if (showFullLoader || fines.length === 0) {
        setErrorMessage(
          error?.message || "Could not connect to the SmartFine server.",
        );
      } else {
        setWarningTitle("Refresh Failed");
        setWarningMessage(
          error?.message || "Could not refresh the fines directory.",
        );
        setShowWarningModal(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  // ==========================================
  // REFRESH DIRECTORY
  // ==========================================
  const handleRefresh = async () => {
    if (loading || refreshing) {
      return;
    }
    setStatusMenuOpen(false);
    setViolationMenuOpen(false);
    await loadPageData(false);
    setFocusVersion((current) => current + 1);
  };
  // ==========================================
  // FILTER FINES
  // ==========================================
  const filteredFines = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return fines.filter((fine) => {
      // ==================================
      // SEARCH
      // ==================================
      if (search) {
        const searchable = [
          fine.fine_reference,
          fine.student_number,
          fine.student_username,
          fine.student_name,
          fine.violation_name,
          fine.officer_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(search)) {
          return false;
        }
      }
      // ==================================
      // STATUS FILTER
      // ==================================
      if (selectedStatus === "PENDING_CASH") {
        if (!pendingFineIds.has(Number(fine.id))) return false;
      } else if (selectedStatus !== "ALL" && String(fine.status).toUpperCase() !== selectedStatus) {
        return false;
      }
      // ==================================
      // VIOLATION FILTER
      // ==================================
      if (selectedViolationId !== null) {
        if (Number(fine.violation_type_id) !== selectedViolationId) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => Number(pendingFineIds.has(Number(b.id))) - Number(pendingFineIds.has(Number(a.id))));
  }, [fines, searchText, selectedStatus, selectedViolationId, pendingFineIds]);
  const pendingCount = pendingFineIds.size;
  const unpaidCount = fines.filter((fine) => String(fine.status).toUpperCase() === "UNPAID").length;
  // ==========================================
  // SELECTED VIOLATION LABEL
  // ==========================================
  const selectedViolationName = useMemo(() => {
    if (selectedViolationId === null) {
      return "Violation Type";
    }
    const violation = violationTypes.find(
      (item) => item.id === selectedViolationId,
    );
    return violation?.violation_name || "Violation Type";
  }, [violationTypes, selectedViolationId]);
  // ==========================================
  // OPEN ADD FINE
  // ==========================================
  const handleAddFine = () => {
    if (loading || refreshing) {
      return;
    }
    router.push("/admin/fines/add" as any);
  };
  // ==========================================
  // OPEN FINE DETAILS
  // ==========================================
  const handleOpenFine = (fineId: number) => {
    if (loading || refreshing) {
      return;
    }
    router.push(`/admin/fines/${fineId}` as any);
  };
  // ==========================================
  // OPEN LOGOUT MODAL
  // ==========================================
  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  // ==========================================
  // CANCEL LOGOUT
  // ==========================================
  const handleCancelLogout = () => {
    if (logoutLoading) {
      return;
    }
    setShowLogoutModal(false);
  };
  // ==========================================
  // PERFORM LOGOUT
  // ==========================================
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
  // ==========================================
  // MONEY
  // ==========================================
  const formatMoney = (amount: number) => {
    return `₱${Number(amount || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  // ==========================================
  // DATE
  // ==========================================
  const formatDate = (value: string) => {
    if (!value) {
      return "—";
    }
    const normalized = value.includes("T") ? value : value.replace(" ", "T");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  // ==========================================
  // SCREEN
  // ==========================================
  return (
    <View style={styles.screen}>
      {/* ======================================
          SIDEBAR
      ====================================== */}
      {isTablet && (
        <View style={styles.sidebar}>
          {/* LOGO */}
          <View style={styles.logoArea}>
            <Image
              source={require("../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>
          {/* NAVIGATION */}
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
          {/* LOGOUT */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* ======================================
          MAIN
      ====================================== */}
      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ==================================
              MOBILE NAVIGATION
          ================================== */}
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
          {/* ==================================
              HEADER
          ================================== */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Fines Directory</Text>
            <Text style={styles.pageSubtitle}>Review cashier requests and manage student fines.</Text>
          </View>
          <View style={[styles.summaryRow, !isTablet && styles.summaryRowMobile]}>
            <TouchableOpacity
              style={[styles.summaryCard, styles.summaryCardPending]}
              onPress={() => setSelectedStatus("PENDING_CASH")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`View ${pendingCount} pending cashier requests`}
            >
              <Text style={styles.summaryLabel}>PENDING CASH REQUESTS</Text>
              <Text style={styles.summaryNumber}>{pendingCount}</Text>
              <Text style={styles.summaryHint}>Review these first  →</Text>
            </TouchableOpacity>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>UNPAID FINES</Text>
              <Text style={styles.summaryNumber}>{unpaidCount}</Text>
              <Text style={styles.summaryHint}>Includes pending cashier requests</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>ALL FINES</Text>
              <Text style={styles.summaryNumber}>{fines.length}</Text>
              <Text style={styles.summaryHint}>All recorded fines</Text>
            </View>
          </View>
          {/* ==================================
              TOOLBAR
          ================================== */}
          <View style={styles.toolbar}>
            {/* SEARCH */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search student name or Fine ID"
                placeholderTextColor="#8C939F"
                editable={!loading}
              />
            </View>
            {/* STATUS FILTER */}
            <View style={styles.filterWrapper}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  loading && {
                    opacity: 0.55,
                  },
                ]}
                onPress={() => {
                  if (loading) {
                    return;
                  }
                  setStatusMenuOpen(!statusMenuOpen);
                  setViolationMenuOpen(false);
                }}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.filterButtonText}>
                  {selectedStatus === "ALL" ? "All Status" : selectedStatus === "PENDING_CASH" ? "Pending Cash" : formatStatus(selectedStatus)}
                </Text>
                <Text style={styles.filterArrow}>▼</Text>
              </TouchableOpacity>
              {statusMenuOpen && (
                <View style={styles.dropdownMenu}>
                  {["ALL", "PENDING_CASH", "UNPAID", "PAID", "CANCELLED"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedStatus(status);
                        setStatusMenuOpen(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.dropdownItemText}>
                        {status === "ALL" ? "All Status" : status === "PENDING_CASH" ? `Pending Cash (${pendingCount})` : formatStatus(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {/* VIOLATION FILTER */}
            <View style={[styles.filterWrapper, styles.violationFilterWrapper]}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  loading && {
                    opacity: 0.55,
                  },
                ]}
                onPress={() => {
                  if (loading) {
                    return;
                  }
                  setViolationMenuOpen(!violationMenuOpen);
                  setStatusMenuOpen(false);
                }}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.filterButtonText} numberOfLines={1}>
                  {selectedViolationName}
                </Text>
                <Text style={styles.filterArrow}>▼</Text>
              </TouchableOpacity>
              {violationMenuOpen && (
                <View style={[styles.dropdownMenu, styles.violationDropdown]}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedViolationId(null);
                      setViolationMenuOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownItemText}>All Violations</Text>
                  </TouchableOpacity>
                  {violationTypes.map((violation) => (
                    <TouchableOpacity
                      key={violation.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedViolationId(violation.id);
                        setViolationMenuOpen(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.dropdownItemText}>
                        {violation.violation_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {/* REFRESH */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  width: 125,
                  opacity: loading || refreshing ? 0.6 : 1,
                },
              ]}
              onPress={handleRefresh}
              disabled={loading || refreshing}
              activeOpacity={0.8}
            >
              {refreshing ? (
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                  }}
                >
                  <ActivityIndicator size="small" color="#173A73" />
                  <Text style={styles.filterButtonText}>Refreshing</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.filterButtonText}>Refresh</Text>
                  <Text
                    style={{
                      color: "#173A73",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    ↻
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {/* ADD FINE */}
            <TouchableOpacity
              style={[
                styles.addButton,
                (loading || refreshing) && {
                  opacity: 0.55,
                },
              ]}
              onPress={handleAddFine}
              disabled={loading || refreshing}
              activeOpacity={0.85}
            >
              <Text style={styles.addButtonText}>+ Add Fine</Text>
            </TouchableOpacity>
          </View>
          {/* ==================================
              TABLE CARD
          ================================== */}
          <View style={styles.tableCard}>
            <View style={styles.tableIntro}>
              <View>
                <Text style={styles.tableIntroTitle}>Fine records</Text>
                <Text style={styles.tableIntroSubtitle}>Pending cash requests appear first. Opening one marks its notice read; payment is recorded separately.</Text>
              </View>
              <Text style={styles.resultCount}>{filteredFines.length} shown</Text>
            </View>
            {/* INITIAL LOADING */}
            {loading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#173A73" />
                <Text style={styles.loadingText}>
                  Loading fines and violation types...
                </Text>
              </View>
            ) : errorMessage ? (
              /* ERROR */
              <View style={styles.centerState}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => loadPageData(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* TABLE */
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.table}>
                  {/* TABLE HEADER */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, styles.fineIdColumn]}>
                      Fine ID
                    </Text>
                    <Text style={[styles.headerCell, styles.violationColumn]}>
                      Violation Type
                    </Text>
                    <Text style={[styles.headerCell, styles.studentColumn]}>
                      Student Name
                    </Text>
                    <Text style={[styles.headerCell, styles.amountColumn]}>
                      Amount
                    </Text>
                    <Text style={[styles.headerCell, styles.officerColumn]}>
                      Officer
                    </Text>
                    <Text style={[styles.headerCell, styles.dateColumn]}>
                      Date Issued
                    </Text>
                    <Text style={[styles.headerCell, styles.statusColumn]}>
                      Status
                    </Text>
                  </View>
                  {/* EMPTY STATE */}
                  {filteredFines.length === 0 ? (
                    <View style={styles.emptyTable}>
                      <Text style={styles.emptyTitle}>No fines found</Text>
                      <Text style={styles.emptyText}>
                        No fine records match the current filters.
                      </Text>
                    </View>
                  ) : (
                    /* FINE ROWS */
                    filteredFines.map((fine) => (
                      <TouchableOpacity
                        key={fine.id}
                        style={[
                          styles.tableRow,
                          pendingFineIds.has(Number(fine.id)) && styles.tableRowPending,
                          (fineNotifications[fine.id]?.isRead === false || paymentNotifications[fine.id]?.isRead === false) && styles.tableRowUnread,
                          refreshing && {
                            opacity: 0.65,
                          },
                        ]}
                        onPress={() => handleOpenFine(fine.id)}
                        disabled={refreshing}
                        activeOpacity={0.75}
                      >
                        {/* FINE ID */}
                        <Text
                          style={[
                            styles.cell,
                            styles.fineIdColumn,
                            styles.fineIdText,
                          ]}
                        >
                          {fine.fine_reference}
                          {pendingFineIds.has(Number(fine.id)) && (
                            <Text style={styles.cashRequestedLabel}>{"\n"}CASH REQUESTED</Text>
                          )}
                          {fineNotifications[fine.id] && (
                            <Text style={fineNotifications[fine.id].isRead ? styles.fineReadLabel : styles.fineUnreadLabel}>
                              {"\n"}FINE {fineNotifications[fine.id].isRead ? "READ" : "NEW"}
                            </Text>
                          )}
                          {paymentNotifications[fine.id] && (
                            <Text style={paymentNotifications[fine.id].isRead ? styles.fineReadLabel : styles.fineUnreadLabel}>
                              {"\n"}CASH REQUEST {paymentNotifications[fine.id].isRead ? "READ" : "NEW"}
                            </Text>
                          )}
                        </Text>
                        {/* VIOLATION */}
                        <Text style={[styles.cell, styles.violationColumn]}>
                          {fine.violation_name}
                        </Text>
                        {/* STUDENT */}
                        <View
                          style={[styles.cellContainer, styles.studentColumn]}
                        >
                          <Text style={styles.studentName}>
                            {fine.student_name}
                          </Text>
                          <Text style={styles.studentNumber}>
                            {fine.student_number || ""}
                          </Text>
                        </View>
                        {/* AMOUNT */}
                        <Text
                          style={[
                            styles.cell,
                            styles.amountColumn,
                            styles.amountText,
                          ]}
                        >
                          {formatMoney(fine.amount)}
                        </Text>
                        {/* OFFICER */}
                        <Text style={[styles.cell, styles.officerColumn]}>
                          {fine.officer_name}
                        </Text>
                        {/* DATE */}
                        <Text style={[styles.cell, styles.dateColumn]}>
                          {formatDate(fine.issued_at)}
                        </Text>
                        {/* STATUS */}
                        <View
                          style={[styles.cellContainer, styles.statusColumn]}
                        >
                          <View
                            style={[
                              styles.statusBadge,
                              pendingFineIds.has(Number(fine.id)) ? styles.statusBadgePending : getStatusBadgeStyle(fine.status),
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                pendingFineIds.has(Number(fine.id)) ? styles.statusTextPending : getStatusTextStyle(fine.status),
                              ]}
                            >
                              {pendingFineIds.has(Number(fine.id)) ? "Pending Cash" : formatStatus(fine.status)}
                            </Text>
                          </View>
                          {pendingFineIds.has(Number(fine.id)) && <Text style={styles.pendingFineHint}>Fine is Unpaid</Text>}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </ScrollView>
      </View>
      {/* ======================================
          LOGOUT CONFIRMATION MODAL
      ====================================== */}
      <LogoutModal
        visible={showLogoutModal}
        loading={logoutLoading}
        onCancel={handleCancelLogout}
        onConfirm={performLogout}
      />
      {/* ======================================
          WARNING MODAL
      ====================================== */}
      <WarningModal
        visible={showWarningModal}
        title={warningTitle}
        message={warningMessage}
        buttonText="OK"
        onClose={() => {
          setShowWarningModal(false);
        }}
      />
    </View>
  );
}
// ==========================================
// FORMAT STATUS
// ==========================================
function formatStatus(status: string) {
  const value = String(status || "").toUpperCase();
  switch (value) {
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
// ==========================================
// STATUS BADGE STYLE
// ==========================================
function getStatusBadgeStyle(status: string) {
  const value = String(status || "").toUpperCase();
  switch (value) {
    case "PAID":
      return styles.statusBadgePaid;
    case "CANCELLED":
      return styles.statusBadgeCancelled;
    default:
      return styles.statusBadgeUnpaid;
  }
}
// ==========================================
// STATUS TEXT STYLE
// ==========================================
function getStatusTextStyle(status: string) {
  const value = String(status || "").toUpperCase();
  switch (value) {
    case "PAID":
      return styles.statusTextPaid;
    case "CANCELLED":
      return styles.statusTextCancelled;
    default:
      return styles.statusTextUnpaid;
  }
}
