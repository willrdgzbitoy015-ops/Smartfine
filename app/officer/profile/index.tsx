import { File as ExpoFile } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { fetch as expoFetch } from "expo/fetch";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useOfficerPhotoStyles } from "../../../hooks/officer-photo.styles";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import LogoutModal from "@/components/logout-modal";
import { API_BASE } from "@/constants/api";
import { useAuth } from "@/hooks/use-auth";
import { useResponsiveStyles } from "./profile.styles";

type Page = "profile" | "edit" | "password" | "about";

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

const icons = {
  user: require("../../../assets/icons/user.png"),
  padlock: require("../../../assets/icons/padlock.png"),
  back: require("../../../assets/icons/back_icon.png"),
  arrow: require("../../../assets/icons/arrow.png"),
};

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

function imageUrl(uri: string | null) {
  if (!uri) return null;

  if (/^https?:\/\//i.test(uri)) {
    return uri;
  }

  return `${API_BASE.replace(/\/+$/, "")}/${uri.replace(/^\/+/, "")}`;
}

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
        ...(data ? { "Content-Type": "application/json" } : {}),
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
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

export default function OfficerProfile() {
  const styles = useResponsiveStyles();
  const photoStyles = useOfficerPhotoStyles();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoLock = useRef(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const router = useRouter();
  const { logout } = useAuth();

  const [page, setPage] = useState<Page>("profile");
  const [passwordReturn, setPasswordReturn] = useState<Page>("profile");

  const [officer, setOfficer] = useState<Officer | null>(null);
  const [draft, setDraft] = useState<Officer | null>(null);
  const [fullNameInput, setFullNameInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutLock = useRef(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const busy = saving || loggingOut || uploadingPhoto;

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
          if (!active) return;

          if (!body.user) {
            throw new Error("The server returned no profile.");
          }

          setOfficer(body.user);
          setDraft(body.user);
          setFullNameInput(body.user.fullName);
          setImageFailed(false);
        })
        .catch((caught) => {
          if (!active) return;

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

  const clearPasswords = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswords(false);
  };

  const openPassword = () => {
    if (busy) return;

    setPasswordReturn(page);
    clearPasswords();
    setError("");
    setPage("password");
  };

  const goBack = () => {
    if (busy) return;

    setError("");

    if (page === "profile") {
      router.replace("/officer/dashboard" as any);
    } else if (page === "password") {
      clearPasswords();
      setPage(passwordReturn);
    } else {
      setPage("profile");
    }
  };

  const editField = (
    key: "email" | "username" | "contactNumber",
    value: string,
  ) => {
    setDraft((previous) =>
      previous ? { ...previous, [key]: value } : previous,
    );
  };

  const saveProfile = async () => {
    if (!draft || busy) return;

    const normalizedName = fullNameInput.trim().replace(/\s+/g, " ");
    const originalName = [draft.firstName, draft.middleName, draft.lastName]
      .filter(Boolean)
      .join(" ")
      .trim()
      .replace(/\s+/g, " ");

    // Preserve the stored name parts when the full name is unchanged.
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

      try {
        await AsyncStorage.setItem("userEmail", body.user.email);
      } catch {
        Alert.alert(
          "Profile saved",
          "Your profile was saved, but local session information could not be refreshed. Please log out and log in again.",
        );
        return;
      }

      Alert.alert("Success", "Your profile has been updated.");
    } catch (caught) {
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
  };

  const savePassword = async () => {
    if (busy) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    setError("");

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
      setPage(passwordReturn);

      Alert.alert("Success", "Your password has been changed.");
    } catch (caught) {
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
  };

  const handleLogout = () => {
    if (busy) return;
    setLogoutVisible(true);
  };

  const confirmLogout = async () => {
    if (saving || photoLock.current || logoutLock.current) return;

    logoutLock.current = true;
    setLoggingOut(true);

    try {
      await logout();

      clearPasswords();
      setLogoutVisible(false);

      router.replace("/" as any);
    } catch {
      setLogoutVisible(false);

      Alert.alert(
        "Logout failed",
        "Unable to clear your session. Please try again.",
      );
    } finally {
      logoutLock.current = false;
      setLoggingOut(false);
    }
  };

  const choosePhoto = async () => {
    if (busy || photoLock.current) return;
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
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        throw new Error("Profile picture must be 5 MB or smaller.");
      }
      const token = await AsyncStorage.getItem("token");
      if (!token)
        throw new Error("Your session is missing. Please log in again.");
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
      if (
        !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(mime)
      ) {
        throw new Error("Please select a JPG, PNG, or WEBP photo.");
      }
      const name = `officer-photo.${mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"}`;
      const form = new FormData();
      timeout = setTimeout(() => controller.abort(), 30000);
      if (Platform.OS === "web") {
        let blob: Blob | undefined = asset.file;
        if (!blob) {
          const imageResponse = await fetch(asset.uri, {
            signal: controller.signal,
          });
          if (!imageResponse.ok) {
            throw new Error(
              "Unable to read the selected photo. Please select it again.",
            );
          }
          blob = await imageResponse.blob();
        }
        if (!blob) {
          throw new Error(
            "The selected photo could not be read. Please select it again.",
          );
        }
        if (blob.size > 5 * 1024 * 1024)
          throw new Error("Profile picture must be 5 MB or smaller.");
        form.append("profilePicture", blob, name);
      } else {
        const file = new ExpoFile(asset.uri);
        if (!file.exists || file.size === 0) {
          throw new Error(
            "The selected photo could not be read. Please select it again.",
          );
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Profile picture must be 5 MB or smaller.");
        }
        form.append("profilePicture", file, name);
      }
      const uploadFetch = Platform.OS === "web" ? fetch : expoFetch;
      const response = await uploadFetch(
        `${API_BASE.replace(/\/+$/, "")}/api/officer-profile/me/profile-picture`,
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
      let body: {
        success?: boolean;
        message?: string;
        profilePictureUri?: string;
      };
      try {
        body = JSON.parse(raw);
      } catch {
        throw new Error(
          `Unexpected server response (HTTP ${response.status}). Check your API connection.`,
        );
      }
      if (!response.ok || !body.success || !body.profilePictureUri) {
        throw new Error(
          body.message || "Unable to upload your profile picture.",
        );
      }
      const uri = body.profilePictureUri;
      setOfficer((previous) =>
        previous ? { ...previous, profilePictureUri: uri } : previous,
      );
      setDraft((previous) =>
        previous ? { ...previous, profilePictureUri: uri } : previous,
      );
      setImageFailed(false);
      setPhotoMessage("Profile picture saved.");
    } catch (caught) {
      setError(
        controller.signal.aborted
          ? "Upload timed out. Reopen Profile to check whether the photo saved before retrying."
          : caught instanceof Error
            ? caught.message
            : "Unable to change your profile picture.",
      );
    } finally {
      if (timeout) clearTimeout(timeout);
      photoLock.current = false;
      setUploadingPhoto(false);
    }
  };

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
            headers: { "ngrok-skip-browser-warning": "true" },
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

  const menuButton = (
    label: string,
    icon: "user" | "padlock",
    onPress: () => void,
  ) => (
    <TouchableOpacity
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
    </TouchableOpacity>
  );

  const title = {
    profile: "My Profile",
    edit: "Edit Profile",
    password: "Change Password",
    about: "About SmartFine",
  }[page];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.phone}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            disabled={busy}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Image
              source={icons.back}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#123266" />

                <Text style={styles.helper}>Loading your profile…</Text>
              </View>
            ) : (
              <>
                {!!error && (
                  <View style={styles.errorPanel}>
                    <Text style={styles.errorText} accessibilityRole="alert">
                      {error}
                    </Text>

                    {page === "profile" && (
                      <TouchableOpacity
                        style={styles.retry}
                        onPress={() => setReload((value) => value + 1)}
                        disabled={busy}
                      >
                        <Text style={styles.link}>Retry</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {officer && page === "profile" && (
                  <>
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

                    <View style={styles.infoCard}>
                      <Text style={styles.employeeId}>
                        ID: {officer.employeeNumber || "Not assigned"}
                      </Text>

                      <Text style={styles.detail}>Email: {officer.email}</Text>

                      <Text style={styles.detail}>
                        Contact Number:{" "}
                        {officer.contactNumber || "Not provided"}
                      </Text>
                    </View>

                    <View style={styles.menu}>
                      {menuButton("Edit Personal Information", "user", () => {
                        setDraft({ ...officer });
                        setFullNameInput(officer.fullName);
                        setError("");
                        setPage("edit");
                      })}

                      {menuButton("Change Password", "padlock", openPassword)}

                      {menuButton("About SmartFine", "user", () => {
                        setError("");
                        setPage("about");
                      })}

                      <TouchableOpacity
                        style={[styles.primaryButton, busy && styles.disabled]}
                        onPress={handleLogout}
                        disabled={busy}
                        accessibilityRole="button"
                      >
                        <Text style={styles.primaryText}>
                          {loggingOut ? "Logging out…" : "Logout"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {page === "edit" && draft && (
                  <>
                    <View style={styles.photoArea}>
                      <View style={photoStyles.photoWrapper}>
                        {renderAvatar(true)}
                        <TouchableOpacity
                          style={[
                            photoStyles.photoButton,
                            busy && styles.disabled,
                          ]}
                          onPress={() => void choosePhoto()}
                          disabled={busy}
                          accessibilityRole="button"
                          accessibilityLabel="Change profile picture"
                          accessibilityState={{
                            disabled: busy,
                            busy: uploadingPhoto,
                          }}
                        >
                          {uploadingPhoto ? (
                            <ActivityIndicator size="small" color="#123266" />
                          ) : (
                            <Image
                              source={require("../../../assets/icons/edit-image.png")}
                              style={photoStyles.photoIcon}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                      <Text
                        style={photoStyles.photoHint}
                        accessibilityLiveRegion="polite"
                      >
                        {uploadingPhoto
                          ? "Selecting or uploading photo…"
                          : photoMessage ||
                            "Tap the photo button to change your picture. Photos save immediately. JPG, PNG or WEBP • Up to 5 MB."}
                      </Text>
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>Full Name</Text>

                      <TextInput
                        style={styles.input}
                        value={fullNameInput}
                        onChangeText={(value) => {
                          setFullNameInput(value);
                          setError("");
                        }}
                        editable={!busy}
                        autoCorrect={false}
                        autoCapitalize="words"
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
                          style={styles.input}
                          value={draft[key]}
                          onChangeText={(value) => editField(key, value)}
                          editable={!busy}
                          autoCorrect={false}
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

                    {menuButton("Change Password", "padlock", openPassword)}

                    <TouchableOpacity
                      style={[styles.primaryButton, busy && styles.disabled]}
                      onPress={() => void saveProfile()}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      <Text style={styles.primaryText}>
                        {saving ? "Saving…" : "Save Changes"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {page === "password" && (
                  <View style={styles.passwordPage}>
                    <View>
                      <Text style={styles.passwordHelp}>
                        Enter your current password, then choose a new password
                        with at least 8 characters.
                      </Text>

                      {[
                        {
                          label: "Current Password",
                          value: currentPassword,
                          update: setCurrentPassword,
                        },
                        {
                          label: "New Password",
                          value: newPassword,
                          update: setNewPassword,
                        },
                        {
                          label: "Confirm New Password",
                          value: confirmPassword,
                          update: setConfirmPassword,
                        },
                      ].map((field) => (
                        <View key={field.label} style={styles.field}>
                          <Text style={styles.label}>{field.label}</Text>

                          <TextInput
                            style={styles.input}
                            value={field.value}
                            onChangeText={field.update}
                            secureTextEntry={!showPasswords}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!busy}
                          />
                        </View>
                      ))}

                      <TouchableOpacity
                        style={styles.showPassword}
                        onPress={() => setShowPasswords((value) => !value)}
                        disabled={busy}
                        accessibilityRole="button"
                      >
                        <Text style={styles.link}>
                          {showPasswords ? "Hide passwords" : "Show passwords"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        styles.saveButton,
                        busy && styles.disabled,
                      ]}
                      onPress={() => void savePassword()}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      <Text style={styles.primaryText}>
                        {saving ? "Updating…" : "Update Password"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {page === "about" && (
                  <>
                    <View style={styles.logoPlaceholder}>
                      <Text style={styles.logoText}>SmartFine</Text>
                    </View>

                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>About SmartFine</Text>
                    </View>

                    <View style={styles.aboutCard}>
                      <Text style={styles.aboutText}>
                        SmartFine is a mobile application designed to help
                        schools manage student fines digitally. Students can
                        view their fines and access their QR code. Fines
                        officers can identify students, record fines, and view
                        payment status, while administrators manage fine records
                        and update payment status.
                      </Text>
                    </View>

                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>Developed By</Text>
                    </View>

                    <View style={styles.aboutCard}>
                      <Text style={styles.developerName}>Will R. Bitoy</Text>

                      <Text style={styles.aboutText}>REMOVED</Text>

                      <Text style={styles.aboutText}>
                        Email: REMOVED
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <SafeAreaView edges={["bottom"]} style={styles.bottomArea}>
          <View style={styles.bottomNavigation}>
            {navigation.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.navItem}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{
                  selected: item.label === "Profile",
                }}
                onPress={() => {
                  if (item.label === "Profile") {
                    setPage("profile");
                    setError("");
                    clearPasswords();
                  } else {
                    router.replace(item.route as any);
                  }
                }}
              >
                <Image source={item.icon} style={styles.navIcon} />

                <Text style={styles.navLabel}>{item.label}</Text>

                <View
                  style={[
                    styles.activeIndicator,
                    item.label !== "Profile" && styles.hiddenIndicator,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </View>

      <LogoutModal
        visible={logoutVisible}
        loading={loggingOut}
        onCancel={() => {
          if (!logoutLock.current) {
            setLogoutVisible(false);
          }
        }}
        onConfirm={() => void confirmLogout()}
      />
    </SafeAreaView>
  );
}
