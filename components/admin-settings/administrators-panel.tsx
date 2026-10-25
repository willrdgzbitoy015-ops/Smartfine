import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import { AccountAccessModal } from "@/components/account-access";
import DeleteModal from "@/components/deletationmodal";
import { FadeIn } from "@/components/motion";
import { SkeletonList } from "@/components/skeleton";
import { API_BASE } from "@/constants/api";
import { useActionLock } from "@/hooks/use-action-lock";

import { AddAdminModal } from "./add-admin-modal";
import { COLORS, styles } from "./admin-settings.styles";
import { EditAdminModal } from "./edit-admin-modal";
import { adminRequest, PopupButton } from "./form";
import { SectionCard } from "./section-card";
import { TypeToConfirmModal } from "./type-to-confirm-modal";
import type { AdminAccount } from "./types";

type AdminsResponse = {
  success: boolean;
  message?: string;
  admins?: AdminAccount[];
  activeCount?: number;
  nextUsername?: string;
};

type AdminResponse = {
  success: boolean;
  message?: string;
  code?: string;
  admin?: AdminAccount;
};

type PendingAction = {
  type: "deactivate" | "delete";
  admin: AdminAccount;
};

// ==========================================
// ADMINISTRATORS PANEL
// ==========================================

// Lists every administrator and lets the signed-in admin add, edit, deactivate,
// reactivate or delete the others. Editing and deleting ask for the person's
// username to be typed first. Results are reported through `onMessage` (the
// screen's Success / Warning pop-ups).
export function AdministratorsPanel({
  onMessage,
}: {
  onMessage: (title: string, message: string) => void;
}) {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [nextUsername, setNextUsername] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [accessAdmin, setAccessAdmin] = useState<AdminAccount | null>(null);
  const [editAdmin, setEditAdmin] = useState<AdminAccount | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Saving, paying and changing records run once per tap.
  const runLocked = useActionLock();

  const load = async (mode: "initial" | "refresh") => {
    if (mode === "refresh") {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const { ok, data } = await adminRequest<AdminsResponse>("/api/admins");

    if (ok) {
      setAdmins(data.admins || []);
      setNextUsername(data.nextUsername || "");
      setError("");
    } else if (mode === "refresh") {
      onMessage("Administrators", data.message || "Failed to load administrators.");
    } else {
      setError(data.message || "Failed to load administrators.");
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load("initial");
  }, []);

  const replaceAdmin = (updated?: AdminAccount) => {
    if (!updated) {
      return;
    }

    setAdmins((current) =>
      current.map((admin) => (admin.id === updated.id ? updated : admin)),
    );
  };

  // ========================================
  // ACTIONS
  // ========================================

  const changeStatus = (admin: AdminAccount, status: "ACTIVE" | "INACTIVE") =>
    runLocked(async () => {
      setWorkingId(admin.id);

      const { ok, data } = await adminRequest<AdminResponse>(
        `/api/admins/${admin.id}/status`,
        { method: "PATCH", body: { status } },
      );

      setWorkingId(null);
      setPending(null);

      if (!ok) {
        onMessage(
          "Unable to Update Administrator",
          data.message || "Failed to update the administrator.",
        );
        return;
      }

      replaceAdmin(data.admin);

      onMessage("Success", data.message || "Administrator updated.");
    });

  const deleteAdmin = (admin: AdminAccount, typed: string) =>
    runLocked(async () => {
      setWorkingId(admin.id);
      setDeleteError("");

      const { ok, data } = await adminRequest<AdminResponse>(
        `/api/admins/${admin.id}`,
        { method: "DELETE", body: { confirmation: typed } },
      );

      setWorkingId(null);

      // A wrong word stays in the pop-up so it can be typed again.
      if (!ok && data.code?.startsWith("CONFIRMATION")) {
        setDeleteError(data.message || "Type the username to confirm.");
        return;
      }

      setPending(null);

      if (!ok) {
        onMessage(
          "Unable to Delete Administrator",
          data.message || "Failed to delete the administrator.",
        );

        // The account may have gained history meanwhile; show the latest.
        load("refresh");
        return;
      }

      setAdmins((current) => current.filter((item) => item.id !== admin.id));

      onMessage("Success", data.message || "Administrator deleted.");
    });

  const requestDelete = (admin: AdminAccount) => {
    if (!admin.canDelete) {
      onMessage(
        "Account Kept for Records",
        `${displayName(admin)} has handled fines, payments or fine types, so the account can't be deleted. Deactivate it instead to block sign-in while keeping the history.`,
      );
      return;
    }

    setDeleteError("");
    setPending({ type: "delete", admin });
  };

  const confirmDeactivate = () => {
    if (pending?.type === "deactivate") {
      changeStatus(pending.admin, "INACTIVE");
    }
  };

  // ========================================
  // UI
  // ========================================

  const activeCount = admins.filter(
    (admin) => admin.accountStatus === "ACTIVE",
  ).length;

  const busy = loading || refreshing || workingId !== null;

  return (
    <>
      <SectionCard
        title="Administrators"
        description="People who can sign in to the SmartFine admin panel. You can edit or delete another administrator after typing their username to confirm. You can't deactivate or delete your own account."
        icon={require("../../assets/icons/officers.png")}
        actions={
          <>
            <PopupButton
              label="↻ Refresh"
              busyLabel="Refreshing..."
              variant="outline"
              busy={refreshing}
              disabled={busy}
              onPress={() => load("refresh")}
            />

            <PopupButton
              label="+ Add Administrator"
              variant="green"
              disabled={loading || !!error}
              onPress={() => setShowAdd(true)}
            />
          </>
        }
      >
        {loading ? (
          <SkeletonList label="Loading administrators" count={3} />
        ) : error ? (
          <View style={[styles.stateBox, styles.stateBoxError]}>
            <Text style={styles.stateErrorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => load("initial")}
              activeOpacity={0.8}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <SummaryChip
                color={COLORS.navy}
                label={`${admins.length} ${admins.length === 1 ? "administrator" : "administrators"}`}
              />

              <SummaryChip color={COLORS.green} label={`${activeCount} active`} />

              {admins.length - activeCount > 0 && (
                <SummaryChip
                  color={COLORS.red}
                  label={`${admins.length - activeCount} inactive`}
                />
              )}
            </View>

            {admins.map((admin, index) => (
              <FadeIn key={admin.id} index={index}>
                <AdminRow
                  admin={admin}
                  working={workingId === admin.id}
                  disabled={busy}
                  onActivate={() => changeStatus(admin, "ACTIVE")}
                  onDeactivate={() => setPending({ type: "deactivate", admin })}
                  onDelete={() => requestDelete(admin)}
                  onEdit={() => setEditAdmin(admin)}
                  onAccess={() => setAccessAdmin(admin)}
                />
              </FadeIn>
            ))}
          </>
        )}
      </SectionCard>

      <AccountAccessModal
        visible={accessAdmin !== null}
        userId={accessAdmin ? accessAdmin.id : null}
        name={accessAdmin ? displayName(accessAdmin) : ""}
        onClose={() => setAccessAdmin(null)}
        onChanged={() => void load("refresh")}
      />

      <AddAdminModal
        visible={showAdd}
        suggestedUsername={nextUsername}
        onClose={() => setShowAdd(false)}
        onAdded={(_admin, message) => {
          setShowAdd(false);
          load("refresh");
          onMessage("Success", message);
        }}
      />

      <EditAdminModal
        visible={editAdmin !== null}
        admin={editAdmin}
        onClose={() => setEditAdmin(null)}
        onSaved={(updated, message) => {
          setEditAdmin(null);
          replaceAdmin(updated);
          onMessage("Success", message);
        }}
      />

      <TypeToConfirmModal
        visible={pending?.type === "delete"}
        busy={workingId !== null}
        title="Delete Administrator?"
        subtitle={
          pending ? `${displayName(pending.admin)} (@${pending.admin.username})` : ""
        }
        message={
          pending
            ? `${displayName(pending.admin)} will be permanently removed and will no longer be able to sign in. This can't be undone. Their name stays on the Log Trail entries they made.`
            : ""
        }
        word={pending?.admin.username ?? ""}
        confirmLabel="Delete Administrator"
        busyLabel="Deleting..."
        danger
        error={deleteError}
        onCancel={() => {
          if (workingId === null) {
            setPending(null);
          }
        }}
        onConfirm={(typed) => {
          if (pending?.type === "delete") {
            deleteAdmin(pending.admin, typed);
          }
        }}
      />

      <DeleteModal
        visible={pending?.type === "deactivate"}
        loading={workingId !== null}
        title="Deactivate Administrator?"
        message={
          pending
            ? `${displayName(pending.admin)} won't be able to sign in until an administrator reactivates the account.`
            : ""
        }
        confirmText="Deactivate"
        onCancel={() => {
          if (workingId === null) {
            setPending(null);
          }
        }}
        onConfirm={confirmDeactivate}
      />
    </>
  );
}

// ==========================================
// ROW
// ==========================================

function AdminRow({
  admin,
  working,
  disabled,
  onActivate,
  onDeactivate,
  onDelete,
  onEdit,
  onAccess,
}: {
  admin: AdminAccount;
  working: boolean;
  disabled: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onAccess: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const active = admin.accountStatus === "ACTIVE";

  const photo = pictureUrl(admin.profilePictureUri);

  const added = formatDate(admin.createdAt);

  return (
    <View
      style={[
        styles.adminRow,
        admin.isCurrentUser && styles.adminRowSelf,
        !active && styles.adminRowInactive,
      ]}
    >
      <View style={styles.adminIdentity}>
        <View style={[styles.avatar, !active && styles.avatarInactive]}>
          {photo && !imageFailed ? (
            <Image
              source={{ uri: photo }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Text style={styles.avatarText}>{initialsOf(admin)}</Text>
          )}
        </View>

        <View style={styles.adminText}>
          <View style={styles.adminNameRow}>
            <Text
              style={[styles.adminName, !active && styles.adminNameInactive]}
              numberOfLines={1}
            >
              {displayName(admin)}
            </Text>

            {admin.isCurrentUser && <Text style={styles.youTag}>YOU</Text>}
          </View>

          <Text style={styles.adminMeta} numberOfLines={1}>
            @{admin.username}
            {admin.email ? `  ·  ${admin.email}` : ""}
          </Text>

          {(added || admin.contactNumber) && (
            <Text style={styles.adminMetaSmall} numberOfLines={1}>
              {[admin.contactNumber, added && `Added ${added}`]
                .filter(Boolean)
                .join("  ·  ")}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.adminSide}>
        <Text
          style={[
            styles.statusBadge,
            active ? styles.statusActive : styles.statusInactive,
          ]}
        >
          {admin.accountStatus === "LOCKED" ? "Locked" : active ? "Active" : "Inactive"}
        </Text>

        {admin.isCurrentUser ? (
          <Text style={styles.selfNote}>Signed in now</Text>
        ) : (
          <>
            {active ? (
              <RowButton
                label={working ? "Updating..." : "Deactivate"}
                buttonStyle={styles.rowButtonDeactivate}
                textStyle={styles.rowTextDeactivate}
                disabled={disabled}
                onPress={onDeactivate}
                accessibilityLabel={`Deactivate ${displayName(admin)}`}
              />
            ) : (
              <RowButton
                label={working ? "Updating..." : "Activate"}
                buttonStyle={styles.rowButtonActivate}
                textStyle={styles.rowTextActivate}
                disabled={disabled}
                onPress={onActivate}
                accessibilityLabel={`Activate ${displayName(admin)}`}
              />
            )}

            <RowButton
              label="Access"
              buttonStyle={styles.rowButtonMuted}
              textStyle={styles.rowTextMuted}
              disabled={disabled}
              onPress={onAccess}
              accessibilityLabel={`Lock, unlock or change the role of ${displayName(admin)}`}
            />

            <RowButton
              label="Edit"
              buttonStyle={styles.rowButtonMuted}
              textStyle={styles.rowTextMuted}
              disabled={disabled}
              onPress={onEdit}
              accessibilityLabel={`Edit ${displayName(admin)}`}
            />

            <RowButton
              label="Delete"
              buttonStyle={
                admin.canDelete ? styles.rowButtonDelete : styles.rowButtonMuted
              }
              textStyle={
                admin.canDelete ? styles.rowTextDelete : styles.rowTextMuted
              }
              disabled={disabled}
              onPress={onDelete}
              accessibilityLabel={`Delete ${displayName(admin)}`}
            />
          </>
        )}
      </View>
    </View>
  );
}

function RowButton({
  label,
  buttonStyle,
  textStyle,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  buttonStyle: object;
  textStyle: object;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.rowButton, buttonStyle, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.8}
    >
      <Text style={[styles.rowButtonText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SummaryChip({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.summaryChip}>
      <View style={[styles.summaryDot, { backgroundColor: color }]} />

      <Text style={styles.summaryText}>{label}</Text>
    </View>
  );
}

// ==========================================
// HELPERS
// ==========================================

export function displayName(admin: AdminAccount | null) {
  return admin?.fullName?.trim() || admin?.username || "Administrator";
}

export function initialsOf(admin: AdminAccount | null) {
  const first = admin?.firstName?.trim().charAt(0).toUpperCase() || "";

  const last = admin?.lastName?.trim().charAt(0).toUpperCase() || "";

  return `${first}${last}` || "AD";
}

export function pictureUrl(uri: string | null | undefined) {
  if (!uri) {
    return null;
  }

  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  return `${API_BASE}${uri}`;
}

// SQLite stores UTC as "YYYY-MM-DD HH:MM:SS".
export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(
    value.includes("T") ? value : `${value.replace(" ", "T")}Z`,
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
