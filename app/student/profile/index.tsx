import AsyncStorage from "@react-native-async-storage/async-storage";
import { File as ExpoFile } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { StatusBar } from "expo-status-bar";
import { fetch as expoFetch } from "expo/fetch";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LogoutModal from "@/components/logout-modal";
import {
  FadeIn,
  PopIn,
  PressableScale,
  useRetainedValue,
  useSwitchFade,
} from "@/components/motion";
import { SkeletonProfile } from "@/components/skeleton";
import { API_BASE } from "@/constants/api";
import { useActionLock } from "@/hooks/use-action-lock";
import { useFieldFocus } from "@/hooks/use-field-focus";
import { haptics } from "@/utils/haptics";
import { returnToLogin, useAuth } from "@/hooks/use-auth";
import { styles } from "../styles/student-profile.styles";

import { CountUp } from "@/components/count-up";
import { FloatingTabBar } from "@/components/floating-tab-bar";
type Page = "profile" | "edit" | "password" | "about" | "privacy";

type StudentProfile = {
  id: number;
  username: string;
  studentId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  email: string;
  contactNumber: string;
  profilePictureUri: string | null;
  gradeLevel: string;
  section: string;
  role: "STUDENT";
};

type ProfileResponse = {
  success: boolean;
  message?: string;
  user?: StudentProfile;
};

type DashboardResponse = {
  success: boolean;
  message?: string;
  stats?: {
    totalAmountCentavos: number;
    paidAmountCentavos: number;
    outstandingAmountCentavos: number;
  };
};

type ProfileDraft = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  contactNumber: string;
};

type PasswordDraft = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const baseUrl = API_BASE.replace(/\/+$/, "");

const icons = {
  home: require("../../../assets/icons/dashboard.png"),
  fines: require("../../../assets/icons/fines.png"),
  qr: require("../../../assets/icons/qr-codeWhite.png"),
  user: require("../../../assets/icons/user.png"),
  lock: require("../../../assets/icons/padlock.png"),
  policy: require("../../../assets/icons/policy-icon.png"),
  back: require("../../../assets/icons/back_icon.png"),
  arrow: require("../../../assets/icons/arrow.png"),
};

const navigation = [
  { label: "Home", icon: icons.home, route: "/student/dashboard" },
  { label: "Fines", icon: icons.fines, route: "/student/fines" },
  { label: "My QR", icon: icons.qr, route: "/student/qr" },
  { label: "Profile", icon: icons.user, route: "/student/profile" },
] as const;

function money(centavos: number) {
  if (!Number.isFinite(centavos)) return "—";

  return `₱ ${(centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function photoUrl(uri: string | null) {
  if (!uri) return null;
  if (/^https?:\/\//i.test(uri)) return uri;
  return `${baseUrl}/${uri.replace(/^\/+/, "")}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "S"
  );
}

async function responseBody(response: Response) {
  const raw = await response.text();

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "The server returned an unexpected response. Please try again.",
    );
  }
}

export default function StudentProfileScreen() {
  const router = useGuardedRouter();

  // Saving, paying and changing records run once per tap.
  const runLocked = useActionLock();

  // Highlights the field being typed in.
  const { focused: focusedField, bind: bindFocus } = useFieldFocus();
  const { logout } = useAuth();

  const [page, setPage] = useState<Page>("profile");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [totals, setTotals] = useState<DashboardResponse["stats"] | null>(null);

  const [draft, setDraft] = useState<ProfileDraft>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    contactNumber: "",
  });

  const [password, setPassword] = useState<PasswordDraft>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // The notice stays on its pop-up while the pop-up fades out.
  const shownNotice = useRetainedValue(notice || null);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutLock = useRef(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        returnToLogin();
        return;
      }

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      };

      const profileResponse = await fetch(`${baseUrl}/api/student-profile/me`, {
        headers,
      });

      const profileResult = (await responseBody(
        profileResponse,
      )) as ProfileResponse;

      if (
        !profileResponse.ok ||
        !profileResult.success ||
        !profileResult.user
      ) {
        throw new Error(
          profileResult.message || "Unable to load your profile.",
        );
      }

      setProfile(profileResult.user);

      // A totals error does not prevent the profile from opening.
      try {
        const dashboardResponse = await fetch(
          `${baseUrl}/api/auth/student-dashboard`,
          { headers },
        );

        const dashboardResult = (await responseBody(
          dashboardResponse,
        )) as DashboardResponse;

        if (
          dashboardResponse.ok &&
          dashboardResult.success &&
          dashboardResult.stats
        ) {
          setTotals(dashboardResult.stats);
        }
      } catch {
        setTotals(null);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const goBack = () => {
    if (busy || loggingOut) return;

    if (page !== "profile") {
      setError("");
      setPage("profile");
      return;
    }

    router.replace("/student/dashboard");
  };

  const openEdit = () => {
    if (!profile) return;

    setDraft({
      firstName: profile.firstName,
      middleName: profile.middleName,
      lastName: profile.lastName,
      email: profile.email,
      contactNumber: profile.contactNumber,
    });

    setError("");
    setPage("edit");
  };

  const openPassword = () => {
    setPassword({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswords(false);
    setError("");
    setPage("password");
  };

  const saveProfile = () =>
    runLocked(async () => {
      if (busy) return;

      setBusy(true);
      setError("");

      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          throw new Error("Please sign in again.");
        }

        const response = await fetch(`${baseUrl}/api/student-profile/me`, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(draft),
        });

        const result = (await responseBody(response)) as ProfileResponse;

        if (!response.ok || !result.success || !result.user) {
          throw new Error(result.message || "Unable to save your profile.");
        }

        setProfile(result.user);
        setPage("profile");
        haptics.success();
        setNotice("Your personal information was updated.");
      } catch (caught) {
        haptics.error();
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to save your profile.",
        );
      } finally {
        setBusy(false);
      }
    });

  const changePassword = () =>
    runLocked(async () => {
      if (busy) return;

      setBusy(true);
      setError("");

      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          throw new Error("Please sign in again.");
        }

        const response = await fetch(
          `${baseUrl}/api/student-profile/me/password`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify(password),
          },
        );

        const result = await responseBody(response);

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to change your password.");
        }

        setPassword({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setPage("profile");
        haptics.success();
        setNotice("Your password was updated.");
      } catch (caught) {
        haptics.error();
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to change your password.",
        );
      } finally {
        setBusy(false);
      }
    });

  const changePhoto = async () => {
    if (busy) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    setBusy(true);
    setError("");

    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          throw new Error("Please allow photo access in your phone settings.");
        }
      }

      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (selection.canceled || !selection.assets?.length) {
        return;
      }

      const asset = selection.assets[0];

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        throw new Error("Profile picture must be 5 MB or smaller.");
      }

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Please sign in again.");
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

      const fileName =
        mime === "image/png"
          ? "student-photo.png"
          : mime === "image/webp"
            ? "student-photo.webp"
            : "student-photo.jpg";

      const form = new FormData();
      timer = setTimeout(() => controller.abort(), 30000);

      if (Platform.OS === "web") {
        let blob: Blob | undefined = asset.file;

        if (!blob) {
          const imageResponse = await fetch(asset.uri, {
            signal: controller.signal,
          });
          blob = await imageResponse.blob();
        }

        form.append("profilePicture", blob, fileName);
      } else {
        const file = new ExpoFile(asset.uri);

        if (!file.exists || file.size === 0) {
          throw new Error("The selected photo could not be read.");
        }

        form.append("profilePicture", file, fileName);
      }

      const uploadFetch = Platform.OS === "web" ? fetch : expoFetch;

      const response = await uploadFetch(
        `${baseUrl}/api/student-profile/me/profile-picture`,
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

      const result = await responseBody(response);

      if (!response.ok || !result.success || !result.profilePictureUri) {
        throw new Error(
          result.message || "Unable to upload your profile picture.",
        );
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              profilePictureUri: result.profilePictureUri,
            }
          : current,
      );

      haptics.success();
      setNotice("Your profile picture was updated.");
    } catch (caught) {
      haptics.error();
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to upload your profile picture.",
      );
    } finally {
      if (timer) clearTimeout(timer);
      setBusy(false);
    }
  };

  const confirmLogout = async () => {
    if (loggingOut || logoutLock.current) return;

    logoutLock.current = true;
    setLoggingOut(true);

    try {
      await logout();
      setLogoutVisible(false);
      returnToLogin();
    } catch {
      setLogoutVisible(false);
      setNotice("Unable to log out. Please try again.");
    } finally {
      logoutLock.current = false;
      setLoggingOut(false);
    }
  };

  const avatar = photoUrl(profile?.profilePictureUri || null);

  // Rows rise in one after another and squeeze slightly while pressed.
  const menuButton = (
    label: string,
    icon: number,
    onPress: () => void,
    index: number,
  ) => (
    <FadeIn key={label} index={index + 3}>
      <PressableScale
        style={styles.menuButton}
        onPress={onPress}
        accessibilityRole="button"
      >
        <Image source={icon} style={styles.menuIcon} />
        <Text style={styles.menuText}>{label}</Text>
        <Image source={icons.arrow} style={styles.arrowIcon} />
      </PressableScale>
    </FadeIn>
  );

  const passwordField = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.passwordRow,
          focusedField === label && styles.inputFocused,
        ]}
      >
        <TextInput
          {...bindFocus(label)}
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPasswords}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
        />

        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={() => setShowPasswords((current) => !current)}
          accessibilityLabel={
            showPasswords ? "Hide passwords" : "Show passwords"
          }
        >
          <Text style={styles.visibilityText}>
            {showPasswords ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const pageFade = useSwitchFade(page);

  const title = {
    profile: "My Profile",
    edit: "Edit Profile",
    password: "Change Password",
    about: "About SmartFine",
    privacy: "Privacy Policy",
  }[page];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.phone}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Image source={icons.back} style={styles.backIcon} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Fades in again when moving between profile pages. */}
        <Animated.ScrollView
          style={[styles.scroll, pageFade]}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Placeholders only before the first load; returning to the
              tab refreshes the profile in place. */}
          {loading && !profile ? (
            <SkeletonProfile label="Loading your profile" />
          ) : (
            <>
              {!!error && (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{error}</Text>

                  {!profile && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => void loadProfile()}
                    >
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {profile && page === "profile" && (
                <>
                  <FadeIn index={0}>
                  <View style={styles.identity}>
                    <TouchableOpacity
                      style={styles.avatarButton}
                      onPress={() => void changePhoto()}
                      disabled={busy}
                      accessibilityLabel="Change profile picture"
                    >
                      {avatar ? (
                        <Image
                          source={{ uri: avatar }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={styles.avatarInitials}>
                          {initials(profile.fullName)}
                        </Text>
                      )}

                      {/* Shown while a new photo uploads. */}
                      {busy && (
                        <View style={styles.avatarBusy}>
                          <ActivityIndicator color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <View style={styles.identityText}>
                      <Text style={styles.studentName}>{profile.fullName}</Text>
                      <Text style={styles.studentSubtitle}>
                        Student
                        {profile.gradeLevel ? ` • ${profile.gradeLevel}` : ""}
                        {profile.section ? ` - ${profile.section}` : ""}
                      </Text>
                      <Text style={styles.photoHint}>Tap photo to change</Text>
                    </View>
                  </View>
                  </FadeIn>

                  <FadeIn index={1}>
                    <View style={styles.infoCard}>
                      <Text style={styles.studentId}>
                        ID: {profile.studentId || "Unavailable"}
                      </Text>
                      <Text style={styles.infoLine}>
                        Email: {profile.email || "Not provided"}
                      </Text>
                      <Text style={styles.infoLine}>
                        Contact Number: {profile.contactNumber || "Not provided"}
                      </Text>
                    </View>
                  </FadeIn>

                  <FadeIn index={2}>
                    <Text style={styles.sectionTitle}>Account Overview</Text>

                    <View style={styles.overview}>
                      <View style={styles.overviewItem}>
                        <Text style={styles.overviewLabel}>Total</Text>
                        {totals ? (
                          <CountUp
                            value={totals.totalAmountCentavos}
                            format={money}
                            style={styles.overviewValue}
                          />
                        ) : (
                          <Text style={styles.overviewValue}>—</Text>
                        )}
                      </View>

                      <View style={styles.overviewItem}>
                        <Text style={styles.overviewLabel}>Paid</Text>
                        {totals ? (
                          <CountUp
                            value={totals.paidAmountCentavos}
                            format={money}
                            style={[styles.overviewValue, styles.paidValue]}
                          />
                        ) : (
                          <Text style={[styles.overviewValue, styles.paidValue]}>
                            —
                          </Text>
                        )}
                      </View>

                      <View style={styles.overviewItem}>
                        <Text style={styles.overviewLabel}>Outstanding</Text>
                        {totals ? (
                          <CountUp
                            value={totals.outstandingAmountCentavos}
                            format={money}
                            style={[
                              styles.overviewValue,
                              styles.outstandingValue,
                            ]}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.overviewValue,
                              styles.outstandingValue,
                            ]}
                          >
                            —
                          </Text>
                        )}
                      </View>
                    </View>
                  </FadeIn>

                  <View style={styles.menu}>
                    {menuButton(
                      "Edit Personal Information",
                      icons.user,
                      openEdit,
                      0,
                    )}
                    {menuButton("Change Password", icons.lock, openPassword, 1)}
                    {menuButton(
                      "About SmartFine",
                      icons.user,
                      () => {
                        setError("");
                        setPage("about");
                      },
                      2,
                    )}
                    {menuButton(
                      "Privacy Policy",
                      icons.policy,
                      () => {
                        setError("");
                        setPage("privacy");
                      },
                      3,
                    )}
                  </View>

                  <FadeIn index={7}>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => setLogoutVisible(true)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.primaryText}>Logout</Text>
                    </TouchableOpacity>
                  </FadeIn>
                </>
              )}

              {profile && page === "edit" && (
                <>
                  <Text style={styles.formIntro}>
                    Update your contact information and profile picture. Your
                    Student ID and username are managed by the school.
                  </Text>

                  <View style={styles.editPhotoArea}>
                    <TouchableOpacity
                      style={styles.editAvatar}
                      onPress={() => void changePhoto()}
                      disabled={busy}
                      accessibilityLabel="Change profile picture"
                    >
                      {avatar ? (
                        <Image
                          source={{ uri: avatar }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={styles.avatarInitials}>
                          {initials(profile.fullName)}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editPhotoButton}
                      onPress={() => void changePhoto()}
                      disabled={busy}
                    >
                      <Text style={styles.editPhotoText}>
                        Change Profile Picture
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Student ID</Text>
                    <TextInput
                      style={[styles.input, styles.readOnlyInput]}
                      value={profile.studentId}
                      editable={false}
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                      style={[styles.input, styles.readOnlyInput]}
                      value={profile.username}
                      editable={false}
                    />
                  </View>

                  {(
                    [
                      ["First Name", "firstName"],
                      ["Middle Name", "middleName"],
                      ["Last Name", "lastName"],
                      ["Email", "email"],
                      ["Contact Number", "contactNumber"],
                    ] as const
                  ).map(([label, key]) => (
                    <View style={styles.field} key={key}>
                      <Text style={styles.label}>{label}</Text>
                      <TextInput
                        {...bindFocus(key)}
                        style={[
                          styles.input,
                          focusedField === key && styles.inputFocused,
                        ]}
                        value={draft[key]}
                        onChangeText={(value) =>
                          setDraft((current) => ({
                            ...current,
                            [key]: value,
                          }))
                        }
                        editable={!busy}
                        autoCapitalize={key === "email" ? "none" : "words"}
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
                    <Text style={styles.primaryText}>
                      {busy ? "Saving…" : "Save Changes"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {profile && page === "password" && (
                <>
                  <Text style={styles.passwordHelp}>
                    Use at least eight characters, including an uppercase
                    letter, lowercase letter, number, and special character.
                  </Text>

                  {passwordField(
                    "Current Password",
                    password.currentPassword,
                    (value) =>
                      setPassword((current) => ({
                        ...current,
                        currentPassword: value,
                      })),
                  )}

                  {passwordField(
                    "New Password",
                    password.newPassword,
                    (value) =>
                      setPassword((current) => ({
                        ...current,
                        newPassword: value,
                      })),
                  )}

                  {passwordField(
                    "Confirm New Password",
                    password.confirmPassword,
                    (value) =>
                      setPassword((current) => ({
                        ...current,
                        confirmPassword: value,
                      })),
                  )}

                  <TouchableOpacity
                    style={[styles.primaryButton, busy && styles.disabled]}
                    onPress={() => void changePassword()}
                    disabled={busy}
                  >
                    <Text style={styles.primaryText}>
                      {busy ? "Updating…" : "Update Password"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {profile && page === "about" && (
                <>
                  <View style={styles.aboutLogoArea}>
                    <Image
                      source={require("../../../assets/branding/smartfine-logo.png")}
                      style={styles.aboutLogo}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.aboutHeading}>
                    <Text style={styles.aboutHeadingText}>About SmartFine</Text>
                  </View>

                  <View style={styles.aboutCard}>
                    <Text style={styles.aboutBody}>
                      SmartFine is a mobile application designed to help schools
                      manage student fines digitally. Students can monitor their
                      fines, receive in-app notifications, and show their QR
                      code to a Fines Officer. Administrators and Fines Officers
                      use the system to record and manage fines.
                    </Text>
                  </View>

                  <View style={styles.aboutHeading}>
                    <Text style={styles.aboutHeadingText}>Developed By</Text>
                  </View>

                  <View style={styles.developerCard}>
                    <Image
                      source={require("../../../assets/branding/programmer.jpg")}
                      style={styles.developerPhoto}
                      resizeMode="cover"
                    />

                    <View style={styles.developerInfo}>
                      <Text style={styles.developerName}>Will R. Bitoy</Text>
                      <Text style={styles.developerContact}>REMOVED</Text>
                      <Text style={styles.developerContact}>
                        Email: REMOVED
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {profile && page === "privacy" && (
                <>
                  <View style={styles.textCard}>
                    <Text style={styles.textCardTitle}>Privacy Policy</Text>
                    <Text style={styles.textCardBody}>
                      SmartFine respects the privacy of its users. This policy
                      explains how information is used and handled within the
                      system.
                    </Text>
                  </View>

                  <View style={styles.textCard}>
                    <Text style={styles.textCardTitle}>
                      Information We Collect
                    </Text>
                    <Text style={styles.textCardBody}>
                      SmartFine stores account information such as names,
                      usernames, email addresses, contact numbers, profile
                      pictures, and assigned user roles.
                    </Text>
                  </View>

                  <View style={styles.textCard}>
                    <Text style={styles.textCardTitle}>
                      Student and Fine Records
                    </Text>
                    <Text style={styles.textCardBody}>
                      SmartFine stores student identification information,
                      violation information, fine records, and payment status
                      needed to manage student fines.
                    </Text>
                  </View>

                  <View style={styles.textCard}>
                    <Text style={styles.textCardTitle}>Account Security</Text>
                    <Text style={styles.textCardBody}>
                      Passwords are protected using password hashing. Keep your
                      login credentials private and do not share your password.
                    </Text>
                  </View>

                  <View style={styles.textCard}>
                    <Text style={styles.textCardTitle}>
                      Data Access and Retention
                    </Text>
                    <Text style={styles.textCardBody}>
                      Information is available according to each user's assigned
                      role. Historical records may be retained to preserve
                      account, fine, and payment history.
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </Animated.ScrollView>

        <FloatingTabBar
          items={navigation}
          active="Profile"
          onSelect={(item) => {
            if (item.label === "Profile") {
              setPage("profile");
              return;
            }

            router.push(item.route);
          }}
        />
      </View>

      <Modal
        visible={Boolean(notice)}
        transparent
        animationType="fade"
        onRequestClose={() => setNotice("")}
      >
        <View style={styles.modalOverlay}>
          <PopIn style={styles.modalCard}>
            <Text style={styles.modalTitle}>SmartFine</Text>
            <Text style={styles.modalMessage}>{shownNotice}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setNotice("")}
            >
              <Text style={styles.primaryText}>OK</Text>
            </TouchableOpacity>
          </PopIn>
        </View>
      </Modal>

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
