import { MAX_PASSWORD_BYTES, passwordBytes } from "@/utils/validation";
import { StyleSheet, Text, View } from "react-native";

// ==========================================
// PASSWORD RULES
// A live checklist shown while someone creates a password: each rule turns
// green as it is met, and the last line shows whether the confirmation
// matches. The same rules the server enforces.
// ==========================================

export const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { key: "upper", label: "An uppercase letter (A-Z)", test: (value: string) => /[A-Z]/.test(value) },
  { key: "lower", label: "A lowercase letter (a-z)", test: (value: string) => /[a-z]/.test(value) },
  { key: "number", label: "A number (0-9)", test: (value: string) => /[0-9]/.test(value) },
  {
    key: "special",
    label: "A special character (! @ # $ % &)",
    test: (value: string) => /[^A-Za-z0-9\s]/.test(value),
  },
];

export function meetsPasswordRules(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value)) && passwordBytes(value) <= MAX_PASSWORD_BYTES;
}

type Tone = "light" | "dark";

const PALETTE = {
  light: { text: "#6B7689", met: "#238A35", bad: "#D32F2F", dot: "#CBD5E1", title: "#123266" },
  // For the navy sign-in screen.
  dark: { text: "#C9D4E8", met: "#7CE08A", bad: "#FF9B9B", dot: "rgba(255,255,255,0.35)", title: "#FFFFFF" },
};

export function PasswordRules({
  password,
  confirmPassword,
  tone = "light",
}: {
  password: string;
  // Leave out when there is no confirmation field.
  confirmPassword?: string;
  tone?: Tone;
}) {
  const colors = PALETTE[tone];

  const rows: { key: string; label: string; state: "met" | "unmet" | "bad" }[] = PASSWORD_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    state: rule.test(password) ? "met" : "unmet",
  }));

  // Shown only when the password is too long to be used.
  if (passwordBytes(password) > MAX_PASSWORD_BYTES) {
    rows.push({ key: "max", label: "No more than 72 characters", state: "bad" });
  }

  if (confirmPassword !== undefined) {
    rows.push({
      key: "match",
      label: confirmPassword.length > 0 && confirmPassword !== password ? "Passwords do not match" : "Both passwords match",
      state:
        confirmPassword.length === 0
          ? "unmet"
          : confirmPassword === password && password.length > 0
            ? "met"
            : "bad",
    });
  }

  return (
    <View style={styles.box} accessibilityLabel="Password requirements">
      <Text style={[styles.title, { color: colors.title }]}>Your password needs:</Text>

      {rows.map((row) => {
        const color = row.state === "met" ? colors.met : row.state === "bad" ? colors.bad : colors.text;

        return (
          <View
            key={row.key}
            style={styles.row}
            accessible
            accessibilityLabel={`${row.label}: ${row.state === "met" ? "done" : "not yet"}`}
          >
            <Text style={[styles.mark, { color: row.state === "unmet" ? colors.dot : color }]}>
              {row.state === "met" ? "✓" : row.state === "bad" ? "✕" : "○"}
            </Text>

            <Text style={[styles.label, { color }, row.state === "met" && styles.labelMet]}>{row.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "100%",
    gap: 4,
    marginTop: 10,
    marginBottom: 10,
  },

  title: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    marginBottom: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  mark: {
    width: 16,
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    textAlign: "center",
  },

  label: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },

  labelMet: {
    fontFamily: "Poppins_500Medium",
  },
});
