import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  AppState,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "expo-router";

import { useGuardedRouter } from "@/hooks/use-guarded-router";

import { returnToLogin, useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";
import { PopIn, ScanLine } from "@/components/motion";
import { AdminNavBadge } from "@/components/notification-badge";
import { SkeletonList } from "@/components/skeleton";
import { haptics } from "@/utils/haptics";

import { FineFormModal } from "@/components/admin-forms/fine-form-modal";
import LogoutModal from "@/components/logout-modal";
import WarningModal from "@/components/warningmodal";

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

type NavItem = {
  label: string;

  route: string;

  icon?: any;
};

// ==========================================
// SMARTFINE QR PREFIX
// ==========================================

const QR_PREFIX = "SMARTFINE_STUDENT:";

// ==========================================
// QR SCANNER
// ==========================================

export default function QRScanner() {
  const router = useGuardedRouter();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // ==========================================
  // CAMERA PERMISSION
  // ==========================================

  const [permission, requestPermission] = useCameraPermissions();

  const [requestingPermission, setRequestingPermission] = useState(false);

  // ==========================================
  // CAMERA ACTIVITY
  //
  // The camera runs only while this screen is showing and the app is in
  // the foreground. Admin modules stay open underneath each other, so
  // without this the camera and scan line kept running elsewhere.
  // ==========================================

  const [screenFocused, setScreenFocused] = useState(false);

  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );

  // The scan line starts only once the camera is actually streaming.
  const [cameraReady, setCameraReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);

      return () => {
        setScreenFocused(false);
        setCameraReady(false);
      };
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");

      if (state !== "active") {
        setCameraReady(false);
      }
    });

    return () => subscription.remove();
  }, []);

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
  // STATE
  // ==========================================

  const [students, setStudents] = useState<Student[]>([]);

  const [loadingStudents, setLoadingStudents] = useState(true);

  const [processingScan, setProcessingScan] = useState(false);

  const [scanLocked, setScanLocked] = useState(false);

  const [manualStudentId, setManualStudentId] = useState("");

  const [foundStudent, setFoundStudent] = useState<Student | null>(null);

  // Add New Fine for the scanned student, opened over the scanner.
  const [showFineForm, setShowFineForm] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [profileImageFailed, setProfileImageFailed] = useState(false);

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
  // LOAD STUDENTS
  // ==========================================

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);

      setErrorMessage("");

      const response = await fetch(`${API_BASE}/api/students`);

      const data = await response.json();

      console.log("QR scanner students:", data);

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to load student records.");

        return;
      }

      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (error) {
      console.error("QR scanner load students error:", error);

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setLoadingStudents(false);
    }
  };

  // ==========================================
  // REQUEST CAMERA PERMISSION
  // ==========================================

  const handleRequestPermission = async () => {
    if (requestingPermission) {
      return;
    }

    try {
      setRequestingPermission(true);

      await requestPermission();
    } catch (error) {
      console.error("Camera permission error:", error);

      setWarningTitle("Camera Error");

      setWarningMessage(
        "Could not request camera permission. Please try again.",
      );

      setShowWarningModal(true);
    } finally {
      setRequestingPermission(false);
    }
  };

  // ==========================================
  // PROFILE PICTURE URL
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
  // PROCESS STUDENT ID
  // ==========================================

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

      // ======================================
      // RELOAD STUDENTS IF EMPTY
      // ======================================

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

      const normalizedSearch = normalizedId.trim().toLowerCase();

      const student =
        currentStudents.find(
          (item) =>
            String(item.student_id || "")
              .trim()
              .toLowerCase() === normalizedSearch,
        ) || null;

      if (!student) {
        haptics.error();

        setFoundStudent(null);

        setErrorMessage(
          `No student was found with Student ID ${normalizedId}.`,
        );

        return;
      }

      haptics.success();

      setFoundStudent(student);

      setManualStudentId(student.student_id);

      setScanLocked(true);
    } catch (error) {
      console.error("Process student QR error:", error);

      haptics.error();

      setErrorMessage("Could not process the student QR code.");
    } finally {
      setProcessingScan(false);
    }
  };

  // ==========================================
  // HANDLE QR SCAN
  // ==========================================

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanLocked || processingScan) {
      return;
    }

    setScanLocked(true);

    setErrorMessage("");

    const scannedValue = String(data || "").trim();

    console.log("QR scanned:", scannedValue);

    // ======================================
    // CHECK SMARTFINE QR FORMAT
    // ======================================

    if (!scannedValue.startsWith(QR_PREFIX)) {
      haptics.error();

      setFoundStudent(null);

      setErrorMessage(
        "Invalid QR Code. This is not a SmartFine Student QR Code.",
      );

      return;
    }

    const permanentStudentId = scannedValue.slice(QR_PREFIX.length).trim();

    if (!permanentStudentId) {
      haptics.error();

      setFoundStudent(null);

      setErrorMessage("Invalid SmartFine QR Code. Student ID is missing.");

      return;
    }

    // A firm tap confirms the code was read.
    haptics.impact();

    processStudentId(permanentStudentId);
  };

  // ==========================================
  // MANUAL STUDENT SEARCH
  // ==========================================

  const handleManualSearch = async () => {
    const normalizedId = manualStudentId.trim();

    if (!normalizedId) {
      setErrorMessage("Enter a Student ID first.");

      return;
    }

    setScanLocked(true);

    await processStudentId(normalizedId);
  };

  // ==========================================
  // SCAN ANOTHER STUDENT
  // ==========================================

  const handleScanAgain = () => {
    setFoundStudent(null);

    setErrorMessage("");

    setManualStudentId("");

    setProfileImageFailed(false);

    setProcessingScan(false);

    setScanLocked(false);
  };

  // ==========================================
  // VIEW STUDENT PROFILE
  // ==========================================

  const handleViewProfile = () => {
    if (!foundStudent) {
      return;
    }

    router.push(`/admin/students/${foundStudent.id}` as any);
  };

  // ==========================================
  // RECORD FINE
  // ==========================================

  const handleRecordFine = () => {
    if (!foundStudent) {
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
  // NAVIGATION
  // ==========================================

  const handleNavigation = (item: NavItem) => {
    router.push(item.route as any);
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

      returnToLogin();
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
  // STUDENT RESULT
  // ==========================================

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
      <PopIn style={styles.resultCard} from={0.95}>
        {/* ==================================
              RESULT HEADER
          ================================== */}

        <View style={styles.resultHeader}>
          <View>
            <Text style={styles.resultTitle}>Student Found</Text>

            <Text style={styles.resultSubtitle}>
              SmartFine QR verified successfully
            </Text>
          </View>

          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>Verified</Text>
          </View>
        </View>

        {/* ==================================
              STUDENT INFORMATION
          ================================== */}

        <View style={styles.studentResult}>
          {/* PROFILE PHOTO */}

          {showPicture ? (
            <Image
              source={{
                uri: profilePictureUrl!,
              }}
              style={styles.studentAvatarImage}
              resizeMode="cover"
              onError={() => {
                setProfileImageFailed(true);
              }}
            />
          ) : (
            <View style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>{initials || "ST"}</Text>
            </View>
          )}

          {/* DETAILS */}

          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{student.full_name}</Text>

            <Text style={styles.studentMeta}>
              Student ID: {student.student_id}
            </Text>

            <Text style={styles.studentMeta}>{gradeSection}</Text>

            <Text style={styles.studentMeta}>
              Email: {student.email || "Not provided"}
            </Text>

            <View
              style={[
                styles.accountStatusBadge,

                isActive ? styles.activeBadge : styles.inactiveBadge,
              ]}
            >
              <Text
                style={[
                  styles.accountStatusText,

                  isActive ? styles.activeText : styles.inactiveText,
                ]}
              >
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>

        {/* ==================================
              FINANCIAL SUMMARY
          ================================== */}

        <View style={styles.resultStatsRow}>
          <View style={styles.resultStat}>
            <Text style={styles.resultStatLabel}>Total Fines</Text>

            <Text style={styles.resultStatValue}>
              ₱{Number(student.total_fines || 0).toFixed(2)}
            </Text>
          </View>

          <View style={styles.resultStat}>
            <Text style={styles.resultStatLabel}>Outstanding</Text>

            <Text style={styles.resultOutstanding}>
              ₱{Number(student.outstanding_balance || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* ==================================
              ACTIONS
          ================================== */}

        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleScanAgain}
          >
            <Text style={styles.secondaryButtonText}>Scan Another</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleViewProfile}
          >
            <Text style={styles.profileButtonText}>View Student Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.recordFineButton,

              !isActive && styles.buttonDisabled,
            ]}
            onPress={handleRecordFine}
            disabled={!isActive}
          >
            <Text style={styles.recordFineButtonText}>Record Fine</Text>
          </TouchableOpacity>
        </View>

        {!isActive && (
          <Text style={styles.inactiveNotice}>
            This student is inactive. Fine recording is disabled.
          </Text>
        )}
      </PopIn>
    );
  };

  // ==========================================
  // CAMERA CONTENT
  // ==========================================

  const renderCamera = () => {
    // ======================================
    // WEB
    // ======================================

    if (Platform.OS === "web") {
      return (
        <View style={styles.webCameraPlaceholder}>
          <Image
            source={require("../../../assets/icons/qr-code.png")}
            style={styles.cameraPlaceholderImage}
            resizeMode="contain"
          />

          <Text style={styles.cameraPlaceholderTitle}>Camera Scanner</Text>

          <Text style={styles.cameraPlaceholderText}>
            For the best QR scanning experience, open SmartFine on your Android
            phone. You can use Student ID search below while using the web
            version.
          </Text>
        </View>
      );
    }

    // ======================================
    // CAMERA PERMISSION LOADING
    // ======================================

    if (!permission) {
      return (
        <View style={styles.cameraState}>
          <ActivityIndicator size="large" color="#173A73" />

          <Text style={styles.cameraPlaceholderText}>Loading camera...</Text>
        </View>
      );
    }

    // ======================================
    // CAMERA PERMISSION NOT GRANTED
    // ======================================

    if (!permission.granted) {
      return (
        <View style={styles.cameraState}>
          <Image
            source={require("../../../assets/icons/qr-code.png")}
            style={styles.cameraPlaceholderImage}
            resizeMode="contain"
          />

          <Text style={styles.cameraPlaceholderTitle}>
            Camera Permission Required
          </Text>

          <Text style={styles.cameraPlaceholderText}>
            SmartFine needs permission to use your camera to scan Student QR
            Codes.
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestPermission}
            disabled={requestingPermission}
          >
            {requestingPermission ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator size="small" color="#FFFFFF" />

                <Text style={[styles.permissionButtonText, { marginLeft: 8 }]}>
                  Requesting...
                </Text>
              </View>
            ) : (
              <Text style={styles.permissionButtonText}>Allow Camera</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    // ======================================
    // CAMERA PAUSED (screen hidden or app in background)
    // ======================================

    if (!screenFocused || !appActive) {
      return (
        <View style={styles.cameraState}>
          <Image
            source={require("../../../assets/icons/qr-code.png")}
            style={styles.cameraPlaceholderImage}
            resizeMode="contain"
          />

          <Text style={styles.cameraPlaceholderText}>Camera paused</Text>
        </View>
      );
    }

    // ======================================
    // CAMERA
    // ======================================

    return (
      <View style={styles.cameraWrapper}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onCameraReady={() => setCameraReady(true)}
          onBarcodeScanned={scanLocked ? undefined : handleBarcodeScanned}
        />

        {/* ==================================
              CAMERA OVERLAY
          ================================== */}

        <View pointerEvents="none" style={styles.cameraOverlay}>
          <View style={styles.scanFrame}>
            <ScanLine active={cameraReady && !scanLocked} />
          </View>

          <Text style={styles.scanInstruction}>
            Position the SmartFine Student QR Code inside the frame
          </Text>
        </View>

        {/* ==================================
              PROCESSING
          ================================== */}

        {scanLocked && !foundStudent && (
          <View style={styles.processingOverlay}>
            {processingScan ? (
              <>
                <ActivityIndicator size="large" color="#FFFFFF" />

                <Text style={styles.processingText}>Verifying student...</Text>
              </>
            ) : (
              <TouchableOpacity
                style={styles.scanAgainOverlayButton}
                onPress={handleScanAgain}
              >
                <Text style={styles.scanAgainOverlayText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
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
              source={require("../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.navigation}>
            {navItems.map((item) => {
              const active = item.label === "QR Scanner";

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
                  <AdminNavBadge label={item.label} />
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
                const active = item.label === "QR Scanner";

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
                    <AdminNavBadge label={item.label} variant="menu" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ==================================
              HEADER
          ================================== */}

          <View style={styles.header}>
            <Text style={styles.pageTitle}>QR Scanner</Text>

            <Text style={styles.subtitle}>
              Scan a SmartFine Student QR Code to identify a student quickly
            </Text>
          </View>

          {/* ==================================
              LOADING
          ================================== */}

          {loadingStudents ? (
            <SkeletonList
              label="Loading SmartFine student records"
              count={3}
              style={styles.skeletonCard}
            />
          ) : (
            <>
              {/* ==================================
                  SCANNER
              ================================== */}

              {!foundStudent && (
                <View style={styles.scannerCard}>
                  <View style={styles.scannerCardHeader}>
                    <Text style={styles.scannerTitle}>
                      Scan Student QR Code
                    </Text>

                    <Text style={styles.scannerSubtitle}>
                      Only SmartFine Student QR Codes are accepted.
                    </Text>
                  </View>

                  {renderCamera()}
                </View>
              )}

              {/* ==================================
                  ERROR
              ================================== */}

              {errorMessage !== "" && (
                <View style={styles.errorBox}>
                  <View style={styles.errorContent}>
                    <Text style={styles.errorTitle}>QR Scan Error</Text>

                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>

                  {scanLocked && (
                    <TouchableOpacity
                      style={styles.errorResetButton}
                      onPress={handleScanAgain}
                    >
                      <Text style={styles.errorResetText}>Try Again</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ==================================
                  STUDENT RESULT
              ================================== */}

              {renderStudentResult()}

              {/* ==================================
                  MANUAL SEARCH
              ================================== */}

              {!foundStudent && (
                <View style={styles.manualCard}>
                  <Text style={styles.manualTitle}>Search by Student ID</Text>

                  <Text style={styles.manualSubtitle}>
                    Use this option if the QR code cannot be scanned.
                  </Text>

                  <View style={styles.manualSearchRow}>
                    <TextInput
                      style={styles.manualInput}
                      value={manualStudentId}
                      onChangeText={(text) => {
                        setManualStudentId(text);

                        setErrorMessage("");
                      }}
                      placeholder="Example: 2026-0004"
                      placeholderTextColor="#8C939F"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!processingScan}
                      onSubmitEditing={handleManualSearch}
                    />

                    <TouchableOpacity
                      style={[
                        styles.searchButton,

                        processingScan && styles.buttonDisabled,
                      ]}
                      onPress={handleManualSearch}
                      disabled={processingScan}
                    >
                      {processingScan ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <ActivityIndicator size="small" color="#FFFFFF" />

                          <Text
                            style={[styles.searchButtonText, { marginLeft: 8 }]}
                          >
                            Searching...
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.searchButtonText}>
                          Search Student
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
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

      <FineFormModal
        visible={showFineForm}
        mode="add"
        studentId={foundStudent?.id ?? null}
        onClose={() => setShowFineForm(false)}
        onSaved={() => {}}
        onViewFine={handleViewSavedFine}
      />

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
