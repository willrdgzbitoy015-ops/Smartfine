import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Text, TouchableOpacity, View, type LayoutChangeEvent } from "react-native";

import {
  Banner,
  FormField,
  FormInput,
  FormPopup,
  FormSection,
  PasswordInput,
  PopupButton,
  SuccessPanel,
} from "@/components/form-popup";
import ConfirmDialog from "@/components/deletationmodal";
import { FadeIn, useRetainedValue } from "@/components/motion";
import { SkeletonList } from "@/components/skeleton";
import SuccessModal from "@/components/success-modal";
import { API_BASE } from "@/constants/api";
import { useActionLock } from "@/hooks/use-action-lock";
import { usePopupSwap } from "@/hooks/use-popup-swap";
import { apiFetch } from "@/utils/api-fetch";
import { saveResponseAsFile } from "@/utils/download-file";
import { forceSignOut } from "@/utils/session-guard";
import { formatFileSize, formatLogTime } from "@/utils/log-time";
import { haptics } from "@/utils/haptics";

import { adminRequest } from "./form";
import { styles, TYPE_COLORS } from "./backup-panel.styles";
import { SectionCard } from "./section-card";

type Backup = {
  id: string;
  type: string;
  typeLabel: string;
  createdAt: string;
  createdBy: { id: number; name: string | null } | null;
  // Imported backups: when and by whom the file was brought in.
  importedAt?: string | null;
  importedBy?: { id: number; name: string | null } | null;
  sizeBytes: number;
  // "20 tables and 1,309 rows": missing on backups made before this was recorded.
  tableCount?: number | null;
  rowCount?: number | null;
  contents: {
    students: number;
    officers: number;
    administrators: number;
    fines: number;
    payments: number;
  };
  verified: boolean;
  verifiedAt: string | null;
};

type Schedule = {
  description: string;
  keepAutomatic: number;
  encrypted: boolean;
  nextRunAt: string;
  lastAutomatic: Backup | null;
  lastFailure: { at: string; message: string } | null;
};

type ListResponse = {
  success: boolean;
  message?: string;
  backups?: Backup[];
  schedule?: Schedule;
  confirmPhrase?: string;
  deletePhrase?: string;
};

// The list shows the newest few; "Show all" opens the rest.
const VISIBLE_BACKUPS = 5;

// Panel width (in pixels) from which each backup uses one row.
const WIDE_PANEL = 700;

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString("en-PH")} ${count === 1 ? one : many}`;

// ==========================================
// RESTORE POP-UP
// ==========================================

// Replaces SmartFine's data with a backup. The server saves the current data
// first (so this can be undone), keeps the Log Trail, and signs everyone out.
function RestoreModal({
  backup,
  confirmPhrase,
  onClose,
}: {
  backup: Backup | null;
  confirmPhrase: string;
  onClose: () => void;
}) {
  const runLocked = useActionLock();

  const [password, setPassword] = useState("");
  const [phrase, setPhrase] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ safetyBackup: Backup } | null>(null);

  // Every opening starts with an empty form.
  useEffect(() => {
    if (!backup) return;

    setPassword("");
    setPhrase("");
    setError("");
    setDone(null);
  }, [backup]);

  const phraseMatches = phrase.trim().toUpperCase() === confirmPhrase;

  const restoreNow = () =>
    runLocked(async () => {
      if (!backup) return;

      setError("");

      if (!phraseMatches) {
        haptics.warning();
        setError(`Type ${confirmPhrase} exactly to confirm the restore.`);
        return;
      }

      if (!password) {
        haptics.warning();
        setError("Enter your current password to confirm the restore.");
        return;
      }

      setRestoring(true);

      const { ok, data } = await adminRequest<{
        success: boolean;
        message?: string;
        safetyBackup?: Backup;
      }>(`/api/backups/${backup.id}/restore`, {
        method: "POST",
        body: { currentPassword: password, confirmation: phrase },
      });

      setRestoring(false);
      setPassword("");

      if (!ok || !data.safetyBackup) {
        haptics.error();
        setError(data.message || "The backup could not be restored. Nothing was changed.");
        return;
      }

      haptics.success();
      setDone({ safetyBackup: data.safetyBackup });
    });

  const footer = done ? (
    <PopupButton label="Sign In Again" onPress={() => void forceSignOut("restored")} />
  ) : (
    <>
      <PopupButton label="Cancel" variant="outline" disabled={restoring} onPress={onClose} />
      <PopupButton
        label="Restore Data"
        busyLabel="Restoring..."
        busy={restoring}
        disabled={!phraseMatches || !password}
        variant="danger"
        onPress={() => void restoreNow()}
      />
    </>
  );

  return (
    <FormPopup
      visible={backup !== null}
      busy={restoring}
      size="lg"
      title="Restore From Backup"
      subtitle={backup ? `Backup made ${formatLogTime(backup.createdAt)}` : ""}
      icon={require("../../assets/icons/settings.png")}
      onClose={done ? () => void forceSignOut("restored") : onClose}
      notice={!done && error ? <Banner tone="error" title="Not Restored" message={error} /> : null}
      footer={footer}
    >
      {done && backup ? (
        <SuccessPanel
          title="Data Restored"
          lines={[
            `SmartFine now has the data from ${formatLogTime(backup.createdAt)}.`,
            `The data as it was just before is saved as a backup (${formatLogTime(done.safetyBackup.createdAt)}), so this can be undone.`,
            "The Log Trail kept every entry and recorded the restore.",
            "Everyone was signed out. Sign in again with the restored accounts.",
          ]}
        />
      ) : backup ? (
        <>
          <Banner
            tone="warning"
            title="This replaces everything in SmartFine"
            message="Accounts, fines, payments, refunds, notices and settings go back to how they were in this backup. Anything saved after it is replaced."
          />

          <FormSection title="This backup holds" style={styles.section}>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {`${plural(backup.contents.students, "student account")}, ${plural(backup.contents.officers, "fines officer account")} and ${plural(backup.contents.administrators, "administrator account")}`}
              </Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {`${plural(backup.contents.fines, "fine")} and ${plural(backup.contents.payments, "payment record")}`}
              </Text>
            </View>
          </FormSection>

          <FormSection title="What happens" style={styles.section}>
            {[
              "A backup of the data as it is right now is saved first, so you can undo the restore.",
              "The Log Trail is kept as it is. It records this restore.",
              "Everyone, including you, is signed out and signs in again with the restored accounts.",
              "Profile pictures and evidence photos are files, not part of the backup.",
            ].map((line) => (
              <View key={line} style={styles.listRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{line}</Text>
              </View>
            ))}
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
                editable={!restoring}
              />
            </FormField>

            <FormField
              label={`Type ${confirmPhrase} to confirm`}
              required
              hint="This makes sure a restore is not started by accident."
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
                editable={!restoring}
              />
            </FormField>
          </FormSection>
        </>
      ) : null}
    </FormPopup>
  );
}

// ==========================================
// DOWNLOAD POP-UP
// ==========================================

// Saves a copy of the encrypted backup file outside the server: on the web it
// goes to the computer's Downloads folder, on a phone the share sheet opens.
// The file stays encrypted (it cannot be opened without the server's backup
// key), and the administrator's password is needed, as for a restore.
function DownloadModal({ backup, onClose }: { backup: Backup | null; onClose: () => void }) {
  const runLocked = useActionLock();

  const [password, setPassword] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [savedAs, setSavedAs] = useState("");

  // Every opening starts with an empty form.
  useEffect(() => {
    if (!backup) return;

    setPassword("");
    setError("");
    setSavedAs("");
  }, [backup]);

  const downloadNow = () =>
    runLocked(async () => {
      if (!backup) return;

      setError("");

      if (!password) {
        haptics.warning();
        setError("Enter your current password to download the backup.");
        return;
      }

      setDownloading(true);

      try {
        const response = await apiFetch(`${API_BASE}/api/backups/download/${backup.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: password }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);

          throw new Error(data?.message || "The backup could not be downloaded.");
        }

        const fileName = `smartfine-backup-${backup.id}.sfbak`;

        await saveResponseAsFile(response, fileName);

        haptics.success();
        setSavedAs(fileName);
      } catch (caught) {
        haptics.error();
        setError(caught instanceof Error ? caught.message : "The backup could not be downloaded.");
      } finally {
        setDownloading(false);
        setPassword("");
      }
    });

  const savedLines =
    Platform.OS === "web"
      ? [
          `Your browser saved ${savedAs}. Look in your Downloads folder, or open the browser's list of downloads.`,
          "The file is encrypted. It can be opened only with SmartFine's backup key, so keep a copy of the key file (server/.backup-key) somewhere safe too.",
        ]
      : [
          `Choose where to keep ${savedAs} in the share sheet that opened (for example Save to Files).`,
          "The file is encrypted. It can be opened only with SmartFine's backup key.",
        ];

  return (
    <FormPopup
      visible={backup !== null}
      busy={downloading}
      title="Download Backup"
      subtitle={backup ? `Backup made ${formatLogTime(backup.createdAt)}` : ""}
      icon={require("../../assets/icons/download.png")}
      onClose={onClose}
      notice={!savedAs && error ? <Banner tone="error" title="Not Downloaded" message={error} /> : null}
      footer={
        savedAs ? (
          <PopupButton label="Done" onPress={onClose} />
        ) : (
          <>
            <PopupButton label="Cancel" variant="outline" disabled={downloading} onPress={onClose} />
            <PopupButton
              label="Download"
              busyLabel="Downloading..."
              busy={downloading}
              disabled={!password}
              variant="green"
              onPress={() => void downloadNow()}
            />
          </>
        )
      }
    >
      {savedAs ? (
        <SuccessPanel title="Backup Downloaded" lines={savedLines} />
      ) : backup ? (
        <>
          <Banner
            tone="info"
            title="You get the encrypted file"
            message="The backup stays encrypted (AES-256). It holds the accounts, fines and payments of that moment, so keep it somewhere private."
          />

          <FormSection title="Confirm" style={styles.section}>
            <FormField label="Your Current Password" required hint="Needed because a backup holds every record.">
              <PasswordInput
                label="current password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (error) setError("");
                }}
                placeholder="Enter your password"
                editable={!downloading}
                onSubmitEditing={() => void downloadNow()}
              />
            </FormField>
          </FormSection>
        </>
      ) : null}
    </FormPopup>
  );
}

// ==========================================
// IMPORT BACKUP FILE
// ==========================================

type PickedFile = { name: string; size: number | null; asset: DocumentPicker.DocumentPickerAsset };

// Import Backup File: the file picker opens at once, then "Replace the current
// data with this file?" (Cancel / Continue), then this password pop-up. The
// server opens the file with its own backup key and checks it, saves the
// current data as a backup, and restores the data from the file. Everyone,
// including you, then signs in again.
function ImportPasswordModal({ file, onClose }: { file: PickedFile | null; onClose: () => void }) {
  const runLocked = useActionLock();

  const [password, setPassword] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Every opening starts with an empty form.
  useEffect(() => {
    if (!file) return;

    setPassword("");
    setError("");
    setDone(false);
  }, [file]);

  const restoreNow = () =>
    runLocked(async () => {
      if (!file) return;

      setError("");

      if (!password) {
        haptics.warning();
        setError("Enter your current password to continue.");
        return;
      }

      setRestoring(true);

      try {
        // The password goes first, so the server reads it before the file.
        // No Content-Type is set: fetch adds the multipart boundary itself.
        const form = new FormData();

        form.append("currentPassword", password);
        form.append("restore", "true");

        if (Platform.OS === "web") {
          if (!file.asset.file) throw new Error("Could not access the selected file.");

          form.append("file", file.asset.file, file.name);
        } else {
          (form as any).append("file", {
            uri: file.asset.uri,
            name: file.name,
            type: "application/octet-stream",
          });
        }

        const response = await apiFetch(`${API_BASE}/api/backups/import`, { method: "POST", body: form });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "The backup file could not be restored. Nothing was changed.");
        }

        haptics.success();
        setDone(true);
      } catch (caught) {
        haptics.error();
        setError(
          caught instanceof Error && caught.message && !/network request failed|failed to fetch/i.test(caught.message)
            ? caught.message
            : "Could not connect to the SmartFine server. Nothing was changed.",
        );
      } finally {
        setRestoring(false);
        setPassword("");
      }
    });

  return (
    <>
      <FormPopup
        visible={file !== null && !done}
        busy={restoring}
        title="Confirm with your password"
        subtitle={file ? `Importing ${file.name} replaces the current data.` : ""}
        icon={require("../../assets/icons/import-icon.png")}
        onClose={onClose}
        notice={error ? <Banner tone="error" title="Not Restored" message={error} /> : null}
        footer={
          <>
            <PopupButton label="Cancel" variant="outline" disabled={restoring} onPress={onClose} />
            <PopupButton
              label="Restore"
              busyLabel="Restoring..."
              busy={restoring}
              disabled={!password}
              variant="danger"
              onPress={() => void restoreNow()}
            />
          </>
        }
      >
        <FormField label="Your Current Password" required>
          <PasswordInput
            label="current password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (error) setError("");
            }}
            placeholder="Your password"
            editable={!restoring}
            onSubmitEditing={() => void restoreNow()}
          />
        </FormField>
      </FormPopup>

      <SuccessModal
        visible={done}
        title="Backup Restored"
        message="The backup was restored. The data from just before was saved as a backup too. Everyone, including you, must sign in again."
        buttonText="Sign In Again"
        onClose={() => void forceSignOut("restored")}
      />
    </>
  );
}

// ==========================================
// DELETE POP-UP
// ==========================================

// Removes a backup from the server for good. It cannot be undone, so it asks
// for the administrator's password and a typed phrase (the server checks both).
// A copy saved with Download is not affected and can be imported again.
function DeleteModal({
  backup,
  onlyOne,
  deletePhrase,
  onClose,
  onDeleted,
}: {
  backup: Backup | null;
  onlyOne: boolean;
  deletePhrase: string;
  onClose: () => void;
  onDeleted: (backup: Backup) => void;
}) {
  const runLocked = useActionLock();

  const [password, setPassword] = useState("");
  const [phrase, setPhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Backup | null>(null);

  // Every opening starts with an empty form.
  useEffect(() => {
    if (!backup) return;

    setPassword("");
    setPhrase("");
    setError("");
    setDone(null);
  }, [backup]);

  const phraseMatches = phrase.trim().toUpperCase() === deletePhrase;

  const deleteNow = () =>
    runLocked(async () => {
      if (!backup) return;

      setError("");

      if (!phraseMatches) {
        haptics.warning();
        setError(`Type ${deletePhrase} exactly to confirm.`);
        return;
      }

      if (!password) {
        haptics.warning();
        setError("Enter your current password to delete the backup.");
        return;
      }

      setDeleting(true);

      const { ok, data } = await adminRequest<{ success: boolean; message?: string; backup?: Backup }>(
        `/api/backups/${backup.id}`,
        { method: "DELETE", body: { currentPassword: password, confirmation: phrase } },
      );

      setDeleting(false);
      setPassword("");

      if (!ok) {
        haptics.error();
        setError(data.message || "The backup could not be deleted. Nothing was changed.");
        return;
      }

      haptics.success();
      setDone(backup);
      onDeleted(backup);
    });

  const footer = done ? (
    <PopupButton label="Done" onPress={onClose} />
  ) : (
    <>
      <PopupButton label="Cancel" variant="outline" disabled={deleting} onPress={onClose} />
      <PopupButton
        label="Delete Backup"
        busyLabel="Deleting..."
        busy={deleting}
        disabled={!phraseMatches || !password}
        variant="danger"
        onPress={() => void deleteNow()}
      />
    </>
  );

  return (
    <FormPopup
      visible={backup !== null}
      busy={deleting}
      title="Delete Backup"
      subtitle={backup ? `Backup made ${formatLogTime(backup.createdAt)}` : ""}
      icon={require("../../assets/icons/settings.png")}
      onClose={onClose}
      notice={!done && error ? <Banner tone="error" title="Not Deleted" message={error} /> : null}
      footer={footer}
    >
      {done ? (
        <SuccessPanel
          title="Backup Deleted"
          lines={[
            `The backup made ${formatLogTime(done.createdAt)} was removed from the server.`,
            "Your other backups were not touched.",
            "If you saved a copy with Download, that file is not affected. You can import it again.",
          ]}
        />
      ) : backup ? (
        <>
          <Banner
            tone="warning"
            title="This cannot be undone"
            message="The encrypted backup is removed from the server for good, and its data can no longer be restored from here. A copy you saved with Download is not affected."
          />

          {onlyOne ? (
            <View style={styles.section}>
              <Banner
                tone="error"
                title="This is your only backup"
                message="After deleting it, SmartFine has no backup to restore from until the next one is made. Press Back Up Now first if you want a new one."
              />
            </View>
          ) : null}

          {backup.type === "BEFORE_RESET" ? (
            <View style={styles.section}>
              <Banner
                tone="error"
                title="This was saved just before a system reset"
                message="It may be the only copy of the data from before the reset."
              />
            </View>
          ) : null}

          {backup.type === "BEFORE_RESTORE" ? (
            <View style={styles.section}>
              <Banner
                tone="warning"
                title="This is a safety copy made before a restore"
                message="Deleting it means that restore can no longer be undone."
              />
            </View>
          ) : null}

          <FormSection title="This backup" style={styles.section}>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {`${backup.typeLabel} · ${formatLogTime(backup.createdAt)} · ${formatFileSize(backup.sizeBytes)}`}
              </Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {`${plural(backup.contents.students, "student")}, ${plural(backup.contents.officers, "officer")}, ${plural(backup.contents.fines, "fine")} and ${plural(backup.contents.payments, "payment")}`}
              </Text>
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
                editable={!deleting}
              />
            </FormField>

            <FormField
              label={`Type ${deletePhrase} to confirm`}
              required
              hint="This makes sure a backup is not deleted by accident."
            >
              <FormInput
                value={phrase}
                onChangeText={(value) => {
                  setPhrase(value);
                  if (error) setError("");
                }}
                placeholder={deletePhrase}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!deleting}
              />
            </FormField>
          </FormSection>
        </>
      ) : null}
    </FormPopup>
  );
}

// ==========================================
// BACKUP PANEL
// ==========================================

// Settings > Backups: the automatic schedule, every available backup, a
// button to back up now, and Restore.
export function BackupPanel() {
  const runLocked = useActionLock();

  const [backups, setBackups] = useState<Backup[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState("RESTORE SMARTFINE");
  const [deletePhrase, setDeletePhrase] = useState("DELETE BACKUP");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [checking, setChecking] = useState("");
  const [checked, setChecked] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<Backup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null);
  // Import Backup File: the file picked, then "Replace the current data?", then the password.
  const [importConfirm, setImportConfirm] = useState<PickedFile | null>(null);
  const [importPassword, setImportPassword] = useState<PickedFile | null>(null);
  const shownImport = useRetainedValue(importConfirm);
  // The "Backup Saved" dialog after Back Up Now.
  const [saved, setSaved] = useState<Backup | null>(null);
  const shownSaved = useRetainedValue(saved);
  // "See what's inside" per backup, and the short list with "Show all".
  const [inside, setInside] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  // Wide enough for the details on the left and the buttons on the right?
  const [panelWidth, setPanelWidth] = useState(0);
  const wide = panelWidth >= WIDE_PANEL;
  // Closing the import pop-up and opening the restore one: iOS needs a moment.
  const swapPopup = usePopupSwap();

  const requestId = useRef(0);

  const load = useCallback(async (quiet = false) => {
    const id = ++requestId.current;

    if (!quiet) setLoading(true);

    const { ok, data } = await adminRequest<ListResponse>("/api/backups");

    if (id !== requestId.current) return;

    if (ok) {
      setBackups(data.backups || []);
      setSchedule(data.schedule || null);
      if (data.confirmPhrase) setConfirmPhrase(data.confirmPhrase);
      if (data.deletePhrase) setDeletePhrase(data.deletePhrase);
      setError("");
    } else if (!quiet) {
      setError(data.message || "Could not load the backups.");
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const backUpNow = () =>
    runLocked(async () => {
      setBackingUp(true);
      setNotice(null);

      const { ok, data } = await adminRequest<{ success: boolean; message?: string; backup?: Backup }>("/api/backups", {
        method: "POST",
      });

      setBackingUp(false);

      if (ok) {
        haptics.success();

        if (data.backup) {
          setSaved(data.backup);
        } else {
          setNotice({ tone: "success", text: "Backup saved." });
        }

        void load(true);
      } else {
        haptics.error();
        setNotice({ tone: "error", text: data.message || "The backup could not be saved." });
      }
    });

  // Import Backup File opens the file picker at once.
  const chooseImportFile = () =>
    runLocked(async () => {
      setNotice(null);

      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          multiple: false,
          copyToCacheDirectory: true,
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        const name = String(asset.name || "");

        if (!/\.sfbak$/i.test(name)) {
          haptics.warning();
          setNotice({
            tone: "error",
            text: "Choose a SmartFine backup file. Its name ends in .sfbak (for example smartfine-backup-2026….sfbak).",
          });
          return;
        }

        setImportConfirm({ name, size: typeof asset.size === "number" ? asset.size : null, asset });
      } catch {
        setNotice({ tone: "error", text: "The file could not be opened. Please try again." });
      }
    });

  const check = (backup: Backup) =>
    runLocked(async () => {
      setChecking(backup.id);

      const { ok, data } = await adminRequest<{ success: boolean; message?: string; verified?: boolean }>(
        `/api/backups/${backup.id}/verify`,
        { method: "POST" },
      );

      setChecking("");

      const intact = ok && data.verified === true;

      setChecked((current) => ({
        ...current,
        [backup.id]: {
          ok: intact,
          text: intact
            ? "Checked now: the backup opens and is intact."
            : data.message || "The backup could not be checked.",
        },
      }));

      void load(true);
    });

  return (
    <>
      <SectionCard
        title="Backup & Recovery"
        description="SmartFine saves an encrypted copy of all its data automatically. If something goes wrong, an administrator can restore it from here. The Log Trail is kept when you restore."
        icon={require("../../assets/icons/settings.png")}
        actions={
          <>
            <PopupButton
              label="↻ Refresh"
              busyLabel="Refreshing..."
              variant="outline"
              busy={refreshing}
              disabled={loading || refreshing || backingUp}
              onPress={() => {
                setRefreshing(true);
                void load(true);
              }}
            />

          </>
        }
      >
        {notice ? (
          <View style={{ marginBottom: 12 }}>
            <Banner
              tone={notice.tone === "success" ? "info" : "error"}
              message={notice.text}
            />
          </View>
        ) : null}

        <View onLayout={(event: LayoutChangeEvent) => setPanelWidth(event.nativeEvent.layout.width)}>
          {schedule ? (
            <View style={[styles.stats, wide && styles.statsWide]}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>AUTOMATIC BACKUPS</Text>
                <Text style={styles.statValue}>{schedule.description}</Text>
                <Text style={styles.statHint}>{`The newest ${schedule.keepAutomatic} are kept · encrypted`}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>LAST AUTOMATIC BACKUP</Text>
                <Text style={styles.statValue}>
                  {schedule.lastAutomatic ? formatLogTime(schedule.lastAutomatic.createdAt) : "None yet"}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>NEXT AUTOMATIC BACKUP</Text>
                <Text style={styles.statValue}>{formatLogTime(schedule.nextRunAt)}</Text>
              </View>
            </View>
          ) : null}

          {schedule?.lastFailure ? (
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                {`The last automatic backup could not be saved (${formatLogTime(schedule.lastFailure.at)}). The server will try again. If this keeps happening, check the free disk space on the server.`}
              </Text>
            </View>
          ) : null}

          {backups.length > 0 ? (
            <View style={styles.listHead}>
              <Text style={styles.listTitle}>Saved backups</Text>
              <Text style={styles.listCount}>{`${backups.length} in total`}</Text>
            </View>
          ) : null}

          {loading && backups.length === 0 ? (
            <SkeletonList label="Loading the backups" count={3} avatar={false} />
          ) : error && backups.length === 0 ? (
            <View style={styles.message}>
              <Text style={styles.error}>{error}</Text>
              <TouchableOpacity onPress={() => void load()} accessibilityRole="button">
                <Text style={styles.link}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : backups.length === 0 ? (
            <View style={styles.message}>
              <Text style={styles.messageTitle}>No backups yet</Text>
              <Text style={styles.messageText}>
                The first automatic backup is made at the time shown above. You can also back up now.
              </Text>
            </View>
          ) : (
            <FadeIn key={backups.length}>
              {(showAll ? backups : backups.slice(0, VISIBLE_BACKUPS)).map((backup) => {
                const [color, background] = TYPE_COLORS[backup.type] || TYPE_COLORS.MANUAL;
                const result = checked[backup.id];

                return (
                  <View key={backup.id} style={[styles.item, { borderLeftColor: color }, wide && styles.itemWide]}>
                    <View style={styles.itemMain}>
                      <View style={styles.itemHead}>
                        <Text style={styles.time}>{formatLogTime(backup.createdAt)}</Text>

                        <View style={styles.tags}>
                          <Text style={[styles.tag, { color, backgroundColor: background }]}>
                            {backup.typeLabel.toUpperCase()}
                          </Text>
                          <Text
                            style={[
                              styles.tag,
                              backup.verified
                                ? { color: "#2E7D32", backgroundColor: "#E8F6EA" }
                                : { color: "#B3261E", backgroundColor: "#FDECEC" },
                            ]}
                          >
                            {backup.verified ? "VERIFIED" : "NOT VERIFIED"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.meta}>
                        {`${formatFileSize(backup.sizeBytes)}${
                          typeof backup.rowCount === "number" ? ` · ${plural(backup.rowCount, "row")}` : ""
                        } · encrypted${
                          backup.type === "IMPORTED"
                            ? ` · imported${backup.importedBy?.name ? ` by ${backup.importedBy.name}` : ""}${
                                backup.importedAt ? ` on ${formatLogTime(backup.importedAt)}` : ""
                              }`
                            : backup.createdBy?.name
                              ? ` · by ${backup.createdBy.name}`
                              : backup.type === "SCHEDULED"
                                ? " · made automatically"
                                : ""
                        }`}
                      </Text>

                      <TouchableOpacity
                        onPress={() => setInside((current) => ({ ...current, [backup.id]: !current[backup.id] }))}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: Boolean(inside[backup.id]) }}
                      >
                        <Text style={styles.link}>
                          {inside[backup.id] ? "▴ Hide what's inside" : "▾ See what's inside"}
                        </Text>
                      </TouchableOpacity>

                      {inside[backup.id] ? (
                        <Text style={styles.contents}>
                          {`${plural(backup.contents.students, "student")} · ${plural(backup.contents.officers, "officer")} · ${plural(backup.contents.fines, "fine")} · ${plural(backup.contents.payments, "payment")}${
                            typeof backup.tableCount === "number" ? ` · ${plural(backup.tableCount, "table")}` : ""
                          }`}
                        </Text>
                      ) : null}

                      {result ? (
                        <Text style={[styles.checked, { color: result.ok ? "#2E7D32" : "#B3261E" }]}>
                          {result.text}
                        </Text>
                      ) : null}
                    </View>

                    <View style={[styles.actions, wide && styles.actionsWide]}>
                      <PopupButton
                        label="Check"
                        busyLabel="Checking..."
                        variant="outline"
                        compact
                        busy={checking === backup.id}
                        disabled={checking !== ""}
                        onPress={() => void check(backup)}
                      />
                      <PopupButton
                        label="Download"
                        variant="outline"
                        compact
                        disabled={checking !== ""}
                        onPress={() => setDownloadTarget(backup)}
                      />
                      <PopupButton
                        label="Restore"
                        variant="primary"
                        compact
                        disabled={checking !== ""}
                        onPress={() => setRestoreTarget(backup)}
                      />
                      <PopupButton
                        label="Delete"
                        variant="dangerOutline"
                        compact
                        disabled={checking !== ""}
                        onPress={() => setDeleteTarget(backup)}
                      />
                    </View>
                  </View>
                );
              })}
            </FadeIn>
          )}

          {backups.length > VISIBLE_BACKUPS ? (
            <TouchableOpacity
              style={styles.more}
              onPress={() => setShowAll((current) => !current)}
              accessibilityRole="button"
            >
              <Text style={styles.moreText}>{showAll ? "Show fewer" : `Show all ${backups.length}`}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.bottomActions}>
            <PopupButton
              label="Import Backup File"
              variant="outline"
              disabled={loading || backingUp}
              onPress={() => void chooseImportFile()}
            />
            <PopupButton
              label="Back Up Now"
              busyLabel="Backing up..."
              busy={backingUp}
              disabled={loading || backingUp}
              variant="green"
              onPress={() => void backUpNow()}
            />
          </View>

          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Good to know</Text>
            {[
              "A backup holds the database only: accounts, fines, payments and settings. Profile pictures and evidence photos are files on the server.",
              "Backups are encrypted and cannot be opened without the server's backup key. Keep a copy of that key somewhere safe.",
              "Download saves a copy on your own computer. Import Backup File restores the data from such a file: you confirm, then enter your password, and the current data is saved first.",
              "Delete removes a backup from the server for good. It needs your password and a typed phrase.",
            ].map((line) => (
              <View key={line} style={styles.noteRow}>
                <Text style={styles.noteBullet}>•</Text>
                <Text style={styles.noteText}>{line}</Text>
              </View>
            ))}
          </View>
        </View>
      </SectionCard>

      <RestoreModal
        backup={restoreTarget}
        confirmPhrase={confirmPhrase}
        onClose={() => setRestoreTarget(null)}
      />

      <DownloadModal backup={downloadTarget} onClose={() => setDownloadTarget(null)} />

      <DeleteModal
        backup={deleteTarget}
        onlyOne={backups.length <= 1}
        deletePhrase={deletePhrase}
        onClose={() => setDeleteTarget(null)}
        onDeleted={(backup) => {
          setChecked((current) => {
            const { [backup.id]: _removed, ...rest } = current;

            return rest;
          });
          setNotice({
            tone: "success",
            text: `The backup made ${formatLogTime(backup.createdAt)} was deleted from the server.`,
          });
          void load(true);
        }}
      />

      <ConfirmDialog
        visible={importConfirm !== null}
        title="Import backup"
        message={`Replace the current data with “${shownImport?.name ?? ""}”? Everything added or changed since that backup will be undone. A backup of the current data is saved first, and everyone is signed out.`}
        confirmText="Continue"
        onCancel={() => setImportConfirm(null)}
        onConfirm={() => {
          const file = importConfirm;

          setImportConfirm(null);
          swapPopup(() => setImportPassword(file));
        }}
      />

      <ImportPasswordModal file={importPassword} onClose={() => setImportPassword(null)} />

      <SuccessModal
        visible={saved !== null}
        title="Backup Saved"
        message={
          shownSaved
            ? typeof shownSaved.tableCount === "number" && typeof shownSaved.rowCount === "number"
              ? `${plural(shownSaved.tableCount, "table")} and ${plural(shownSaved.rowCount, "row")} were saved.`
              : `${plural(shownSaved.contents.students, "student")}, ${plural(shownSaved.contents.fines, "fine")} and ${plural(shownSaved.contents.payments, "payment")} were saved.`
            : ""
        }
        onClose={() => setSaved(null)}
      />
    </>
  );
}
