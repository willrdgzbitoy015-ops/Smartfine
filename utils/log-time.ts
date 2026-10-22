// "Oct 22, 2026, 2:00 AM" in the school's time zone, for times the server
// stores in UTC ("2026-10-22 02:00:00" or an ISO string).
export function formatLogTime(value: string) {
  const text = String(value || "").trim();
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)
    ? `${text.replace(" ", "T")}Z`
    : text;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return text;

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

// "340 KB" or "1.2 MB".
export function formatFileSize(bytes: number) {
  return bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
