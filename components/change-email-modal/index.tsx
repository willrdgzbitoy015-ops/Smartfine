import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { PopIn } from "@/components/motion";
import { SuccessCheck } from "@/components/success-check";
import { API_BASE } from "@/constants/api";
import { apiFetch } from "@/utils/api-fetch";
import { haptics } from "@/utils/haptics";

import { styles } from "./change-email-modal.styles";

// ==========================================
// CHANGE EMAIL
// Step 1: the new email and the current password.
// Step 2: the 6-digit code sent to the NEW address.
// The address is only changed after the code is entered.
// ==========================================

type Step = "form" | "code" | "done";

type Challenge = {
  challengeId: string;
  maskedEmail: string;
};

// Answers that end the request: the person has to start again.
const START_OVER = ["TOO_MANY_ATTEMPTS", "INVALID_CHALLENGE", "TOO_MANY_CODES"];

async function post(path: string, body: Record<string, unknown>) {
  const response = await apiFetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!data) {
    return {
      ok: false,
      data: {
        success: false,
        message: "The server sent an unexpected answer. Please try again.",
      } as Record<string, any>,
    };
  }

  return { ok: response.ok && data.success !== false, data: data as Record<string, any> };
}

export function ChangeEmailModal({
  visible,
  currentEmail,
  onClose,
  onChanged,
}: {
  visible: boolean;
  currentEmail: string;
  onClose: () => void;
  // Called with the new address once it is saved.
  onChanged: (email: string) => void;
}) {
  const [step, setStep] = useState<Step>("form");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [focused, setFocused] = useState("");

  const busyRef = useRef(false);

  // Starts clean every time the pop-up opens.
  useEffect(() => {
    if (visible) {
      setStep("form");
      setNewEmail("");
      setPassword("");
      setShowPassword(false);
      setChallenge(null);
      setCode("");
      setCountdown(0);
      setError("");
      setSavedEmail("");
    }
  }, [visible]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => setCountdown((current) => Math.max(0, current - 1)), 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // One request at a time.
  const run = async (work: () => Promise<void>) => {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setError("");

    try {
      await work();
    } catch {
      haptics.error();
      setError("Could not reach the SmartFine server. Please check your connection.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const fail = (data: Record<string, any>) => {
    haptics.error();

    if (typeof data.retryAfterSeconds === "number") {
      setCountdown(data.retryAfterSeconds);
    }

    // The request is over: back to the first step with the reason shown.
    if (START_OVER.includes(String(data.code))) {
      setStep("form");
      setChallenge(null);
      setCode("");
      setPassword("");
    }

    setError(data.message || "Something went wrong. Please try again.");
  };

  const requestCode = () =>
    run(async () => {
      const email = newEmail.trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }

      if (!password) {
        setError("Please enter your current password.");
        return;
      }

      const { ok, data } = await post("/api/account/email/request", {
        newEmail: email,
        currentPassword: password,
      });

      if (!ok) return fail(data);

      setChallenge({ challengeId: String(data.challengeId), maskedEmail: String(data.maskedEmail || email) });
      setCountdown(Number(data.resendAfterSeconds || 60));
      setCode("");
      setPassword("");
      setStep("code");
    });

  const confirmCode = () =>
    run(async () => {
      if (!challenge) return;

      if (!/^\d{6}$/.test(code)) {
        setError("Please enter the 6-digit code.");
        return;
      }

      const { ok, data } = await post("/api/account/email/verify", {
        challengeId: challenge.challengeId,
        code,
      });

      if (!ok) {
        setCode("");
        return fail(data);
      }

      const saved = String(data.email || newEmail.trim());

      // The app remembers the signed-in address; keep it current.
      await AsyncStorage.setItem("userEmail", saved).catch(() => undefined);

      haptics.success();
      setSavedEmail(saved);
      setStep("done");
      onChanged(saved);
    });

  const resendCode = () =>
    run(async () => {
      if (!challenge || countdown > 0) return;

      const { ok, data } = await post("/api/account/email/resend", {
        challengeId: challenge.challengeId,
      });

      if (!ok) return fail(data);

      setCountdown(Number(data.resendAfterSeconds || 60));
      setCode("");
    });

  const close = () => {
    if (!busyRef.current) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.overlay}>
          <PopIn style={styles.card} accessibilityViewIsModal>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {step === "form" && (
                <>
                  <Text style={styles.title} accessibilityRole="header">
                    Change Email
                  </Text>

                  <Text style={styles.intro}>
                    Your email is {currentEmail ? <Text style={styles.strong}>{currentEmail}</Text> : "not set"}.
                    We will send a code to your new address to confirm it.
                  </Text>

                  <Text style={styles.label}>New email</Text>
                  <View style={[styles.fieldRow, focused === "email" && styles.fieldRowFocused]}>
                    <TextInput
                      style={styles.input}
                      value={newEmail}
                      onChangeText={(value) => {
                        setNewEmail(value);
                        setError("");
                      }}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused("")}
                      placeholder="name@example.com"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      editable={!busy}
                      accessibilityLabel="New email address"
                    />
                  </View>

                  <Text style={styles.label}>Current password</Text>
                  <View style={[styles.fieldRow, focused === "password" && styles.fieldRowFocused]}>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        setError("");
                      }}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused("")}
                      placeholder="Enter your current password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                      onSubmitEditing={() => void requestCode()}
                      accessibilityLabel="Current password"
                    />
                    <TouchableOpacity
                      style={styles.showButton}
                      onPress={() => setShowPassword((current) => !current)}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                    >
                      <Text style={styles.showText}>{showPassword ? "Hide" : "Show"}</Text>
                    </TouchableOpacity>
                  </View>

                  {!!error && (
                    <Text style={styles.error} accessibilityRole="alert">
                      {error}
                    </Text>
                  )}

                  <View style={styles.buttons}>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonOutline, busy && styles.disabled]}
                      onPress={close}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.buttonText, styles.buttonOutlineText]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, busy && styles.disabled]}
                      onPress={() => void requestCode()}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>Send Code</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {step === "code" && challenge && (
                <>
                  <Text style={styles.title} accessibilityRole="header">
                    Check Your Email
                  </Text>

                  <Text style={styles.intro}>
                    Enter the 6-digit code we sent to{" "}
                    <Text style={styles.strong}>{challenge.maskedEmail}</Text>. It works once and
                    expires in 10 minutes.
                  </Text>

                  <TextInput
                    style={styles.codeInput}
                    value={code}
                    onChangeText={(value) => {
                      setCode(value.replace(/\D/g, "").slice(0, 6));
                      setError("");
                    }}
                    placeholder="000000"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="sms-otp"
                    editable={!busy}
                    onSubmitEditing={() => void confirmCode()}
                    accessibilityLabel="6-digit verification code"
                  />

                  {!!error && (
                    <Text style={styles.error} accessibilityRole="alert">
                      {error}
                    </Text>
                  )}

                  <View style={styles.resendRow}>
                    <TouchableOpacity
                      onPress={() => void resendCode()}
                      disabled={busy || countdown > 0}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
                        {countdown > 0 ? `Send a new code (${countdown}s)` : "Send a new code"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.buttons}>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonOutline, busy && styles.disabled]}
                      onPress={() => {
                        setStep("form");
                        setError("");
                      }}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.buttonText, styles.buttonOutlineText]}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, (busy || code.length !== 6) && styles.disabled]}
                      onPress={() => void confirmCode()}
                      disabled={busy || code.length !== 6}
                      accessibilityRole="button"
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>Confirm</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {step === "done" && (
                <>
                  <SuccessCheck delay={80} />

                  <Text style={[styles.title, styles.centered]}>Email Changed</Text>

                  <Text style={[styles.intro, styles.centered]}>
                    Your email is now <Text style={styles.strong}>{savedEmail}</Text>. You can use it
                    to sign in.
                  </Text>

                  <TouchableOpacity style={styles.button} onPress={onClose} accessibilityRole="button">
                    <Text style={styles.buttonText}>Done</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </PopIn>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
