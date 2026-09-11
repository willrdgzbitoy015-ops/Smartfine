import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE } from "@/constants/api";
import { useResponsiveStyles } from "./qr-scanner.styles";

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

function profileUrl(uri: string | null): string | null {
  if (!uri) return null;
  if (/^https?:\/\//i.test(uri)) return uri;

  return `${API_BASE.replace(/\/+$/, "")}/${uri.replace(/^\/+/, "")}`;
}

export default function OfficerQRScanner() {
  const styles = useResponsiveStyles();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

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

  // Cancel from the camera screen and return to the officer dashboard.
  const handleCancelScanner = () => {
    if (navigatingRef.current) return;

    requestRef.current?.abort();
    requestRef.current = null;

    scanLockRef.current = false;
    navigatingRef.current = true;

    setProcessing(false);

    router.replace("/officer/dashboard" as any);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    // Lock immediately before React updates state.
    if (scanLockRef.current || requestRef.current) return;

    scanLockRef.current = true;
    setScanLocked(true);
    setError("");

    const value = String(data || "").trim();

    if (!value.startsWith(QR_PREFIX)) {
      setError("Please scan a valid SmartFine Student QR Code.");
      return;
    }

    const id = value.slice(QR_PREFIX.length).trim();

    if (!id) {
      setError("This QR code does not contain a Student ID.");
      return;
    }

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

      setStudent(found);
      setImageFailed(false);
    } catch (caught) {
      if (requestRef.current !== controller) return;
      if (controller.signal.aborted && !timedOut) return;

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
          <View style={styles.successCircle}>
            <Image
              source={require("../../../assets/icons/check.png")}
              style={styles.successIcon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.identifiedTitle}>Student Identified</Text>

          <View style={styles.avatar}>
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
          </View>

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
              <Text style={styles.buttonText}>Add Fine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resultCancelButton]}
              onPress={resetScan}
              accessibilityRole="button"
              accessibilityLabel="Cancel student selection and return to camera"
            >
              <Text style={styles.resultCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ========================================
  // QR SCANNER
  // ========================================

  return (
    <SafeAreaView style={styles.scanScreen}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scanContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.scanArea}>
          <View style={styles.cameraFrame}>
            {showCamera ? (
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleBarcodeScanned}
                onMountError={() =>
                  setCameraError(
                    "The camera could not start. Try again or use Student ID.",
                  )
                }
              />
            ) : (
              <View style={styles.cameraPlaceholder}>
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

            <View pointerEvents="none" style={styles.frameBorder} />
          </View>

          <Text style={styles.scanInstruction}>
            {candidateId
              ? `QR captured for Student ID ${candidateId}. Tap Confirm to identify the student.`
              : "Point the camera at the student QR code to identify the student."}
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

          {scanLocked && !processing && (
            <TouchableOpacity
              style={styles.textButton}
              onPress={resetScan}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.scanActions}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              (!candidateId || processing) && styles.disabled,
            ]}
            disabled={!candidateId || processing}
            onPress={() => void identifyStudent(candidateId)}
            accessibilityRole="button"
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Confirm</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancelScanner}
            accessibilityRole="button"
            accessibilityLabel="Cancel scanning and return to dashboard"
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            disabled={processing}
            onPress={() => setManualOpen((current) => !current)}
          >
            <Text style={styles.linkText}>
              {manualOpen
                ? "Close Student ID Search"
                : "Use Student ID Instead"}
            </Text>
          </TouchableOpacity>

          {manualOpen && (
            <View style={styles.manualPanel}>
              <Text style={styles.manualLabel}>Student ID</Text>

              <TextInput
                style={styles.manualInput}
                value={manualId}
                onChangeText={(text) => {
                  setManualId(text);
                  setError("");
                }}
                placeholder="Enter Student ID"
                placeholderTextColor="#8C939F"
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
              >
                <Text style={styles.buttonText}>
                  {processing ? "Searching…" : "Search Student"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
