import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";

import DeleteModal from "@/components/deletationmodal";
import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";

import { styles } from "./officer-profile.styles";

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

  profile_picture_uri: string | null;

  created_at: string | null;

  updated_at: string | null;
};

type OfficerStats = {
  totalFines: number;

  activeFines: number;
};

type RecentFine = {
  id: number;

  fine_reference: string;

  amount: number;

  issued_at: string;

  fine_status: string;

  student_name: string;

  student_number: string;

  violation_name: string;
};

type OfficerProfileResponse = {
  success: boolean;

  officer: Officer;

  stats: OfficerStats;

  recentFines: RecentFine[];
};

type NavItem = {
  label: string;

  route: string;

  icon: any;
};

// ==========================================
// OFFICER PROFILE
// ==========================================

export default function OfficerProfile() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const isCompact = width < 600;

  // ==========================================
  // OFFICER ID
  // ==========================================

  const rawId = params.id;

  const officerId = Array.isArray(rawId) ? rawId[0] : rawId;

  // ==========================================
  // PROFILE STATE
  // ==========================================

  const [data, setData] = useState<OfficerProfileResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  const [profileImageFailed, setProfileImageFailed] = useState(false);

  // ==========================================
  // DELETE MODAL
  // ==========================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ==========================================
  // SUCCESS MODAL
  // ==========================================

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successTitle, setSuccessTitle] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // WARNING MODAL
  // ==========================================

  const [showWarningModal, setShowWarningModal] = useState(false);

  const [warningTitle, setWarningTitle] = useState("");

  const [warningMessage, setWarningMessage] = useState("");

  // ==========================================
  // LOGOUT MODAL
  // ==========================================

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: NavItem[] = [
    {
      label: "Dashboard",

      route: "/admin/dashboard",

      icon: require("../../../../assets/icons/dashboard.png"),
    },

    {
      label: "Students",

      route: "/admin/students",

      icon: require("../../../../assets/icons/students.png"),
    },

    {
      label: "Fines",

      route: "/admin/fines",

      icon: require("../../../../assets/icons/fines.png"),
    },

    {
      label: "QR Scanner",

      route: "/admin/qr-scanner",

      icon: require("../../../../assets/icons/qr-codeWhite.png"),
    },

    {
      label: "Reports",

      route: "/admin/reports",

      icon: require("../../../../assets/icons/reports.png"),
    },

    {
      label: "Settings",

      route: "/admin/settings",

      icon: require("../../../../assets/icons/settings.png"),
    },

    {
      label: "Officers",

      route: "/admin/officers",

      icon: require("../../../../assets/icons/officers.png"),
    },
  ];

  // ==========================================
  // PROFILE PICTURE URL
  // ==========================================

  const getProfilePictureUrl = (uri: string | null | undefined) => {
    if (!uri) {
      return null;
    }

    const normalizedUri = String(uri).trim();

    if (
      normalizedUri.startsWith("http://") ||
      normalizedUri.startsWith("https://")
    ) {
      return normalizedUri;
    }

    return `${API_BASE}${normalizedUri}`;
  };

  // ==========================================
  // SHOW WARNING
  // ==========================================

  const showWarning = (title: string, message: string) => {
    setWarningTitle(title);

    setWarningMessage(message);

    setShowWarningModal(true);
  };

  // ==========================================
  // LOAD OFFICER
  // ==========================================

  const loadOfficer = async () => {
    if (!officerId) {
      setError("Officer ID is missing.");

      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      setError("");

      setProfileImageFailed(false);

      const response = await fetch(`${API_BASE}/api/officers/${officerId}`);

      const result = await response.json();

      console.log("Officer profile response:", result);

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to load officer profile.");

        return;
      }

      setData(result);
    } catch (error) {
      console.error("Officer profile connection error:", error);

      setError("Could not connect to the SmartFine server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfficer();
  }, [officerId]);

  // ==========================================
  // BACK
  // ==========================================

  const handleBack = () => {
    router.replace("/admin/officers" as any);
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = () => {
    if (!officerId) {
      return;
    }

    router.push(`/admin/officers/${officerId}/edit` as any);
  };

  // ==========================================
  // DELETE / ARCHIVE OFFICER
  // ==========================================

  const performDeleteOfficer = async () => {
    if (!officerId || !data?.officer) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(`${API_BASE}/api/officers/${officerId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      console.log("Delete officer response:", result);

      // ====================================
      // FAILED
      // ====================================

      if (!response.ok || !result.success) {
        setShowDeleteModal(false);

        showWarning(
          "Unable to Remove Officer",

          result.message || "Could not remove officer.",
        );

        return;
      }

      // ====================================
      // SUCCESS
      // ====================================

      setShowDeleteModal(false);

      if (result.archived) {
        setSuccessTitle("Officer Removed");

        setSuccessMessage(
          result.message ||
            "Officer removed successfully. Historical fine records were preserved.",
        );
      } else {
        setSuccessTitle("Officer Deleted");

        setSuccessMessage(result.message || "Officer deleted successfully.");
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Delete officer error:", error);

      setShowDeleteModal(false);

      showWarning(
        "Unable to Remove Officer",

        "Could not connect to the SmartFine server.",
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // DELETE BUTTON
  // ==========================================

  const handleDeleteOfficer = () => {
    if (!data?.officer) {
      return;
    }

    const officer = data.officer;

    const status = String(officer.account_status || "").toUpperCase();

    // ====================================
    // ACTIVE OFFICER
    // ====================================

    if (status === "ACTIVE") {
      showWarning(
        "Officer is Active",

        "Active officers cannot be removed. Edit the officer and set the account status to Inactive first.",
      );

      return;
    }

    // ====================================
    // UNRESOLVED FINE RECORDS
    //
    // Paid / Cancelled / Waived fines
    // should NOT block removal.
    // ====================================

    if (Number(data.stats?.activeFines || 0) > 0) {
      showWarning(
        "Officer Has Active Fine Records",

        "This officer still has unpaid or pending fine records. Resolve those fines before removing the officer.",
      );

      return;
    }

    // ====================================
    // ALLOW DELETE OR ARCHIVE
    // ====================================

    setShowDeleteModal(true);
  };

  // ==========================================
  // CANCEL DELETE
  // ==========================================

  const handleCancelDelete = () => {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
  };

  // ==========================================
  // DELETE SUCCESS CLOSE
  // ==========================================

  const handleDeleteSuccessClose = () => {
    setShowSuccessModal(false);

    router.replace("/admin/officers" as any);
  };

  // ==========================================
  // OPEN FINE
  // ==========================================

  const handleFinePress = (fineId: number) => {
    router.push(`/admin/fines/${fineId}` as any);
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleNavigation = (item: NavItem) => {
    router.push(item.route as any);
  };

  // ==========================================
  // OPEN LOGOUT
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

      showWarning(
        "Logout Error",

        "Could not log out. Please try again.",
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  // ==========================================
  // CONTENT
  // ==========================================

  const renderContent = () => {
    // ======================================
    // LOADING
    // ======================================

    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#173A73" />

          <Text style={styles.stateText}>Loading officer profile...</Text>
        </View>
      );
    }

    // ======================================
    // ERROR
    // ======================================

    if (error || !data) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error || "Officer not found."}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={loadOfficer}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const { officer, stats, recentFines } = data;

    const status = String(officer.account_status || "").toUpperCase();

    const isActive = status === "ACTIVE";

    const initials = `${officer.first_name?.[0] || ""}${
      officer.last_name?.[0] || ""
    }`.toUpperCase();

    const profilePictureUrl = getProfilePictureUrl(officer.profile_picture_uri);

    const showProfilePicture =
      Boolean(profilePictureUrl) && !profileImageFailed;

    return (
      <>
        {/* ==================================
            PROFILE CARD
        ================================== */}

        <View
          style={[styles.profileCard, isCompact && styles.profileCardCompact]}
        >
          <View
            style={[styles.profileTop, isCompact && styles.profileTopCompact]}
          >
            {/* PROFILE PICTURE */}

            {showProfilePicture ? (
              <Image
                source={{
                  uri: profilePictureUrl!,
                }}
                style={[styles.avatarImage, isCompact && styles.avatarCompact]}
                resizeMode="cover"
                onError={() => {
                  setProfileImageFailed(true);
                }}
              />
            ) : (
              <View style={[styles.avatar, isCompact && styles.avatarCompact]}>
                <Text
                  style={[
                    styles.avatarText,

                    isCompact && styles.avatarTextCompact,
                  ]}
                >
                  {initials || "OF"}
                </Text>
              </View>
            )}

            {/* HEADING */}

            <View style={styles.profileHeading}>
              <Text
                style={[
                  styles.officerName,

                  isCompact && styles.officerNameCompact,
                ]}
              >
                {officer.full_name}
              </Text>

              <Text style={styles.employeeNumber}>
                {officer.employee_number}
              </Text>

              <View
                style={[
                  styles.statusBadge,

                  isActive ? styles.activeBadge : styles.inactiveBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,

                    isActive
                      ? styles.activeStatusText
                      : styles.inactiveStatusText,
                  ]}
                >
                  {isActive ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            {/* ACTIONS */}

            <View
              style={[
                styles.profileActions,

                isCompact && styles.profileActionsCompact,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.editButton,

                  isCompact && styles.profileActionButtonCompact,
                ]}
                onPress={handleEdit}
                disabled={deleting}
                activeOpacity={0.75}
              >
                <Text style={styles.editButtonText}>Edit Officer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteButton,

                  isCompact && styles.profileActionButtonCompact,

                  deleting && styles.deleteButtonDisabled,
                ]}
                onPress={handleDeleteOfficer}
                disabled={deleting}
                activeOpacity={0.75}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Officer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ==================================
              OFFICER DETAILS
          ================================== */}

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Employee Number</Text>

              <Text style={styles.detailValueStrong}>
                {officer.employee_number}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Username</Text>

              <Text style={styles.detailValue}>{officer.username}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Assigned Area</Text>

              <Text style={styles.detailValue}>
                {officer.assigned_area || "Not assigned"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Email Address</Text>

              <Text style={styles.detailValue}>
                {officer.email || "Not provided"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Contact Number</Text>

              <Text style={styles.detailValue}>
                {officer.contact_number || "Not provided"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Account Created</Text>

              <Text style={styles.detailValue}>
                {formatDate(officer.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* ==================================
            SUMMARY
        ================================== */}

        <View style={styles.summaryRow}>
          <View
            style={[styles.summaryCard, isCompact && styles.summaryCardCompact]}
          >
            <Text style={styles.summaryLabel}>Total Fines Recorded</Text>

            <Text style={styles.summaryValue}>{stats.totalFines}</Text>
          </View>

          <View
            style={[styles.summaryCard, isCompact && styles.summaryCardCompact]}
          >
            <Text style={styles.summaryLabel}>Active Fine Records</Text>

            <Text style={styles.summaryValueGreen}>{stats.activeFines}</Text>
          </View>
        </View>

        {/* ==================================
            RECENT FINES
        ================================== */}

        <View style={styles.historyCard}>
          <View style={styles.historyHeaderBar}>
            <Text style={styles.historyTitle}>Recent Fines Recorded</Text>

            <Text style={styles.historySubtitle}>
              Most recent fines recorded by this officer
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.historyTable}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.referenceColumn]}>
                  Fine Reference
                </Text>

                <Text style={[styles.headerCell, styles.studentColumn]}>
                  Student
                </Text>

                <Text style={[styles.headerCell, styles.violationColumn]}>
                  Violation
                </Text>

                <Text style={[styles.headerCell, styles.dateColumn]}>Date</Text>

                <Text style={[styles.headerCell, styles.amountColumn]}>
                  Amount
                </Text>

                <Text style={[styles.headerCell, styles.statusColumn]}>
                  Status
                </Text>
              </View>

              {recentFines.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>
                    This officer has not recorded any fines yet.
                  </Text>
                </View>
              ) : (
                recentFines.map((fine) => {
                  const fineStatus = normalizeFineStatus(fine.fine_status);

                  return (
                    <TouchableOpacity
                      key={fine.id}
                      style={styles.historyRow}
                      activeOpacity={0.7}
                      onPress={() => handleFinePress(fine.id)}
                    >
                      <Text
                        style={[
                          styles.bodyCell,

                          styles.referenceColumn,

                          styles.referenceText,
                        ]}
                      >
                        {fine.fine_reference}
                      </Text>

                      <View style={styles.studentColumn}>
                        <Text style={styles.studentName}>
                          {fine.student_name}
                        </Text>

                        <Text style={styles.studentNumber}>
                          {fine.student_number}
                        </Text>
                      </View>

                      <Text style={[styles.bodyCell, styles.violationColumn]}>
                        {fine.violation_name}
                      </Text>

                      <Text style={[styles.bodyCell, styles.dateColumn]}>
                        {formatDate(fine.issued_at)}
                      </Text>

                      <Text
                        style={[
                          styles.bodyCell,

                          styles.amountColumn,

                          styles.amountText,
                        ]}
                      >
                        {formatMoney(fine.amount)}
                      </Text>

                      <View style={styles.statusColumn}>
                        <View
                          style={[
                            styles.fineStatusBadge,

                            getFineStatusBadgeStyle(fineStatus),
                          ]}
                        >
                          <Text
                            style={[
                              styles.fineStatusText,

                              getFineStatusTextStyle(fineStatus),
                            ]}
                          >
                            {getFineStatusLabel(fineStatus)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </>
    );
  };

  // ==========================================
  // DELETE MODAL INFORMATION
  // ==========================================

  const hasFineHistory = Number(data?.stats?.totalFines || 0) > 0;

  const deleteModalTitle = hasFineHistory
    ? "Remove Officer?"
    : "Delete Officer?";

  const deleteModalMessage = data?.officer
    ? hasFineHistory
      ? `Remove ${data.officer.full_name} (${data.officer.employee_number}) from the Officers list? Historical fine records will be preserved.`
      : `Permanently delete ${data.officer.full_name} (${data.officer.employee_number})? This action cannot be undone.`
    : "Remove this officer?";

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
          <View style={styles.logoArea}>
            <Image
              source={require("../../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.navigation}>
            {navItems.map((item) => {
              const active = item.label === "Officers";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, active && styles.navItemActive]}
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
          contentContainerStyle={[
            styles.scrollContent,

            isCompact && styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ==================================
              PAGE HEADER / BACK
          ================================== */}

          <View style={styles.pageHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back to Officers"
            >
              <Image
                source={require("../../../../assets/icons/back_icon.png")}
                style={styles.backIconImage}
                resizeMode="contain"
              />

              <Text
                style={[styles.backText, isCompact && styles.backTextCompact]}
                numberOfLines={1}
              >
                Officer Profile
              </Text>
            </TouchableOpacity>

            <Text style={[styles.pageSubtitle, styles.headerSubtitle]}>
              View officer account information and fine history
            </Text>
          </View>

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

          {renderContent()}
        </ScrollView>
      </View>

      {/* ======================================
          DELETE / REMOVE MODAL
      ====================================== */}

      <DeleteModal
        visible={showDeleteModal}
        loading={deleting}
        title={deleteModalTitle}
        message={deleteModalMessage}
        onCancel={handleCancelDelete}
        onConfirm={performDeleteOfficer}
      />

      {/* ======================================
          SUCCESS MODAL
      ====================================== */}

      <SuccessModal
        visible={showSuccessModal}
        title={successTitle}
        message={successMessage}
        buttonText="OK"
        onClose={handleDeleteSuccessClose}
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

      {/* ======================================
          LOGOUT MODAL
      ====================================== */}

      <LogoutModal
        visible={showLogoutModal}
        loading={logoutLoading}
        onCancel={handleCancelLogout}
        onConfirm={performLogout}
      />
    </View>
  );
}

// ==========================================
// FINE STATUS
// ==========================================

function normalizeFineStatus(status: string) {
  return String(status || "UNPAID").toUpperCase();
}

function getFineStatusLabel(status: string) {
  switch (status) {
    case "PAID":
      return "Paid";

    case "CANCELLED":
      return "Cancelled";

    case "PENDING":
      return "Pending";

    case "WAIVED":
      return "Waived";

    default:
      return "Unpaid";
  }
}

function getFineStatusBadgeStyle(status: string) {
  switch (status) {
    case "PAID":
      return {
        backgroundColor: "#E5F7E8",
      };

    case "CANCELLED":
      return {
        backgroundColor: "#ECEFF4",
      };

    case "PENDING":
      return {
        backgroundColor: "#FFF4D6",
      };

    case "WAIVED":
      return {
        backgroundColor: "#E8F2FF",
      };

    default:
      return {
        backgroundColor: "#FFEAEA",
      };
  }
}

function getFineStatusTextStyle(status: string) {
  switch (status) {
    case "PAID":
      return {
        color: "#2E9D43",
      };

    case "CANCELLED":
      return {
        color: "#606775",
      };

    case "PENDING":
      return {
        color: "#A16A00",
      };

    case "WAIVED":
      return {
        color: "#173A73",
      };

    default:
      return {
        color: "#D32F2F",
      };
  }
}

// ==========================================
// MONEY
// ==========================================

function formatMoney(amount: number) {
  return `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,

    maximumFractionDigits: 2,
  })}`;
}

// ==========================================
// DATE
// ==========================================

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",

    day: "numeric",

    year: "numeric",
  });
}
