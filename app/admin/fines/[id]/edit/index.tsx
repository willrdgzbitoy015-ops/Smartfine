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

import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";

import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";

import { styles } from "./edit-fine.styles";

// ==========================================
// TYPES
// ==========================================

type StudentOption = {
  id: number;

  student_id: string;

  username: string;

  first_name: string;
  middle_name: string | null;
  last_name: string;

  full_name: string;

  grade_level: string | null;

  section: string | null;
};

type ViolationOption = {
  id: number;

  violation_code: string | null;

  violation_name: string;

  description: string | null;

  amount_centavos: number;

  amount: number;
};

type OfficerOption = {
  id: number;

  username: string;

  first_name: string;
  middle_name: string | null;
  last_name: string;

  full_name: string;

  role: string;
};

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

  status: string;
};

type NavItem = {
  label: string;
  route: string;
  icon?: any;
};

// ==========================================
// EDIT FINE
// ==========================================

export default function EditFine() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // ==========================================
  // ROUTE
  // ==========================================

  const rawId = params.id;

  const fineId = Array.isArray(rawId) ? rawId[0] : rawId;

  // ==========================================
  // SUCCESS MODAL
  // ==========================================

  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
  // OPTIONS
  // ==========================================

  const [students, setStudents] = useState<StudentOption[]>([]);

  const [violations, setViolations] = useState<ViolationOption[]>([]);

  const [officers, setOfficers] = useState<OfficerOption[]>([]);

  // ==========================================
  // FINE
  // ==========================================

  const [fineReference, setFineReference] = useState("");

  const [fineStatus, setFineStatus] = useState("");

  // ==========================================
  // STUDENT
  // ==========================================

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );

  const [studentSearch, setStudentSearch] = useState("");

  const [studentSuggestionsOpen, setStudentSuggestionsOpen] = useState(false);

  // ==========================================
  // VIOLATION
  // ==========================================

  const [selectedViolationId, setSelectedViolationId] = useState<number | null>(
    null,
  );

  const [violationMenuOpen, setViolationMenuOpen] = useState(false);

  // ==========================================
  // OFFICER
  // ==========================================

  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(
    null,
  );

  const [officerMenuOpen, setOfficerMenuOpen] = useState(false);

  // ==========================================
  // OTHER FORM VALUES
  // ==========================================

  const [issuedAt, setIssuedAt] = useState("");

  const [remarks, setRemarks] = useState("");

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: NavItem[] = [
    {
      label: "Dashboard",

      route: "/admin/dashboard",

      icon: require("../../../../../assets/icons/dashboard.png"),
    },

    {
      label: "Students",

      route: "/admin/students",

      icon: require("../../../../../assets/icons/students.png"),
    },

    {
      label: "Fines",

      route: "/admin/fines",

      icon: require("../../../../../assets/icons/fines.png"),
    },

    {
      label: "QR Scanner",

      route: "/admin/qr-scanner",

      icon: require("../../../../../assets/icons/qr-codeWhite.png"),
    },

    {
      label: "Reports",

      route: "/admin/reports",

      icon: require("../../../../../assets/icons/reports.png"),
    },

    {
      label: "Settings",

      route: "/admin/settings",

      icon: require("../../../../../assets/icons/settings.png"),
    },

    {
      label: "Officers",

      route: "/admin/officers",

      icon: require("../../../../../assets/icons/officers.png"),
    },
  ];

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadPageData = async () => {
    if (!fineId) {
      return;
    }

    try {
      setLoading(true);

      setErrorMessage("");

      const [
        fineResponse,
        studentsResponse,
        violationsResponse,
        officersResponse,
      ] = await Promise.all([
        fetch(`${API_BASE}/api/fines/${fineId}`),

        fetch(`${API_BASE}/api/fines/options/students`),

        fetch(`${API_BASE}/api/fines/options/violations`),

        fetch(`${API_BASE}/api/fines/options/officers`),
      ]);

      const fineData = await fineResponse.json();

      const studentsData = await studentsResponse.json();

      const violationsData = await violationsResponse.json();

      const officersData = await officersResponse.json();

      // ======================================
      // FINE
      // ======================================

      if (!fineResponse.ok || !fineData.success || !fineData.fine) {
        throw new Error(fineData.message || "Failed to load fine.");
      }

      // ======================================
      // STUDENTS
      // ======================================

      if (!studentsResponse.ok || !studentsData.success) {
        throw new Error(studentsData.message || "Failed to load students.");
      }

      // ======================================
      // VIOLATIONS
      // ======================================

      if (!violationsResponse.ok || !violationsData.success) {
        throw new Error(
          violationsData.message || "Failed to load violation types.",
        );
      }

      // ======================================
      // OFFICERS
      // ======================================

      if (!officersResponse.ok || !officersData.success) {
        throw new Error(officersData.message || "Failed to load officers.");
      }

      const loadedFine: Fine = fineData.fine;

      setStudents(studentsData.students || []);

      setViolations(violationsData.violations || []);

      setOfficers(officersData.officers || []);

      // ======================================
      // EXISTING VALUES
      // ======================================

      setFineReference(loadedFine.fine_reference);

      setFineStatus(loadedFine.status);

      setSelectedStudentId(loadedFine.student_id);

      setStudentSearch(loadedFine.student_name);

      setSelectedViolationId(loadedFine.violation_type_id);

      setSelectedOfficerId(loadedFine.officer_id);

      setIssuedAt(formatDateForInput(loadedFine.issued_at));

      setRemarks(loadedFine.remarks || "");
    } catch (error) {
      console.error("Load Edit Fine error:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Could not load the fine.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [fineId]);

  // ==========================================
  // CURRENT STATUS
  // ==========================================

  const isEditable = String(fineStatus || "").toUpperCase() === "UNPAID";

  // ==========================================
  // SELECTED STUDENT
  // ==========================================

  const selectedStudent = useMemo(() => {
    return students.find((student) => student.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // ==========================================
  // STUDENT SEARCH RESULTS
  // ==========================================

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    if (!search) {
      return [];
    }

    return students
      .filter((student) => {
        const searchable = [
          student.full_name,
          student.student_id,
          student.username,
          student.grade_level,
          student.section,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(search);
      })
      .slice(0, 6);
  }, [students, studentSearch]);

  // ==========================================
  // SELECTED VIOLATION
  // ==========================================

  const selectedViolation = useMemo(() => {
    return (
      violations.find((violation) => violation.id === selectedViolationId) ||
      null
    );
  }, [violations, selectedViolationId]);

  // ==========================================
  // SELECTED OFFICER
  // ==========================================

  const selectedOfficer = useMemo(() => {
    return officers.find((officer) => officer.id === selectedOfficerId) || null;
  }, [officers, selectedOfficerId]);

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // ==========================================
  // STUDENT SEARCH
  // ==========================================

  const handleStudentSearchChange = (text: string) => {
    setStudentSearch(text);

    setSelectedStudentId(null);

    setStudentSuggestionsOpen(text.trim().length > 0);

    setViolationMenuOpen(false);

    setOfficerMenuOpen(false);

    clearError();
  };

  const selectStudent = (student: StudentOption) => {
    setSelectedStudentId(student.id);

    setStudentSearch(student.full_name);

    setStudentSuggestionsOpen(false);

    clearError();
  };

  // ==========================================
  // DROPDOWNS
  // ==========================================

  const toggleViolationMenu = () => {
    setViolationMenuOpen(!violationMenuOpen);

    setOfficerMenuOpen(false);

    setStudentSuggestionsOpen(false);
  };

  const toggleOfficerMenu = () => {
    setOfficerMenuOpen(!officerMenuOpen);

    setViolationMenuOpen(false);

    setStudentSuggestionsOpen(false);
  };

  // ==========================================
  // SAVE
  // ==========================================

  const handleSave = async () => {
    setErrorMessage("");

    // ======================================
    // EDITABLE CHECK
    // ======================================

    if (!isEditable) {
      setErrorMessage("Only unpaid fines can be edited.");

      return;
    }

    // ======================================
    // STUDENT
    // ======================================

    if (selectedStudentId === null) {
      setErrorMessage("Please search for and select a student.");

      return;
    }

    // ======================================
    // VIOLATION
    // ======================================

    if (selectedViolationId === null) {
      setErrorMessage("Please select a violation type.");

      return;
    }

    // ======================================
    // OFFICER
    // ======================================

    if (selectedOfficerId === null) {
      setErrorMessage("Please select an assigned officer.");

      return;
    }

    // ======================================
    // DATE
    // ======================================

    if (!isValidDate(issuedAt)) {
      setErrorMessage("Please enter the violation date using YYYY-MM-DD.");

      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/api/fines/${fineId}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          studentId: selectedStudentId,

          violationTypeId: selectedViolationId,

          recordedBy: selectedOfficerId,

          remarks: remarks.trim(),

          issuedAt: issuedAt.trim(),
        }),
      });

      const data = await response.json();

      console.log("Update fine response:", data);

      // ======================================
      // UPDATE FAILED
      // ======================================

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to update fine.");

        return;
      }

      // ======================================
      // SHOW CUSTOM SUCCESS MODAL
      // ======================================

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Update fine error:", error);

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // SUCCESS MODAL CLOSE
  // ==========================================

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);

    router.replace(`/admin/fines/${fineId}` as any);
  };

  // ==========================================
  // BACK / CANCEL
  // ==========================================

  const handleBack = () => {
    router.replace(`/admin/fines/${fineId}` as any);
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
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#173A73" />

        <Text style={styles.loadingText}>Loading fine information...</Text>
      </View>
    );
  }

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
              source={require("../../../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ==================================
              PAGE HEADER
          ================================== */}

          <View style={styles.pageHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>

            <View>
              <Text style={styles.pageTitle}>Edit Fine</Text>

              <Text style={styles.pageSubtitle}>Update fine information</Text>
            </View>
          </View>

          {/* ==================================
              FORM CARD
          ================================== */}

          <View style={styles.formCard}>
            {/* CARD HEADER */}

            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Edit Fine Information</Text>

                <Text style={styles.fineReference}>{fineReference}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,

                  isEditable
                    ? styles.statusBadgeUnpaid
                    : styles.statusBadgeLocked,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,

                    isEditable
                      ? styles.statusTextUnpaid
                      : styles.statusTextLocked,
                  ]}
                >
                  {formatStatus(fineStatus)}
                </Text>
              </View>
            </View>

            {/* ==================================
                NOT EDITABLE
            ================================== */}

            {!isEditable && (
              <View style={styles.lockedBox}>
                <Text style={styles.lockedTitle}>Editing Disabled</Text>

                <Text style={styles.lockedText}>
                  Paid or cancelled fines cannot be edited.
                </Text>
              </View>
            )}

            {/* ==================================
                ROW 1
            ================================== */}

            <View style={[styles.formRow, styles.formRowTop]}>
              {/* STUDENT */}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Student Name</Text>

                <TextInput
                  style={styles.input}
                  value={studentSearch}
                  onFocus={() => {
                    if (isEditable && studentSearch.trim().length > 0) {
                      setStudentSuggestionsOpen(true);
                    }
                  }}
                  onChangeText={handleStudentSearchChange}
                  placeholder="Type student name or ID"
                  placeholderTextColor="#8C939F"
                  editable={isEditable && !saving}
                />

                {studentSuggestionsOpen && isEditable && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredStudents.length === 0 ? (
                        <View style={styles.emptyOption}>
                          <Text style={styles.emptyOptionText}>
                            No matching active students found.
                          </Text>
                        </View>
                      ) : (
                        filteredStudents.map((student) => (
                          <TouchableOpacity
                            key={student.id}
                            style={styles.dropdownItem}
                            onPress={() => selectStudent(student)}
                          >
                            <Text style={styles.dropdownTitle}>
                              {student.full_name}
                            </Text>

                            <Text style={styles.dropdownSubtitle}>
                              {student.student_id}

                              {student.grade_level
                                ? ` • ${student.grade_level}`
                                : ""}

                              {student.section ? ` - ${student.section}` : ""}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}

                {selectedStudent && (
                  <Text style={styles.helperText}>
                    Student ID: {selectedStudent.student_id}
                  </Text>
                )}
              </View>

              {/* DATE */}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Date of Violation</Text>

                <TextInput
                  style={styles.input}
                  value={issuedAt}
                  onChangeText={(text) => {
                    setIssuedAt(text);

                    clearError();
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#8C939F"
                  editable={isEditable && !saving}
                />

                <Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
              </View>
            </View>

            {/* ==================================
                ROW 2
            ================================== */}

            <View style={[styles.formRow, styles.formRowMiddle]}>
              {/* VIOLATION */}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Violation Type</Text>

                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={toggleViolationMenu}
                  disabled={!isEditable || saving}
                >
                  <Text style={styles.selectText} numberOfLines={1}>
                    {selectedViolation
                      ? selectedViolation.violation_name
                      : "Select violation type"}
                  </Text>

                  <Text style={styles.selectArrow}>▼</Text>
                </TouchableOpacity>

                {violationMenuOpen && isEditable && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                    >
                      {violations.map((violation) => (
                        <TouchableOpacity
                          key={violation.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedViolationId(violation.id);

                            setViolationMenuOpen(false);

                            clearError();
                          }}
                        >
                          <Text style={styles.dropdownTitle}>
                            {violation.violation_name}
                          </Text>

                          <Text style={styles.dropdownSubtitle}>
                            {formatMoney(violation.amount)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* OFFICER */}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Assigned Officer</Text>

                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={toggleOfficerMenu}
                  disabled={!isEditable || saving}
                >
                  <Text style={styles.selectText} numberOfLines={1}>
                    {selectedOfficer
                      ? selectedOfficer.full_name
                      : "Select officer"}
                  </Text>

                  <Text style={styles.selectArrow}>▼</Text>
                </TouchableOpacity>

                {officerMenuOpen && isEditable && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled
                    >
                      {officers.map((officer) => (
                        <TouchableOpacity
                          key={officer.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedOfficerId(officer.id);

                            setOfficerMenuOpen(false);

                            clearError();
                          }}
                        >
                          <Text style={styles.dropdownTitle}>
                            {officer.full_name}
                          </Text>

                          <Text style={styles.dropdownSubtitle}>
                            {formatRole(officer.role)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* ==================================
                ROW 3
            ================================== */}

            <View style={[styles.formRow, styles.formRowBottom]}>
              {/* AMOUNT */}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Amount</Text>

                <View style={styles.amountBox}>
                  <Text style={styles.amountText}>
                    {selectedViolation
                      ? formatMoney(selectedViolation.amount)
                      : "₱0.00"}
                  </Text>
                </View>

                <Text style={styles.helperText}>
                  Automatically based on the violation type.
                </Text>
              </View>

              {/* NOTES */}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Notes / Description</Text>

                <TextInput
                  style={styles.input}
                  value={remarks}
                  onChangeText={(text) => {
                    setRemarks(text);

                    clearError();
                  }}
                  placeholder="Enter minor details"
                  placeholderTextColor="#8C939F"
                  editable={isEditable && !saving}
                />
              </View>
            </View>

            {/* ==================================
                ERROR
            ================================== */}

            {errorMessage !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Unable to Save Changes</Text>

                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* ==================================
                ACTIONS
            ================================== */}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleBack}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,

                  (!isEditable || saving) && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={!isEditable || saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ======================================
          SUCCESS MODAL
      ====================================== */}

      <SuccessModal
        visible={showSuccessModal}
        title="Fine Updated"
        message="Fine updated successfully."
        buttonText="OK"
        onClose={handleSuccessModalClose}
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
// DATE FOR INPUT
// ==========================================

function formatDateForInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ==========================================
// VALID DATE
// ==========================================

function isValidDate(value: string) {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!pattern.test(value.trim())) {
    return false;
  }

  const [year, month, day] = value.trim().split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
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
// STATUS
// ==========================================

function formatStatus(status: string) {
  switch (String(status || "").toUpperCase()) {
    case "PAID":
      return "Paid";

    case "CANCELLED":
      return "Cancelled";

    default:
      return "Unpaid";
  }
}

// ==========================================
// ROLE
// ==========================================

function formatRole(role: string) {
  switch (String(role || "").toUpperCase()) {
    case "FINES_OFFICER":
      return "Fines Officer";

    case "ADMIN":
      return "Administrator";

    default:
      return role;
  }
}
