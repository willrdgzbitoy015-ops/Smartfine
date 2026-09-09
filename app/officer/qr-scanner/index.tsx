import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";

import { useRouter } from "expo-router";

import { API_BASE } from "@/constants/api";

import { styles } from "./qr-scanner.styles";

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

  total_fines?: number;

  outstanding_balance?: number;
};

// ==========================================
// SMARTFINE QR FORMAT
// ==========================================

const QR_PREFIX = "SMARTFINE_STUDENT:";

// ==========================================
// OFFICER QR SCANNER
// ==========================================

export default function OfficerQRScanner() {
  const router = useRouter();

  // ========================================
  // CAMERA PERMISSION
  // ========================================

  const [permission, requestPermission] = useCameraPermissions();

  // ========================================
  // STATE
  // ========================================

  const [students, setStudents] = useState<Student[]>([]);

  const [loadingStudents, setLoadingStudents] = useState(true);

  const [processingScan, setProcessingScan] = useState(false);

  const [scanLocked, setScanLocked] = useState(false);

  const [manualStudentId, setManualStudentId] = useState("");

  const [foundStudent, setFoundStudent] = useState<Student | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [profileImageFailed, setProfileImageFailed] = useState(false);

  // ========================================
  // LOAD STUDENTS
  // ========================================

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);

      setErrorMessage("");

      const response = await fetch(`${API_BASE}/api/students`);

      const rawText = await response.text();

      let data: any = null;

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("The SmartFine server returned an invalid response.");
      }

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to load student records.");

        return;
      }

      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (error) {
      console.error("Officer QR scanner load students error:", error);

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setLoadingStudents(false);
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
  // PROCESS STUDENT ID
  // ========================================

  const processStudentId = async (permanentStudentId: string) => {
    try {
      setProcessingScan(true);

      setErrorMessage("");

      setProfileImageFailed(false);

      const normalizedId = permanentStudentId.trim();

      if (!normalizedId) {
        setFoundStudent(null);

        setErrorMessage("Student ID is missing.");

        return;
      }

      // ====================================
      // RELOAD IF STUDENT LIST IS EMPTY
      // ====================================

      let currentStudents = students;

      if (currentStudents.length === 0) {
        const response = await fetch(`${API_BASE}/api/students`);

        const data = await response.json();

        if (!response.ok || !data.success) {
          setErrorMessage(data.message || "Could not load student records.");

          return;
        }

        currentStudents = Array.isArray(data.students) ? data.students : [];

        setStudents(currentStudents);
      }

      // ====================================
      // FIND STUDENT
      // ====================================

      const normalizedSearch = normalizedId.toLowerCase();

      const student =
        currentStudents.find(
          (item) =>
            String(item.student_id || "")
              .trim()
              .toLowerCase() === normalizedSearch,
        ) || null;

      if (!student) {
        setFoundStudent(null);

        setErrorMessage(
          `No SmartFine student was found with Student ID ${normalizedId}.`,
        );

        setScanLocked(true);

        return;
      }

      setFoundStudent(student);

      setManualStudentId(student.student_id);

      setScanLocked(true);
    } catch (error) {
      console.error("Officer process student QR error:", error);

      setFoundStudent(null);

      setErrorMessage("Could not process the Student QR Code.");

      setScanLocked(true);
    } finally {
      setProcessingScan(false);
    }
  };

  // ========================================
  // HANDLE QR SCAN
  // ========================================

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanLocked || processingScan) {
      return;
    }

    setScanLocked(true);

    setErrorMessage("");

    const scannedValue = String(data || "").trim();

    console.log("Officer QR scanned:", scannedValue);

    // ====================================
    // VERIFY SMARTFINE QR
    // ====================================

    if (!scannedValue.startsWith(QR_PREFIX)) {
      setFoundStudent(null);

      setErrorMessage(
        "Invalid QR Code. Please scan a SmartFine Student QR Code.",
      );

      return;
    }

    const permanentStudentId = scannedValue.slice(QR_PREFIX.length).trim();

    if (!permanentStudentId) {
      setFoundStudent(null);

      setErrorMessage("Invalid SmartFine QR Code. Student ID is missing.");

      return;
    }

    processStudentId(permanentStudentId);
  };

  // ========================================
  // MANUAL SEARCH
  // ========================================

  const handleManualSearch = async () => {
    const normalizedId = manualStudentId.trim();

    if (!normalizedId) {
      setErrorMessage("Please enter a Student ID.");

      return;
    }

    setScanLocked(true);

    await processStudentId(normalizedId);
  };

  // ========================================
  // SCAN ANOTHER
  // ========================================

  const handleScanAgain = () => {
    setFoundStudent(null);

    setManualStudentId("");

    setErrorMessage("");

    setProfileImageFailed(false);

    setProcessingScan(false);

    setScanLocked(false);
  };

  // ========================================
  // RECORD FINE
  // ========================================

  const handleRecordFine = () => {
    if (!foundStudent) {
      return;
    }

    const isActive =
      String(foundStudent.account_status || "").toUpperCase() === "ACTIVE";

    if (!isActive) {
      setErrorMessage(
        "This student account is inactive. A fine cannot be recorded.",
      );

      return;
    }

    router.push(`/officer/fines/add?studentId=${foundStudent.id}` as any);
  };

  // ========================================
  // NAVIGATION
  // ========================================

  const goToDashboard = () => {
    router.replace("/officer/dashboard" as any);
  };

  const goToScanner = () => {
    return;
  };

  // ========================================
  // STUDENT RESULT
  // ========================================

  const renderStudentResult = () => {
    if (!foundStudent) {
      return null;
    }

    const student = foundStudent;

    const profilePictureUrl = getProfilePictureUrl(student.profile_picture_uri);

    const showPicture = Boolean(profilePictureUrl) && !profileImageFailed;

    const initials = `${student.first_name?.[0] || ""}${
      student.last_name?.[0] || ""
    }`.toUpperCase();

    const gradeSection =
      [student.grade_level, student.section].filter(Boolean).join(" - ") ||
      "Not assigned";

    const isActive =
      String(student.account_status || "").toUpperCase() === "ACTIVE";

    return (
      <View style={styles.resultCard}>
        {/* VERIFIED */}

        <View style={styles.verifiedRow}>
          <View style={styles.verifiedIconContainer}>
            <Text style={styles.verifiedIconText}>✓</Text>
          </View>

          <View style={styles.verifiedTextArea}>
            <Text style={styles.studentFoundTitle}>Student Found</Text>

            <Text style={styles.studentFoundSubtitle}>
              SmartFine QR verified successfully
            </Text>
          </View>
        </View>

        {/* STUDENT */}

        <View style={styles.studentInformation}>
          {showPicture ? (
            <Image
              source={{
                uri: profilePictureUrl!,
              }}
              style={styles.studentAvatarImage}
              resizeMode="cover"
              onError={() => setProfileImageFailed(true)}
            />
          ) : (
            <View style={styles.studentAvatarFallback}>
              <Text style={styles.studentAvatarText}>{initials || "ST"}</Text>
            </View>
          )}

          <Text style={styles.studentName}>{student.full_name}</Text>

          <Text style={styles.studentNumber}>{student.student_id}</Text>

          <Text style={styles.gradeSection}>{gradeSection}</Text>

          <View
            style={[
              styles.statusBadge,

              isActive ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,

                isActive ? styles.activeBadgeText : styles.inactiveBadgeText,
              ]}
            >
              {isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* SUMMARY */}

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Fines</Text>

            <Text style={styles.summaryValue}>
              ₱{Number(student.total_fines || 0).toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Outstanding</Text>

            <Text style={styles.outstandingValue}>
              ₱{Number(student.outstanding_balance || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* ACTIONS */}

        <TouchableOpacity
          style={[styles.recordFineButton, !isActive && styles.disabledButton]}
          onPress={handleRecordFine}
          disabled={!isActive}
          activeOpacity={0.85}
        >
          <Text style={styles.recordFineButtonText}>Record Fine</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanAnotherButton}
          onPress={handleScanAgain}
          activeOpacity={0.8}
        >
          <Text style={styles.scanAnotherButtonText}>Scan Another Student</Text>
        </TouchableOpacity>

        {!isActive && (
          <Text style={styles.inactiveNotice}>
            Fine recording is disabled because this student account is inactive.
          </Text>
        )}
      </View>
    );
  };

  // ========================================
  // CAMERA
  // ========================================

  const renderCamera = () => {
    // ====================================
    // WEB FALLBACK
    // ====================================

    if (Platform.OS === "web") {
      return (
        <View style={styles.cameraUnavailable}>
          <Image
            source={require("../../../assets/icons/qr-code.png")}
            style={styles.cameraUnavailableIcon}
            resizeMode="contain"
          />

          <Text style={styles.cameraUnavailableTitle}>QR Camera Scanner</Text>

          <Text style={styles.cameraUnavailableText}>
            Open SmartFine on a mobile phone to scan Student QR Codes. You can
            also search using the Student ID below.
          </Text>
        </View>
      );
    }

    // ====================================
    // PERMISSION LOADING
    // ====================================

    if (!permission) {
      return (
        <View style={styles.cameraState}>
          <ActivityIndicator size="large" color="#45B94F" />

          <Text style={styles.cameraStateText}>Preparing camera...</Text>
        </View>
      );
    }

    // ====================================
    // PERMISSION REQUIRED
    // ====================================

    if (!permission.granted) {
      return (
        <View style={styles.cameraState}>
          <Image
            source={require("../../../assets/icons/qr-code.png")}
            style={styles.permissionIcon}
            resizeMode="contain"
          />

          <Text style={styles.permissionTitle}>Camera Permission Required</Text>

          <Text style={styles.permissionText}>
            SmartFine needs camera access so the Fines Officer can scan Student
            QR Codes.
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // ====================================
    // LIVE CAMERA
    // ====================================

    return (
      <View style={styles.cameraWrapper}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanLocked ? undefined : handleBarcodeScanned}
        />

        {/* SCANNER FRAME */}

        <View pointerEvents="none" style={styles.cameraOverlay}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.topLeftCorner]} />

            <View style={[styles.corner, styles.topRightCorner]} />

            <View style={[styles.corner, styles.bottomLeftCorner]} />

            <View style={[styles.corner, styles.bottomRightCorner]} />
          </View>

          <Text style={styles.scanInstruction}>
            Place the Student QR Code inside the frame
          </Text>
        </View>

        {/* PROCESSING */}

        {scanLocked && !foundStudent && (
          <View style={styles.processingOverlay}>
            {processingScan ? (
              <>
                <ActivityIndicator size="large" color="#FFFFFF" />

                <Text style={styles.processingText}>Verifying student...</Text>
              </>
            ) : (
              <TouchableOpacity
                style={styles.tryAgainCameraButton}
                onPress={handleScanAgain}
              >
                <Text style={styles.tryAgainCameraButtonText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

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
        <View>
          <Text style={styles.headerEyebrow}>SmartFine</Text>

          <Text style={styles.headerTitle}>QR Scanner</Text>
        </View>

        <View style={styles.headerIconContainer}>
          <Image
            source={require("../../../assets/icons/qr-codeWhite.png")}
            style={styles.headerIcon}
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
        <Text style={styles.pageDescription}>
          Scan a student's SmartFine QR Code to identify the student and record
          a fine.
        </Text>

        {loadingStudents ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#45B94F" />

            <Text style={styles.loadingTitle}>Loading Students</Text>

            <Text style={styles.loadingText}>
              Please wait while SmartFine loads the student records.
            </Text>
          </View>
        ) : (
          <>
            {/* ==============================
                SCANNER
            ============================== */}

            {!foundStudent && (
              <View style={styles.scannerCard}>
                <Text style={styles.sectionTitle}>Scan Student QR Code</Text>

                <Text style={styles.sectionSubtitle}>
                  Only SmartFine Student QR Codes are accepted.
                </Text>

                {renderCamera()}
              </View>
            )}

            {/* ==============================
                ERROR
            ============================== */}

            {errorMessage !== "" && (
              <View style={styles.errorCard}>
                <View style={styles.errorIconContainer}>
                  <Text style={styles.errorIcon}>!</Text>
                </View>

                <View style={styles.errorTextArea}>
                  <Text style={styles.errorTitle}>Unable to Scan</Text>

                  <Text style={styles.errorMessage}>{errorMessage}</Text>
                </View>

                {scanLocked && (
                  <TouchableOpacity
                    onPress={handleScanAgain}
                    style={styles.errorTryAgain}
                  >
                    <Text style={styles.errorTryAgainText}>Try Again</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ==============================
                STUDENT RESULT
            ============================== */}

            {renderStudentResult()}

            {/* ==============================
                MANUAL SEARCH
            ============================== */}

            {!foundStudent && (
              <View style={styles.manualSearchCard}>
                <Text style={styles.sectionTitle}>Search by Student ID</Text>

                <Text style={styles.sectionSubtitle}>
                  Use this if the student's QR Code cannot be scanned.
                </Text>

                <Text style={styles.inputLabel}>Student ID</Text>

                <TextInput
                  style={styles.studentIdInput}
                  value={manualStudentId}
                  onChangeText={(text) => {
                    setManualStudentId(text);

                    setErrorMessage("");
                  }}
                  placeholder="Example: 2026-0004"
                  placeholderTextColor="#9AA5B5"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!processingScan}
                  returnKeyType="search"
                  onSubmitEditing={handleManualSearch}
                />

                <TouchableOpacity
                  style={[
                    styles.searchButton,

                    processingScan && styles.disabledButton,
                  ]}
                  onPress={handleManualSearch}
                  disabled={processingScan}
                  activeOpacity={0.85}
                >
                  {processingScan ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.searchButtonText}>Search Student</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ====================================
          MOBILE BOTTOM NAVIGATION
      ==================================== */}

      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={goToDashboard}
          activeOpacity={0.8}
        >
          <Image
            source={require("../../../assets/icons/dashboard.png")}
            style={styles.bottomNavIcon}
            resizeMode="contain"
          />

          <Text style={styles.bottomNavText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomNavItem, styles.bottomNavItemActive]}
          onPress={goToScanner}
          activeOpacity={0.8}
        >
          <View style={styles.activeNavIconCircle}>
            <Image
              source={require("../../../assets/icons/qr-codeWhite.png")}
              style={styles.bottomNavActiveIcon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.bottomNavTextActive}>Scanner</Text>
        </TouchableOpacity>

        <View style={[styles.bottomNavItem, styles.futureNavItem]}>
          <Image
            source={require("../../../assets/icons/fines.png")}
            style={styles.bottomNavIcon}
            resizeMode="contain"
          />

          <Text style={styles.futureNavText}>History</Text>
        </View>

        <View style={[styles.bottomNavItem, styles.futureNavItem]}>
          <Image
            source={require("../../../assets/icons/user.png")}
            style={styles.bottomNavIcon}
            resizeMode="contain"
          />

          <Text style={styles.futureNavText}>Profile</Text>
        </View>
      </View>
    </View>
  );
}
