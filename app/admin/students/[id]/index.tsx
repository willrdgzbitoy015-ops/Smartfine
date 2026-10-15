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
import { FineFormModal } from "@/components/admin-forms/fine-form-modal";
import { StudentFormModal } from "@/components/admin-forms/student-form-modal";

import QRCode from "react-native-qrcode-svg";

import { returnToLogin, useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";
import { AdminNavBadge } from "@/components/notification-badge";
import { FadeIn, PopIn } from "@/components/motion";
import { SkeletonProfile } from "@/components/skeleton";
import { Pagination } from "@/components/pagination";
import { SummaryCard, SummaryCardRow } from "@/components/summary-card";
import { usePagination } from "@/hooks/use-pagination";
import { formatPeso } from "@/utils/format-peso";

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

  // Add Fine is a pop-up too, opened from the profile card.
  const [showFineForm, setShowFineForm] = useState(false);

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

  // The fines history shows ten per page, newest first.
  const pager = usePagination(
    data?.fines ?? [],
    String(data?.student?.id ?? ""),
  );

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

  const navItems = [
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
  // ADD FINE
  // ==========================================

  // Opens the Add Fine pop-up with this student already chosen.
  const handleAddFine = () => {
    if (
      !data?.student ||
      String(data.student.account_status).toUpperCase() !== "ACTIVE"
    ) {
      return;
    }

    setShowFineForm(true);
  };

  // "View Fine" on the saved fine opens it in the Fines Directory.
  const handleViewSavedFine = (fineId: number) => {
    setShowFineForm(false);

    router.push(`/admin/fines?fineId=${fineId}` as any);
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

    // How many fines are in each state, for the summary cards.
    const countByStatus = (status: string) =>
      fines.filter((fine) => String(fine.status || "").toUpperCase() === status)
        .length;

    const unpaidCount = countByStatus("UNPAID");

    const paidCount = countByStatus("PAID");

    const cancelledCount = countByStatus("CANCELLED");

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

    // A fine can only be recorded for an active account.
    const canAddFine = String(student.account_status).toUpperCase() === "ACTIVE";

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
            {/* ADD FINE */}

            <TouchableOpacity
              style={[
                styles.outlineButton,

                styles.addFineButton,

                isCompact && styles.outlineButtonCompact,

                !canAddFine && styles.addFineButtonDisabled,
              ]}
              onPress={handleAddFine}
              disabled={!canAddFine}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Add a fine for ${student.full_name}`}
              accessibilityState={{ disabled: !canAddFine }}
            >
              <Text style={styles.addFineButtonText}>+ Add Fine</Text>
            </TouchableOpacity>

            {/* QR */}

            <TouchableOpacity
              style={[
                styles.outlineButton,

                isCompact && styles.outlineButtonCompact,
              ]}
              onPress={handleQRCode}
              activeOpacity={0.75}
            >
              <Image
                source={require("../../../../assets/icons/qr-code.png")}
                style={styles.actionButtonIcon}
                resizeMode="contain"
              />

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
              <Image
                source={require("../../../../assets/icons/edit-image.png")}
                style={styles.actionButtonIcon}
                resizeMode="contain"
              />

              <Text style={styles.outlineButtonText}>Edit Information</Text>
            </TouchableOpacity>

            {!canAddFine && (
              <Text
                style={[
                  styles.inactiveHint,

                  isCompact && styles.inactiveHintCompact,
                ]}
              >
                This account is inactive, so a fine cannot be recorded.
              </Text>
            )}
          </View>
        </View>

        {/* ==================================
            SUMMARY
        ================================== */}

        <View style={styles.summaryWrap}>
          <SummaryCardRow>
            <SummaryCard
              label="Outstanding Balance"
              value={formatPeso(totals.outstandingBalance)}
              hint={unpaidCount > 0 ? "Still to be paid" : "Nothing left to pay"}
              tone={unpaidCount > 0 ? "danger" : "success"}
            />

            <SummaryCard
              label="Total Paid"
              value={formatPeso(totals.totalPaid)}
              hint={`${paidCount} paid ${paidCount === 1 ? "fine" : "fines"}`}
              tone="success"
            />

            <SummaryCard
              label="Unpaid Fines"
              value={String(unpaidCount)}
              hint={unpaidCount > 0 ? "Waiting for payment" : "None"}
              tone="attention"
            />

            <SummaryCard
              label="Fines Recorded"
              value={String(fines.length)}
              hint={
                cancelledCount > 0
                  ? `Including ${cancelledCount} cancelled`
                  : "On this account"
              }
              tone="info"
            />
          </SummaryCardRow>
        </View>

        {/* ==================================
            HISTORY
        ================================== */}

        <View style={styles.historyCard}>
          <View style={styles.historyTitleBar}>
            <Text style={styles.historyTitle}>
              Recent Violations & Fines History
            </Text>

            <Text style={styles.historySubtitle}>
              Tap a fine to see its details.
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.historyScroll,
              isCompact && styles.historyScrollCompact,
            ]}
          >
            <View
              style={[styles.historyTable, isCompact && styles.historyTableCompact]}
            >
              {/* HEADER (a phone shows each fine as a card instead) */}

              {!isCompact && (
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
              )}

              {/* NO FINES */}

              {fines.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>
                    No fines recorded for this student.
                  </Text>
                </View>
              ) : (
                pager.pageItems.map((fine) => {
                  const status = String(fine.status || "").toUpperCase();

                  const isPaid = status === "PAID";

                  const isCancelled = status === "CANCELLED";

                  // Phone: violation and amount on top, date, officer and
                  // status underneath.
                  if (isCompact) {
                    return (
                      <TouchableOpacity
                        key={fine.id}
                        style={styles.compactRow}
                        activeOpacity={0.65}
                        onPress={() => handleFinePress(fine)}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${fine.violation_name} fine information`}
                      >
                        <View style={styles.compactTop}>
                          <Text
                            style={[styles.violationText, styles.compactViolation]}
                            numberOfLines={1}
                          >
                            {fine.violation_name}
                          </Text>

                          <Text style={styles.amountText}>
                            {formatPeso(fine.amount)}
                          </Text>
                        </View>

                        <View style={styles.compactBottom}>
                          <Text style={styles.compactMeta} numberOfLines={2}>
                            {formatRecordedDate(fine.created_at || fine.issued_at)}
                            {" · "}
                            {fine.officer_name || "Unknown"}
                          </Text>

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
                      </TouchableOpacity>
                    );
                  }

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
                        {formatPeso(fine.amount)}
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

          <Pagination pager={pager} noun="fines" />
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
                        {formatPeso(selectedFine.amount)}
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
                  <Text style={styles.closeIconText}>×</Text>
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
                    <Image
                      source={item.icon}
                      style={styles.navImageIcon}
                      resizeMode="contain"
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
            <Image
              source={require("../../../../assets/icons/back_icon.png")}
              style={styles.backIconImage}
              resizeMode="contain"
            />

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

      <FineFormModal
        visible={showFineForm}
        mode="add"
        studentId={data?.student ? Number(data.student.id) : null}
        onClose={() => setShowFineForm(false)}
        onSaved={() => void loadStudent()}
        onViewFine={handleViewSavedFine}
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
