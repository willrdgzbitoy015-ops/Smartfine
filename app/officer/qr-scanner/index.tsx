import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { FlowSteps } from "@/components/flow-steps";
import { FadeIn, PopIn, ScanLine } from "@/components/motion";
import { ScanFrame } from "@/components/scan-frame";
import { SuccessCheck } from "@/components/success-check";
import { API_BASE } from "@/constants/api";
import { haptics } from "@/utils/haptics";
import { useResponsiveStyles } from "./qr-scanner.styles";

import { FloatingTabBar } from "@/components/floating-tab-bar";
type Student = {
  id: number;
  student_id: string;
  username: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  grade_level: string | null;
  section: string | null;
  account_status: string;
  profile_picture_uri: string | null;
};

type StudentsResponse = {
  success?: boolean;
  message?: string;
  students?: Student[];
};

const QR_PREFIX = "SMARTFINE_STUDENT:";

// The Officer's bottom navigation; Scan is the tab this screen belongs to.
const NAV_ITEMS = [
  {
    label: "Home",
    route: "/officer/dashboard",
    icon: require("../../../assets/icons/dashboard.png"),
  },
  {
    label: "Students",
    route: "/officer/student",
    icon: require("../../../assets/icons/students.png"),
  },
  {
    label: "Scan",
    route: "/officer/qr-scanner",
    icon: require("../../../assets/icons/qr-codeWhite.png"),
  },
  {
    label: "Profile",
    route: "/officer/profile",
    icon: require("../../../assets/icons/user.png"),
  },
  {
    label: "Records",
    route: "/officer/records",
    icon: require("../../../assets/icons/reports.png"),
  },
];

function profileUrl(uri: string | null): string | null {
  if (!uri) return null;
  if (/^https?:\/\//i.test(uri)) return uri;

  return `${API_BASE.replace(/\/+$/, "")}/${uri.replace(/^\/+/, "")}`;
}

export default function OfficerQRScanner() {
  const styles = useResponsiveStyles();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  // The "how to scan" tips opened by the i button.
  const [infoOpen, setInfoOpen] = useState(false);

  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );

  const [candidateId, setCandidateId] = useState("");
  const [manualId, setManualId] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [cameraError, setCameraError] = useState("");
  // The scan line starts only once the camera is actually streaming.
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState("");

  const scanLockRef = useRef(false);
  const navigatingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);

  // Mount the camera only while this screen is visible.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      navigatingRef.current = false;

      return () => {
        setFocused(false);
        requestRef.current?.abort();
        requestRef.current = null;
        setProcessing(false);
      };
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );

    return () => subscription.remove();
  }, []);

  // Reset the student selection and return to the live camera.
  const resetScan = () => {
    requestRef.current?.abort();
    requestRef.current = null;

    scanLockRef.current = false;
    navigatingRef.current = false;

    setCandidateId("");
    setManualId("");
    setManualOpen(false);
    setScanLocked(false);
    setProcessing(false);
    setStudent(null);
    setImageFailed(false);
    setCameraError("");
    setError("");
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    // Lock immediately before React updates state.
    if (scanLockRef.current || requestRef.current) return;

    scanLockRef.current = true;
    setScanLocked(true);
    setError("");

    const value = String(data || "").trim();

    if (!value.startsWith(QR_PREFIX)) {
      haptics.error();
      setError("Please scan a valid SmartFine Student QR Code.");
      return;
    }

    const id = value.slice(QR_PREFIX.length).trim();

    if (!id) {
      haptics.error();
      setError("This QR code does not contain a Student ID.");
      return;
    }

    // A firm tap confirms the code was read.
    haptics.impact();
    setCandidateId(id);
  };

  // Fetch on confirmation to avoid using an old cached list.
  const identifyStudent = async (value: string) => {
    if (requestRef.current) return;

    const normalizedId = value.trim();

    if (!normalizedId) {
      setError("Please scan a QR code or enter a Student ID.");
      return;
    }

    scanLockRef.current = true;
    setScanLocked(true);
    setProcessing(true);
    setError("");

    const controller = new AbortController();
    requestRef.current = controller;

    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    try {
      const token = await AsyncStorage.getItem("token");

      if (controller.signal.aborted) {
        throw new Error("Request cancelled.");
      }

      if (!token) {
        throw new Error("Your session is missing. Please log in again.");
      }

      const response = await fetch(`${API_BASE}/api/students`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        signal: controller.signal,
      });

      const raw = await response.text();
      let body: StudentsResponse;

      try {
        body = JSON.parse(raw);
      } catch {
        throw new Error(
          `Unexpected server response (HTTP ${response.status}). Check your backend connection.`,
        );
      }

      if (!response.ok || !body?.success || !Array.isArray(body.students)) {
        throw new Error(body?.message || "Could not load student records.");
      }

      const found = body.students.find(
        (item) =>
          String(item.student_id || "")
            .trim()
            .toLowerCase() === normalizedId.toLowerCase(),
      );

      if (!found) {
        throw new Error(
          `No student was found with Student ID ${normalizedId}.`,
        );
      }

      if (!Number.isSafeInteger(Number(found.id)) || Number(found.id) <= 0) {
        throw new Error("The student record has an invalid database ID.");
      }

      if (requestRef.current !== controller) return;

      haptics.success();
      setStudent(found);
      setImageFailed(false);
    } catch (caught) {
      if (requestRef.current !== controller) return;
      if (controller.signal.aborted && !timedOut) return;

      haptics.error();
      setError(
        timedOut
          ? "The server took too long to respond. Please try again."
          : caught instanceof Error
            ? caught.message
            : "Could not identify the student.",
      );
    } finally {
      clearTimeout(timeout);

      if (requestRef.current === controller) {
        requestRef.current = null;
        setProcessing(false);
      }
    }
  };

  const handleAddFine = () => {
    if (!student || navigatingRef.current) return;

    if (String(student.account_status).toUpperCase() !== "ACTIVE") {
      setError("This student account is inactive. A fine cannot be recorded.");
      return;
    }

    navigatingRef.current = true;

    router.push({
      pathname: "/officer/fines/add" as any,
      params: { studentId: String(student.id) },
    });
  };

  const handleCameraPermission = async () => {
    try {
      setError("");

      if (permission?.canAskAgain === false) {
        await Linking.openSettings();
      } else {
        await requestPermission();
      }
    } catch {
      setError("Unable to open camera permissions. Check app settings.");
    }
  };

  const studentName = student
    ? student.full_name ||
      [student.first_name, student.middle_name, student.last_name]
        .filter(Boolean)
        .join(" ")
    : "";

  const gradeSection = student
    ? [student.grade_level, student.section].filter(Boolean).join(" - ")
    : "";

  const avatarUri = profileUrl(student?.profile_picture_uri || null);

  const initials = student
    ? `${student.first_name?.charAt(0) || ""}${
        student.last_name?.charAt(0) || ""
      }`.toUpperCase() || "ST"
    : "ST";

  const activeStudent =
    String(student?.account_status || "").toUpperCase() === "ACTIVE";

  const showCamera =
    Platform.OS !== "web" &&
    permission?.granted &&
    focused &&
    foreground &&
    !student &&
    !scanLocked &&
    !manualOpen &&
    !cameraError;

  // A camera that is unmounted has to report ready again before scanning.
  useEffect(() => {
    if (!showCamera) {
      setCameraReady(false);
    }
  }, [showCamera]);

  // ========================================
  // STUDENT IDENTIFIED
  // ========================================

  if (student) {
    return (
      <SafeAreaView style={styles.resultScreen}>
        <StatusBar style="dark" />

        <ScrollView
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.screenHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={resetScan}
              accessibilityRole="button"
              accessibilityLabel="Back to the camera"
            >
              <Image
                source={require("../../../assets/icons/back_icon.png")}
                style={[styles.backIcon, styles.backIconDark]}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <Text style={[styles.screenTitle, styles.screenTitleDark]}>
              Check Student
            </Text>

            <View style={styles.backSpacer} />
          </View>

          <FlowSteps current={2} style={styles.steps} />

          <SuccessCheck style={styles.successCheck} />

          <Text style={styles.identifiedTitle}>Student Identified</Text>

          <FadeIn style={styles.avatar} delay={120}>
            {avatarUri && !imageFailed ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </FadeIn>

          <Text style={styles.studentName}>{studentName}</Text>

          <Text style={styles.studentDetails}>
            {gradeSection || "Grade and section not assigned"}
          </Text>

          <Text style={styles.studentDetails}>
            Student ID: {student.student_id}
          </Text>

          {!activeStudent && (
            <Text style={styles.inactiveNotice}>
              This account is inactive. Fine recording is unavailable.
            </Text>
          )}

          {error ? (
            <Text style={styles.resultError} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          {activeStudent && (
            <Text style={styles.nextHint}>
              Is this the right student? Next, record the fine.
            </Text>
          )}

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.addFineButton,
                !activeStudent && styles.disabled,
              ]}
              onPress={handleAddFine}
              disabled={!activeStudent}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Add Fine for This Student</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resultCancelButton]}
              onPress={resetScan}
              accessibilityRole="button"
              accessibilityLabel="Not this student. Go back to the camera to scan another student"
            >
              <Text style={styles.resultCancelText}>Scan Another Student</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ========================================
  // QR SCANNER
  // ========================================

  const hasCandidate = Boolean(candidateId);

  return (
    <View style={styles.scanScreen}>
      <StatusBar style="light" />

      {/* ==================================
          TITLE BAR
      ================================== */}

      <SafeAreaView edges={["top"]} style={styles.scanHeader}>
        <View style={styles.scanHeaderInner}>
          <View style={styles.scanHeaderRow}>
            <View style={styles.headerSide} />

            <Text style={styles.scanTitle} accessibilityRole="header">
              Scan Student QR
            </Text>

            <TouchableOpacity
              style={styles.headerSide}
              onPress={() => setInfoOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="How to scan a student"
            >
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>i</Text>
              </View>
            </TouchableOpacity>
          </View>

          <FlowSteps current={1} tone="dark" style={styles.headerSteps} />
        </View>
      </SafeAreaView>

      {/* ==================================
          CAMERA, FRAME AND OPTIONS
      ================================== */}

      <View style={styles.cameraArea}>
        {showCamera && (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleBarcodeScanned}
            onCameraReady={() => setCameraReady(true)}
            onMountError={() =>
              setCameraError(
                "The camera could not start. Try again or use Student ID.",
              )
            }
          />
        )}

        <ScrollView
          contentContainerStyle={styles.scanBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScanFrame style={styles.frame}>
            {!showCamera && (
              <View style={styles.framePlaceholder}>
                {processing ? (
                  <ActivityIndicator size="large" color="#45B94F" />
                ) : (
                  <Image
                    source={require("../../../assets/icons/qr-codeWhite.png")}
                    style={styles.qrIcon}
                    resizeMode="contain"
                  />
                )}
              </View>
            )}

            <ScanLine active={Boolean(showCamera) && cameraReady} />
          </ScanFrame>

          <Text style={styles.scanInstruction}>
            {hasCandidate
              ? `QR code read for Student ID ${candidateId}.`
              : "Place the student's QR code inside the frame."}
          </Text>

          {Platform.OS === "web" && (
            <Text style={styles.supportText}>
              Open SmartFine on your phone to scan, or enter the Student ID.
            </Text>
          )}

          {Platform.OS !== "web" && !permission?.granted && (
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleCameraPermission}
              disabled={processing}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>
                {permission?.canAskAgain === false
                  ? "Open Camera Settings"
                  : "Allow Camera"}
              </Text>
            </TouchableOpacity>
          )}

          {cameraError ? (
            <Text style={styles.scanError}>{cameraError}</Text>
          ) : null}

          {error ? (
            <Text style={styles.scanError} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          {scanLocked && !processing && !hasCandidate && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={resetScan}
              accessibilityRole="button"
            >
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          )}

          <View style={styles.spacer} />

          {hasCandidate ? (
            // A code was read: check the ID, then confirm.
            <View style={styles.sheet}>
              <Text style={styles.sheetLabel}>QR code read</Text>

              <Text style={styles.sheetValue}>Student ID {candidateId}</Text>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  processing && styles.disabled,
                ]}
                disabled={processing}
                onPress={() => void identifyStudent(candidateId)}
                accessibilityRole="button"
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Confirm Student</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textButton}
                disabled={processing}
                onPress={resetScan}
                accessibilityRole="button"
              >
                <Text style={styles.sheetLink}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          ) : manualOpen ? (
            // Typing a Student ID instead of scanning.
            <View style={styles.sheet}>
              <Text style={styles.sheetLabel}>Enter the Student ID</Text>

              <TextInput
                style={styles.manualInput}
                value={manualId}
                onChangeText={(text) => {
                  setManualId(text);
                  setError("");
                }}
                placeholder="Example: 2026-0004"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!processing}
                returnKeyType="search"
                onSubmitEditing={() => void identifyStudent(manualId)}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.manualSearchButton,
                  processing && styles.disabled,
                ]}
                onPress={() => void identifyStudent(manualId)}
                disabled={processing}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>
                  {processing ? "Searching…" : "Search Student"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textButton}
                disabled={processing}
                onPress={() => {
                  setManualOpen(false);
                  setManualId("");
                  setError("");
                }}
                accessibilityRole="button"
              >
                <Text style={styles.sheetLink}>Back to Scanner</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Two other ways to find the student.
            <View style={styles.options}>
              <TouchableOpacity
                style={styles.option}
                disabled={processing}
                onPress={() => setManualOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Type a Student ID instead"
              >
                <ScanFrame
                  dim={false}
                  size="small"
                  color="#FFFFFF"
                  style={styles.optionIcon}
                >
                  <Image
                    source={require("../../../assets/icons/user.png")}
                    style={styles.optionGlyph}
                    resizeMode="contain"
                  />
                </ScanFrame>

                <Text style={styles.optionLabel}>Student ID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                disabled={processing}
                onPress={() => router.replace("/officer/student" as any)}
                accessibilityRole="button"
                accessibilityLabel="Choose a student from the Student List"
              >
                <ScanFrame
                  dim={false}
                  size="small"
                  color="#FFFFFF"
                  style={styles.optionIcon}
                >
                  <Image
                    source={require("../../../assets/icons/students.png")}
                    style={styles.optionGlyph}
                    resizeMode="contain"
                  />
                </ScanFrame>

                <Text style={styles.optionLabel}>Student List</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* ==================================
          BOTTOM NAVIGATION
          (hidden while typing, to leave room for the keyboard)
      ================================== */}

      {!manualOpen && (
        <FloatingTabBar
          items={NAV_ITEMS}
          active="Scan"
          onSelect={(item) => {
            if (item.label !== "Scan") {
              router.replace(item.route as any);
            }
          }}
        />
      )}

      {/* ==================================
          HOW TO SCAN
      ================================== */}

      <Modal
        visible={infoOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setInfoOpen(false)}
      >
        <View style={styles.infoOverlay}>
          <PopIn style={styles.infoCard} accessibilityViewIsModal>
            <Text style={styles.infoTitle}>How to scan a student</Text>

            <Text style={styles.infoItem}>
              1. Ask the student to open My QR in their SmartFine app.
            </Text>

            <Text style={styles.infoItem}>
              2. Hold the camera steady until the code is read, then tap
              Confirm Student.
            </Text>

            <Text style={styles.infoItem}>
              3. No QR code? Choose Student ID to type it, or Student List to
              pick the student.
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton, styles.infoButton]}
              onPress={() => setInfoOpen(false)}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Got it</Text>
            </TouchableOpacity>
          </PopIn>
        </View>
      </Modal>
    </View>
  );
}
