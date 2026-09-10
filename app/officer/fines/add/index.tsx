import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE } from "@/constants/api";
import { styles } from "./add-fine.styles";

type Student = {
  id: number;
  student_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  grade_level: string | null;
  section: string | null;
  account_status: string;
  profile_picture_uri: string | null;
};

type Violation = {
  id: number;
  violation_name: string;
  amount_centavos: number;
};

type SavedFine = {
  fineReference?: string;
  violationName?: string;
  amount?: number;
  recordedAt?: string;
};

async function headers() {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("Your session is missing. Please log in again.");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "ngrok-skip-browser-warning": "true",
  };
}

async function readResponse(response: Response) {
  const raw = await response.text();
  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Unexpected server response (HTTP ${response.status}).`);
  }

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || "The request could not be completed.");
  }

  return data;
}

function pictureUrl(uri: string | null | undefined) {
  if (!uri) return null;
  if (/^https?:\/\//i.test(uri)) return uri;

  return `${API_BASE.replace(/\/+$/, "")}/${uri.replace(/^\/+/, "")}`;
}

function pesos(amount: number) {
  return `₱ ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRecordedAt(value?: string) {
  if (!value) return "";

  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? value.replace(" ", "T") + "Z"
    : value;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });
}

export default function OfficerAddFine() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawId = params.studentId;
  const studentId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const [student, setStudent] = useState<Student | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [officerId, setOfficerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const [modal, setModal] = useState<
    "violations" | "confirm" | "success" | null
  >(null);

  const [savedFine, setSavedFine] = useState<SavedFine | null>(null);
  const savingRef = useRef(false);

  const selected = violations.find((item) => item.id === selectedId);
  const amount = Number(selected?.amount_centavos ?? 0) / 100;
  const active = student?.account_status?.toUpperCase() === "ACTIVE";

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        if (!Number.isSafeInteger(studentId) || studentId <= 0) {
          throw new Error("Please scan or select a student first.");
        }

        const requestHeaders = await headers();

        const [storedId, role] = await Promise.all([
          AsyncStorage.getItem("userId"),
          AsyncStorage.getItem("userRole"),
        ]);

        const currentOfficerId = Number(storedId);

        if (
          role !== "FINES_OFFICER" ||
          !Number.isSafeInteger(currentOfficerId) ||
          currentOfficerId <= 0
        ) {
          throw new Error("Please log in with a Fines Officer account.");
        }

        const [studentData, violationData] = await Promise.all([
          fetch(`${API_BASE}/api/students/${studentId}`, {
            headers: requestHeaders,
          }).then(readResponse),
          fetch(`${API_BASE}/api/fines/options/violations`, {
            headers: requestHeaders,
          }).then(readResponse),
        ]);

        if (!studentData.student) {
          throw new Error("Student information was not returned.");
        }

        if (!Array.isArray(violationData.violations)) {
          throw new Error("Violation options were not returned.");
        }

        if (!mounted) return;

        setStudent(studentData.student);
        setViolations(violationData.violations);
        setOfficerId(currentOfficerId);
        setImageFailed(false);

        if (studentData.student.account_status !== "ACTIVE") {
          setError("This student is inactive. Fine recording is unavailable.");
        }
      } catch (caught) {
        if (mounted) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load the Add Fine screen.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [studentId]);

  const back = () => {
    if (savingRef.current) return;
    router.replace("/officer/qr-scanner" as any);
  };

  const openConfirmation = () => {
    setError("");

    if (!student || !active || !officerId) {
      setError("An active student and valid officer session are required.");
      return;
    }

    if (!selected) {
      setError("Please select a violation.");
      return;
    }

    setModal("confirm");
  };

  const saveFine = async () => {
    if (savingRef.current || !student || !selected || !officerId || !active) {
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");

    try {
      const requestHeaders = await headers();

      const response = await fetch(`${API_BASE}/api/fines`, {
        method: "POST",
        headers: {
          ...requestHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: student.id,
          violationTypeId: selected.id,
          recordedBy: officerId,
          remarks: description.trim(),

          // Omit issuedAt. The existing backend uses
          // CURRENT_TIMESTAMP when no date is supplied.
        }),
      });

      const data = await readResponse(response);

      setSavedFine(data.fine || {});
      setModal("success");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save the fine. Check your connection.",
      );
      setModal(null);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const avatarUri = pictureUrl(student?.profile_picture_uri);
  const initials =
    `${student?.first_name?.charAt(0) || ""}${
      student?.last_name?.charAt(0) || ""
    }`.toUpperCase() || "ST";

  const studentHeader = () => (
    <View style={styles.studentRow}>
      <View style={styles.avatar}>
        {avatarUri && !imageFailed ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarImage}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Text style={styles.initials}>{initials}</Text>
        )}
      </View>

      <View style={styles.studentText}>
        <Text style={styles.studentName}>
          {student?.full_name || "Student"}
        </Text>
        <Text style={styles.studentMeta}>
          {[student?.grade_level, student?.section].filter(Boolean).join(" - ")}
          {" · Student ID: "}
          {student?.student_id || "—"}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={back}
              disabled={saving}
              accessibilityLabel="Back to scanner"
            >
              <Image
                source={require("../../../../assets/icons/back_icon.png")}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <Text style={styles.title}>Add Fine</Text>
            <View style={styles.headerSpacer} />
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#173A73" />
              <Text style={styles.helper}>Loading student information…</Text>
            </View>
          ) : (
            <>
              {student && studentHeader()}

              {error ? (
                <Text style={styles.error} accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}

              <View style={styles.form}>
                <Text style={styles.label}>Violation</Text>

                <TouchableOpacity
                  style={styles.field}
                  onPress={() => setModal("violations")}
                  disabled={!active || saving}
                  accessibilityRole="button"
                  accessibilityLabel="Select violation"
                >
                  <Text style={styles.fieldText}>
                    {selected?.violation_name || "Select violation"}
                  </Text>
                  <View style={styles.chevron} />
                </TouchableOpacity>

                <Text style={styles.label}>Fine Amount</Text>
                <View style={styles.field}>
                  <Text style={styles.amount}>
                    {selected ? pesos(amount) : "₱ —"}
                  </Text>
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.description}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter a description"
                  placeholderTextColor="#7A89A8"
                  multiline
                  maxLength={500}
                  editable={active && !saving}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={back}
                  disabled={saving}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    (!active || saving) && styles.disabled,
                  ]}
                  onPress={openConfirmation}
                  disabled={!active || saving}
                >
                  <Text style={styles.buttonText}>Add Fine</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={modal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (saving) return;

          if (modal === "success") {
            router.replace("/officer/dashboard");
          } else {
            setModal(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {modal === "violations" && (
                <>
                  <Text style={styles.modalTitle}>Select Violation</Text>

                  {violations.length === 0 && (
                    <Text style={styles.helper}>
                      No violation types are available.
                    </Text>
                  )}

                  {violations.map((violation) => (
                    <Pressable
                      key={violation.id}
                      style={[
                        styles.option,
                        selectedId === violation.id && styles.optionSelected,
                      ]}
                      onPress={() => {
                        setSelectedId(violation.id);
                        setModal(null);
                        setError("");
                      }}
                    >
                      <Text style={styles.optionName}>
                        {violation.violation_name}
                      </Text>
                      <Text style={styles.optionAmount}>
                        {pesos(Number(violation.amount_centavos) / 100)}
                      </Text>
                    </Pressable>
                  ))}

                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setModal(null)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}

              {modal === "confirm" && (
                <>
                  <Text style={styles.modalTitle}>Fine Details</Text>
                  {studentHeader()}

                  <Text style={styles.detailLabel}>Violation</Text>
                  <Text style={styles.detailText}>
                    {selected?.violation_name}
                  </Text>

                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.redAmount}>{pesos(amount)}</Text>

                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailText}>
                    {description.trim() || "No description"}
                  </Text>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => setModal(null)}
                      disabled={saving}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.primaryButton,
                        saving && styles.disabled,
                      ]}
                      onPress={saveFine}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>Confirm</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {modal === "success" && (
                <>
                  <View style={styles.successCircle}>
                    <Image
                      source={require("../../../../assets/icons/check.png")}
                      style={styles.successIcon}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={styles.modalTitle}>
                    Fine Recorded Successfully!
                  </Text>

                  {studentHeader()}

                  <View style={styles.receipt}>
                    <Text style={styles.receiptText}>
                      {savedFine?.violationName || selected?.violation_name}
                    </Text>
                    <Text style={styles.redAmount}>
                      {pesos(Number(savedFine?.amount ?? amount))}
                    </Text>

                    {savedFine?.fineReference && (
                      <Text style={styles.helper}>
                        {savedFine.fineReference}
                      </Text>
                    )}

                    {savedFine?.recordedAt && (
                      <Text style={styles.helper}>
                        {formatRecordedAt(savedFine.recordedAt)}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.button, styles.successButton]}
                    onPress={() => router.replace("/officer/dashboard")}
                  >
                    <Text style={styles.buttonText}>Back to Dashboard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => router.replace("/officer/qr-scanner" as any)}
                  >
                    <Text style={styles.cancelText}>Scan Another Student</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
