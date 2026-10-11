import { useEffect, useState } from "react";

import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { useLocalSearchParams } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { StudentFormModal } from "@/components/admin-forms/student-form-modal";

import QRCode from "react-native-qrcode-svg";

import { returnToLogin, useAuth } from "@/hooks/use-auth";

import AppIcon, { IconName } from "@/components/AppIcon";
import { API_BASE } from "@/constants/api";
import { AdminNavBadge } from "@/components/notification-badge";
import { FadeIn, PopIn } from "@/components/motion";
import { SkeletonProfile } from "@/components/skeleton";

import { styles } from "./student-profile.styles";

// ==========================================
// TYPES
// ==========================================

type Student = {
  id: number;
  student_id: string;
  username: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  email: string | null;
  contact_number: string | null;
  grade_level: string | null;
  section: string | null;
  account_status: string;
  profile_picture_uri: string | null;
};

type Fine = {
  id: number;
  fine_reference?: string;
  violation_name: string;
  amount: number;
  issued_at: string;
  created_at: string | null;
  status: string;
  officer_name: string;
};

type StudentProfileResponse = {
  success: boolean;

  student: Student;

  totals: {
    totalFines: number;
    outstandingBalance: number;
    totalPaid: number;
  };

  fines: Fine[];
};

// ==========================================
// STUDENT PROFILE
// ==========================================

export default function StudentProfile() {
  const router = useGuardedRouter();

  const params = useLocalSearchParams();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const isCompact = width < 600;

  // ==========================================
  // STUDENT DATABASE ID
  // ==========================================

  const rawId = params.id;

  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;

  // Edit Student Information is a pop-up; ?edit=1 (the old edit route) opens it.
  const [showEdit, setShowEdit] = useState(false);

  const editParam = Array.isArray(params.edit) ? params.edit[0] : params.edit;

  useEffect(() => {
    if (editParam === "1") {
      setShowEdit(true);
      router.setParams({ edit: undefined });
    }
  }, [editParam]);

  // ==========================================
  // STATE
  // ==========================================

  const [data, setData] = useState<StudentProfileResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [profileImageFailed, setProfileImageFailed] = useState(false);

  // QR
  const [qrVisible, setQrVisible] = useState(false);

  // FINE INFORMATION MODAL
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);

  const [fineModalVisible, setFineModalVisible] = useState(false);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: { label: string; route: string; icon: IconName }[] = [
    {
      label: "Dashboard",
      route: "/admin/dashboard",
      icon: "dashboard",
    },

    {
      label: "Students",
      route: "/admin/students",
      icon: "students",
    },

    {
      label: "Fines",
      route: "/admin/fines",
      icon: "fines",
    },

    {
      label: "QR Scanner",
      route: "/admin/qr-scanner",
      icon: "qr",
    },

    {
      label: "Reports",
      route: "/admin/reports",
      icon: "reports",
    },

    {
      label: "Settings",
      route: "/admin/settings",
      icon: "settings",
    },

    {
      label: "Officers",
      route: "/admin/officers",
      icon: "officers",
    },
  ];

  // ==========================================
  // LOAD STUDENT
  // ==========================================

  useEffect(() => {
    if (!studentId) {
      return;
    }

    void loadStudent();
  }, [studentId]);

  const loadStudent = async () => {
    try {
      setLoading(true);

      setError("");

      setProfileImageFailed(false);

      const response = await fetch(`${API_BASE}/api/students/${studentId}`);

      const result = await response.json();

      console.log("Student profile response:", result);

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to load student.");

        return;
      }

      setData(result);
    } catch (error) {
      console.error("Student profile connection error:", error);

      setError("Could not connect to the SmartFine server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PROFILE IMAGE URL
  // ==========================================

  const getProfilePictureUrl = (uri: string | null | undefined) => {
    if (!uri) {
      return null;
    }

    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      return uri;
    }

    return `${API_BASE}${uri}`;
  };

  // ==========================================
  // BACK
  // ==========================================

  const handleBack = () => {
    router.replace("/admin/students" as any);
  };

  // ==========================================
  // EDIT STUDENT
  // ==========================================

  const handleEdit = () => {
    if (!studentId) {
      return;
    }

    setShowEdit(true);
  };

  // ==========================================
  // QR CODE
  // ==========================================

  const handleQRCode = () => {
    if (!data?.student) {
      return;
    }

    setQrVisible(true);
  };

  const handleCloseQRCode = () => {
    setQrVisible(false);
  };

  // ==========================================
  // FINE INFORMATION MODAL
  // ==========================================

  const handleFinePress = (fine: Fine) => {
    setSelectedFine(fine);

    setFineModalVisible(true);
  };

  const handleCloseFineModal = () => {
    setFineModalVisible(false);

    setSelectedFine(null);
  };

  const handleManageFine = () => {
    if (!selectedFine) {
      return;
    }

    const fineId = selectedFine.id;

    setFineModalVisible(false);

    setSelectedFine(null);

    router.push(`/admin/fines/${fineId}` as any);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const performLogout = async () => {
    try {
      await logout();

      returnToLogin();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to log out?");

      if (confirmed) {
        void performLogout();
      }

      return;
    }

    Alert.alert(
      "Log Out",

      "Are you sure you want to log out?",

      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Log Out",
          style: "destructive",
          onPress: () => void performLogout(),
        },
      ],
    );
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
        <SkeletonProfile
          label="Loading student profile"
          sections={2}
          style={styles.skeleton}
        />
      );
    }

    // ======================================
    // ERROR
    // ======================================

    if (error || !data) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error || "Student not found."}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void loadStudent()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const { student, totals, fines } = data;

    // ======================================
    // INITIALS
    // ======================================

    const initials = `${student.first_name?.[0] || ""}${
      student.last_name?.[0] || ""
    }`.toUpperCase();

    // ======================================
    // PROFILE PHOTO
    // ======================================

    const profilePictureUrl = getProfilePictureUrl(student.profile_picture_uri);

    const showPicture = Boolean(profilePictureUrl) && !profileImageFailed;

    // ======================================
    // GRADE / SECTION
    // ======================================

    const gradeSection =
      [student.grade_level, student.section].filter(Boolean).join(" - ") ||
      "Not assigned";

    // ======================================
    // QR VALUE
    // ======================================

    const qrValue = `SMARTFINE_STUDENT:${student.student_id}`;

    // ======================================
    // SELECTED FINE STATUS
    // ======================================

    const selectedFineStatus = String(selectedFine?.status || "").toUpperCase();

    const selectedFinePaid = selectedFineStatus === "PAID";

    const selectedFineCancelled = selectedFineStatus === "CANCELLED";

    return (
      <>
        {/* ==================================
            PROFILE CARD
        ================================== */}

        <View
          style={[styles.profileCard, isCompact && styles.profileCardCompact]}
        >
          {/* LEFT */}

          <View
            style={[styles.profileLeft, isCompact && styles.profileLeftCompact]}
          >
            {/* PHOTO */}

            {showPicture ? (
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
                  {initials || "ST"}
                </Text>
              </View>
            )}

            {/* DETAILS */}

            <View style={styles.studentInfo}>
              <Text
                style={[
                  styles.studentName,

                  isCompact && styles.studentNameCompact,
                ]}
              >
                {student.full_name}
              </Text>

              <Text style={styles.studentMeta}>{gradeSection}</Text>

              <Text style={styles.studentMeta}>
                Student ID: {student.student_id}
              </Text>

              <Text style={styles.studentMeta}>
                Email: {student.email || "Not provided"}
              </Text>
            </View>
          </View>

          {/* ==================================
              PROFILE ACTIONS
          ================================== */}

          <View
            style={[
              styles.profileActions,

              isCompact && styles.profileActionsCompact,
            ]}
          >
            {/* QR */}

            <TouchableOpacity
              style={[
                styles.outlineButton,

                isCompact && styles.outlineButtonCompact,
              ]}
              onPress={handleQRCode}
              activeOpacity={0.75}
            >
              <View style={styles.actionButtonIcon}>
                <AppIcon name="qr" size={20} color="#173A73" />
              </View>

              <Text style={styles.outlineButtonText}>View QR Code</Text>
            </TouchableOpacity>

            {/* EDIT */}

            <TouchableOpacity
              style={[
                styles.outlineButton,

                isCompact && styles.outlineButtonCompact,
              ]}
              onPress={handleEdit}
              activeOpacity={0.75}
            >
              <View style={styles.actionButtonIcon}>
                <AppIcon name="edit" size={20} color="#173A73" />
              </View>

              <Text style={styles.outlineButtonText}>Edit Information</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================
            SUMMARY
        ================================== */}

        <View style={styles.summaryRow}>
          <View
            style={[styles.summaryCard, isCompact && styles.summaryCardCompact]}
          >
            <Text style={styles.summaryLabel}>Outstanding Balance</Text>

            <Text style={styles.outstandingValue}>
              ₱{Number(totals.outstandingBalance || 0).toFixed(2)}
            </Text>
          </View>

          <View
            style={[styles.summaryCard, isCompact && styles.summaryCardCompact]}
          >
            <Text style={styles.summaryLabel}>Total Paid</Text>

            <Text style={styles.paidValue}>
              ₱{Number(totals.totalPaid || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* ==================================
            HISTORY
        ================================== */}

        <View style={styles.historyCard}>
          <View style={styles.historyTitleBar}>
            <Text style={styles.historyTitle}>
              Recent Violations & Fines History
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.historyTable}>
              {/* HEADER */}

              <View style={styles.historyHeader}>
                <Text
                  style={[styles.historyHeaderText, styles.violationColumn]}
                >
                  Violation Type
                </Text>

                <Text style={[styles.historyHeaderText, styles.dateColumn]}>
                  Date
                </Text>

                <Text style={[styles.historyHeaderText, styles.amountColumn]}>
                  Amount
                </Text>

                <Text
                  style={[styles.historyHeaderText, styles.fineStatusColumn]}
                >
                  Status
                </Text>

                <Text style={[styles.historyHeaderText, styles.officerColumn]}>
                  Officer
                </Text>
              </View>

              {/* NO FINES */}

              {fines.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>
                    No fines recorded for this student.
                  </Text>
                </View>
              ) : (
                fines.map((fine) => {
                  const status = String(fine.status || "").toUpperCase();

                  const isPaid = status === "PAID";

                  const isCancelled = status === "CANCELLED";

                  return (
                    <TouchableOpacity
                      key={fine.id}
                      style={styles.historyRow}
                      activeOpacity={0.65}
                      onPress={() => handleFinePress(fine)}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${fine.violation_name} fine information`}
                    >
                      <Text
                        style={[
                          styles.historyCell,
                          styles.violationColumn,
                          styles.violationText,
                        ]}
                      >
                        {fine.violation_name}
                      </Text>

                      <Text style={[styles.historyCell, styles.dateColumn]}>
                        {formatRecordedDate(fine.created_at || fine.issued_at)}
                      </Text>

                      <Text
                        style={[
                          styles.historyCell,
                          styles.amountColumn,
                          styles.amountText,
                        ]}
                      >
                        ₱{Number(fine.amount || 0).toFixed(2)}
                      </Text>

                      <View style={styles.fineStatusColumn}>
                        <View
                          style={[
                            styles.statusBadge,

                            isPaid ? styles.paidBadge : styles.unpaidBadge,

                            isCancelled && styles.cancelledBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,

                              isPaid
                                ? styles.paidBadgeText
                                : styles.unpaidBadgeText,

                              isCancelled && styles.cancelledBadgeText,
                            ]}
                          >
                            {formatFineStatus(status)}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.historyCell, styles.officerColumn]}>
                        {fine.officer_name || "Unknown"}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>

        {/* ==================================
            FINE INFORMATION MODAL
        ================================== */}

        <Modal
          visible={fineModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCloseFineModal}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={handleCloseFineModal}
            />

            <PopIn
              style={[styles.fineModal, isCompact && styles.fineModalCompact]}
            >
              {/* HEADER */}

              <View style={styles.fineModalHeader}>
                <View style={styles.fineModalTitleArea}>
                  <Text style={styles.fineModalTitle}>
                    Fine Information
                    {selectedFine?.fine_reference
                      ? ` #${selectedFine.fine_reference}`
                      : ""}
                  </Text>

                  <Text style={styles.fineModalSubtitle}>
                    Student fine record details
                  </Text>
                </View>

                {selectedFine && (
                  <View
                    style={[
                      styles.statusBadge,

                      selectedFinePaid ? styles.paidBadge : styles.unpaidBadge,

                      selectedFineCancelled && styles.cancelledBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,

                        selectedFinePaid
                          ? styles.paidBadgeText
                          : styles.unpaidBadgeText,

                        selectedFineCancelled && styles.cancelledBadgeText,
                      ]}
                    >
                      {formatFineStatus(selectedFineStatus)}
                    </Text>
                  </View>
                )}
              </View>

              {/* DIVIDER */}

              <View style={styles.fineModalDivider} />

              {/* DETAILS */}

              {selectedFine && (
                <ScrollView
                  style={styles.fineModalScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.fineDetailRows}>
                    <View style={styles.fineDetailRow}>
                      <Text style={styles.fineDetailLabel}>Student</Text>

                      <Text style={styles.fineDetailValue}>
                        {student.full_name} ({student.student_id})
                      </Text>
                    </View>

                    <View style={styles.fineDetailRow}>
                      <Text style={styles.fineDetailLabel}>
                        Grade / Section
                      </Text>

                      <Text style={styles.fineDetailValue}>{gradeSection}</Text>
                    </View>

                    <View style={styles.fineDetailRow}>
                      <Text style={styles.fineDetailLabel}>Violation Type</Text>

                      <Text style={styles.fineDetailValue}>
                        {selectedFine.violation_name}
                      </Text>
                    </View>

                    <View style={styles.fineDetailRow}>
                      <Text style={styles.fineDetailLabel}>Amount</Text>

                      <Text style={styles.fineDetailAmount}>
                        ₱{Number(selectedFine.amount || 0).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.fineDetailRow}>
                      <Text style={styles.fineDetailLabel}>Date Issued</Text>

                      <Text style={styles.fineDetailValue}>
                        {formatRecordedDate(
                          selectedFine.created_at || selectedFine.issued_at,
                        )}
                      </Text>
                    </View>

                    <View style={styles.fineDetailRow}>
                      <Text style={styles.fineDetailLabel}>Issued By</Text>

                      <Text style={styles.fineDetailValue}>
                        {selectedFine.officer_name || "Unknown"}
                      </Text>
                    </View>

                    <View style={styles.fineDetailRow}>
                      <Text style={styles.fineDetailLabel}>Status</Text>

                      <Text style={styles.fineDetailValue}>
                        {formatFineStatus(selectedFineStatus)}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              )}

              {/* ACTIONS */}

              <View style={styles.fineModalActions}>
                <TouchableOpacity
                  style={styles.fineCloseButton}
                  onPress={handleCloseFineModal}
                  activeOpacity={0.75}
                >
                  <Text style={styles.fineCloseButtonText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fineManageButton}
                  onPress={handleManageFine}
                  activeOpacity={0.75}
                >
                  <Text style={styles.fineManageButtonText}>Manage Fine</Text>
                </TouchableOpacity>
              </View>
            </PopIn>
          </View>
        </Modal>

        {/* ==================================
            QR MODAL
        ================================== */}

        <Modal
          visible={qrVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCloseQRCode}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={handleCloseQRCode}
            />

            <PopIn style={[styles.qrModal, isCompact && styles.qrModalCompact]}>
              {/* MODAL HEADER */}

              <View style={styles.qrModalHeader}>
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text style={styles.qrModalTitle}>Student QR Code</Text>

                  <Text style={styles.qrModalSubtitle}>
                    Scan this code to identify the student in SmartFine
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeIconButton}
                  onPress={handleCloseQRCode}
                >
                  <AppIcon name="close" size={22} color="#444444" />
                </TouchableOpacity>
              </View>

              {/* QR */}

              <View style={styles.qrContainer}>
                <View style={styles.qrWhiteBox}>
                  <QRCode
                    value={qrValue}
                    size={isCompact ? 180 : 220}
                    backgroundColor="#FFFFFF"
                    color="#000000"
                    quietZone={8}
                  />
                </View>
              </View>

              {/* STUDENT */}

              <Text style={styles.qrStudentName}>{student.full_name}</Text>

              <Text style={styles.qrStudentId}>
                Student ID: {student.student_id}
              </Text>

              <Text style={styles.qrGradeSection}>{gradeSection}</Text>

              {/* SECURITY NOTE */}

              <View style={styles.qrNoteBox}>
                <Text style={styles.qrNoteTitle}>SmartFine Student QR</Text>

                <Text style={styles.qrNoteText}>
                  Use this QR code to identify this student within SmartFine.
                </Text>
              </View>

              {/* CLOSE */}

              <TouchableOpacity
                style={styles.qrCloseButton}
                onPress={handleCloseQRCode}
              >
                <Text style={styles.qrCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </PopIn>
          </View>
        </Modal>
      </>
    );
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
          <View style={styles.logoArea}>
            <Image
              source={require("../../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.navigation}>
            {navItems.map((item) => {
              const active = item.label === "Students";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={styles.navIconContainer}>
                    <AppIcon
                      name={item.icon}
                      focused={active}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>

                  <Text style={styles.navText}>{item.label}</Text>
                  <AdminNavBadge label={item.label} />
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to Students Directory"
          >
            <View style={styles.backIconImage}>
              <AppIcon name="back" size={22} color="#111111" />
            </View>

            <Text
              style={[styles.backText, isCompact && styles.backTextCompact]}
              numberOfLines={1}
            >
              Student Profile
            </Text>
          </TouchableOpacity>

          {/* ==================================
              MOBILE NAV
          ================================== */}

          {!isTablet && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileNav}
            >
              {navItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.mobileNavItem,

                    item.label === "Students" && styles.mobileNavItemActive,
                  ]}
                  onPress={() => router.push(item.route as any)}
                >
                  <Text
                    style={[
                      styles.mobileNavText,

                      item.label === "Students" && styles.mobileNavTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <AdminNavBadge label={item.label} variant="menu" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* The loaded page fades in after the placeholder. */}
          <FadeIn key={loading ? "loading" : "content"}>
            {renderContent()}
          </FadeIn>
        </ScrollView>
      </View>

      <StudentFormModal
        visible={showEdit}
        mode="edit"
        studentId={studentId}
        onClose={() => setShowEdit(false)}
        onSaved={() => void loadStudent()}
      />
    </View>
  );
}

// ==========================================
// FINE STATUS
// ==========================================

function formatFineStatus(status: string) {
  switch (String(status || "").toUpperCase()) {
    case "PAID":
      return "Paid";

    case "CANCELLED":
      return "Cancelled";

    case "WAIVED":
      return "Waived";

    case "PENDING":
      return "Pending";

    default:
      return "Unpaid";
  }
}

// ==========================================
// RECORDED DATE / TIME
// ==========================================

function formatRecordedDate(value: string) {
  if (!value) {
    return "—";
  }

  const trimmedValue = String(value).trim();

  let normalized = trimmedValue;

  // SQLite CURRENT_TIMESTAMP normally returns:
  // YYYY-MM-DD HH:MM:SS
  //
  // It represents UTC time.
  // Adding "Z" allows JavaScript to convert it
  // correctly to the device/browser local time.

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmedValue)) {
    normalized = `${trimmedValue.replace(" ", "T")}Z`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    normalized = `${trimmedValue}T00:00:00`;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return trimmedValue;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
