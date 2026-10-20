import AsyncStorage from "@react-native-async-storage/async-storage";
import { File as ExpoFile } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { API_BASE } from "@/constants/api";

// ==========================================
// FINE EVIDENCE PHOTOS
// ==========================================

// Matches the server: up to 3 photos per fine, 5 MB each.
export const EVIDENCE_MAX = 3;
export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;

// Phone photos are 3–8 MB at full quality; this keeps them near 1–2 MB, which
// uploads quickly through the tunnel and is still clear enough as evidence.
const PHOTO_QUALITY = 0.6;

const UPLOAD_TIMEOUT_MS = 45000;

export type EvidencePhoto = ImagePicker.ImagePickerAsset;

export type TrailPerson = {
  id: number;
  name: string;
  role: string | null;
  pictureUri: string | null;
};

export type TrailEvidence = {
  id: number;
  url: string;
  uploadedBy: TrailPerson | null;
  uploadedAt: string;
  canRemove: boolean;
};

export type FineTrailData = {
  fineId: number;
  recorded: { by: TrailPerson | null; at: string | null };
  collected: {
    by: TrailPerson | null;
    method: "CASH" | "GCASH" | null;
    reference: string | null;
    at: string | null;
  } | null;
  refunded: {
    by: TrailPerson | null;
    method: "CASH" | "GCASH";
    reference: string;
    at: string | null;
  } | null;
  cancelled: {
    by: TrailPerson | null;
    reason: string | null;
    at: string | null;
  } | null;
  evidence: TrailEvidence[];
  removedEvidence: {
    id: number;
    removedBy: TrailPerson | null;
    removedAt: string;
  }[];
  canAddEvidence: boolean;
  maxEvidence: number;
  locked: boolean;
};

// A server path (such as an evidence link or a profile picture) as a full
// address.
export function serverUrl(uri: string) {
  if (/^https?:\/\//i.test(uri)) return uri;

  return `${API_BASE.replace(/\/+$/, "")}/${uri.replace(/^\/+/, "")}`;
}

// An image source for a server picture. Phones go through ngrok, which needs
// this header to skip its warning page.
export function serverImage(uri: string) {
  return Platform.OS === "web"
    ? { uri: serverUrl(uri) }
    : {
        uri: serverUrl(uri),
        headers: { "ngrok-skip-browser-warning": "true" },
      };
}

async function authHeaders() {
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

async function readTrail(response: { status: number; text(): Promise<string> }) {
  const raw = await response.text();
  let body;

  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error(
      `Unexpected server response (HTTP ${response.status}). Restart the backend if it has not been updated.`,
    );
  }

  if (response.status >= 400 || !body?.success || !body.trail) {
    throw new Error(body?.message || "The request could not be completed.");
  }

  return body.trail as FineTrailData;
}

export async function loadFineTrail(fineId: number, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE}/api/fines/${fineId}/trail`, {
    headers: await authHeaders(),
    signal,
  });

  return readTrail(response);
}

export async function removeEvidencePhoto(fineId: number, evidenceId: number) {
  const response = await fetch(
    `${API_BASE}/api/fines/${fineId}/evidence/${evidenceId}`,
    { method: "DELETE", headers: await authHeaders() },
  );

  return readTrail(response);
}

// Asks for permission, then lets the user take one photo or choose up to
// `limit` from the gallery. Returns [] when the user backs out.
export async function pickEvidencePhotos(
  source: "camera" | "library",
  limit: number,
): Promise<EvidencePhoto[]> {
  if (limit <= 0) return [];

  if (Platform.OS !== "web") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error(
        source === "camera"
          ? "Please allow camera access in your phone settings to take evidence photos."
          : "Please allow photo access in your phone settings to attach evidence photos.",
      );
    }
  }

  // The photo is kept as taken (no cropping), so it stays a faithful record.
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: PHOTO_QUALITY,
          exif: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: PHOTO_QUALITY,
          allowsMultipleSelection: limit > 1,
          selectionLimit: limit,
          exif: false,
        });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  const photos = result.assets.slice(0, limit);

  if (photos.some((photo) => photo.fileSize && photo.fileSize > EVIDENCE_MAX_BYTES)) {
    throw new Error("Each evidence photo must be 5 MB or smaller.");
  }

  return photos;
}

function photoType(photo: EvidencePhoto) {
  const extension = (photo.fileName || photo.uri)
    .split(/[?#]/)[0]
    .split(".")
    .pop()
    ?.toLowerCase();

  const mime =
    photo.mimeType ||
    (extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "image/jpeg");

  const name = `evidence.${
    mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"
  }`;

  return { mime, name };
}

// Uploads one photo to a fine and returns the fine's updated record.
export async function uploadEvidencePhoto(fineId: number, photo: EvidencePhoto) {
  const headers = await authHeaders();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const { name } = photoType(photo);
    const form = new FormData();

    if (Platform.OS === "web") {
      let blob: Blob | undefined = photo.file;

      if (!blob) {
        const local = await fetch(photo.uri, { signal: controller.signal });
        blob = await local.blob();
      }

      form.append("photo", blob, name);
    } else {
      const file = new ExpoFile(photo.uri);

      if (!file.exists || file.size === 0) {
        throw new Error("The photo could not be read. Please take it again.");
      }

      form.append("photo", file, name);
    }

    const send = Platform.OS === "web" ? fetch : expoFetch;

    const response = await send(`${API_BASE}/api/fines/${fineId}/evidence`, {
      method: "POST",
      headers,
      body: form,
      signal: controller.signal,
    });

    return await readTrail(response);
  } catch (caught) {
    if (controller.signal.aborted) {
      throw new Error("The upload took too long. Check your connection and try again.");
    }

    throw caught;
  } finally {
    clearTimeout(timeout);
  }
}
