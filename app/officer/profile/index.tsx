import { File as ExpoFile } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { fetch as expoFetch } from "expo/fetch";
import { useCallback, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import LogoutModal from "@/components/logout-modal";
import { FadeIn, PressableScale, useSwitchFade } from "@/components/motion";
import { SkeletonProfile } from "@/components/skeleton";
import SuccessModal from "@/components/success-modal";

import { API_BASE } from "@/constants/api";
import { useActionLock } from "@/hooks/use-action-lock";
import { useFieldFocus } from "@/hooks/use-field-focus";
import { returnToLogin, useAuth } from "@/hooks/use-auth";
import { haptics } from "@/utils/haptics";

import { useResponsiveStyles } from "./profile.styles";

import { FloatingTabBar } from "@/components/floating-tab-bar";
// ==========================================
// TYPES
// ==========================================

type Page = "profile" | "edit" | "password" | "about" | "privacy";

type Officer = {
  id: number;
  username: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  email: string;
  contactNumber: string;
  profilePictureUri: string | null;
  employeeNumber: string;
  assignedArea: string;
};

type ResponseBody = {
  success?: boolean;
  message?: string;
  user?: Officer;
};

type MenuIcon = "user" | "padlock" | "policy";

// ==========================================
// ICONS
// ==========================================

const icons = {
  user: require("../../../assets/icons/user.png"),

  padlock: require("../../../assets/icons/padlock.png"),

  policy: require("../../../assets/icons/policy-icon.png"),

  back: require("../../../assets/icons/back_icon.png"),

  arrow: require("../../../assets/icons/arrow.png"),

  view: require("../../../assets/icons/view.png"),

  hide: require("../../../assets/icons/hide.png"),
};

// ==========================================
// BOTTOM NAVIGATION
// ==========================================

const navigation = [
  {
    label: "Home",
    icon: require("../../../assets/icons/dashboard.png"),
    route: "/officer/dashboard",
  },

  {
    label: "Students",
    icon: require("../../../assets/icons/students.png"),
    route: "/officer/student",
  },

  {
    label: "Scan",
    icon: require("../../../assets/icons/qr-codeWhite.png"),
    route: "/officer/qr-scanner",
  },

  {
    label: "Profile",
    icon: icons.user,
    route: "/officer/profile",
  },

  {
    label: "Records",
    icon: require("../../../assets/icons/reports.png"),
    route: "/officer/records",
  },
];

// ==========================================
// PROFILE IMAGE URL
// ==========================================

function imageUrl(uri: string | null) {
  if (!uri) {
    return null;
  }

  if (/^https?:\/\//i.test(uri)) {
    return uri;
  }

  return `${API_BASE.replace(/\/+$/, "")}/${uri.replace(/^\/+/, "")}`;
}

// ==========================================
// PASSWORD VALIDATION
// ==========================================

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "New password must contain at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "New password must contain at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "New password must contain at least one lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "New password must contain at least one number.";
  }

  if (!/[^A-Za-z0-9\s]/.test(password)) {
    return "New password must contain at least one special character.";
  }

  return null;
}

// ==========================================
// PROFILE API REQUEST
// ==========================================

async function profileRequest(
  path: string,
  method = "GET",
  data?: Record<string, string>,
  signal?: AbortSignal,
): Promise<ResponseBody> {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("Your session is missing. Please log in again.");
  }

  const response = await fetch(
    `${API_BASE.replace(/\/+$/, "")}/api/officer-profile${path}`,
    {
      method,

      signal,

      headers: {
        Accept: "application/json",

        Authorization: `Bearer ${token}`,

        "ngrok-skip-browser-warning": "true",

        ...(data
          ? {
              "Content-Type": "application/json",
            }
          : {}),
      },

      ...(data
        ? {
            body: JSON.stringify(data),
          }
        : {}),
    },
  );

  const raw = await response.text();

  let body: ResponseBody;

  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error(
      `Unexpected server response (HTTP ${response.status}). Check your API connection.`,
    );
  }

  if (!response.ok || !body.success) {
    throw new Error(body.message || "The request could not be completed.");
  }

  return body;
}

// ==========================================
// OFFICER PROFILE
// ==========================================

export default function OfficerProfile() {
  const styles = useResponsiveStyles();

  const router = useGuardedRouter();

  // Saving, paying and changing records run once per tap.
  const runLocked = useActionLock();

  // Highlights the field being typed in.
  const { focused: focusedField, bind: bindFocus } = useFieldFocus();

  const { logout } = useAuth();

  // ==========================================
  // PAGE
  // ==========================================

  const [page, setPage] = useState<Page>("profile");

  // ==========================================
  // OFFICER DATA
  // ==========================================

  const [officer, setOfficer] = useState<Officer | null>(null);

  const [draft, setDraft] = useState<Officer | null>(null);

  const [fullNameInput, setFullNameInput] = useState("");

  // ==========================================
  // SCREEN STATE
  // ==========================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [reload, setReload] = useState(0);

  const [imageFailed, setImageFailed] = useState(false);

  // ==========================================
  // PROFILE PHOTO
  // ==========================================

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const photoLock = useRef(false);

  const [photoMessage, setPhotoMessage] = useState("");

  // ==========================================
  // PASSWORD
  // ==========================================

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==========================================
  // PASSWORD SUCCESS
  // ==========================================

  const [passwordSuccessVisible, setPasswordSuccessVisible] = useState(false);
  const [profileSuccessVisible, setProfileSuccessVisible] = useState(false);

  // ==========================================
  // LOGOUT
  // ==========================================

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const [loggingOut, setLoggingOut] = useState(false);

  const logoutLock = useRef(false);

  const busy = saving || loggingOut || uploadingPhoto;

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      let active = true;

      let timedOut = false;

      const controller = new AbortController();

      setLoading(true);

      setError("");

      const timeout = setTimeout(() => {
        timedOut = true;

        controller.abort();
      }, 15000);

      void profileRequest("/me", "GET", undefined, controller.signal)
        .then((body) => {
          if (!active) {
            return;
          }

          if (!body.user) {
            throw new Error("The server returned no profile.");
          }

          setOfficer(body.user);

          setDraft(body.user);

          setFullNameInput(body.user.fullName);

          setImageFailed(false);
        })
        .catch((caught) => {
          if (!active) {
            return;
          }

          setError(
            timedOut
              ? "The server took too long to respond. Please retry."
              : caught instanceof Error
                ? caught.message
                : "Unable to load your profile.",
          );
        })
        .finally(() => {
          clearTimeout(timeout);

          if (active) {
            setLoading(false);
          }
        });

      return () => {
        active = false;

        clearTimeout(timeout);

        controller.abort();
      };
    }, [reload]),
  );

  // ==========================================
  // CLEAR PASSWORDS
  // ==========================================

  const clearPasswords = () => {
    setCurrentPassword("");

    setNewPassword("");

    setConfirmPassword("");

    setShowCurrentPassword(false);

    setShowNewPassword(false);

    setShowConfirmPassword(false);
  };

  // ==========================================
  // BACK
  // ==========================================

  const goBack = () => {
    if (busy) {
      return;
    }

    setError("");

    if (page === "profile") {
      router.replace("/officer/dashboard" as any);

      return;
    }

    if (page === "password") {
      clearPasswords();
    }

    setPage("profile");
  };

  // ==========================================
  // OPEN PASSWORD
  // ==========================================

  const openPassword = () => {
    if (busy) {
      return;
    }

    clearPasswords();

    setError("");

    setPage("password");
  };

  // ==========================================
  // EDIT FIELD
  // ==========================================

  const editField = (
    key: "email" | "username" | "contactNumber",
    value: string,
  ) => {
    setDraft((previous) =>
      previous
        ? {
            ...previous,
            [key]: value,
          }
        : previous,
    );

    setError("");
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const saveProfile = () =>
    runLocked(async () => {
      if (!draft || busy) {
        return;
      }

      const normalizedName = fullNameInput.trim().replace(/\s+/g, " ");

      const originalName = [draft.firstName, draft.middleName, draft.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()
        .replace(/\s+/g, " ");

      let firstName = draft.firstName;

      let middleName = draft.middleName;

      let lastName = draft.lastName;

      if (normalizedName !== originalName) {
        const nameParts = normalizedName.split(" ").filter(Boolean);

        if (nameParts.length < 2) {
          setError("Please enter both your first name and last name.");

          return;
        }

        firstName = nameParts[0];

        lastName = nameParts[nameParts.length - 1];

        middleName = nameParts.slice(1, -1).join(" ");
      }

      setSaving(true);

      setError("");

      const controller = new AbortController();

      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const body = await profileRequest(
          "/me",
          "PUT",
          {
            firstName,

            middleName,

            lastName,

            username: draft.username,

            email: draft.email,

            contactNumber: draft.contactNumber,
          },
          controller.signal,
        );

        if (!body.user) {
          throw new Error("The server returned no updated profile.");
        }

        setOfficer(body.user);

        setDraft(body.user);

        setFullNameInput(body.user.fullName);

        setPage("profile");

        await AsyncStorage.setItem("userEmail", body.user.email);

        // The success pop-up gives the "done" vibration.
        setProfileSuccessVisible(true);
      } catch (caught) {
        haptics.error();

        setError(
          controller.signal.aborted
            ? "The request timed out. Reload your profile to check whether it saved."
            : caught instanceof Error
              ? caught.message
              : "Unable to update your profile.",
        );
      } finally {
        clearTimeout(timeout);

        setSaving(false);
      }
    });

  // ==========================================
  // SAVE PASSWORD
  // ==========================================

  const savePassword = () =>
    runLocked(async () => {
      if (busy) {
        return;
      }

      setError("");

      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("Please complete all password fields.");

        return;
      }

      const passwordError = validatePassword(newPassword);

      if (passwordError) {
        setError(passwordError);

        return;
      }

      if (newPassword !== confirmPassword) {
        setError("New password and confirmation do not match.");

        return;
      }

      setSaving(true);

      const controller = new AbortController();

      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        await profileRequest(
          "/me/password",
          "PUT",
          {
            currentPassword,
            newPassword,
            confirmPassword,
          },
          controller.signal,
        );

        clearPasswords();

        setError("");

        setPasswordSuccessVisible(true);
      } catch (caught) {
        haptics.error();

        setError(
          controller.signal.aborted
            ? "The request timed out. The password may have changed; verify it before retrying."
            : caught instanceof Error
              ? caught.message
              : "Unable to change your password.",
        );
      } finally {
        clearTimeout(timeout);

        setSaving(false);
      }
    });

  // ==========================================
  // PASSWORD SUCCESS
  // ==========================================

  const handlePasswordSuccessClose = () => {
    setPasswordSuccessVisible(false);

    clearPasswords();

    setError("");

    setPage("profile");
  };

  // ==========================================
  // PROFILE PHOTO
  // ==========================================

  const choosePhoto = async () => {
    if (busy || photoLock.current) {
      return;
    }

    photoLock.current = true;

    setUploadingPhoto(true);

    setPhotoMessage("");

    setError("");

    let timeout: ReturnType<typeof setTimeout> | undefined;

    const controller = new AbortController();

    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          throw new Error(
            "Please allow photo access in your phone settings to change your picture.",
          );
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],

        allowsEditing: true,

        aspect: [1, 1],

        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        throw new Error("Profile picture must be 5 MB or smaller.");
      }

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Your session is missing. Please log in again.");
      }

      const extension = (asset.fileName || asset.uri)
        .split(/[?#]/)[0]
        .split(".")
        .pop()
        ?.toLowerCase();

      const mime =
        asset.mimeType ||
        (extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : "image/jpeg");

      const name = `officer-photo.${
        mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"
      }`;

      const form = new FormData();

      timeout = setTimeout(() => controller.abort(), 30000);

      if (Platform.OS === "web") {
        let blob: Blob | undefined = asset.file;

        if (!blob) {
          const imageResponse = await fetch(asset.uri, {
            signal: controller.signal,
          });

          blob = await imageResponse.blob();
        }

        if (!blob) {
          throw new Error("The selected photo could not be read.");
        }

        form.append("profilePicture", blob, name);
      } else {
        const file = new ExpoFile(asset.uri);

        if (!file.exists || file.size === 0) {
          throw new Error("The selected photo could not be read.");
        }

        form.append("profilePicture", file, name);
      }

      const uploadFetch = Platform.OS === "web" ? fetch : expoFetch;

      const response = await uploadFetch(
        `${API_BASE.replace(
          /\/+$/,
          "",
        )}/api/officer-profile/me/profile-picture`,
        {
          method: "POST",

          signal: controller.signal,

          headers: {
            Accept: "application/json",

            Authorization: `Bearer ${token}`,

            "ngrok-skip-browser-warning": "true",
          },

          body: form,
        },
      );

      const raw = await response.text();

      const body = JSON.parse(raw);

      if (!response.ok || !body.success || !body.profilePictureUri) {
        throw new Error(
          body.message || "Unable to upload your profile picture.",
        );
      }

      const uri = body.profilePictureUri;

      setOfficer((previous) =>
        previous
          ? {
              ...previous,
              profilePictureUri: uri,
            }
          : previous,
      );

      setDraft((previous) =>
        previous
          ? {
              ...previous,
              profilePictureUri: uri,
            }
          : previous,
      );

      setImageFailed(false);

      setPhotoMessage("Profile picture saved.");
    } catch (caught) {
      setError(
        controller.signal.aborted
          ? "Upload timed out. Please try again."
          : caught instanceof Error
            ? caught.message
            : "Unable to change your profile picture.",
      );
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }

      photoLock.current = false;

      setUploadingPhoto(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    if (busy) {
      return;
    }

    setLogoutError("");
    setLogoutVisible(true);
  };

  const confirmLogout = async () => {
    if (loggingOut || logoutLock.current) {
      return;
    }

    logoutLock.current = true;

    setLoggingOut(true);

    try {
      await logout();

      setLogoutVisible(false);

      returnToLogin();
    } catch {
      // Shown inside the Log Out pop-up (no system dialog).
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      logoutLock.current = false;

      setLoggingOut(false);
    }
  };

  // ==========================================
  // AVATAR
  // ==========================================

  const avatar = imageUrl(officer?.profilePictureUri || null);

  const initials =
    `${officer?.firstName?.charAt(0) || ""}${
      officer?.lastName?.charAt(0) || ""
    }`.toUpperCase() || "FO";

  const renderAvatar = (large = false) => (
    <View style={[styles.avatar, large && styles.avatarLarge]}>
      {avatar && !imageFailed ? (
        <Image
          source={{
            uri: avatar,

            headers: {
              "ngrok-skip-browser-warning": "true",
            },
          }}
          style={styles.avatarImage}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text style={[styles.initials, large && styles.initialsLarge]}>
          {initials}
        </Text>
      )}
    </View>
  );

  // ==========================================
  // MENU BUTTON
  // ==========================================

  // Rows rise in one after another and squeeze slightly while pressed.
  const menuButton = (
    label: string,
    icon: MenuIcon,
    onPress: () => void,
    index: number,
  ) => (
    <FadeIn key={label} index={index + 2}>
      <PressableScale
        style={styles.menuButton}
        onPress={onPress}
        disabled={busy}
        accessibilityRole="button"
      >
        <Image
          source={icons[icon]}
          style={styles.menuIcon}
          resizeMode="contain"
        />

        <Text style={styles.menuText}>{label}</Text>

        <Image
          source={icons.arrow}
          style={styles.menuArrow}
          resizeMode="contain"
        />
      </PressableScale>
    </FadeIn>
  );

  // ==========================================
  // PASSWORD FIELD
  // ==========================================

  const passwordInput = (
    label: string,
    value: string,
    update: (value: string) => void,
    visible: boolean,
    toggleVisible: () => void,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.passwordInputContainer,
          focusedField === label && styles.inputFocused,
        ]}
      >
        <TextInput
          {...bindFocus(label)}
          style={styles.passwordInput}
          value={value}
          onChangeText={(text) => {
            update(text);

            setError("");
          }}
          placeholder={
            label === "Current Password"
              ? "Enter current password"
              : label === "New Password"
                ? "Enter new password"
                : "Re-enter new password"
          }
          placeholderTextColor="#8C939F"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
        />

        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={toggleVisible}
          disabled={busy}
        >
          <Image
            source={visible ? icons.hide : icons.view}
            style={styles.passwordIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ==========================================
  // PAGE TITLE
  // ==========================================

  const pageFade = useSwitchFade(page);

  const title = {
    profile: "My Profile",

    edit: "Edit Profile",

    password: "Change Password",

    about: "About SmartFine",

    privacy: "Privacy Policy",
  }[page];

  // ==========================================
  // UI
  // ==========================================

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.phone}>
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            disabled={busy}
          >
            <Image source={icons.back} style={styles.backIcon} />
          </TouchableOpacity>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* CONTENT */}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Fades in again when moving between profile pages. */}
          <Animated.ScrollView
            style={pageFade}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Placeholders only before the first load; returning to the
                tab refreshes the profile in place. */}
            {loading && !officer ? (
              <SkeletonProfile label="Loading your profile" />
            ) : (
              <>
                {/* ERROR */}

                {!!error && (
                  <View style={styles.errorPanel}>
                    <Text style={styles.errorText}>{error}</Text>

                    {page === "profile" && (
                      <TouchableOpacity
                        style={styles.retry}
                        onPress={() => setReload((value) => value + 1)}
                      >
                        <Text style={styles.link}>Retry</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* ==================================
                    PROFILE
                ================================== */}

                {officer && page === "profile" && (
                  <>
                    <FadeIn index={0}>
                      <View style={styles.identity}>
                        {renderAvatar()}

                        <View style={styles.identityText}>
                          <Text style={styles.name}>{officer.fullName}</Text>

                          <Text style={styles.role}>
                            Fines Officer
                            {officer.assignedArea
                              ? ` | ${officer.assignedArea}`
                              : ""}
                          </Text>
                        </View>
                      </View>
                    </FadeIn>

                    <FadeIn index={1}>
                      <View style={styles.infoCard}>
                        <Text style={styles.employeeId}>
                          ID: {officer.employeeNumber || "Not assigned"}
                        </Text>

                        <Text style={styles.detail}>
                          Email: {officer.email}
                        </Text>

                        <Text style={styles.detail}>
                          Contact Number:{" "}
                          {officer.contactNumber || "Not provided"}
                        </Text>
                      </View>
                    </FadeIn>

                    <View style={styles.menu}>
                      {menuButton(
                        "Edit Personal Information",
                        "user",
                        () => {
                          setDraft({
                            ...officer,
                          });

                          setFullNameInput(officer.fullName);

                          setError("");

                          setPage("edit");
                        },
                        0,
                      )}

                      {menuButton("Change Password", "padlock", openPassword, 1)}

                      {menuButton(
                        "About SmartFine",
                        "user",
                        () => {
                          setError("");

                          setPage("about");
                        },
                        2,
                      )}

                      {menuButton(
                        "Privacy Policy",
                        "policy",
                        () => {
                          setError("");

                          setPage("privacy");
                        },
                        3,
                      )}

                      <FadeIn index={6}>
                        <TouchableOpacity
                          style={[
                            styles.primaryButton,
                            busy && styles.disabled,
                          ]}
                          onPress={handleLogout}
                          disabled={busy}
                        >
                          <Text style={styles.primaryText}>
                            {loggingOut ? "Logging out…" : "Logout"}
                          </Text>
                        </TouchableOpacity>
                      </FadeIn>
                    </View>
                  </>
                )}

                {/* ==================================
                    EDIT PROFILE
                ================================== */}

                {page === "edit" && draft && (
                  <>
                    <View style={styles.photoArea}>
                      <View>
                        {renderAvatar(true)}

                        <TouchableOpacity
                          style={{
                            position: "absolute",

                            right: 0,

                            bottom: 0,

                            width: 38,

                            height: 38,

                            borderRadius: 19,

                            backgroundColor: "#FFFFFF",

                            borderWidth: 1,

                            borderColor: "#123266",

                            alignItems: "center",

                            justifyContent: "center",
                          }}
                          onPress={() => void choosePhoto()}
                          disabled={busy}
                        >
                          {uploadingPhoto ? (
                            <ActivityIndicator size="small" color="#123266" />
                          ) : (
                            <Image
                              source={require("../../../assets/icons/edit-image.png")}
                              style={{
                                width: 20,

                                height: 20,
                              }}
                              resizeMode="contain"
                            />
                          )}
                        </TouchableOpacity>
                      </View>

                      {!!photoMessage && (
                        <Text style={styles.helper}>{photoMessage}</Text>
                      )}
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>Full Name</Text>

                      <TextInput
                        {...bindFocus("fullName")}
                        style={[
                          styles.input,
                          focusedField === "fullName" && styles.inputFocused,
                        ]}
                        value={fullNameInput}
                        onChangeText={(value) => {
                          setFullNameInput(value);

                          setError("");
                        }}
                        editable={!busy}
                      />
                    </View>

                    {(
                      [
                        ["email", "Email"],

                        ["username", "Username"],

                        ["contactNumber", "Contact Number"],
                      ] as const
                    ).map(([key, label]) => (
                      <View key={key} style={styles.field}>
                        <Text style={styles.label}>{label}</Text>

                        <TextInput
                          {...bindFocus(key)}
                          style={[
                            styles.input,
                            focusedField === key && styles.inputFocused,
                          ]}
                          value={draft[key]}
                          onChangeText={(value) => editField(key, value)}
                          editable={!busy}
                          autoCapitalize="none"
                          keyboardType={
                            key === "email"
                              ? "email-address"
                              : key === "contactNumber"
                                ? "phone-pad"
                                : "default"
                          }
                        />
                      </View>
                    ))}

                    <TouchableOpacity
                      style={[styles.primaryButton, busy && styles.disabled]}
                      onPress={() => void saveProfile()}
                      disabled={busy}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* ==================================
                    CHANGE PASSWORD
                ================================== */}

                {page === "password" && (
                  <View style={styles.passwordPage}>
                    <View>
                      <Text style={styles.passwordHelp}>
                        Enter your current password, then choose a new password
                        with at least 8 characters, uppercase, lowercase,
                        number, and special character.
                      </Text>

                      {passwordInput(
                        "Current Password",
                        currentPassword,
                        setCurrentPassword,
                        showCurrentPassword,
                        () => setShowCurrentPassword((current) => !current),
                      )}

                      {passwordInput(
                        "New Password",
                        newPassword,
                        setNewPassword,
                        showNewPassword,
                        () => setShowNewPassword((current) => !current),
                      )}

                      {passwordInput(
                        "Confirm New Password",
                        confirmPassword,
                        setConfirmPassword,
                        showConfirmPassword,
                        () => setShowConfirmPassword((current) => !current),
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,

                        styles.saveButton,

                        busy && styles.disabled,
                      ]}
                      onPress={() => void savePassword()}
                      disabled={busy}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryText}>Update Password</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* ==================================
                    ABOUT SMARTFINE
                ================================== */}

                {page === "about" && (
                  <>
                    <View style={styles.aboutLogoArea}>
                      <Image
                        source={require("../../../assets/branding/smartfine-logo.png")}
                        style={styles.aboutLogo}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>About SmartFine</Text>
                    </View>

                    <View style={styles.aboutCard}>
                      <Text style={styles.aboutText}>
                        SmartFine is a mobile application designed to help
                        schools manage student fines digitally. It allows
                        students to monitor their fines, receive notifications,
                        make secure payments, and access their QR code, while
                        enabling administrators to record and manage fines
                        efficiently.
                      </Text>
                    </View>

                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>Developed By</Text>
                    </View>

                    <View style={styles.developerCard}>
                      <Image
                        source={require("../../../assets/branding/programmer.jpg")}
                        style={styles.developerPhoto}
                        resizeMode="cover"
                      />

                      <View style={styles.developerInfo}>
                        <Text style={styles.developerName}>Will R. Bitoy</Text>

                        <Text style={styles.developerContact}>
                          REMOVED
                        </Text>

                        <Text style={styles.developerContact}>
                          Email: REMOVED
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {/* ==================================
                    PRIVACY POLICY
                ================================== */}

                {page === "privacy" && (
                  <>
                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>
                        SmartFine Privacy Policy
                      </Text>
                    </View>

                    <View style={styles.aboutCard}>
                      <Text style={styles.aboutText}>
                        SmartFine respects the privacy of its users. This policy
                        explains how information is used and handled within the
                        system.
                      </Text>
                    </View>

                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>
                        Information We Collect
                      </Text>
                    </View>

                    <View style={styles.aboutCard}>
                      <Text style={styles.aboutText}>
                        SmartFine stores account information such as names,
                        usernames, email addresses, contact numbers, profile
                        pictures, and assigned user roles.
                      </Text>
                    </View>

                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>
                        Student and Fine Records
                      </Text>
                    </View>

                    <View style={styles.aboutCard}>
                      <Text style={styles.aboutText}>
                        SmartFine stores student identification information,
                        violation information, fine records, and payment status
                        needed to manage student fines.
                      </Text>
                    </View>

                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>Account Security</Text>
                    </View>

                    <View style={styles.aboutCard}>
                      <Text style={styles.aboutText}>
                        Passwords are protected using secure password hashing.
                        Users should keep their login credentials private and
                        should not share their passwords.
                      </Text>
                    </View>

                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>Data Access</Text>
                    </View>

                    <View style={styles.aboutCard}>
                      <Text style={styles.aboutText}>
                        Information and system functions are available according
                        to each user's assigned SmartFine role.
                      </Text>
                    </View>

                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>Data Retention</Text>
                    </View>

                    <View style={styles.aboutCard}>
                      <Text style={styles.aboutText}>
                        Historical records may be retained when necessary to
                        preserve account, fine, payment, and transaction
                        history.
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
          </Animated.ScrollView>
        </KeyboardAvoidingView>

        {/* ==================================
            BOTTOM NAVIGATION
        ================================== */}

        <FloatingTabBar
          items={navigation}
          active="Profile"
          disabled={busy}
          onSelect={(item) => {
            if (item.label === "Profile") {
              setPage("profile");

              setError("");

              clearPasswords();
            } else {
              router.replace(item.route as any);
            }
          }}
        />
      </View>

      {/* ======================================
          PASSWORD SUCCESS MODAL
      ====================================== */}

      <SuccessModal
        visible={profileSuccessVisible}
        title="Profile Updated"
        message="Your profile has been updated."
        buttonText="OK"
        onClose={() => setProfileSuccessVisible(false)}
      />

      <SuccessModal
        visible={passwordSuccessVisible}
        title="Password Updated"
        message="Your password has been updated successfully."
        buttonText="OK"
        onClose={handlePasswordSuccessClose}
      />

      {/* ======================================
          LOGOUT MODAL
      ====================================== */}

      <LogoutModal
        visible={logoutVisible}
        loading={loggingOut}
        onCancel={() => {
          if (!logoutLock.current) {
            setLogoutVisible(false);
          }
        }}
        onConfirm={() => void confirmLogout()}
        error={logoutError}
      />
    </SafeAreaView>
  );
}
