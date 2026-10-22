import { MAX_PASSWORD_BYTES, PASSWORD_TOO_LONG_MESSAGE, passwordBytes } from "@/utils/validation";
import * as ImagePicker from "expo-image-picker";

import { API_BASE } from "@/constants/api";

// Same password policy as the server (auth.js validatePasswordPolicy).
export function validatePassword(password: string): string | null {
  if (passwordBytes(password) > MAX_PASSWORD_BYTES) {
    return PASSWORD_TOO_LONG_MESSAGE;
  }

  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }

  if (!/[^A-Za-z0-9\s]/.test(password)) {
    return "Password must contain at least one special character.";
  }

  return null;
}

// Saved pictures are stored as /uploads/... paths on the server.
export function pictureUrl(uri: string | null | undefined): string | null {
  if (!uri) {
    return null;
  }

  const normalized = uri.trim();

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `${API_BASE.replace(/\/+$/, "")}/${normalized.replace(/^\/+/, "")}`;
}

export function imageExtension(asset: ImagePicker.ImagePickerAsset): string {
  const match = (asset.fileName || "")
    .toLowerCase()
    .match(/\.(jpg|jpeg|png|webp)$/);

  if (match?.[1]) {
    return match[1] === "jpeg" ? "jpg" : match[1];
  }

  const mime = String(asset.mimeType || "").toLowerCase();

  if (mime.includes("png")) {
    return "png";
  }

  if (mime.includes("webp")) {
    return "webp";
  }

  return "jpg";
}

export function imageMimeType(
  asset: ImagePicker.ImagePickerAsset,
  extension: string,
): string {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return "image/jpeg";
}
