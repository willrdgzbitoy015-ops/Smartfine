import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Skeleton, SkeletonGroup } from "@/components/skeleton";
import { OFFICER } from "@/constants/officer-theme";
import { useActionLock } from "@/hooks/use-action-lock";
import { useLiveReload } from "@/hooks/use-live-updates";
import {
  type FineTrailData,
  type TrailEvidence,
  type TrailPerson,
  loadFineTrail,
  pickEvidencePhotos,
  removeEvidencePhoto,
  serverImage,
  uploadEvidencePhoto,
} from "@/utils/evidence-photos";
import { haptics } from "@/utils/haptics";

import { styles } from "./fine-trail.styles";

// ==========================================
// FINE TRAIL
// Who recorded, collected, refunded or cancelled a fine, and its evidence
// photos. Shown to the student, the recording Officer and Administrators;
// the server decides what each of them may change.
// ==========================================

function when(value: string | null | undefined) {
  if (!value) return "";

  const text = value.trim();
  const normalized = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text)
    ? text.replace(" ", "T") + "Z"
    : text;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function roleLabel(role: string | null | undefined) {
  if (role === "ADMIN") return "Administrator";
  if (role === "FINES_OFFICER") return "Fines Officer";
  if (role === "STUDENT") return "Student";
  return "";
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = `${parts[0]?.[0] || ""}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`;

  return letters.toUpperCase() || "?";
}

function Avatar({ person, symbol }: { person: TrailPerson | null; symbol?: string }) {
  const [failed, setFailed] = useState(false);

  if (!person) {
    return (
      <View style={[styles.avatar, styles.avatarSystem]}>
        <Text style={[styles.avatarText, styles.avatarSystemText]}>
          {symbol || "?"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.avatar}>
      {person.pictureUri && !failed ? (
        <Image
          source={serverImage(person.pictureUri)}
          style={styles.avatarImage}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={styles.avatarText}>{initials(person.name)}</Text>
      )}
    </View>
  );
}

function PersonRow({
  label,
  person,
  fallbackName,
  detail,
  symbol,
}: {
  label: string;
  person: TrailPerson | null;
  fallbackName?: string;
  detail?: string;
  symbol?: string;
}) {
  const name = person?.name || fallbackName || "Not recorded";
  const role = roleLabel(person?.role);
  const line = [role, detail].filter(Boolean).join(" · ");

  return (
    <View
      style={styles.personRow}
      accessible
      accessibilityLabel={`${label}: ${name}${line ? `, ${line}` : ""}`}
    >
      <Avatar person={person} symbol={symbol} />

      <View style={styles.personText}>
        <Text style={styles.personLabel}>{label}</Text>
        <Text style={styles.personName} numberOfLines={2}>
          {name}
        </Text>
        {!!line && <Text style={styles.personDetail}>{line}</Text>}
      </View>
    </View>
  );
}

function Thumb({
  item,
  index,
  total,
  onOpen,
  onRemove,
  busy,
}: {
  item: TrailEvidence;
  index: number;
  total: number;
  onOpen: () => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <View style={styles.thumb}>
      <TouchableOpacity
        style={styles.thumbImage}
        onPress={onOpen}
        accessibilityRole="imagebutton"
        accessibilityLabel={`Evidence photo ${index + 1} of ${total}${
          item.uploadedBy ? `, added by ${item.uploadedBy.name}` : ""
        }. Opens the photo.`}
      >
        {failed ? (
          <View style={styles.thumbFailed}>
            <Text style={styles.thumbFailedText}>Photo did not load</Text>
          </View>
        ) : (
          <Image
            source={serverImage(item.url)}
            style={styles.thumbImage}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        )}
      </TouchableOpacity>

      {item.canRemove && (
        <TouchableOpacity
          style={[styles.removeBadge, busy && styles.disabled]}
          onPress={onRemove}
          disabled={busy}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove evidence photo ${index + 1}`}
        >
          <Text style={styles.removeBadgeText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PhotoViewer({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: TrailEvidence[];
  index: number | null;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const shown = index === null ? null : photos[index];

  return (
    <Modal
      visible={shown !== null && shown !== undefined}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {shown && index !== null && (
        <View style={styles.viewer} accessibilityViewIsModal>
          <View style={styles.viewerTop}>
            <Text style={styles.viewerCount}>
              Evidence {index + 1} of {photos.length}
            </Text>

            <TouchableOpacity
              style={styles.viewerClose}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close photo"
            >
              <Text style={styles.viewerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          <Image
            source={serverImage(shown.url)}
            style={styles.viewerImage}
            resizeMode="contain"
            accessibilityLabel={`Evidence photo ${index + 1}`}
          />

          <Text style={styles.viewerCaption}>
            {shown.uploadedBy
              ? `Added by ${shown.uploadedBy.name}${
                  roleLabel(shown.uploadedBy.role)
                    ? ` (${roleLabel(shown.uploadedBy.role)})`
                    : ""
                }`
              : "Added by an unknown account"}
            {when(shown.uploadedAt) ? ` · ${when(shown.uploadedAt)}` : ""}
          </Text>

          {photos.length > 1 && (
            <View style={styles.viewerNav}>
              <TouchableOpacity
                style={[styles.viewerNavButton, index === 0 && styles.disabled]}
                onPress={() => onIndex(index - 1)}
                disabled={index === 0}
                accessibilityRole="button"
              >
                <Text style={styles.viewerNavText}>‹ Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.viewerNavButton,
                  index === photos.length - 1 && styles.disabled,
                ]}
                onPress={() => onIndex(index + 1)}
                disabled={index === photos.length - 1}
                accessibilityRole="button"
              >
                <Text style={styles.viewerNavText}>Next ›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </Modal>
  );
}

export function FineTrail({ fineId }: { fineId: number }) {
  const runLocked = useActionLock();

  const [trail, setTrail] = useState<FineTrailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<TrailEvidence | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const requestRef = useRef<AbortController | null>(null);

  // `silent` is a live update: keep what is on screen if it fails.
  const load = useCallback(
    async (silent = false) => {
      requestRef.current?.abort();

      const controller = new AbortController();
      requestRef.current = controller;

      if (!silent) {
        setLoading(true);
        setLoadError("");
      }

      try {
        const next = await loadFineTrail(fineId, controller.signal);

        if (requestRef.current === controller) {
          setTrail(next);
          setLoadError("");
        }
      } catch (caught) {
        if (requestRef.current !== controller || controller.signal.aborted || silent) {
          return;
        }

        setLoadError(
          caught instanceof Error ? caught.message : "Could not load this fine's record.",
        );
      } finally {
        if (requestRef.current === controller) {
          setLoading(false);
        }
      }
    },
    [fineId],
  );

  useEffect(() => {
    setTrail(null);
    setActionError("");
    setConfirmRemove(null);
    setViewerIndex(null);
    void load();

    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [load]);

  // A payment, cancellation or photo added elsewhere shows here at once.
  useLiveReload(["fines", "payments", "refunds"], () => load(true));

  const addPhotos = (source: "camera" | "library") =>
    runLocked(async () => {
      if (!trail) return;

      setActionError("");
      setConfirmRemove(null);

      try {
        const room = trail.maxEvidence - trail.evidence.length;
        const photos = await pickEvidencePhotos(source, room);

        for (let index = 0; index < photos.length; index += 1) {
          setBusy(
            photos.length > 1
              ? `Uploading photo ${index + 1} of ${photos.length}…`
              : "Uploading photo…",
          );

          try {
            setTrail(await uploadEvidencePhoto(fineId, photos[index]));
          } catch (caught) {
            throw new Error(
              `${photos.length > 1 ? `Photo ${index + 1} did not upload. ` : ""}${
                caught instanceof Error ? caught.message : "Please try again."
              }`,
            );
          }
        }

        if (photos.length) haptics.success();
      } catch (caught) {
        haptics.warning();
        setActionError(
          caught instanceof Error ? caught.message : "The photo could not be added.",
        );
        void load(true);
      } finally {
        setBusy("");
      }
    });

  const removePhoto = (item: TrailEvidence) =>
    runLocked(async () => {
      setActionError("");
      setBusy("Removing photo…");

      try {
        setTrail(await removeEvidencePhoto(fineId, item.id));
        setConfirmRemove(null);
        setViewerIndex(null);
        haptics.success();
      } catch (caught) {
        haptics.warning();
        setActionError(
          caught instanceof Error ? caught.message : "The photo could not be removed.",
        );
        void load(true);
      } finally {
        setBusy("");
      }
    });

  if (loading && !trail) {
    return (
      <SkeletonGroup label="Loading who handled this fine" style={styles.wrap}>
        <View style={styles.section}>
          {[0, 1].map((row) => (
            <View key={row} style={styles.skeletonRow}>
              <Skeleton width={36} height={36} radius={18} />
              <View style={styles.skeletonText}>
                <Skeleton width="35%" height={9} />
                <Skeleton width="65%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </SkeletonGroup>
    );
  }

  if (!trail) {
    return (
      <View style={[styles.wrap, styles.section]}>
        <Text style={styles.error}>{loadError || "Could not load this fine's record."}</Text>
        <TouchableOpacity onPress={() => void load()} accessibilityRole="button">
          <Text style={styles.retry}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { collected, refunded, cancelled, evidence } = trail;
  const working = busy !== "";

  return (
    <View style={styles.wrap}>
      {/* WHO HANDLED THIS FINE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Handled by
        </Text>

        <PersonRow
          label="Recorded by"
          person={trail.recorded.by}
          detail={when(trail.recorded.at)}
        />

        {collected &&
          (collected.method === "GCASH" ? (
            <PersonRow
              label="Paid with GCash"
              person={null}
              symbol="₱"
              fallbackName="Confirmed by PayMongo"
              detail={when(collected.at)}
            />
          ) : collected.by ? (
            <PersonRow
              label="Cash received by"
              person={collected.by}
              detail={["Cash", when(collected.at)].filter(Boolean).join(" · ")}
            />
          ) : (
            <PersonRow
              label="Marked paid"
              person={null}
              symbol="₱"
              fallbackName="No collector recorded"
              detail={when(collected.at)}
            />
          ))}

        {refunded && (
          <PersonRow
            label="Refund approved by"
            person={refunded.by}
            detail={[
              refunded.method === "GCASH" ? "GCash refund" : "Cash refund",
              when(refunded.at),
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        )}

        {cancelled && (
          <>
            <PersonRow
              label="Cancelled by"
              person={cancelled.by}
              detail={when(cancelled.at)}
            />
            <Text style={styles.reason}>
              Reason: {cancelled.reason || "No reason was given."}
            </Text>
          </>
        )}
      </View>

      {/* EVIDENCE PHOTOS */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Evidence photos
          </Text>
          {evidence.length > 0 && (
            <Text style={styles.sectionCount}>
              {evidence.length} of {trail.maxEvidence}
            </Text>
          )}
        </View>

        {evidence.length > 0 ? (
          <View style={styles.thumbs}>
            {evidence.map((item, index) => (
              <Thumb
                key={item.id}
                item={item}
                index={index}
                total={evidence.length}
                busy={working}
                onOpen={() => setViewerIndex(index)}
                onRemove={() => {
                  haptics.selection();
                  setActionError("");
                  setConfirmRemove(item);
                }}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>No evidence photos were attached.</Text>
        )}

        {trail.removedEvidence.map((item) => (
          <Text key={item.id} style={styles.removedNote}>
            A photo was removed by {item.removedBy?.name || "an unknown account"}
            {when(item.removedAt) ? ` · ${when(item.removedAt)}` : ""}
          </Text>
        ))}

        {confirmRemove && (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>
              Remove this photo? Everyone who can see this fine will see that a
              photo was removed.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setConfirmRemove(null)}
                disabled={working}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Keep Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.dangerButton, working && styles.disabled]}
                onPress={() => void removePhoto(confirmRemove)}
                disabled={working}
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, styles.dangerButtonText]}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {working && (
          <View style={styles.busyRow} accessibilityLiveRegion="polite">
            <ActivityIndicator size="small" color={OFFICER.navy} />
            <Text style={styles.muted}>{busy}</Text>
          </View>
        )}

        {!!actionError && (
          <Text style={styles.error} accessibilityRole="alert">
            {actionError}
          </Text>
        )}

        {trail.canAddEvidence && !confirmRemove && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, working && styles.disabled]}
              onPress={() => void addPhotos("camera")}
              disabled={working}
              accessibilityRole="button"
              accessibilityLabel="Take an evidence photo"
            >
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, working && styles.disabled]}
              onPress={() => void addPhotos("library")}
              disabled={working}
              accessibilityRole="button"
              accessibilityLabel="Choose evidence photos from the gallery"
            >
              <Text style={styles.buttonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <PhotoViewer
        photos={evidence}
        index={viewerIndex}
        onIndex={setViewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
}
