import { useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useLocalSearchParams, useRouter } from "expo-router";

import { API_BASE } from "@/constants/api";

import SuccessModal from "@/components/success-modal";

import { styles } from "./add-fine.styles";

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

type ViolationOption = {
  id: number;

  violation_code: string | null;

  violation_name: string;

  description: string | null;

  amount_centavos: number;

  amount: number;
};

// ==========================================
// OFFICER RECORD FINE
// MOBILE PHONE VIEW ONLY
// ==========================================

export default function OfficerAddFine() {
  const router = useRouter();

  const params = useLocalSearchParams();

  // ========================================
  // STUDENT FROM QR SCANNER
  // ========================================

  const rawStudentId = params.studentId;

  const studentDatabaseId = useMemo(() => {
    const value = Array.isArray(rawStudentId) ? rawStudentId[0] : rawStudentId;

    if (!value) {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }, [rawStudentId]);

  // ========================================
  // CURRENT OFFICER
  // ========================================

  const [officerId, setOfficerId] = useState<number | null>(null);

  // ========================================
  // STUDENT
  // ========================================

  const [student, setStudent] = useState<Student | null>(null);

  const [profileImageFailed, setProfileImageFailed] = useState(false);

  // ========================================
  // VIOLATIONS
  // ========================================

  const [violations, setViolations] = useState<ViolationOption[]>([]);

  const [selectedViolationId, setSelectedViolationId] = useState<number | null>(
    null,
  );

  const [violationMenuOpen, setViolationMenuOpen] = useState(false);

  // ========================================
  // FORM VALUES
  // ========================================

  const [issuedAt, setIssuedAt] = useState(getTodayDate());

  const [remarks, setRemarks] = useState("");

  // ========================================
  // SCREEN STATE
  // ========================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // ========================================
  // SUCCESS
  // ========================================

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  // ========================================
  // SELECTED VIOLATION
  // ========================================

  const selectedViolation = useMemo(() => {
    return (
      violations.find((violation) => violation.id === selectedViolationId) ||
      null
    );
  }, [violations, selectedViolationId]);

  // ========================================
  // LOAD PAGE
  // ========================================

  useEffect(() => {
    loadPage();
  }, [studentDatabaseId]);

  // ========================================
  // LOAD PAGE DATA
  // ========================================

  const loadPage = async () => {
    try {
      setLoading(true);

      setErrorMessage("");

      // ====================================
      // STUDENT ID REQUIRED
      // ====================================

      if (studentDatabaseId === null) {
        setErrorMessage(
          "No student was selected. Please return to the QR Scanner and scan a student.",
        );

        return;
      }

      // ====================================
      // CURRENT OFFICER
      // ====================================

      const storedUserId = await AsyncStorage.getItem("userId");

      const storedUserRole = await AsyncStorage.getItem("userRole");

      const parsedOfficerId = Number(storedUserId);

      if (!Number.isInteger(parsedOfficerId) || parsedOfficerId <= 0) {
        setErrorMessage(
          "Your officer session could not be identified. Please log in again.",
        );

        return;
      }

      if (String(storedUserRole || "").toUpperCase() !== "FINES_OFFICER") {
        setErrorMessage(
          "This page is only available to a Fines Officer account.",
        );

        return;
      }

      setOfficerId(parsedOfficerId);

      // ====================================
      // LOAD STUDENT + VIOLATIONS
      // ====================================

      const [studentResponse, violationsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/students/${studentDatabaseId}`),

        fetch(`${API_BASE}/api/fines/options/violations`),
      ]);

      const studentData = await studentResponse.json();

      const violationsData = await violationsResponse.json();

      // ====================================
      // STUDENT
      // ====================================

      if (!studentResponse.ok || !studentData.success) {
        throw new Error(
          studentData.message || "Could not load the selected student.",
        );
      }

      const loadedStudent = studentData.student;

      if (!loadedStudent) {
        throw new Error("The selected student could not be found.");
      }

      if (
        String(loadedStudent.account_status || "").toUpperCase() !== "ACTIVE"
      ) {
        setStudent(loadedStudent);

        setErrorMessage(
          "This student account is inactive. A new fine cannot be recorded.",
        );

        return;
      }

      setStudent(loadedStudent);

      // ====================================
      // VIOLATIONS
      // ====================================

      if (!violationsResponse.ok || !violationsData.success) {
        throw new Error(
          violationsData.message || "Could not load violation types.",
        );
      }

      setViolations(
        Array.isArray(violationsData.violations)
          ? violationsData.violations
          : [],
      );
    } catch (error) {
      console.error("Officer Record Fine load error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load the Record Fine form.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // PROFILE PICTURE URL
  // ========================================

  const getProfilePictureUrl = (uri: string | null | undefined) => {
    if (!uri) {
      return null;
    }

    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      return uri;
    }

    return `${API_BASE}${uri}`;
  };

  // ========================================
  // CLEAR ERROR
  // ========================================

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // ========================================
  // SAVE FINE
  // ========================================

  const handleSaveFine = async () => {
    setErrorMessage("");

    // ====================================
    // STUDENT
    // ====================================

    if (!student) {
      setErrorMessage("Student information is missing.");

      return;
    }

    // ====================================
    // OFFICER
    // ====================================

    if (officerId === null) {
      setErrorMessage(
        "Your officer account could not be identified. Please log in again.",
      );

      return;
    }

    // ====================================
    // VIOLATION
    // ====================================

    if (selectedViolationId === null) {
      setErrorMessage("Please select a violation type.");

      return;
    }

    // ====================================
    // DATE
    // ====================================

    if (!isValidDate(issuedAt)) {
      setErrorMessage("Please enter the violation date using YYYY-MM-DD.");

      return;
    }

    // ====================================
    // CREATE FINE
    // ====================================

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/api/fines`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          studentId: student.id,

          violationTypeId: selectedViolationId,

          recordedBy: officerId,

          remarks: remarks.trim(),

          issuedAt: issuedAt.trim(),
        }),
      });

      const data = await response.json();

      console.log("Officer create fine response:", data);

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to record the fine.");

        return;
      }

      const fineReference =
        data.fine?.fineReference || data.fine?.fine_reference;

      const message = fineReference
        ? `Fine ${fineReference} was recorded successfully.`
        : "Fine recorded successfully.";

      setSuccessMessage(message);

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Officer create fine error:", error);

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // SUCCESS
  // ========================================

  const handleSuccessClose = () => {
    setShowSuccessModal(false);

    router.replace("/officer/qr-scanner" as any);
  };

  // ========================================
  // BACK
  // ========================================

  const handleBack = () => {
    router.back();
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#173A73" />

        <ActivityIndicator size="large" color="#45B94F" />

        <Text style={styles.loadingTitle}>Loading Record Fine</Text>

        <Text style={styles.loadingText}>Please wait...</Text>
      </View>
    );
  }

  // ========================================
  // STUDENT INFORMATION
  // ========================================

  const profilePictureUrl = getProfilePictureUrl(student?.profile_picture_uri);

  const showStudentPicture = Boolean(profilePictureUrl) && !profileImageFailed;

  const studentInitials = `${student?.first_name?.[0] || ""}${
    student?.last_name?.[0] || ""
  }`.toUpperCase();

  const gradeSection =
    [student?.grade_level, student?.section].filter(Boolean).join(" - ") ||
    "Not assigned";

  // ========================================
  // UI
  // ========================================

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#173A73" />

      {/* ====================================
          HEADER
      ==================================== */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.75}
        >
          <Image
            source={require("../../../../assets/icons/back_icon.png")}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerEyebrow}>SmartFine</Text>

          <Text style={styles.headerTitle}>Record Fine</Text>
        </View>

        <View style={styles.headerFineIconBox}>
          <Image
            source={require("../../../../assets/icons/fines.png")}
            style={styles.headerFineIcon}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* ====================================
          CONTENT
      ==================================== */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ==================================
            STUDENT
        ================================== */}

        {student && (
          <View style={styles.studentCard}>
            <View style={styles.selectedStudentBadge}>
              <Text style={styles.selectedStudentBadgeText}>
                Student Selected
              </Text>
            </View>

            <View style={styles.studentRow}>
              {showStudentPicture ? (
                <Image
                  source={{
                    uri: profilePictureUrl!,
                  }}
                  style={styles.studentPhoto}
                  resizeMode="cover"
                  onError={() => setProfileImageFailed(true)}
                />
              ) : (
                <View style={styles.studentPhotoFallback}>
                  <Text style={styles.studentInitials}>
                    {studentInitials || "ST"}
                  </Text>
                </View>
              )}

              <View style={styles.studentDetails}>
                <Text style={styles.studentName} numberOfLines={2}>
                  {student.full_name}
                </Text>

                <Text style={styles.studentNumber}>{student.student_id}</Text>

                <Text style={styles.studentGrade}>{gradeSection}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ==================================
            ERROR
        ================================== */}

        {errorMessage !== "" && (
          <View style={styles.errorCard}>
            <View style={styles.errorIconBox}>
              <Text style={styles.errorIconText}>!</Text>
            </View>

            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Unable to Record Fine</Text>

              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
          </View>
        )}

        {/* ==================================
            FORM
        ================================== */}

        {student && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Violation Details</Text>

            <Text style={styles.sectionDescription}>
              Select the student's violation and review the fine amount before
              saving.
            </Text>

            {/* ==============================
                VIOLATION
            ============================== */}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Violation Type</Text>

              <TouchableOpacity
                style={[
                  styles.selectButton,

                  violationMenuOpen && styles.selectButtonActive,
                ]}
                onPress={() => {
                  setViolationMenuOpen(!violationMenuOpen);

                  clearError();
                }}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.selectText,

                    !selectedViolation && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedViolation
                    ? selectedViolation.violation_name
                    : "Select violation type"}
                </Text>

                <Text style={styles.selectArrow}>
                  {violationMenuOpen ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {violationMenuOpen && (
                <View style={styles.dropdownMenu}>
                  <ScrollView
                    style={styles.dropdownScroll}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {violations.length === 0 ? (
                      <View style={styles.emptyDropdown}>
                        <Text style={styles.emptyDropdownText}>
                          No active violation types are available.
                        </Text>
                      </View>
                    ) : (
                      violations.map((violation) => (
                        <TouchableOpacity
                          key={violation.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedViolationId(violation.id);

                            setViolationMenuOpen(false);

                            clearError();
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={styles.dropdownTextArea}>
                            <Text style={styles.dropdownTitle}>
                              {violation.violation_name}
                            </Text>

                            {violation.description ? (
                              <Text
                                style={styles.dropdownDescription}
                                numberOfLines={2}
                              >
                                {violation.description}
                              </Text>
                            ) : null}
                          </View>

                          <Text style={styles.dropdownAmount}>
                            {formatMoney(violation.amount)}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* ==============================
                AMOUNT
            ============================== */}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Fine Amount</Text>

              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Amount</Text>

                <Text style={styles.amountValue}>
                  {selectedViolation
                    ? formatMoney(selectedViolation.amount)
                    : "₱0.00"}
                </Text>
              </View>

              <Text style={styles.amountHelper}>
                The fine amount is automatically based on the selected
                violation.
              </Text>
            </View>

            {/* ==============================
                DATE
            ============================== */}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of Violation</Text>

              <TextInput
                style={styles.textInput}
                value={issuedAt}
                onChangeText={(text) => {
                  setIssuedAt(text);

                  clearError();
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9AA5B5"
                editable={!saving}
                autoCorrect={false}
              />

              <Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
            </View>

            {/* ==============================
                REMARKS
            ============================== */}

            <View style={[styles.fieldGroup, styles.lastFieldGroup]}>
              <Text style={styles.fieldLabel}>Notes / Description</Text>

              <TextInput
                style={styles.remarksInput}
                value={remarks}
                onChangeText={(text) => {
                  setRemarks(text);

                  clearError();
                }}
                placeholder="Enter additional details about the violation"
                placeholderTextColor="#9AA5B5"
                editable={!saving}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />

              <Text style={styles.characterCount}>{remarks.length}/500</Text>
            </View>
          </View>
        )}

        {/* ==================================
            ACTIONS
        ================================== */}

        {student && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleBack}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSaveFine}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Fine</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ==================================
            RETURN TO SCANNER IF NO STUDENT
        ================================== */}

        {!student && (
          <TouchableOpacity
            style={styles.returnScannerButton}
            onPress={() => router.replace("/officer/qr-scanner" as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.returnScannerButtonText}>
              Return to QR Scanner
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ====================================
          SUCCESS MODAL
      ==================================== */}

      <SuccessModal
        visible={showSuccessModal}
        title="Fine Recorded"
        message={successMessage}
        buttonText="Scan Another Student"
        onClose={handleSuccessClose}
      />
    </View>
  );
}

// ==========================================
// TODAY
// ==========================================

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ==========================================
// DATE VALIDATION
// ==========================================

function isValidDate(value: string) {
  const trimmed = value.trim();

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(trimmed)) {
    return false;
  }

  const [year, month, day] = trimmed.split("-").map(Number);

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
