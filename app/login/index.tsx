import { MAX_PASSWORD_BYTES, PASSWORD_TOO_LONG_MESSAGE, passwordBytes } from "@/utils/validation";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SvgXml } from "react-native-svg";

import { PasswordRules } from "@/components/password-rules";

import { FadeIn, useShake, useSwitchFade } from "@/components/motion";
import { SuccessCheck } from "@/components/success-check";
import { API_BASE } from "@/constants/api";
import { useFieldFocus } from "@/hooks/use-field-focus";
import { haptics } from "@/utils/haptics";
import { NOTICE_KEY, beginSession } from "@/utils/session-guard";

// ==========================================
// TYPES
// ==========================================

type ScreenMode = "login" | "forgot" | "verify" | "reset" | "success";

// ==========================================
// LOGIN SCREEN
// ==========================================

export default function LoginScreen() {
  const router = useRouter();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // ==========================================
  // INPUT REFERENCES
  // ==========================================

  const usernameRef = useRef<TextInput | null>(null);

  const passwordRef = useRef<TextInput | null>(null);

  const resetIdentifierRef = useRef<TextInput | null>(null);

  const newPasswordRef = useRef<TextInput | null>(null);

  const confirmPasswordRef = useRef<TextInput | null>(null);

  const otpRefs = useRef<Array<TextInput | null>>([]);

  // ==========================================
  // CURRENT SCREEN
  // ==========================================

  const [screenMode, setScreenMode] = useState<ScreenMode>("login");

  // ==========================================
  // LOGIN FORM
  // ==========================================

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // Highlights the sign-in field being typed in.
  const { focused: focusedField, bind: bindFocus } = useFieldFocus<
    "username" | "password"
  >();

  const [rememberMe, setRememberMe] = useState(false);

  // ==========================================
  // LOGIN LOCKOUT
  // ==========================================

  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // After a lockout, sign-in also needs a CAPTCHA (a picture the server draws).
  const [captchaRequired, setCaptchaRequired] = useState(false);

  const [captcha, setCaptcha] = useState<{
    captchaId: string;
    svg: string;
  } | null>(null);

  const [captchaAnswer, setCaptchaAnswer] = useState("");

  // Why the last session ended ("idle" or "ended"), shown once.
  const [signedOutNotice, setSignedOutNotice] = useState("");

  const [lockedUsername, setLockedUsername] = useState("");

  // ==========================================
  // PASSWORD RESET
  // ==========================================

  const [resetIdentifier, setResetIdentifier] = useState("");

  const [challengeId, setChallengeId] = useState("");

  const [maskedEmail, setMaskedEmail] = useState("");

  const [verificationCode, setVerificationCode] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resendCountdown, setResendCountdown] = useState(0);

  // "reset" is Forgot Password; "firstLogin" is a new account verifying its
  // email and choosing its own password. Both use the same code and password
  // steps.
  const [flow, setFlow] = useState<"reset" | "firstLogin">("reset");

  // "Set up your account" is the same email-code steps as Forgot Password,
  // worded for someone who has never signed in (an imported student).
  const [setupMode, setSetupMode] = useState(false);

  const [stepToken, setStepToken] = useState("");

  // ==========================================
  // LOADING
  // ==========================================

  const [loading, setLoading] = useState(false);

  // ==========================================
  // ERROR
  // ==========================================

  const [errorTitle, setErrorTitle] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [errorPersistent, setErrorPersistent] = useState(false);

  const [errorHideDelay, setErrorHideDelay] = useState(5000);

  // ==========================================
  // CURRENT LOCK STATE
  // ==========================================

  const currentUsername = username.trim().toLowerCase();

  const isCurrentAccountLocked =
    lockoutSeconds > 0 &&
    Boolean(lockedUsername) &&
    currentUsername === lockedUsername.toLowerCase();

  // ==========================================
  // ERROR SHAKE AND STEP FADE
  // ==========================================

  // A rejected login shakes the card; each step (login, forgot,
  // verify, reset, success) fades in when it opens.
  const { shake, shakeStyle } = useShake();

  const modeFade = useSwitchFade(screenMode);

  // ==========================================
  // SHOW ERROR
  // ==========================================

  const showError = (
    title: string,
    message: string,
    options?: {
      persistent?: boolean;
      hideAfter?: number;
    },
  ) => {
    haptics.error();

    shake();

    setErrorTitle(title);

    setErrorMessage(message);

    setErrorPersistent(Boolean(options?.persistent));

    setErrorHideDelay(options?.hideAfter ?? 5000);
  };

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError = () => {
    setErrorTitle("");

    setErrorMessage("");

    setErrorPersistent(false);

    setErrorHideDelay(5000);
  };

  // ==========================================
  // AUTO-HIDE TRANSIENT ERROR
  // ==========================================

  useEffect(() => {
    if (!errorMessage || errorPersistent) {
      return;
    }

    const timer = setTimeout(() => {
      clearError();
    }, errorHideDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [errorMessage, errorPersistent, errorHideDelay]);

  // ==========================================
  // LOGIN LOCKOUT COUNTDOWN
  // ==========================================

  useEffect(() => {
    if (lockoutSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setLockoutSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [lockoutSeconds]);

  // ==========================================
  // KEEP LOCKOUT ERROR VISIBLE
  // ==========================================

  useEffect(() => {
    if (isCurrentAccountLocked) {
      setErrorTitle("Account Temporarily Locked");

      setErrorMessage(
        "Too many failed login attempts. This account is temporarily locked.",
      );

      setErrorPersistent(true);

      return;
    }

    if (
      errorTitle === "Account Temporarily Locked" &&
      !isCurrentAccountLocked
    ) {
      clearError();
    }
  }, [username, lockoutSeconds, lockedUsername]);

  // ==========================================
  // OPENING THE APP: NOTICE AND REMEMBERED LOCKOUT
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const [notice, lockedIdentifier] = await Promise.all([
          AsyncStorage.getItem(NOTICE_KEY),
          AsyncStorage.getItem("lockedIdentifier"),
        ]);

        if (cancelled) return;

        if (notice === "idle") {
          setSignedOutNotice("You were signed out after 15 minutes of inactivity. Please sign in again.");
        } else if (notice === "ended") {
          setSignedOutNotice("You were signed out. Please sign in again.");
        } else if (notice === "restored") {
          setSignedOutNotice("SmartFine's data was restored from a backup. Please sign in again.");
        }

        if (notice) {
          await AsyncStorage.removeItem(NOTICE_KEY);
        }

        // A lockout lasts on the server; show its timer again.
        if (lockedIdentifier) {
          setUsername(lockedIdentifier);

          await checkLoginStatus(lockedIdentifier);
        }
      } catch {
        // Nothing to restore.
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // LOCKOUT FINISHED
  // ==========================================

  useEffect(() => {
    if (lockoutSeconds !== 0 || !lockedUsername) {
      return;
    }

    setLockedUsername("");

    AsyncStorage.removeItem("lockedIdentifier").catch(() => undefined);

    if (captchaRequired) {
      void loadCaptcha();
    }

    if (errorTitle === "Account Temporarily Locked") {
      clearError();
    }

    const timer = setTimeout(() => {
      passwordRef.current?.focus();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [lockoutSeconds, lockedUsername]);

  // ==========================================
  // RESEND COUNTDOWN
  // ==========================================

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [resendCountdown]);

  // ==========================================
  // COUNTDOWN FORMAT
  // ==========================================

  const formatLockoutTime = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));

    const minutes = Math.floor(safeSeconds / 60);

    const seconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  };

  // ==========================================
  // CAPTCHA AND LOCKOUT STATUS
  // ==========================================

  const loadCaptcha = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/captcha`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      const data = await response.json();

      if (response.ok && data?.captchaId && data?.svg) {
        setCaptcha({ captchaId: data.captchaId, svg: data.svg });

        setCaptchaAnswer("");
      }
    } catch {
      // The next sign-in answer brings a CAPTCHA too.
    }
  };

  // Asks the server whether this account is locked or needs a CAPTCHA, so the
  // timer and the picture come back after a refresh or reopening the app.
  const checkLoginStatus = async (identifier: string) => {
    const typed = identifier.trim();

    if (!typed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/login-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ identifier: typed }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        return;
      }

      if (data.locked && !data.lockedByAdmin && Number(data.retryAfterSeconds) > 0) {
        setLockedUsername(typed);

        setLockoutSeconds(Number(data.retryAfterSeconds));
      }

      setCaptchaRequired(Boolean(data.captchaRequired));

      if (data.captcha?.captchaId && data.captcha?.svg) {
        setCaptcha({ captchaId: data.captcha.captchaId, svg: data.captcha.svg });
      }
    } catch {
      // Offline: signing in will say so.
    }
  };

  // ==========================================
  // SAFE API RESPONSE
  // ==========================================

  const readApiResponse = async (response: Response) => {
    const rawText = await response.text();

    if (!rawText.trim()) {
      return {
        success: false,

        code: "EMPTY_RESPONSE",

        message: "The SmartFine server returned an empty response.",
      };
    }

    try {
      return JSON.parse(rawText);
    } catch (error) {
      console.error("SmartFine API returned invalid JSON:", error);

      console.error("Status:", response.status);

      console.error("Raw response:", rawText);

      return {
        success: false,

        code: "INVALID_SERVER_RESPONSE",

        message:
          "The SmartFine server returned an unexpected response. Please check the backend connection.",
      };
    }
  };

  // ==========================================
  // SAVE LOGIN SESSION
  // ==========================================

  const saveLoginSession = async (data: any) => {
    if (!data.token) {
      throw new Error("LOGIN_TOKEN_MISSING");
    }

    if (!data.user) {
      throw new Error("LOGIN_USER_MISSING");
    }

    const userEmail = String(data.user.email || data.user.username || "");

    const userId = String(data.user.id);

    const userRole = String(data.user.role);

    await AsyncStorage.multiSet([
      ["token", String(data.token)],

      ["userEmail", userEmail],

      ["userId", userId],

      ["userRole", userRole],
    ]);

    // Starts watching for inactivity with the limits the server gave.
    await beginSession(data.session);

    console.log("Login session saved.");

    console.log("Saved user ID:", userId);

    console.log("Saved role:", userRole);
  };

  // ==========================================
  // LOGIN
  // ==========================================

  // Everything after a successful sign-in: remember the session and open the
  // person's own dashboard. Also used when a new account finishes setup.
  const completeSignIn = async (data: any) => {
    if (!data.user || !data.user.role) {
      showError(
        "Login Error",

        "The server did not return a valid user role.",

        {
          hideAfter: 1000,
        },
      );

      return;
    }

    if (!data.token) {
      showError(
        "Login Error",

        "The server did not return a valid login token.",

        {
          hideAfter: 1000,
        },
      );

      return;
    }

    // ====================================
    // LOGIN SUCCESS
    // ====================================

    clearError();

    setLockoutSeconds(0);

    setLockedUsername("");

    setCaptchaRequired(false);

    setCaptcha(null);

    setCaptchaAnswer("");

    AsyncStorage.removeItem("lockedIdentifier").catch(() => undefined);

    await saveLoginSession(data);

    const role = String(data.user.role).toUpperCase();

    haptics.success();

    // ====================================
    // ROLE REDIRECTION
    // ====================================

    // Screens from a previous sign-in must not stay open underneath.
    if (router.canDismiss()) {
      router.dismissAll();
    }

    if (role === "ADMIN") {
      router.replace("/admin/dashboard");
    } else if (role === "FINES_OFFICER") {
      router.replace("/officer/dashboard");
    } else if (role === "STUDENT") {
      router.replace("/student/dashboard");
    } else {
      await AsyncStorage.multiRemove([
        "token",
        "userEmail",
        "userId",
        "userRole",
      ]);

      showError(
        "Login Error",

        `Unknown user role: ${role}`,

        {
          hideAfter: 1000,
        },
      );
    }
  };

  // A new account has no session yet: show the code step.
  const startFirstLogin = (data: any) => {
    clearError();

    setPassword("");

    setFlow("firstLogin");

    setChallengeId(String(data.challengeId || ""));

    setMaskedEmail(String(data.maskedEmail || ""));

    setVerificationCode(["", "", "", "", "", ""]);

    setStepToken("");

    setResendCountdown(Number(data.resendAfterSeconds || 60));

    setScreenMode("verify");

    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 300);
  };

  const handleLogin = async () => {
    // ======================================
    // LOCAL LOCK CHECK
    // ======================================

    if (isCurrentAccountLocked) {
      showError(
        "Account Temporarily Locked",

        "Too many failed login attempts. This account is temporarily locked.",

        {
          persistent: true,
        },
      );

      return;
    }

    clearError();

    // ======================================
    // REQUIRED FIELDS
    // ======================================

    if (!username.trim() || !password.trim()) {
      showError(
        "Missing Information",

        "Please enter your username or email and your password.",

        {
          hideAfter: 1000,
        },
      );

      return;
    }

    if (captchaRequired && captcha && !captchaAnswer.trim()) {
      showError(
        "Verification",

        "Please type the characters in the picture.",

        {
          hideAfter: 3000,
        },
      );

      return;
    }

    const loginUrl = `${API_BASE}/api/auth/login`;

    try {
      setLoading(true);

      console.log("==========================================");

      console.log("SMARTFINE LOGIN REQUEST");

      console.log("==========================================");

      console.log("Platform:", Platform.OS);

      console.log("API base:", API_BASE);

      console.log("Login API URL:", loginUrl);

      console.log("Username:", username.trim());

      const response = await fetch(
        loginUrl,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Accept: "application/json",
          },

          body: JSON.stringify({
            username: username.trim(),

            password,

            ...(captcha && captchaRequired
              ? { captchaId: captcha.captchaId, captchaAnswer: captchaAnswer.trim() }
              : {}),
          }),
        },
      );

      const data = await readApiResponse(response);

      console.log("Login response:", data);

      // ====================================
      // LOGIN FAILED
      // ====================================

      // The server hands out the next CAPTCHA with its answer.
      if (data.captchaRequired) {
        setCaptchaRequired(true);
      }

      if (data.captcha?.captchaId && data.captcha?.svg) {
        setCaptcha({ captchaId: data.captcha.captchaId, svg: data.captcha.svg });

        setCaptchaAnswer("");
      }

      if (!response.ok || !data.success) {
        // ================================
        // CAPTCHA
        // ================================

        if (data.code === "CAPTCHA_REQUIRED" || data.code === "CAPTCHA_INVALID") {
          showError(
            "Verification",

            data.message || "Please type the characters in the picture.",

            {
              hideAfter: 4000,
            },
          );

          return;
        }

        // ================================
        // INVALID CREDENTIALS
        // ================================

        if (data.code === "INVALID_CREDENTIALS") {
          let message = "The username/email or password is incorrect.";

          if (typeof data.attemptsRemaining === "number") {
            const attemptWord =
              data.attemptsRemaining === 1 ? "attempt" : "attempts";

            message += `\n${data.attemptsRemaining} ${attemptWord} remaining.`;
          }

          showError(
            "Incorrect Login",

            message,

            {
              hideAfter: 1000,
            },
          );

          setPassword("");

          setTimeout(() => {
            passwordRef.current?.focus();
          }, 100);

          return;
        }

        // ================================
        // ACCOUNT LOCKED
        // ================================

        if (data.code === "ACCOUNT_LOCKED") {
          const seconds = Math.max(1, Number(data.retryAfterSeconds || 30));

          setLockedUsername(username.trim());

          setLockoutSeconds(seconds);

          AsyncStorage.setItem("lockedIdentifier", username.trim()).catch(() => undefined);

          // The next attempt after the timer needs a CAPTCHA.
          setCaptcha(null);

          showError(
            "Account Temporarily Locked",

            "Too many failed login attempts. This account is temporarily locked.",

            {
              persistent: true,
            },
          );

          setPassword("");

          return;
        }

        // ================================
        // LOCKED BY AN ADMINISTRATOR
        // ================================

        if (data.code === "ACCOUNT_LOCKED_BY_ADMIN") {
          showError(
            "Account Locked",

            data.message ||
              "This account has been locked by an administrator. Please contact the SmartFine administrator.",

            {
              persistent: true,
            },
          );

          setPassword("");

          return;
        }

        // ================================
        // DEACTIVATED
        // ================================

        if (data.code === "ACCOUNT_DEACTIVATED") {
          showError(
            "Account Deactivated",

            data.message ||
              "This account has been deactivated. Please contact the SmartFine administrator.",

            {
              hideAfter: 1000,
            },
          );

          setPassword("");

          return;
        }

        // ================================
        // UNAVAILABLE
        // ================================

        if (data.code === "ACCOUNT_UNAVAILABLE") {
          showError(
            "Account Unavailable",

            data.message ||
              "This account is currently unavailable. Please contact the SmartFine administrator.",

            {
              hideAfter: 1000,
            },
          );

          setPassword("");

          return;
        }

        // ================================
        // MISSING CREDENTIALS
        // ================================

        if (data.code === "MISSING_CREDENTIALS") {
          showError(
            "Missing Information",

            data.message || "Username and password are required.",

            {
              hideAfter: 1000,
            },
          );

          return;
        }

        showError(
          "Login Failed",

          data.message || "Unable to log in. Please try again.",

          {
            hideAfter: 1000,
          },
        );

        return;
      }

      // ====================================
      // NEW ACCOUNT: VERIFY THE EMAIL FIRST
      // ====================================

      if (data.requiresVerification) {
        startFirstLogin(data);

        return;
      }

      await completeSignIn(data);
    } catch (error) {
      console.error("SMARTFINE LOGIN CONNECTION ERROR:", error);

      showError(
        "Connection Error",

        "Could not connect to the SmartFine server. Please check your backend server, network connection, and ngrok tunnel.",

        {
          hideAfter: 1000,
        },
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // OPEN FORGOT PASSWORD
  // ==========================================

  const handleOpenSetup = () => {
    setSetupMode(true);

    handleOpenForgotPassword();
  };

  const handleOpenForgotPassword = () => {
    clearError();

    setResetIdentifier(username.trim());

    setScreenMode("forgot");

    setTimeout(() => {
      resetIdentifierRef.current?.focus();
    }, 250);
  };

  // ==========================================
  // REQUEST VERIFICATION CODE
  // ==========================================

  const handleRequestReset = async () => {
    clearError();

    if (!resetIdentifier.trim()) {
      showError(
        "Missing Information",

        "Please enter your username or email.",
      );

      setTimeout(() => {
        resetIdentifierRef.current?.focus();
      }, 100);

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/auth/forgot-password/request`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Accept: "application/json",
          },

          body: JSON.stringify({
            identifier: resetIdentifier.trim(),
          }),
        },
      );

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        showError(
          "Password Reset",

          data.message || "Unable to send the verification code.",
        );

        return;
      }

      setChallengeId(String(data.challengeId || ""));

      setMaskedEmail(String(data.maskedEmail || ""));

      setVerificationCode(["", "", "", "", "", ""]);

      setResendCountdown(Number(data.resendAfterSeconds || 60));

      clearError();

      setScreenMode("verify");

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 300);
    } catch (error) {
      console.error("Forgot password request error:", error);

      showError(
        "Connection Error",

        "Could not connect to the SmartFine server.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // OTP INPUT CHANGE
  // ==========================================

  const handleOtpChange = (text: string, index: number) => {
    clearError();

    const digits = text.replace(/\D/g, "");

    if (!digits) {
      const updated = [...verificationCode];

      updated[index] = "";

      setVerificationCode(updated);

      return;
    }

    if (digits.length > 1) {
      const updated = [...verificationCode];

      let position = index;

      for (const digit of digits) {
        if (position >= 6) {
          break;
        }

        updated[position] = digit;

        position += 1;
      }

      setVerificationCode(updated);

      if (position < 6) {
        requestAnimationFrame(() => {
          otpRefs.current[position]?.focus();
        });
      } else {
        requestAnimationFrame(() => {
          otpRefs.current[5]?.focus();
        });
      }

      return;
    }

    const updated = [...verificationCode];

    updated[index] = digits.charAt(digits.length - 1);

    setVerificationCode(updated);

    if (index < 5) {
      requestAnimationFrame(() => {
        otpRefs.current[index + 1]?.focus();
      });
    }
  };

  // ==========================================
  // OTP BACKSPACE
  // ==========================================

  const handleOtpBackspace = (index: number) => {
    if (verificationCode[index]) {
      const updated = [...verificationCode];

      updated[index] = "";

      setVerificationCode(updated);

      return;
    }

    if (index > 0) {
      const updated = [...verificationCode];

      updated[index - 1] = "";

      setVerificationCode(updated);

      requestAnimationFrame(() => {
        otpRefs.current[index - 1]?.focus();
      });
    }
  };

  // ==========================================
  // VERIFY CODE
  // ==========================================

  const handleVerifyCode = async () => {
    clearError();

    const code = verificationCode.join("");

    if (code.length !== 6) {
      showError(
        "Verification Code",

        "Please enter the complete 6-digit verification code.",
      );

      const firstEmpty = verificationCode.findIndex((digit) => !digit);

      setTimeout(() => {
        otpRefs.current[firstEmpty >= 0 ? firstEmpty : 0]?.focus();
      }, 100);

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        flow === "firstLogin"
          ? `${API_BASE}/api/auth/first-login/verify`
          : `${API_BASE}/api/auth/forgot-password/verify`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Accept: "application/json",
          },

          body: JSON.stringify({
            challengeId,
            code,
          }),
        },
      );

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        showError(
          "Verification Failed",

          data.message || "The verification code could not be verified.",
        );

        setVerificationCode(["", "", "", "", "", ""]);

        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 150);

        return;
      }

      setResetToken(String(data.resetToken || ""));

      setStepToken(String(data.stepToken || ""));

      setNewPassword("");

      setConfirmPassword("");

      clearError();

      setScreenMode("reset");

      setTimeout(() => {
        newPasswordRef.current?.focus();
      }, 300);
    } catch (error) {
      console.error("Verify code error:", error);

      showError(
        "Connection Error",

        "Could not connect to the SmartFine server.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RESEND CODE
  // ==========================================

  const handleResendCode = async () => {
    if (loading || resendCountdown > 0) {
      return;
    }

    clearError();

    try {
      setLoading(true);

      const response = await fetch(
        flow === "firstLogin"
          ? `${API_BASE}/api/auth/first-login/resend`
          : `${API_BASE}/api/auth/forgot-password/resend`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Accept: "application/json",
          },

          body: JSON.stringify({
            challengeId,
          }),
        },
      );

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        if (typeof data.retryAfterSeconds === "number") {
          setResendCountdown(data.retryAfterSeconds);
        }

        showError(
          "Resend Code",

          data.message || "Unable to resend the verification code.",
        );

        return;
      }

      setMaskedEmail(String(data.maskedEmail || maskedEmail));

      setVerificationCode(["", "", "", "", "", ""]);

      setResendCountdown(Number(data.resendAfterSeconds || 60));

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 250);
    } catch (error) {
      console.error("Resend verification code error:", error);

      showError(
        "Connection Error",

        "Could not connect to the SmartFine server.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CREATE NEW PASSWORD
  // ==========================================

  const handleResetPassword = async () => {
    clearError();

    if (!newPassword || !confirmPassword) {
      showError(
        "Missing Information",

        "Please enter and confirm your new password.",
      );

      return;
    }

    if (passwordBytes(newPassword) > MAX_PASSWORD_BYTES) {
      showError("Invalid Password", PASSWORD_TOO_LONG_MESSAGE);
      return;
    }

    if (newPassword.length < 8) {
      showError(
        "Invalid Password",

        "Password must contain at least 8 characters.",
      );

      setTimeout(() => {
        newPasswordRef.current?.focus();
      }, 100);

      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      showError(
        "Invalid Password",

        "Password must contain at least one uppercase letter.",
      );

      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      showError(
        "Invalid Password",

        "Password must contain at least one lowercase letter.",
      );

      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      showError(
        "Invalid Password",

        "Password must contain at least one number.",
      );

      return;
    }

    if (!/[^A-Za-z0-9\s]/.test(newPassword)) {
      showError(
        "Invalid Password",

        "Password must contain at least one special character.",
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      showError(
        "Password Mismatch",

        "New password and confirmation do not match.",
      );

      setTimeout(() => {
        confirmPasswordRef.current?.focus();
      }, 100);

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        flow === "firstLogin"
          ? `${API_BASE}/api/auth/first-login/complete`
          : `${API_BASE}/api/auth/forgot-password/reset`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Accept: "application/json",
          },

          body: JSON.stringify(
            flow === "firstLogin"
              ? { challengeId, stepToken, newPassword, confirmPassword }
              : { challengeId, resetToken, newPassword, confirmPassword },
          ),
        },
      );

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        showError(
          "Password Reset",

          data.message || "Unable to reset your password.",
        );

        return;
      }

      // A new account is signed in as soon as its password is chosen.
      if (flow === "firstLogin") {
        await completeSignIn(data);

        return;
      }

      clearError();

      setPassword("");

      setScreenMode("success");
    } catch (error) {
      console.error("Reset password error:", error);

      showError(
        "Connection Error",

        "Could not connect to the SmartFine server.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BACK TO LOGIN
  // ==========================================

  const handleBackToLogin = () => {
    clearError();

    setScreenMode("login");

    setFlow("reset");

    setSetupMode(false);

    setStepToken("");

    setResetIdentifier("");

    setChallengeId("");

    setMaskedEmail("");

    setVerificationCode(["", "", "", "", "", ""]);

    setResetToken("");

    setNewPassword("");

    setConfirmPassword("");

    setShowNewPassword(false);

    setShowConfirmPassword(false);

    setResendCountdown(0);

    setPassword("");

    setTimeout(() => {
      usernameRef.current?.focus();
    }, 250);
  };

  // ==========================================
  // ERROR BOX
  // ==========================================

  const renderErrorBox = () => {
    if (!errorMessage) {
      return null;
    }

    const locked =
      errorTitle === "Account Temporarily Locked" && isCurrentAccountLocked;

    return (
      <View style={[styles.errorBox, locked && styles.lockoutErrorBox]}>
        <View style={styles.errorHeaderRow}>
          <Text style={styles.errorTitle}>{errorTitle}</Text>

          {locked && (
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>
                {formatLockoutTime(lockoutSeconds)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.errorMessage}>{errorMessage}</Text>

        {locked && (
          <Text style={styles.lockoutHelper}>
            Try again when the timer reaches 00:00.
          </Text>
        )}
      </View>
    );
  };

  // ==========================================
  // LOGIN FORM
  // ==========================================

  const LoginForm = () => (
    <>
      {!!signedOutNotice && (
        <View style={styles.noticeBox} accessibilityRole="alert">
          <Text style={styles.noticeText}>{signedOutNotice}</Text>
        </View>
      )}

      {/* USERNAME */}

      <View
        style={[
          styles.inputContainer,
          focusedField === "username" && styles.inputContainerFocused,
        ]}
      >
        <View style={styles.iconContainer}>
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.userIcon}
            resizeMode="contain"
          />
        </View>

        <TextInput
          ref={usernameRef}
          {...bindFocus("username")}
          style={styles.input}
          placeholder="Enter your username or email"
          placeholderTextColor="#6E6E6E"
          value={username}
          onChangeText={(text) => {
            setUsername(text);

            const normalized = text.trim().toLowerCase();

            const stillLocked =
              lockoutSeconds > 0 &&
              Boolean(lockedUsername) &&
              normalized === lockedUsername.toLowerCase();

            if (!stillLocked) {
              clearError();
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          editable={!loading}
          returnKeyType="next"
          blurOnSubmit={false}
          onBlur={() => {
            // Bound highlight first (see bindFocus), then the lockout check.
            bindFocus("username").onBlur();

            void checkLoginStatus(username);
          }}
          onSubmitEditing={() => {
            if (!isCurrentAccountLocked) {
              passwordRef.current?.focus();
            }
          }}
        />
      </View>

      {/* PASSWORD */}

      <View
        style={[
          styles.inputContainer,
          focusedField === "password" && styles.inputContainerFocused,
        ]}
      >
        <View style={styles.iconContainer}>
          <Image
            source={require("../../assets/icons/padlock.png")}
            style={styles.lockIcon}
            resizeMode="contain"
          />
        </View>

        <TextInput
          ref={passwordRef}
          {...bindFocus("password")}
          style={styles.passwordInput}
          placeholder={
            isCurrentAccountLocked
              ? "Account temporarily locked"
              : "Enter your password"
          }
          placeholderTextColor="#6E6E6E"
          value={password}
          onChangeText={(text) => {
            setPassword(text);

            if (!isCurrentAccountLocked) {
              clearError();
            }
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          editable={!loading && !isCurrentAccountLocked}
          onSubmitEditing={handleLogin}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword((current) => !current)}
          disabled={loading || isCurrentAccountLocked}
          activeOpacity={0.7}
        >
          <Image
            source={
              showPassword
                ? require("../../assets/icons/hide.png")
                : require("../../assets/icons/view.png")
            }
            style={styles.eyeIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* CAPTCHA (after a lockout) */}

      {captchaRequired && captcha && !isCurrentAccountLocked && (
        <View style={styles.captchaBox}>
          <Text style={styles.captchaLabel}>Type the characters you see</Text>

          <View style={styles.captchaRow}>
            <View
              style={styles.captchaImage}
              accessible
              accessibilityLabel="CAPTCHA picture. Type the characters you see."
            >
              <SvgXml xml={captcha.svg} width={170} height={60} />
            </View>

            <TouchableOpacity
              onPress={() => void loadCaptcha()}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Get a new CAPTCHA picture"
            >
              <Text style={styles.captchaRefresh}>New picture</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.captchaInput}
            value={captchaAnswer}
            onChangeText={(value) => {
              setCaptchaAnswer(value);

              clearError();
            }}
            placeholder="Enter the characters"
            placeholderTextColor="#6E6E6E"
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
            maxLength={8}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            accessibilityLabel="CAPTCHA characters"
          />
        </View>
      )}

      {renderErrorBox()}

      {/* OPTIONS */}

      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRememberMe(!rememberMe)}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Text style={styles.checkmark}>✓</Text>}
          </View>

          <Text style={styles.rememberText}>Remember me</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOpenForgotPassword}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* LOGIN BUTTON */}

      <TouchableOpacity
        style={[
          styles.loginButton,

          (loading || isCurrentAccountLocked) && styles.disabledButton,
        ]}
        onPress={handleLogin}
        disabled={loading || isCurrentAccountLocked}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.loginButtonText}>
            {isCurrentAccountLocked
              ? `LOCKED · ${formatLockoutTime(lockoutSeconds)}`
              : "LOGIN"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.setupLinkButton}
        onPress={handleOpenSetup}
        disabled={loading}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <Text style={styles.setupLinkText}>
          First time here? Set up your account
        </Text>
      </TouchableOpacity>
    </>
  );

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  const ForgotPasswordForm = () => (
    <>
      <Text style={styles.recoveryTitle}>
        {setupMode ? "Set Up Your Account" : "Forgot Password?"}
      </Text>

      <Text style={styles.recoveryDescription}>
        {setupMode
          ? "Enter your username or email. We will send a code to the email on file, then you choose your own password."
          : "Enter your username or email to recover your account."}
      </Text>

      <View style={styles.recoveryFieldCard}>
        <Text style={styles.fieldLabel}>Username or Email</Text>

        <View style={styles.recoveryInputContainer}>
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.recoveryInputIcon}
            resizeMode="contain"
          />

          <TextInput
            ref={resetIdentifierRef}
            style={styles.recoveryInput}
            placeholder="Enter your username or email"
            placeholderTextColor="#777777"
            value={resetIdentifier}
            onChangeText={(text) => {
              setResetIdentifier(text);

              clearError();
            }}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            editable={!loading}
            returnKeyType="next"
            onSubmitEditing={handleRequestReset}
          />
        </View>
      </View>

      {renderErrorBox()}

      <TouchableOpacity
        style={[styles.recoveryButton, loading && styles.disabledButton]}
        onPress={handleRequestReset}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.recoveryButtonText}>Next</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backToLoginButton}
        onPress={handleBackToLogin}
        disabled={loading}
      >
        <Text style={styles.backToLoginText}>Back to Login</Text>
      </TouchableOpacity>
    </>
  );

  // ==========================================
  // VERIFY CODE
  // ==========================================

  const VerifyForm = () => (
    <>
      <Text style={styles.recoveryTitle}>
        {flow === "firstLogin" ? "Verify Your Email" : "Enter Verification Code"}
      </Text>

      <Text style={styles.recoveryDescription}>
        {flow === "firstLogin"
          ? "Welcome to SmartFine! To finish setting up your account, enter the 6-digit code we sent to"
          : "Enter the 6-digit code we sent to"}
      </Text>

      <Text style={styles.maskedEmailText}>{maskedEmail}</Text>

      <View style={styles.otpRow}>
        {verificationCode.map((digit, index) => (
          <TextInput
            key={`otp-${index}`}
            ref={(reference) => {
              otpRefs.current[index] = reference;
            }}
            style={[styles.otpInput, digit !== "" && styles.otpInputFilled]}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Backspace") {
                handleOtpBackspace(index);
              }
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete={index === 0 ? "sms-otp" : "off"}
            maxLength={6}
            textAlign="center"
            selectTextOnFocus
            editable={!loading}
            selectionColor="#56C85C"
            returnKeyType={index === 5 ? "done" : "next"}
            onSubmitEditing={() => {
              if (index === 5) {
                handleVerifyCode();
              } else {
                otpRefs.current[index + 1]?.focus();
              }
            }}
          />
        ))}
      </View>

      {renderErrorBox()}

      <Text style={styles.didNotReceiveText}>Didn't receive the code?</Text>

      <TouchableOpacity
        onPress={handleResendCode}
        disabled={loading || resendCountdown > 0}
      >
        <Text
          style={[
            styles.resendText,

            resendCountdown > 0 && styles.resendDisabled,
          ]}
        >
          {resendCountdown > 0
            ? `Resend Code (${resendCountdown}s)`
            : "Resend Code"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.recoveryButton,
          styles.verifyButton,

          loading && styles.disabledButton,
        ]}
        onPress={handleVerifyCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.recoveryButtonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backToLoginButton}
        onPress={handleBackToLogin}
        disabled={loading}
      >
        <Text style={styles.backToLoginText}>Back to Login</Text>
      </TouchableOpacity>
    </>
  );

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  const ResetPasswordForm = () => (
    <>
      <Text style={styles.recoveryTitle}>
        {flow === "firstLogin" ? "Choose Your Password" : "Create New Password"}
      </Text>

      <Text style={styles.recoveryDescription}>
        {flow === "firstLogin"
          ? "Choose your own password. The temporary one you were given can no longer be used."
          : "Create a secure new password for your SmartFine account."}
      </Text>

      <View style={styles.passwordFieldCard}>
        <Text style={styles.fieldLabel}>New Password</Text>

        <View style={styles.passwordRecoveryInput}>
          <TextInput
            ref={newPasswordRef}
            style={styles.passwordRecoveryTextInput}
            placeholder="Enter new password"
            placeholderTextColor="#777777"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);

              clearError();
            }}
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            editable={!loading}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              confirmPasswordRef.current?.focus();
            }}
          />

          <TouchableOpacity
            style={styles.recoveryEyeButton}
            onPress={() => setShowNewPassword(!showNewPassword)}
            activeOpacity={0.7}
          >
            <Image
              source={
                showNewPassword
                  ? require("../../assets/icons/hide.png")
                  : require("../../assets/icons/view.png")
              }
              style={styles.recoveryEyeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.fieldLabel, styles.confirmLabel]}>
          Confirm Password
        </Text>

        <View style={styles.passwordRecoveryInput}>
          <TextInput
            ref={confirmPasswordRef}
            style={styles.passwordRecoveryTextInput}
            placeholder="Confirm new password"
            placeholderTextColor="#777777"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);

              clearError();
            }}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
          />

          <TouchableOpacity
            style={styles.recoveryEyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            activeOpacity={0.7}
          >
            <Image
              source={
                showConfirmPassword
                  ? require("../../assets/icons/hide.png")
                  : require("../../assets/icons/view.png")
              }
              style={styles.recoveryEyeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <PasswordRules
        password={newPassword}
        confirmPassword={confirmPassword}
        tone="dark"
      />

      {renderErrorBox()}

      <TouchableOpacity
        style={[styles.recoveryButton, loading && styles.disabledButton]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.recoveryButtonText}>
            {flow === "firstLogin" ? "Finish and Sign In" : "Create Password"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backToLoginButton}
        onPress={handleBackToLogin}
        disabled={loading}
      >
        <Text style={styles.backToLoginText}>Back to Login</Text>
      </TouchableOpacity>
    </>
  );

  // ==========================================
  // SUCCESS
  // ==========================================

  const SuccessForm = () => (
    <View style={styles.successContent}>
      <SuccessCheck style={styles.successIcon} />

      <Text style={styles.successTitle}>
        {setupMode ? "Account Ready" : "Password Reset"}
      </Text>

      <Text style={styles.successSubtitle}>Successful!</Text>

      <Text style={styles.successDescription}>
        {setupMode
          ? "Your password is set. You can sign in now."
          : "Your password has been updated successfully."}
      </Text>

      <TouchableOpacity
        style={[styles.recoveryButton, styles.successButton]}
        onPress={handleBackToLogin}
      >
        <Text style={styles.recoveryButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );

  // ==========================================
  // CURRENT RECOVERY SCREEN
  // ==========================================

  const RecoveryForm = () => {
    switch (screenMode) {
      case "forgot":
        return ForgotPasswordForm();

      case "verify":
        return VerifyForm();

      case "reset":
        return ResetPasswordForm();

      case "success":
        return SuccessForm();

      default:
        return null;
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,

          isTablet ? styles.tabletContainer : styles.phoneContainer,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* BRAND */}

        <FadeIn
          style={[
            styles.brandSection,

            isTablet ? styles.brandTablet : styles.brandPhone,
          ]}
        >
          <Image
            source={require("../../assets/branding/smartfineNoBG.png")}
            style={[
              styles.brandLogo,

              isTablet ? styles.brandLogoTablet : styles.brandLogoPhone,
            ]}
            resizeMode="contain"
          />

          <Text
            style={[
              styles.tagline,

              isTablet ? styles.taglineTablet : styles.taglinePhone,
            ]}
          >
            A Student Fines Monitoring and Management
            {"\n"}
            System
          </Text>
        </FadeIn>

        {/* LOGIN / RECOVERY */}

        <Animated.View
          style={[
            styles.loginSection,

            isTablet ? styles.loginTablet : styles.loginPhone,

            modeFade,
          ]}
        >
          {isTablet && (
            <Animated.View style={[styles.loginCardTablet, shakeStyle]}>
              {screenMode !== "success" && (
                <View style={styles.smallLogoBox}>
                  <Image
                    source={require("../../assets/branding/smartfine-logo.png")}
                    style={styles.smallLogo}
                    resizeMode="contain"
                  />
                </View>
              )}

              {screenMode === "login" ? (
                <>
                  <Text style={styles.welcomeTextTablet}>Welcome Back!</Text>

                  <Text style={styles.loginTitleTablet}>LOGIN</Text>

                  {LoginForm()}
                </>
              ) : (
                RecoveryForm()
              )}
            </Animated.View>
          )}

          {!isTablet && (
            <>
              {screenMode === "login" ? (
                <>
                  <Text style={styles.welcomeTextPhone}>Welcome Back!</Text>

                  <Text style={styles.loginTitlePhone}>Login</Text>

                  <Animated.View style={[styles.loginCardPhone, shakeStyle]}>
                    {LoginForm()}
                  </Animated.View>
                </>
              ) : (
                <Animated.View
                  style={[styles.recoveryPhoneContainer, shakeStyle]}
                >
                  {RecoveryForm()}
                </Animated.View>
              )}
            </>
          )}

          {screenMode === "login" && (
            <Text
              style={[
                styles.securityText,

                !isTablet && styles.securityTextPhone,
              ]}
            >
              Secure access for students and authorized school personnel
            </Text>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#173568",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#173568",
  },

  container: {
    flexGrow: 1,
    backgroundColor: "#173568",
  },

  tabletContainer: {
    minHeight: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
    paddingVertical: 35,
  },

  phoneContainer: {
    minHeight: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 35,
  },

  brandSection: {
    alignItems: "center",
    justifyContent: "center",
  },

  brandTablet: {
    flex: 1,
  },

  brandPhone: {
    width: "100%",
    marginBottom: 21,
  },

  brandLogo: {
    alignSelf: "center",
  },

  brandLogoTablet: {
    width: 330,
    height: 175,
  },

  brandLogoPhone: {
    width: 300,
    height: 185,
    marginBottom: -22,
  },

  tagline: {
    color: "#FFFFFF",
    textAlign: "center",
  },

  taglineTablet: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    lineHeight: 24,
  },

  taglinePhone: {
    width: "100%",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 0,
  },

  loginSection: {
    alignItems: "center",
    justifyContent: "center",
  },

  loginTablet: {
    flex: 1,
    paddingHorizontal: 20,
  },

  loginPhone: {
    width: "100%",
  },

  welcomeTextPhone: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 23,
    textAlign: "center",
    marginTop: 0,
  },

  loginTitlePhone: {
    color: "#16E564",
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  loginCardPhone: {
    width: "86%",
    maxWidth: 340,
    backgroundColor: "#425D89",
    borderRadius: 10,
    paddingHorizontal: 19,
    paddingTop: 22,
    paddingBottom: 30,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
  },

  loginCardTablet: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#425D89",
    borderRadius: 14,
    paddingHorizontal: 46,
    paddingTop: 38,
    paddingBottom: 42,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  smallLogoBox: {
    width: 110,
    height: 110,
    borderRadius: 24,
    backgroundColor: "#082947",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },

  smallLogo: {
    width: 72,
    height: 72,
  },

  welcomeTextTablet: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    textAlign: "center",
  },

  loginTitleTablet: {
    color: "#16E564",
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    textAlign: "center",
    marginTop: 3,
    marginBottom: 24,
  },

  inputContainer: {
    width: "100%",
    height: 43,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    // Transparent until focused, so the highlight never shifts the layout.
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 29,
    overflow: "hidden",
  },

  inputContainerFocused: {
    borderColor: "#20C95C",
  },

  iconContainer: {
    width: 47,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  userIcon: {
    width: 28,
    height: 28,
  },

  lockIcon: {
    width: 23,
    height: 23,
  },

  input: {
    flex: 1,
    height: "100%",
    color: "#222222",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    paddingHorizontal: 4,
    paddingRight: 12,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    color: "#222222",
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    paddingHorizontal: 4,
  },

  eyeButton: {
    width: 43,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  eyeIcon: {
    width: 23,
    height: 23,
  },

  noticeBox: {
    width: "100%",
    backgroundColor: "#E8F1FF",
    borderWidth: 1,
    borderColor: "#7FA8E6",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },

  noticeText: {
    color: "#123266",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    lineHeight: 18,
  },

  captchaBox: {
    width: "100%",
    marginBottom: 14,
  },

  captchaLabel: {
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    marginBottom: 6,
  },

  captchaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },

  captchaImage: {
    width: 170,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#EEF2F8",
  },

  captchaRefresh: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    textDecorationLine: "underline",
  },

  captchaInput: {
    width: "100%",
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#123266",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    letterSpacing: 3,
  },

  errorBox: {
    width: "100%",
    backgroundColor: "#FFF1F1",
    borderWidth: 1,
    borderColor: "#E15252",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },

  lockoutErrorBox: {
    backgroundColor: "#FFF7E8",
    borderColor: "#E8A323",
  },

  errorHeaderRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 2,
  },

  errorTitle: {
    flex: 1,
    color: "#B42318",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },

  errorMessage: {
    color: "#B42318",
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },

  timerBadge: {
    minWidth: 58,
    minHeight: 24,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#173A73",
  },

  timerBadgeText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  lockoutHelper: {
    color: "#875600",
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    lineHeight: 13,
    marginTop: 5,
  },

  optionsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -10,
    marginBottom: 42,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 12,
    height: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  checkboxChecked: {
    backgroundColor: "#20C95C",
  },

  checkmark: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
  },

  rememberText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
  },

  forgotText: {
    color: "#18E968",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
  },

  setupLinkButton: {
    alignSelf: "center",
    marginTop: 12,
    paddingVertical: 6,
  },

  setupLinkText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    textDecorationLine: "underline",
  },

  loginButton: {
    width: "100%",
    height: 33,
    backgroundColor: "#4CB94F",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },

  securityText: {
    color: "#C6D2E5",
    fontFamily: "Poppins_300Light",
    fontSize: 10,
    textAlign: "center",
    marginTop: 15,
  },

  securityTextPhone: {
    marginTop: 18,
    fontSize: 9,
  },

  recoveryPhoneContainer: {
    width: "86%",
    maxWidth: 340,
    alignSelf: "center",
    alignItems: "center",
    paddingTop: 0,
  },

  recoveryTitle: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    textAlign: "center",
    marginTop: 0,
    marginBottom: 8,
  },

  recoveryDescription: {
    color: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginBottom: 4,
  },

  maskedEmailText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_300Light",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 24,
  },

  recoveryFieldCard: {
    width: "100%",
    backgroundColor: "#425D89",
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 24,
    marginBottom: 14,
  },

  fieldLabel: {
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 9,
    marginBottom: 5,
  },

  recoveryInputContainer: {
    width: "100%",
    height: 39,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  recoveryInputIcon: {
    width: 20,
    height: 20,
    marginLeft: 8,
    marginRight: 8,
  },

  recoveryInput: {
    flex: 1,
    height: "100%",
    color: "#222222",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    paddingRight: 10,
  },

  recoveryButton: {
    width: "100%",
    minHeight: 34,
    backgroundColor: "#4CB94F",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 10,
  },

  recoveryButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
  },

  backToLoginButton: {
    paddingVertical: 14,
    paddingHorizontal: 10,
  },

  backToLoginText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_500Medium",
    fontSize: 9,
    textAlign: "center",
  },

  otpRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 24,
  },

  otpInput: {
    width: "14%",
    minWidth: 38,
    maxWidth: 48,
    height: 52,
    backgroundColor: "#5B7098",
    borderWidth: 2,
    borderColor: "#6D83AA",
    borderRadius: 7,
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 21,
    textAlign: "center",
    padding: 0,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  otpInputFilled: {
    backgroundColor: "#647DA8",
    borderColor: "#56C85C",
  },

  didNotReceiveText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },

  resendText: {
    color: "#16E564",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    textAlign: "center",
    marginTop: 7,
  },

  resendDisabled: {
    color: "#B8C4D7",
  },

  verifyButton: {
    marginTop: 20,
  },

  passwordFieldCard: {
    width: "100%",
    backgroundColor: "#425D89",
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 22,
    marginBottom: 10,
  },

  confirmLabel: {
    marginTop: 13,
  },

  passwordRecoveryInput: {
    width: "100%",
    height: 39,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordRecoveryTextInput: {
    flex: 1,
    height: "100%",
    color: "#222222",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    paddingHorizontal: 10,
  },

  recoveryEyeButton: {
    width: 40,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  recoveryEyeIcon: {
    width: 18,
    height: 18,
  },

  passwordHelper: {
    width: "100%",
    color: "#C6D2E5",
    fontFamily: "Poppins_300Light",
    fontSize: 8,
    lineHeight: 12,
    marginBottom: 10,
  },

  successContent: {
    width: "100%",
    alignItems: "center",
    paddingTop: 10,
  },

  successIcon: {
    marginBottom: 24,
  },

  successTitle: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 19,
    textAlign: "center",
  },

  successSubtitle: {
    color: "#16E564",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    textAlign: "center",
    marginTop: 2,
  },

  successDescription: {
    color: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 26,
    marginBottom: 30,
  },

  successButton: {
    marginTop: 0,
  },
});
