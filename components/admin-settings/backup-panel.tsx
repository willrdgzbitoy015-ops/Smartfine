import { useCallback, useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
import { FadeIn } from "@/components/motion";
import { SkeletonList } from "@/components/skeleton";
import { useActionLock } from "@/hooks/use-action-lock";
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
  sizeBytes: number;
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
};

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
// BACKUP PANEL
// ==========================================

// Settings > Backups: the automatic schedule, every available backup, a
// button to back up now, and Restore.
export function BackupPanel() {
  const runLocked = useActionLock();

  const [backups, setBackups] = useState<Backup[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState("RESTORE SMARTFINE");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [checking, setChecking] = useState("");
  const [checked, setChecked] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);

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

      const { ok, data } = await adminRequest<{ success: boolean; message?: string }>("/api/backups", {
        method: "POST",
      });

      setBackingUp(false);

      if (ok) {
        haptics.success();
        setNotice({ tone: "success", text: "Backup saved." });
        void load(true);
      } else {
        haptics.error();
        setNotice({ tone: "error", text: data.message || "The backup could not be saved." });
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
            <PopupButton
              label="Back Up Now"
              busyLabel="Backing up..."
              busy={backingUp}
              disabled={loading || backingUp}
              onPress={() => void backUpNow()}
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

        {schedule ? (
          <View style={styles.status}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Automatic backups:</Text>
              <Text style={styles.statusText}>
                {`${schedule.description} · the newest ${schedule.keepAutomatic} are kept · encrypted`}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last automatic backup:</Text>
              <Text style={styles.statusText}>
                {schedule.lastAutomatic ? formatLogTime(schedule.lastAutomatic.createdAt) : "None yet"}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Next automatic backup:</Text>
              <Text style={styles.statusText}>{formatLogTime(schedule.nextRunAt)}</Text>
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
            {backups.map((backup) => {
              const [color, background] = TYPE_COLORS[backup.type] || TYPE_COLORS.MANUAL;
              const result = checked[backup.id];

              return (
                <View key={backup.id} style={styles.item}>
                  <View style={styles.itemTop}>
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
                    <Text style={styles.time}>{formatLogTime(backup.createdAt)}</Text>
                  </View>

                  <Text style={styles.contents}>
                    {`${plural(backup.contents.students, "student")} · ${plural(backup.contents.officers, "officer")} · ${plural(backup.contents.fines, "fine")} · ${plural(backup.contents.payments, "payment")}`}
                  </Text>

                  <Text style={styles.meta}>
                    {`${formatFileSize(backup.sizeBytes)} · encrypted${
                      backup.createdBy?.name ? ` · by ${backup.createdBy.name}` : backup.type === "SCHEDULED" ? " · made automatically" : ""
                    }`}
                  </Text>

                  {result ? (
                    <Text style={[styles.checked, { color: result.ok ? "#2E7D32" : "#B3261E" }]}>
                      {result.text}
                    </Text>
                  ) : null}

                  <View style={styles.actions}>
                    <PopupButton
                      label="Check"
                      busyLabel="Checking..."
                      variant="outline"
                      busy={checking === backup.id}
                      disabled={checking !== ""}
                      onPress={() => void check(backup)}
                    />
                    <PopupButton
                      label="Restore"
                      variant="danger"
                      disabled={checking !== ""}
                      onPress={() => setRestoreTarget(backup)}
                    />
                  </View>
                </View>
              );
            })}
          </FadeIn>
        )}

        <Text style={styles.note}>
          Backups hold the database only (accounts, fines, payments and settings). They are encrypted on the
          server and cannot be opened without its backup key; keep a copy of that key somewhere safe.
          Profile pictures and evidence photos are stored as files on the server.
        </Text>
      </SectionCard>

      <RestoreModal
        backup={restoreTarget}
        confirmPhrase={confirmPhrase}
        onClose={() => setRestoreTarget(null)}
      />
    </>
  );
}
