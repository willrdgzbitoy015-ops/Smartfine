import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { PopIn } from "@/components/motion";
import { API_BASE } from "@/constants/api";
import { useLiveReload } from "@/hooks/use-live-updates";
import { apiFetch } from "@/utils/api-fetch";
import { haptics } from "@/utils/haptics";

import { styles } from "./account-access.styles";

// ==========================================
// ACCOUNT ACCESS
// For Administrators: lock or unlock someone's account, and change a staff
// member between Administrator and Fines Officer. Each action asks first and
// is written to the Activity Log by the server.
// ==========================================

type Access = {
  id: number;
  role: "ADMIN" | "FINES_OFFICER" | "STUDENT";
  accountStatus: string;
  failedAttempts: number;
  timedLockSecondsLeft: number;
  isSelf: boolean;
  canChangeRole: boolean;
};

type Pending =
  | { type: "lock" }
  | { type: "unlock" }
  | { type: "role"; role: "ADMIN" | "FINES_OFFICER" };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  FINES_OFFICER: "Fines Officer",
  STUDENT: "Student",
};

function clock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);

  return `${String(minutes).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

async function request(path: string, method: "GET" | "POST", body?: unknown) {
  const response = await apiFetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  return {
    ok: Boolean(data) && response.ok && data.success !== false,
    data: (data || { message: "The server sent an unexpected answer." }) as Record<string, any>,
  };
}

export function AccountAccess({
  userId,
  name,
  onChanged,
}: {
  userId: number;
  name: string;
  // Called after a change so the page can reload what it shows.
  onChanged?: () => void;
}) {
  const [access, setAccess] = useState<Access | null>(null);
  const [loadError, setLoadError] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const busyRef = useRef(false);

  const load = useCallback(async () => {
    const { ok, data } = await request(`/api/access/${userId}`, "GET");

    if (ok && data.access) {
      setAccess(data.access as Access);
      setLoadError("");
    } else {
      setLoadError(String(data.message || "Could not load this account's access."));
    }
  }, [userId]);

  useEffect(() => {
    setAccess(null);
    setMessage(null);
    void load();
  }, [load]);

  // A lock that runs out (or another administrator's change) shows up here.
  useLiveReload(["people"], load);

  // The timed lockout counts down on screen.
  useEffect(() => {
    if (!access || access.timedLockSecondsLeft <= 0) return;

    const timer = setTimeout(
      () =>
        setAccess((current) =>
          current
            ? { ...current, timedLockSecondsLeft: Math.max(0, current.timedLockSecondsLeft - 1) }
            : current,
        ),
      1000,
    );

    return () => clearTimeout(timer);
  }, [access]);

  const confirm = async () => {
    if (!pending || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);

    try {
      const { ok, data } =
        pending.type === "role"
          ? await request(`/api/access/${userId}/role`, "POST", { role: pending.role })
          : await request(`/api/access/${userId}/${pending.type}`, "POST");

      setPending(null);
      setMessage({ ok, text: String(data.message || (ok ? "Done." : "Something went wrong.")) });

      if (ok) {
        haptics.success();
        onChanged?.();
      } else {
        haptics.error();
      }

      await load();
    } catch {
      setPending(null);
      setMessage({ ok: false, text: "Could not reach the SmartFine server. Please try again." });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (!access) {
    return (
      <View style={styles.card} accessibilityLabel="Account access">
        <Text style={styles.title}>Account Access</Text>
        {loadError ? (
          <>
            <Text style={[styles.message, styles.messageError]}>{loadError}</Text>
            <TouchableOpacity style={styles.button} onPress={() => void load()} accessibilityRole="button">
              <Text style={styles.buttonText}>Try again</Text>
            </TouchableOpacity>
          </>
        ) : (
          <ActivityIndicator color="#173A73" />
        )}
      </View>
    );
  }

  const lockedByAdmin = access.accountStatus === "LOCKED";
  const timedLock = access.timedLockSecondsLeft > 0;
  const inactive = access.accountStatus === "INACTIVE";
  const staff = access.role === "ADMIN" || access.role === "FINES_OFFICER";

  const badge = lockedByAdmin
    ? { text: "Locked by an administrator", style: styles.badgeLocked }
    : timedLock
      ? { text: `Locked · too many attempts · ${clock(access.timedLockSecondsLeft)} left`, style: styles.badgeTimed }
      : inactive
        ? { text: "Inactive", style: styles.badgeInactive }
        : { text: "Active", style: styles.badgeActive };

  const nextRole = access.role === "ADMIN" ? "FINES_OFFICER" : "ADMIN";

  const dialog = pending
    ? pending.type === "lock"
      ? {
          title: "Lock this account?",
          text: `${name} will not be able to use SmartFine until you unlock the account. Anything they have open stops working at once.`,
          action: "Lock Account",
          danger: true,
        }
      : pending.type === "unlock"
        ? {
            title: "Unlock this account?",
            text: `${name} will be able to sign in again, and any "too many attempts" lockout is cleared.`,
            action: "Unlock Account",
            danger: false,
          }
        : {
            title: `Make ${name} a ${ROLE_LABELS[pending.role]}?`,
            text:
              pending.role === "ADMIN"
                ? "Administrators can manage students, officers, fines, payments, settings and other administrators. They need to sign in again."
                : "A Fines Officer can scan students and record fines, but can no longer use the administrator screens. They need to sign in again.",
            action: `Make ${ROLE_LABELS[pending.role]}`,
            danger: pending.role === "FINES_OFFICER",
          }
    : null;

  return (
    <View style={styles.card} accessibilityLabel="Account access">
      <Text style={styles.title} accessibilityRole="header">
        Account Access
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Status</Text>
        <Text style={[styles.badge, badge.style]}>{badge.text}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{ROLE_LABELS[access.role] || access.role}</Text>
      </View>

      {access.isSelf ? (
        <Text style={styles.description}>This is your own account, so you can't lock it or change its role.</Text>
      ) : (
        <View style={styles.buttons}>
          {lockedByAdmin || timedLock ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonGreen, busy && styles.disabled]}
              onPress={() => setPending({ type: "unlock" })}
              disabled={busy}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, styles.buttonGreenText]}>Unlock Account</Text>
            </TouchableOpacity>
          ) : access.accountStatus === "ACTIVE" ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger, busy && styles.disabled]}
              onPress={() => setPending({ type: "lock" })}
              disabled={busy}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, styles.buttonDangerText]}>Lock Account</Text>
            </TouchableOpacity>
          ) : null}

          {staff && access.canChangeRole && (
            <TouchableOpacity
              style={[styles.button, busy && styles.disabled]}
              onPress={() => setPending({ type: "role", role: nextRole })}
              disabled={busy}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Make {ROLE_LABELS[nextRole]}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!!message && (
        <Text
          style={[styles.message, message.ok ? styles.messageOk : styles.messageError]}
          accessibilityRole="alert"
        >
          {message.text}
        </Text>
      )}

      <Modal
        visible={pending !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!busy) setPending(null);
        }}
      >
        <View style={styles.overlay}>
          <PopIn style={styles.dialog} accessibilityViewIsModal>
            {dialog && (
              <>
                <Text style={styles.dialogTitle}>{dialog.title}</Text>
                <Text style={styles.dialogText}>{dialog.text}</Text>

                <View style={styles.dialogButtons}>
                  <TouchableOpacity
                    style={[styles.dialogButton, styles.dialogButtonOutline, busy && styles.disabled]}
                    onPress={() => setPending(null)}
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.dialogButtonText, styles.dialogButtonOutlineText]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dialogButton, dialog.danger && styles.dialogButtonDanger, busy && styles.disabled]}
                    onPress={() => void confirm()}
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.dialogButtonText}>{dialog.action}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </PopIn>
        </View>
      </Modal>
    </View>
  );
}

// The same card in a pop-up, for lists that have no room for it (Settings ›
// Administrators).
export function AccountAccessModal({
  visible,
  userId,
  name,
  onClose,
  onChanged,
}: {
  visible: boolean;
  userId: number | null;
  name: string;
  onClose: () => void;
  onChanged?: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <PopIn style={[styles.dialog, { padding: 14 }]} accessibilityViewIsModal>
          {userId !== null && <AccountAccess userId={userId} name={name} onChanged={onChanged} />}

          <TouchableOpacity
            style={[styles.dialogButton, styles.dialogButtonOutline]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={[styles.dialogButtonText, styles.dialogButtonOutlineText]}>Close</Text>
          </TouchableOpacity>
        </PopIn>
      </View>
    </Modal>
  );
}
