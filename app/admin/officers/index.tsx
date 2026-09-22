import { useEffect, useMemo, useState } from "react";

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

import { useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";

import LogoutModal from "@/components/logout-modal";
import WarningModal from "@/components/warningmodal";

import { styles } from "./officers.styles";

// ==========================================
// TYPES
// ==========================================

type Officer = {
  id: number;

  officer_profile_id: number;

  employee_number: string;

  username: string;

  first_name: string;

  middle_name: string | null;

  last_name: string;

  full_name: string;

  email: string | null;

  contact_number: string | null;

  assigned_area: string | null;

  account_status: string;

  created_at: string | null;

  updated_at: string | null;

  total_fines_recorded: number;
};

type NavItem = {
  label: string;

  route: string;

  icon?: any;
};

// ==========================================
// OFFICERS DIRECTORY
// ==========================================

export default function OfficersDirectory() {
  const router = useRouter();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // ==========================================
  // OFFICERS
  // ==========================================

  const [officers, setOfficers] = useState<Officer[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // SEARCH
  // ==========================================

  const [search, setSearch] = useState("");

  // ==========================================
  // FILTERS
  // ==========================================

  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [selectedArea, setSelectedArea] = useState("ALL");

  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const [showAreaMenu, setShowAreaMenu] = useState(false);

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
  // NAVIGATION
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
  // LOAD OFFICERS
  // ==========================================

  const loadOfficers = async (showFullLoader = false) => {
    if (refreshing) {
      return;
    }

    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await fetch(`${API_BASE}/api/officers`);

      const data = await response.json();

      console.log("Officers response:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load officers.");
      }

      setOfficers(data.officers || []);
    } catch (error: any) {
      console.error("Load officers error:", error);

      if (showFullLoader || officers.length === 0) {
        setError(
          error?.message || "Could not connect to the SmartFine server.",
        );
      } else {
        setWarningTitle("Refresh Failed");

        setWarningMessage(
          error?.message || "Could not refresh the officers directory.",
        );

        setShowWarningModal(true);
      }
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOfficers(true);
  }, []);

  // ==========================================
  // REFRESH OFFICERS
  // ==========================================

  const handleRefresh = async () => {
    if (loading || refreshing) {
      return;
    }

    setShowStatusMenu(false);

    setShowAreaMenu(false);

    await loadOfficers(false);
  };

  // ==========================================
  // ASSIGNED AREA OPTIONS
  // ==========================================

  const areaOptions = useMemo(() => {
    const areas = officers
      .map((officer) => officer.assigned_area)
      .filter((area): area is string => Boolean(area));

    return Array.from(new Set(areas)).sort();
  }, [officers]);

  // ==========================================
  // FILTERED OFFICERS
  // ==========================================

  const filteredOfficers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return officers.filter((officer) => {
      const searchableText = [
        officer.employee_number,

        officer.username,

        officer.full_name,

        officer.email,

        officer.contact_number,

        officer.assigned_area,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const normalizedStatus = String(
        officer.account_status || "",
      ).toUpperCase();

      const matchesStatus =
        selectedStatus === "ALL" || normalizedStatus === selectedStatus;

      const matchesArea =
        selectedArea === "ALL" || officer.assigned_area === selectedArea;

      return matchesSearch && matchesStatus && matchesArea;
    });
  }, [officers, search, selectedStatus, selectedArea]);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleNavigation = (item: NavItem) => {
    router.push(item.route as any);
  };

  // ==========================================
  // ADD OFFICER
  // ==========================================

  const handleAddOfficer = () => {
    if (loading || refreshing) {
      return;
    }

    router.push("/admin/officers/add" as any);
  };

  // ==========================================
  // OPEN OFFICER PROFILE
  // ==========================================

  const handleOfficerPress = (officer: Officer) => {
    if (loading || refreshing) {
      return;
    }

    router.push(`/admin/officers/${officer.id}` as any);
  };

  // ==========================================
  // STATUS HELPERS
  // ==========================================

  const getStatusLabel = (status: string) => {
    const normalizedStatus = String(status || "").toUpperCase();

    if (normalizedStatus === "ACTIVE") {
      return "Active";
    }

    if (normalizedStatus === "INACTIVE" || normalizedStatus === "DEACTIVATED") {
      return "Inactive";
    }

    return status || "Unknown";
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

      router.replace("/login" as any);
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
  // UI
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
              const isActive = item.label === "Officers";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => handleNavigation(item)}
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
          MAIN CONTENT
      ====================================== */}

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ==================================
              MOBILE NAV
          ================================== */}

          {!isTablet && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileNav}
            >
              {navItems.map((item) => {
                const active = item.label === "Officers";

                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.mobileNavItem,

                      active && styles.mobileNavItemActive,
                    ]}
                    onPress={() => handleNavigation(item)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.mobileNavText,

                        active && styles.mobileNavTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ==================================
              HEADER
          ================================== */}

          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>Officers Management</Text>

              <Text style={styles.pageSubtitle}>
                Manage SmartFine fines officer accounts
              </Text>
            </View>
          </View>

          {/* ==================================
              TOOLBAR
          ================================== */}

          <View style={styles.toolbar}>
            {/* SEARCH */}

            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>⌕</Text>

              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search officer by name, ID, email, or area"
                placeholderTextColor="#8C939F"
                editable={!loading}
              />
            </View>

            {/* ==================================
                STATUS FILTER
            ================================== */}

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

                  setShowStatusMenu(!showStatusMenu);

                  setShowAreaMenu(false);
                }}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.filterText}>
                  {selectedStatus === "ALL"
                    ? "Status"
                    : getStatusLabel(selectedStatus)}
                </Text>

                <Text style={styles.filterArrow}>▼</Text>
              </TouchableOpacity>

              {showStatusMenu && (
                <View style={styles.filterMenu}>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedStatus("ALL");

                      setShowStatusMenu(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.filterOptionText}>All Status</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedStatus("ACTIVE");

                      setShowStatusMenu(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.filterOptionText}>Active</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedStatus("INACTIVE");

                      setShowStatusMenu(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.filterOptionText}>Inactive</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* ==================================
                AREA FILTER
            ================================== */}

            <View style={[styles.filterWrapper, styles.areaFilterWrapper]}>
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

                  setShowAreaMenu(!showAreaMenu);

                  setShowStatusMenu(false);
                }}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.filterText} numberOfLines={1}>
                  {selectedArea === "ALL" ? "Assigned Area" : selectedArea}
                </Text>

                <Text style={styles.filterArrow}>▼</Text>
              </TouchableOpacity>

              {showAreaMenu && (
                <View style={styles.filterMenu}>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedArea("ALL");

                      setShowAreaMenu(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.filterOptionText}>All Areas</Text>
                  </TouchableOpacity>

                  {areaOptions.map((area) => (
                    <TouchableOpacity
                      key={area}
                      style={styles.filterOption}
                      onPress={() => {
                        setSelectedArea(area);

                        setShowAreaMenu(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.filterOptionText}>{area}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ==================================
                REFRESH
            ================================== */}

            <TouchableOpacity
              style={[
                styles.filterButton,

                {
                  width: 120,

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

                  <Text style={styles.filterText}>Refreshing</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.filterText}>Refresh</Text>

                  <Text
                    style={{
                      color: "#173A73",

                      fontSize: 16,

                      fontWeight: "800",
                    }}
                  >
                    ↻
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* ==================================
                ADD OFFICER
            ================================== */}

            <TouchableOpacity
              style={[
                styles.addButton,

                (loading || refreshing) && {
                  opacity: 0.55,
                },
              ]}
              onPress={handleAddOfficer}
              disabled={loading || refreshing}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+ Add New Officer</Text>
            </TouchableOpacity>
          </View>

          {/* ==================================
              TABLE CARD
          ================================== */}

          <View style={styles.tableCard}>
            {/* ==================================
                INITIAL LOADING
            ================================== */}

            {loading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#173A73" />

                <Text style={styles.stateText}>
                  Loading officer accounts...
                </Text>
              </View>
            ) : error ? (
              // ==================================
              // ERROR
              // ==================================

              <View style={styles.centerState}>
                <Text style={styles.errorText}>{error}</Text>

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => loadOfficers(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View style={styles.table}>
                    {/* ==================================
                        TABLE HEADER
                    ================================== */}

                    <View style={styles.tableHeader}>
                      <Text style={[styles.headerCell, styles.employeeColumn]}>
                        Employee No.
                      </Text>

                      <Text style={[styles.headerCell, styles.nameColumn]}>
                        Officer Name
                      </Text>

                      <Text style={[styles.headerCell, styles.areaColumn]}>
                        Assigned Area
                      </Text>

                      <Text style={[styles.headerCell, styles.emailColumn]}>
                        Email
                      </Text>

                      <Text style={[styles.headerCell, styles.contactColumn]}>
                        Contact
                      </Text>

                      <Text style={[styles.headerCell, styles.finesColumn]}>
                        Fines Recorded
                      </Text>

                      <Text style={[styles.headerCell, styles.statusColumn]}>
                        Status
                      </Text>
                    </View>

                    {/* ==================================
                        EMPTY
                    ================================== */}

                    {filteredOfficers.length === 0 ? (
                      <View style={styles.emptyRow}>
                        <Text style={styles.emptyText}>No officers found.</Text>
                      </View>
                    ) : (
                      // ==================================
                      // OFFICER ROWS
                      // ==================================

                      filteredOfficers.map((officer) => {
                        const normalizedStatus = String(
                          officer.account_status || "",
                        ).toUpperCase();

                        const isActive = normalizedStatus === "ACTIVE";

                        return (
                          <TouchableOpacity
                            key={officer.id}
                            style={[
                              styles.officerRow,

                              refreshing && {
                                opacity: 0.65,
                              },
                            ]}
                            activeOpacity={0.7}
                            disabled={refreshing}
                            onPress={() => handleOfficerPress(officer)}
                          >
                            {/* EMPLOYEE NUMBER */}

                            <Text
                              style={[
                                styles.bodyCell,

                                styles.employeeColumn,

                                styles.employeeNumber,
                              ]}
                            >
                              {officer.employee_number}
                            </Text>

                            {/* NAME */}

                            <View style={styles.nameColumn}>
                              <Text
                                style={styles.officerName}
                                numberOfLines={1}
                              >
                                {officer.full_name}
                              </Text>

                              <Text style={styles.usernameText}>
                                Username: {officer.username}
                              </Text>
                            </View>

                            {/* AREA */}

                            <Text
                              style={[styles.bodyCell, styles.areaColumn]}
                              numberOfLines={2}
                            >
                              {officer.assigned_area || "Not Assigned"}
                            </Text>

                            {/* EMAIL */}

                            <Text
                              style={[styles.bodyCell, styles.emailColumn]}
                              numberOfLines={1}
                            >
                              {officer.email || "Not provided"}
                            </Text>

                            {/* CONTACT */}

                            <Text
                              style={[styles.bodyCell, styles.contactColumn]}
                            >
                              {officer.contact_number || "—"}
                            </Text>

                            {/* FINES */}

                            <Text
                              style={[
                                styles.bodyCell,

                                styles.finesColumn,

                                styles.finesRecorded,
                              ]}
                            >
                              {Number(officer.total_fines_recorded || 0)}
                            </Text>

                            {/* STATUS */}

                            <View style={styles.statusColumn}>
                              <View
                                style={[
                                  styles.statusBadge,

                                  isActive
                                    ? styles.activeBadge
                                    : styles.inactiveBadge,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusText,

                                    isActive
                                      ? styles.activeStatusText
                                      : styles.inactiveStatusText,
                                  ]}
                                >
                                  {getStatusLabel(officer.account_status)}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </ScrollView>

                {/* ==================================
                    FOOTER
                ================================== */}

                <View style={styles.tableFooter}>
                  <Text style={styles.totalOfficersText}>
                    Total Officers: {officers.length}
                  </Text>

                  <Text style={styles.visibleOfficersText}>
                    Showing: {filteredOfficers.length}
                  </Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>

      {/* ======================================
          LOGOUT MODAL
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
        onClose={() => setShowWarningModal(false)}
      />
    </View>
  );
}
