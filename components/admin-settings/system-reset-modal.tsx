import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import {
  Banner,
  CheckOption,
  FormField,
  FormInput,
  FormPopup,
  FormSection,
  PasswordInput,
  PopupButton,
  SuccessPanel,
} from "@/components/form-popup";
import { SkeletonForm } from "@/components/skeleton";
import { useActionLock } from "@/hooks/use-action-lock";
import { refreshNotificationCounts } from "@/hooks/use-notification-counts";
import { haptics } from "@/utils/haptics";

import { adminRequest } from "./form";
import { resetStyles as styles } from "./admin-settings.styles";

type Summary = {
  confirmPhrase: string;
  counts: {
    students: number;
    officers: number;
    otherAdmins: number;
    fines: number;
    payments: number;
    collectedCentavos: number;
    refunds: number;
    notifications: number;
    fineTypes: number;
    pictures: number;
  };
  school: { schoolName: string; academicYear: string };
  openCheckouts: string[];
  processingRefunds: { refundReference: string; fineReference: string }[];
};

type ResetResult = {
  backupFolder: string;
  removed: {
    students: number;
    officers: number;
    otherAdmins: number;
    fines: number;
    payments: number;
    refunds: number;
    notifications: number;
    fineTypes: number;
    pictures: number;
  };
  picturesNotMoved: string[];
  keptFineTypes: boolean;
  keptSchoolDetails: boolean;
};

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString("en-PH")} ${count === 1 ? one : many}`;

const pesos = (centavos: number) =>
  `₱${(centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ==========================================
// RESET SYSTEM POP-UP
// ==========================================

// Deletes SmartFine's records so another school can start fresh. The server
// saves a backup first, keeps this administrator, and refuses while money
// is still moving through PayMongo.
export function SystemResetModal({
  visible,
  onClose,
  onReset,
}: {
  visible: boolean;
  onClose: () => void;
  // "Done" after a reset: every screen's data is gone, so start over.
  onReset: () => void;
}) {
  const runLocked = useActionLock();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [keepFineTypes, setKeepFineTypes] = useState(true);
  const [keepSchoolDetails, setKeepSchoolDetails] = useState(true);
  const [password, setPassword] = useState("");
  const [phrase, setPhrase] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResetResult | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setLoadError("");

    const { ok, data } = await adminRequest<{
      success: boolean;
      message?: string;
      summary?: Summary;
    }>("/api/system-reset");

    if (ok && data.summary) {
      setSummary(data.summary);
    } else {
      setLoadError(data.message || "Could not load what a reset would delete.");
    }

    setLoading(false);
  };

  // Every opening starts from the current records and an empty form.
  useEffect(() => {
    if (!visible) return;

    setSummary(null);
    setKeepFineTypes(true);
    setKeepSchoolDetails(true);
    setPassword("");
    setPhrase("");
    setError("");
    setResult(null);
    void loadSummary();
  }, [visible]);

  const confirmPhrase = summary?.confirmPhrase || "RESET SMARTFINE";
  const phraseMatches = phrase.trim().toUpperCase() === confirmPhrase;
  const blocked = (summary?.processingRefunds.length ?? 0) > 0;

  const resetNow = () =>
    runLocked(async () => {
      setError("");

      if (!phraseMatches) {
        haptics.warning();
        setError(`Type ${confirmPhrase} exactly to confirm the reset.`);
        return;
      }

      if (!password) {
        haptics.warning();
        setError("Enter your current password to confirm the reset.");
        return;
      }

      setResetting(true);

      const { ok, data } = await adminRequest<
        { success: boolean; message?: string } & Partial<ResetResult>
      >("/api/system-reset", {
        method: "POST",
        body: {
          currentPassword: password,
          confirmation: phrase,
          keepFineTypes,
          keepSchoolDetails,
        },
      });

      setResetting(false);
      setPassword("");

      if (!ok || !data.backupFolder || !data.removed) {
        haptics.error();
        setError(data.message || "The reset failed. Nothing was deleted.");
        // Something may have changed (a checkout closed, a refund finished).
        void loadSummary();
        return;
      }

      haptics.success();
      setResult(data as ResetResult);
      // The deleted notices leave the badges at once.
      void refreshNotificationCounts();
    });

  // ========================================
  // UI
  // ========================================

  const counts = summary?.counts;

  const deletedLines = counts
    ? [
        plural(counts.students, "student account"),
        plural(counts.officers, "fines officer account"),
        plural(counts.otherAdmins, "other administrator account"),
        plural(counts.fines, "fine"),
        `${plural(counts.payments, "payment record")}${counts.collectedCentavos > 0 ? ` (${pesos(counts.collectedCentavos)} collected)` : ""}`,
        plural(counts.refunds, "refund record"),
        plural(counts.notifications, "notification"),
        plural(counts.pictures, "profile picture"),
      ]
    : [];

  const footer = result ? (
    <PopupButton label="Done" onPress={onReset} />
  ) : (
    <>
      <PopupButton label="Cancel" variant="outline" disabled={resetting} onPress={onClose} />
      <PopupButton
        label="Reset System"
        busyLabel="Resetting..."
        busy={resetting}
        disabled={!summary || blocked || !phraseMatches || !password}
        variant="danger"
        onPress={() => void resetNow()}
      />
    </>
  );

  return (
    <FormPopup
      visible={visible}
      busy={resetting}
      size="lg"
      title="Reset System"
      subtitle="Delete all records so SmartFine can start fresh"
      icon={require("../../assets/icons/settings.png")}
      onClose={onClose}
      notice={!result && error ? <Banner tone="error" title="Not Reset" message={error} /> : null}
      footer={footer}
    >
      {result ? (
        <SuccessPanel
          title="SmartFine Was Reset"
          lines={[
            `Backup saved on the server as ${result.backupFolder}.`,
            `Deleted ${plural(result.removed.students, "student")}, ${plural(result.removed.officers, "officer")}, ${plural(result.removed.otherAdmins, "other administrator")}, ${plural(result.removed.fines, "fine")} and ${plural(result.removed.payments, "payment")}.`,
            result.keptFineTypes
              ? "Fine types were kept."
              : `${plural(result.removed.fineTypes, "fine type")} deleted.`,
            result.keptSchoolDetails
              ? "School name and academic year were kept."
              : "School name and academic year were cleared. Set them in Settings › System.",
          ]}
          warning={
            result.picturesNotMoved.length > 0
              ? `${plural(result.picturesNotMoved.length, "profile picture")} could not be moved into the backup and are still in the uploads folder.`
              : undefined
          }
        />
      ) : loading && !summary ? (
        <SkeletonForm label="Loading what a reset would delete" fields={4} />
      ) : loadError ? (
        <View>
          <Banner tone="error" title="Unable to Load" message={loadError} />
          <PopupButton label="Try Again" variant="outline" onPress={() => void loadSummary()} />
        </View>
      ) : summary && counts ? (
        <>
          <Banner
            tone="warning"
            title="This deletes everything in SmartFine"
            message="Use this to hand SmartFine to another school or to start a new school year. A full backup is saved on the server first, but the app has no undo."
          />

          {blocked ? (
            <View style={styles.gap}>
              <Banner
                tone="error"
                title="Reset is not available yet"
                message={`PayMongo is still processing a refund for ${summary.processingRefunds
                  .map((refund) => refund.fineReference)
                  .join(", ")}. Open the fine and use Check Refund Status, then try again.`}
              />
            </View>
          ) : null}

          {summary.openCheckouts.length > 0 ? (
            <View style={styles.gap}>
              <Banner
                tone="info"
                message={`${plural(summary.openCheckouts.length, "GCash payment")} in progress (${summary.openCheckouts.join(", ")}) will be closed with PayMongo before the reset, so no one can pay into a deleted fine.`}
              />
            </View>
          ) : null}

          <FormSection title="What will be deleted" style={styles.section}>
            {deletedLines.map((line) => (
              <View key={line} style={styles.listRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{line}</Text>
              </View>
            ))}
            <Text style={styles.note}>
              New fines, students and officers start numbering from 0001 again.
            </Text>
          </FormSection>

          <FormSection title="What stays" style={styles.section}>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Your administrator account and picture. You stay signed in.
              </Text>
            </View>

            <View style={styles.options}>
              <CheckOption
                checked={keepFineTypes}
                onChange={setKeepFineTypes}
                disabled={resetting}
                title={`Keep fine types (${counts.fineTypes})`}
                description="Violation names and amounts stay so you can reuse or edit them. Untick to start with none."
              />

              <CheckOption
                checked={keepSchoolDetails}
                onChange={setKeepSchoolDetails}
                disabled={resetting}
                title="Keep school name and academic year"
                description={
                  summary.school.schoolName || summary.school.academicYear
                    ? `${summary.school.schoolName || "No school name"} · ${summary.school.academicYear || "No academic year"}. Untick when SmartFine moves to another school.`
                    : "None are set yet. Untick when SmartFine moves to another school."
                }
              />
            </View>
          </FormSection>

          <FormSection title="Confirm" style={styles.section}>
            <FormField label="Your Current Password" required>
              <PasswordInput
                label="current password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (error) setError("");
                }}
                placeholder="Enter your password"
                editable={!resetting && !blocked}
              />
            </FormField>

            <FormField
              label={`Type ${confirmPhrase} to confirm`}
              required
              hint="This makes sure the reset is not started by accident."
            >
              <FormInput
                value={phrase}
                onChangeText={(value) => {
                  setPhrase(value);
                  if (error) setError("");
                }}
                placeholder={confirmPhrase}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!resetting && !blocked}
              />
            </FormField>
          </FormSection>
        </>
      ) : null}
    </FormPopup>
  );
}
