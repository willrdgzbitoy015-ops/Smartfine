import { useEffect, useState } from "react";

import {
  ActivityIndicator,
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

import { API_BASE } from "@/constants/api";

export default function LoginScreen() {
  const router = useRouter();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // ==========================================
  // LOGIN FORM STATE
  // ==========================================

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ==========================================
  // LOGIN ERROR STATE
  // ==========================================

  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // SHOW ERROR
  // ==========================================

  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
  };

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError = () => {
    setErrorTitle("");
    setErrorMessage("");
  };

  // ==========================================
  // AUTO-HIDE ERROR
  // ==========================================

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setErrorTitle("");
      setErrorMessage("");
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [errorMessage]);

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

    console.log("Login session saved.");
    console.log("Saved user ID:", userId);
    console.log("Saved role:", userRole);
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async () => {
    clearError();

    // ======================================
    // EMPTY FIELD VALIDATION
    // ======================================

    if (!username.trim() || !password.trim()) {
      showError(
        "Missing Information",
        "Please enter your ID/Username and password.",
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

      // ====================================
      // LOGIN REQUEST
      // ====================================

      const response = await fetch(loginUrl, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      // ====================================
      // RESPONSE DEBUGGING
      // ====================================

      const contentType =
        response.headers.get("content-type") || "No content-type returned";

      console.log("==========================================");
      console.log("SMARTFINE LOGIN RESPONSE");
      console.log("==========================================");
      console.log("Response status:", response.status);
      console.log("Response OK:", response.ok);
      console.log("Response content-type:", contentType);

      // ====================================
      // READ RESPONSE AS TEXT FIRST
      // ====================================

      const rawResponseText = await response.text();

      let data: any;

      // ====================================
      // EMPTY RESPONSE
      // ====================================

      if (!rawResponseText.trim()) {
        console.error("Login response body is empty.");

        showError(
          "Server Error",
          "The SmartFine server returned an empty response. Please check the backend and ngrok connection.",
        );

        return;
      }

      // ====================================
      // SAFE JSON PARSING
      // ====================================

      try {
        data = JSON.parse(rawResponseText);
      } catch (parseError) {
        console.error("==========================================");
        console.error("LOGIN RESPONSE IS NOT VALID JSON");
        console.error("==========================================");
        console.error("JSON parse error:", parseError);
        console.error("Response status:", response.status);
        console.error("Response content-type:", contentType);
        console.error("Raw response text:");
        console.error(rawResponseText);
        console.error("==========================================");

        showError(
          response.status >= 500 ? "Server Error" : "Connection Error",
          "The SmartFine server returned an unexpected response. Please check that the backend and ngrok tunnel are running, then try again.",
        );

        return;
      }

      console.log("Login response:", data);

      // ====================================
      // LOGIN FAILED
      // ====================================

      if (!response.ok) {
        // ==================================
        // INVALID CREDENTIALS
        // ==================================

        if (data.code === "INVALID_CREDENTIALS") {
          let message = data.message || "Invalid username or password.";

          if (typeof data.attemptsRemaining === "number") {
            const attemptWord =
              data.attemptsRemaining === 1 ? "attempt" : "attempts";

            message += `\n${data.attemptsRemaining} ${attemptWord} remaining before temporary lockout.`;
          }

          showError("Login Failed", message);

          setPassword("");

          return;
        }

        // ==================================
        // ACCOUNT LOCKED
        // ==================================

        if (data.code === "ACCOUNT_LOCKED") {
          let message = data.message || "This account is temporarily locked.";

          if (!data.message && typeof data.retryAfterMinutes === "number") {
            message =
              `This account is temporarily locked. ` +
              `Please try again in approximately ${data.retryAfterMinutes} minute(s).`;
          }

          showError("Account Temporarily Locked", message);

          setPassword("");

          return;
        }

        // ==================================
        // DEACTIVATED
        // ==================================

        if (data.code === "ACCOUNT_DEACTIVATED") {
          showError(
            "Account Deactivated",
            data.message ||
              "This account has been deactivated. Please contact the SmartFine administrator.",
          );

          setPassword("");

          return;
        }

        // ==================================
        // ACCOUNT UNAVAILABLE
        // ==================================

        if (data.code === "ACCOUNT_UNAVAILABLE") {
          showError(
            "Account Unavailable",
            data.message ||
              "This account is currently unavailable. Please contact the SmartFine administrator.",
          );

          setPassword("");

          return;
        }

        // ==================================
        // MISSING CREDENTIALS
        // ==================================

        if (data.code === "MISSING_CREDENTIALS") {
          showError(
            "Missing Information",
            data.message || "Username and password are required.",
          );

          return;
        }

        // ==================================
        // SERVER ERROR
        // ==================================

        if (data.code === "SERVER_ERROR") {
          showError(
            "Server Error",
            data.message || "An error occurred while logging in.",
          );

          return;
        }

        // ==================================
        // OTHER ERROR
        // ==================================

        showError(
          "Login Failed",
          data.message || "Unable to log in. Please try again.",
        );

        return;
      }

      // ====================================
      // VALIDATE RESPONSE
      // ====================================

      if (!data.user || !data.user.role) {
        showError(
          "Login Error",
          "The server did not return a valid user role.",
        );

        return;
      }

      if (!data.token) {
        showError(
          "Login Error",
          "The server did not return a valid login token.",
        );

        return;
      }

      // ====================================
      // LOGIN SUCCESS
      // ====================================

      clearError();

      await saveLoginSession(data);

      const role = String(data.user.role).toUpperCase();

      console.log("Logged-in role:", role);

      // ====================================
      // ROLE REDIRECTION
      // ====================================

      if (role === "ADMIN") {
        console.log("Redirecting to Admin Dashboard...");

        router.replace("/admin/dashboard");
      } else if (role === "FINES_OFFICER") {
        console.log("Redirecting to Officer Dashboard...");

        router.replace("/officer/dashboard");
      } else if (role === "STUDENT") {
        console.log("Redirecting to Student Dashboard...");

        router.replace("/student/dashboard");
      } else {
        await AsyncStorage.multiRemove([
          "token",
          "userEmail",
          "userId",
          "userRole",
        ]);

        showError("Login Error", `Unknown user role: ${role}`);
      }
    } catch (error) {
      console.error("==========================================");
      console.error("SMARTFINE LOGIN CONNECTION ERROR");
      console.error("==========================================");
      console.error("Login API URL:", loginUrl);
      console.error("Login error:", error);
      console.error("==========================================");

      showError(
        "Connection Error",
        "Could not connect to the SmartFine server. Please check your connection, backend server, and ngrok tunnel.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIN FORM
  // ==========================================

  const LoginForm = () => (
    <>
      {/* USERNAME */}

      <View style={styles.inputContainer}>
        <View style={styles.iconContainer}>
          <Image
            source={require("../../assets/icons/user.png")}
            style={styles.userIcon}
            resizeMode="contain"
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter your ID or Username"
          placeholderTextColor="#6E6E6E"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            clearError();
          }}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          returnKeyType="next"
        />
      </View>

      {/* PASSWORD */}

      <View style={styles.inputContainer}>
        <View style={styles.iconContainer}>
          <Image
            source={require("../../assets/icons/padlock.png")}
            style={styles.lockIcon}
            resizeMode="contain"
          />
        </View>

        <TextInput
          style={styles.passwordInput}
          placeholder="Enter your password"
          placeholderTextColor="#6E6E6E"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearError();
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          onSubmitEditing={handleLogin}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword((current) => !current)}
          disabled={loading}
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

      {/* ERROR */}

      {errorMessage !== "" && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>{errorTitle}</Text>

          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      )}

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

        <TouchableOpacity disabled={loading} activeOpacity={0.7}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* LOGIN BUTTON */}

      <TouchableOpacity
        style={[styles.loginButton, loading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.loginButtonText}>LOGIN</Text>
        )}
      </TouchableOpacity>
    </>
  );

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
        {/* =====================================
            BRAND
        ====================================== */}

        <View
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
        </View>

        {/* =====================================
            LOGIN SIDE / MOBILE SECTION
        ====================================== */}

        <View
          style={[
            styles.loginSection,

            isTablet ? styles.loginTablet : styles.loginPhone,
          ]}
        >
          {/* =================================
              TABLET LOGO ONLY
          ================================= */}

          {isTablet && (
            <View style={styles.loginCardTablet}>
              <View style={styles.smallLogoBox}>
                <Image
                  source={require("../../assets/branding/smartfine-logo.png")}
                  style={styles.smallLogo}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.welcomeTextTablet}>Welcome Back!</Text>

              <Text style={styles.loginTitleTablet}>LOGIN</Text>

              <LoginForm />
            </View>
          )}

          {/* =================================
              PHONE VERSION
          ================================= */}

          {!isTablet && (
            <>
              <Text style={styles.welcomeTextPhone}>Welcome Back!</Text>

              <Text style={styles.loginTitlePhone}>Login</Text>

              <View style={styles.loginCardPhone}>
                <LoginForm />
              </View>
            </>
          )}

          <Text
            style={[styles.securityText, !isTablet && styles.securityTextPhone]}
          >
            Secure access for students and authorized school personnel
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // ========================================
  // SCREEN
  // ========================================

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

  // ========================================
  // TABLET
  // ========================================

  tabletContainer: {
    minHeight: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 50,
    paddingVertical: 35,
  },

  // ========================================
  // PHONE
  // ========================================

  phoneContainer: {
    minHeight: "100%",

    alignItems: "center",

    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 35,
  },

  // ========================================
  // BRAND SECTION
  // ========================================

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

  // ========================================
  // MOBILE MAIN LOGO
  // ========================================

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
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },

  taglinePhone: {
    width: "100%",

    fontSize: 13,
    fontWeight: "400",

    lineHeight: 18,

    marginTop: 0,
  },

  // ========================================
  // LOGIN SECTION
  // ========================================

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

  // ========================================
  // MOBILE TITLE
  // ========================================

  welcomeTextPhone: {
    color: "#FFFFFF",

    fontSize: 23,
    fontWeight: "800",

    textAlign: "center",

    marginTop: 0,
  },

  loginTitlePhone: {
    color: "#16E564",

    fontSize: 20,
    fontWeight: "700",

    textAlign: "center",

    marginTop: 20,
    marginBottom: 20,
  },

  // ========================================
  // PHONE CARD
  // ========================================

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

  // ========================================
  // TABLET CARD
  // ========================================

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

  // ========================================
  // TABLET SMALL LOGO
  // ========================================

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

    fontSize: 26,
    fontWeight: "800",

    textAlign: "center",
  },

  loginTitleTablet: {
    color: "#16E564",

    fontSize: 19,
    fontWeight: "800",

    textAlign: "center",

    marginTop: 3,
    marginBottom: 24,
  },

  // ========================================
  // INPUTS
  // ========================================

  inputContainer: {
    width: "100%",

    height: 43,

    backgroundColor: "#FFFFFF",

    borderRadius: 6,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 29,

    overflow: "hidden",
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

    fontSize: 12,

    paddingHorizontal: 4,
    paddingRight: 12,
  },

  passwordInput: {
    flex: 1,
    height: "100%",

    color: "#222222",

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

  // ========================================
  // ERROR
  // ========================================

  errorBox: {
    width: "100%",

    backgroundColor: "#FFF1F1",

    borderWidth: 1,
    borderColor: "#E15252",

    borderRadius: 6,

    paddingHorizontal: 10,
    paddingVertical: 8,

    marginTop: -15,
    marginBottom: 14,
  },

  errorTitle: {
    color: "#B42318",

    fontSize: 12,
    fontWeight: "700",

    marginBottom: 2,
  },

  errorMessage: {
    color: "#B42318",

    fontSize: 11,
    lineHeight: 16,
  },

  // ========================================
  // OPTIONS
  // ========================================

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

    fontSize: 9,
    fontWeight: "800",
  },

  rememberText: {
    color: "#FFFFFF",

    fontSize: 10,
    fontWeight: "500",
  },

  forgotText: {
    color: "#18E968",

    fontSize: 10,
    fontWeight: "600",
  },

  // ========================================
  // LOGIN BUTTON
  // ========================================

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

    fontSize: 12,
    fontWeight: "800",
  },

  // ========================================
  // SECURITY TEXT
  // ========================================

  securityText: {
    color: "#C6D2E5",

    fontSize: 10,

    textAlign: "center",

    marginTop: 15,
  },

  securityTextPhone: {
    marginTop: 18,
    fontSize: 9,
  },
});
