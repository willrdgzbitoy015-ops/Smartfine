import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
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
import { useLocalSearchParams } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  FadeIn,
  PopIn,
  useRetainedValue,
  useSwitchFade,
} from "@/components/motion";
import { FlowSteps } from "@/components/flow-steps";
import { Skeleton, SkeletonGroup } from "@/components/skeleton";
import { SuccessCheck } from "@/components/success-check";
import { API_BASE } from "@/constants/api";
import {
  EVIDENCE_MAX,
  type EvidencePhoto,
  pickEvidencePhotos,
  uploadEvidencePhoto,
} from "@/utils/evidence-photos";
import { haptics } from "@/utils/haptics";
import { useResponsiveStyles } from "./add-fine.styles";

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
  id?: number;
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
  const styles = useResponsiveStyles();
  const router = useGuardedRouter();
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

  // Evidence photos: chosen here, uploaded right after the fine is recorded.
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<EvidencePhoto[]>([]);
  const [uploadProblem, setUploadProblem] = useState("");

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

  // Return to the screen that opened Add Fine.
  // Students -> student profile.
  // Scanner -> scanner.
  const back = () => {
    if (savingRef.current) return;

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/officer/student");
    }
  };

  const openConfirmation = () => {
    setError("");

    if (!student || !active || !officerId) {
      haptics.warning();
      setError("An active student and valid officer session are required.");
      return;
    }

    if (!selected) {
      haptics.warning();
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

          // Omit issuedAt so the backend uses CURRENT_TIMESTAMP.
        }),
      });

      const data = await readResponse(response);
      const fine: SavedFine = data.fine || {};

      setSavedFine(fine);

      // The fine is saved now. A photo that fails to upload never undoes it;
      // the success pop-up offers to try that photo again.
      const fineId = Number(fine.id);
      const failed = Number.isSafeInteger(fineId) && fineId > 0
        ? await uploadPhotos(fineId, photos)
        : photos;

      if (failed.length && !(Number.isSafeInteger(fineId) && fineId > 0)) {
        setUploadProblem("The fine was saved, but its ID was not returned, so the photos could not be attached.");
      }

      if (failed.length) {
        haptics.warning();
      } else {
        haptics.success();
      }

      setModal("success");
    } catch (caught) {
      haptics.error();
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save the fine. Check your connection.",
      );
      setModal(null);
    } finally {
      savingRef.current = false;
      setSaving(false);
      setUploadStatus("");
    }
  };

  // Uploads photos one at a time. Returns the ones that did not upload.
  const uploadPhotos = async (fineId: number, list: EvidencePhoto[]) => {
    const failed: EvidencePhoto[] = [];
    let problem = "";

    for (let index = 0; index < list.length; index += 1) {
      setUploadStatus(
        list.length > 1
          ? `Uploading photo ${index + 1} of ${list.length}…`
          : "Uploading photo…",
      );

      try {
        await uploadEvidencePhoto(fineId, list[index]);
        setUploadedCount((count) => count + 1);
      } catch (caught) {
        failed.push(list[index]);
        problem = caught instanceof Error ? caught.message : "Please try again.";
      }
    }

    setFailedPhotos(failed);
    setUploadProblem(problem);

    return failed;
  };

  const retryUpload = async () => {
    const fineId = Number(savedFine?.id);

    if (savingRef.current || !failedPhotos.length || !Number.isSafeInteger(fineId)) {
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const failed = await uploadPhotos(fineId, failedPhotos);

      if (failed.length) {
        haptics.warning();
      } else {
        haptics.success();
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
      setUploadStatus("");
    }
  };

  const addPhotos = async (source: "camera" | "library") => {
    setPhotoError("");

    try {
      const picked = await pickEvidencePhotos(source, EVIDENCE_MAX - photos.length);

      if (picked.length) {
        haptics.selection();
        setPhotos((current) => [...current, ...picked].slice(0, EVIDENCE_MAX));
      }
    } catch (caught) {
      haptics.warning();
      setPhotoError(
        caught instanceof Error ? caught.message : "The photo could not be added.",
      );
    }
  };

  const removePhoto = (uri: string) => {
    haptics.selection();
    setPhotos((current) => current.filter((photo) => photo.uri !== uri));
  };

  // The pop-up keeps its last step on screen while it fades out.
  const shownModal = useRetainedValue(modal);

  const stepFade = useSwitchFade(shownModal);

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
              accessibilityLabel="Back to previous screen"
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

          <FlowSteps current={3} style={styles.steps} />

          {loading ? (
            // Placeholders in the shape of the student and the form.
            <SkeletonGroup label="Loading student information">
              <View style={styles.studentRow}>
                <Skeleton width={60} height={60} radius={30} />
                <View style={styles.studentText}>
                  <Skeleton width="62%" height={16} />
                  <Skeleton width="85%" height={11} style={styles.skeletonGap} />
                </View>
              </View>

              <View style={styles.form}>
                {[50, 50, 110].map((height, index) => (
                  <View key={index} style={styles.skeletonField}>
                    <Skeleton width="30%" height={11} />
                    <Skeleton
                      height={height}
                      radius={10}
                      style={styles.skeletonGap}
                    />
                  </View>
                ))}
              </View>
            </SkeletonGroup>
          ) : (
            <FadeIn>
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
                  <Text
                    style={[styles.fieldText, !selected && styles.placeholder]}
                  >
                    {selected?.violation_name || "Select violation"}
                  </Text>

                  <View style={styles.chevron} />
                </TouchableOpacity>

                <Text style={styles.label}>Fine Amount</Text>

                <View style={styles.field}>
                  <Text style={[styles.amount, !selected && styles.placeholder]}>
                    {selected ? pesos(amount) : "₱ —"}
                  </Text>
                </View>

                <Text style={styles.fieldHint}>
                  The amount is set automatically from the violation you choose.
                </Text>

                <Text style={styles.label}>Description (optional)</Text>

                <TextInput
                  style={styles.description}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter a description"
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={500}
                  editable={active && !saving}
                  textAlignVertical="top"
                />

                <View style={styles.evidenceLabelRow}>
                  <Text style={styles.label}>Evidence Photos (optional)</Text>
                  <Text style={styles.evidenceCount}>
                    {photos.length} of {EVIDENCE_MAX}
                  </Text>
                </View>

                {photos.length > 0 && (
                  <View style={styles.evidenceThumbs}>
                    {photos.map((photo, index) => (
                      <View key={photo.uri} style={styles.evidenceThumb}>
                        <Image
                          source={{ uri: photo.uri }}
                          style={styles.evidenceImage}
                          resizeMode="cover"
                          accessibilityLabel={`Evidence photo ${index + 1}`}
                        />

                        <TouchableOpacity
                          style={styles.evidenceRemove}
                          onPress={() => removePhoto(photo.uri)}
                          disabled={saving}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove evidence photo ${index + 1}`}
                        >
                          <Text style={styles.evidenceRemoveText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {photos.length < EVIDENCE_MAX && (
                  <View style={styles.evidenceButtons}>
                    <TouchableOpacity
                      style={[
                        styles.evidenceButton,
                        (!active || saving) && styles.disabled,
                      ]}
                      onPress={() => void addPhotos("camera")}
                      disabled={!active || saving}
                      accessibilityRole="button"
                      accessibilityLabel="Take an evidence photo"
                    >
                      <Text style={styles.evidenceButtonText}>Take Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.evidenceButton,
                        (!active || saving) && styles.disabled,
                      ]}
                      onPress={() => void addPhotos("library")}
                      disabled={!active || saving}
                      accessibilityRole="button"
                      accessibilityLabel="Choose evidence photos from the gallery"
                    >
                      <Text style={styles.evidenceButtonText}>
                        Choose from Gallery
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!!photoError && (
                  <Text style={styles.error} accessibilityRole="alert">
                    {photoError}
                  </Text>
                )}

                <Text style={styles.fieldHint}>
                  Up to {EVIDENCE_MAX} photos. The student, the Admin and you
                  can see them once the fine is recorded.
                </Text>
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
                  <Text style={styles.buttonText}>Review Fine</Text>
                </TouchableOpacity>

                <Text style={styles.helper}>
                  You can check everything once more before it is recorded.
                </Text>
              </View>
            </FadeIn>
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
          <PopIn style={styles.modalCard} accessibilityViewIsModal>
            {/* Fades in again at each step: violations, confirm, success. */}
            <Animated.ScrollView
              style={stepFade}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {shownModal === "violations" && (
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
                        haptics.selection();
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

              {shownModal === "confirm" && (
                <>
                  <Text style={styles.modalTitle}>Review Fine</Text>

                  <Text style={styles.helper}>
                    Check the details, then record the fine.
                  </Text>

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

                  <Text style={styles.detailLabel}>Evidence</Text>

                  {photos.length > 0 ? (
                    <View style={styles.evidenceThumbs}>
                      {photos.map((photo, index) => (
                        <View
                          key={photo.uri}
                          style={[styles.evidenceThumb, styles.evidenceThumbSmall]}
                        >
                          <Image
                            source={{ uri: photo.uri }}
                            style={styles.evidenceImage}
                            resizeMode="cover"
                            accessibilityLabel={`Evidence photo ${index + 1}`}
                          />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.detailText}>No photos attached</Text>
                  )}

                  {!!uploadStatus && (
                    <Text style={styles.uploadStatus} accessibilityLiveRegion="polite">
                      Fine recorded. {uploadStatus}
                    </Text>
                  )}

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => setModal(null)}
                      disabled={saving}
                    >
                      <Text style={styles.cancelText}>Go Back</Text>
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
                        <Text style={styles.buttonText}>Record Fine</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {shownModal === "success" && (
                <>
                  <SuccessCheck delay={80} style={styles.successCheck} />

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

                    {uploadedCount > 0 && (
                      <Text style={styles.uploadedNote}>
                        {uploadedCount} evidence{" "}
                        {uploadedCount === 1 ? "photo" : "photos"} attached
                      </Text>
                    )}
                  </View>

                  {(failedPhotos.length > 0 || !!uploadProblem) && (
                    <View style={styles.uploadWarning} accessibilityRole="alert">
                      <Text style={styles.uploadWarningText}>
                        {failedPhotos.length > 0
                          ? `${failedPhotos.length} ${
                              failedPhotos.length === 1 ? "photo" : "photos"
                            } did not upload. The fine itself is saved.`
                          : "Some photos did not upload. The fine itself is saved."}
                        {uploadProblem ? ` ${uploadProblem}` : ""}
                      </Text>

                      {!!uploadStatus && (
                        <Text style={styles.uploadStatus}>{uploadStatus}</Text>
                      )}

                      {failedPhotos.length > 0 && (
                        <TouchableOpacity
                          style={[
                            styles.button,
                            styles.cancelButton,
                            saving && styles.disabled,
                          ]}
                          onPress={() => void retryUpload()}
                          disabled={saving}
                          accessibilityRole="button"
                        >
                          {saving ? (
                            <ActivityIndicator color="#123266" />
                          ) : (
                            <Text style={styles.cancelText}>Retry Upload</Text>
                          )}
                        </TouchableOpacity>
                      )}

                      <Text style={styles.uploadWarningText}>
                        You can also add photos later from Records.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.button, styles.successButton, saving && styles.disabled]}
                    onPress={() => router.replace("/officer/dashboard")}
                    disabled={saving}
                  >
                    <Text style={styles.buttonText}>Back to Dashboard</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton, saving && styles.disabled]}
                    onPress={() => router.replace("/officer/qr-scanner")}
                    disabled={saving}
                  >
                    <Text style={styles.cancelText}>Scan Another Student</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.ScrollView>
          </PopIn>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
