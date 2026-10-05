import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";

import { API_BASE } from "@/constants/api";
import { AdminNavBadge } from "@/components/notification-badge";
import { useAuth } from "@/hooks/use-auth";

import DeleteModal from "@/components/deletationmodal";
import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";
import { SkeletonForm } from "@/components/skeleton";

import { styles } from "./edit-officer.styles";

// ==========================================
// TYPES
// ==========================================

type Officer = {
  id: number;
  officer_profile_id: number;
  employee_number: string;
  username: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  email: string | null;
  contact_number: string | null;
  assigned_area: string | null;
  account_status: string;
  profile_picture_uri: string | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  passwordChanged?: boolean;
  officer?: Officer;
  profile_picture_uri?: string | null;
};

type NavItem = {
  label: string;
  route: string;
  icon: number;
};

// ==========================================
// NAVIGATION
// ==========================================

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    route: "/admin/dashboard",
    icon: require("../../../../../assets/icons/dashboard.png"),
  },
  {
    label: "Students",
    route: "/admin/students",
    icon: require("../../../../../assets/icons/students.png"),
  },
  {
    label: "Fines",
    route: "/admin/fines",
    icon: require("../../../../../assets/icons/fines.png"),
  },
  {
    label: "QR Scanner",
    route: "/admin/qr-scanner",
    icon: require("../../../../../assets/icons/qr-codeWhite.png"),
  },
  {
    label: "Reports",
    route: "/admin/reports",
    icon: require("../../../../../assets/icons/reports.png"),
  },
  {
    label: "Settings",
    route: "/admin/settings",
    icon: require("../../../../../assets/icons/settings.png"),
  },
  {
    label: "Officers",
    route: "/admin/officers",
    icon: require("../../../../../assets/icons/officers.png"),
  },
];

// ==========================================
// API HELPERS
// ==========================================

async function getAuthHeaders(): Promise<Record<string, string>> {
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

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const raw = await response.text();

  let data: ApiResponse;

  try {
    data = JSON.parse(raw);

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response");
    }
  } catch {
    throw new Error(
      `The server returned an unexpected response (HTTP ${response.status}). Check the backend and API URL.`,
    );
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || `The request failed (HTTP ${response.status}).`,
    );
  }

  return data;
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message === "Failed to fetch" ||
      error.message === "Network request failed"
    ) {
      return "Could not connect to the SmartFine server. Check your backend and API URL.";
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getProfilePictureUrl(uri: string | null | undefined): string | null {
  if (!uri) {
    return null;
  }

  const normalized = uri.trim();

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `${API_BASE.replace(/\/+$/, "")}/${normalized.replace(/^\/+/, "")}`;
}

function getImageExtension(asset: ImagePicker.ImagePickerAsset): string {
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

function getImageMimeType(
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

// ==========================================
// PASSWORD POLICY
// ==========================================

function validatePassword(password: string): string | null {
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

// ==========================================
// EDIT OFFICER
// ==========================================

export default function EditOfficer() {
  const router = useGuardedRouter();

  const params = useLocalSearchParams();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const scrollRef = useRef<ScrollView>(null);

  const saveInProgress = useRef(false);

  const isTablet = width >= 768;

  const isCompact = width < 600;

  const rawId = params.id;

  const officerId = Array.isArray(rawId) ? rawId[0] : rawId;

  // ========================================
  // OFFICER INFORMATION
  // ========================================

  const [employeeNumber, setEmployeeNumber] = useState("");

  const [username, setUsername] = useState("");

  const [firstName, setFirstName] = useState("");

  const [middleName, setMiddleName] = useState("");

  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [contactNumber, setContactNumber] = useState("");

  const [assignedArea, setAssignedArea] = useState("");

  const [accountActive, setAccountActive] = useState(true);

  // ========================================
  // OPTIONAL PASSWORD CHANGE
  // ========================================

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ========================================
  // PROFILE PICTURE
  // ========================================

  const [currentProfilePictureUri, setCurrentProfilePictureUri] = useState<
    string | null
  >(null);

  const [newProfilePicture, setNewProfilePicture] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [profileImageFailed, setProfileImageFailed] = useState(false);

  const [removingPicture, setRemovingPicture] = useState(false);

  const [showRemovePictureModal, setShowRemovePictureModal] = useState(false);

  // ========================================
  // PAGE STATE
  // ========================================

  const [loading, setLoading] = useState(true);

  const [officerLoaded, setOfficerLoaded] = useState(false);

  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // ========================================
  // SUCCESS MODAL
  // ========================================

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successTitle, setSuccessTitle] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [successRedirectRoute, setSuccessRedirectRoute] = useState<
    string | null
  >(null);

  // ========================================
  // WARNING MODAL
  // ========================================

  const [showWarningModal, setShowWarningModal] = useState(false);

  const [warningTitle, setWarningTitle] = useState("");

  const [warningMessage, setWarningMessage] = useState("");

  // ========================================
  // LOGOUT MODAL
  // ========================================

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  const busy = saving || removingPicture || logoutLoading;

  const showWarning = (title: string, message: string) => {
    setWarningTitle(title);
    setWarningMessage(message);
    setShowWarningModal(true);
  };

  const showSuccess = (
    title: string,
    message: string,
    redirectRoute: string | null = null,
  ) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setSuccessRedirectRoute(redirectRoute);
    setShowSuccessModal(true);
  };

  const showSaveError = (message: string) => {
    setErrorMessage(message);

    scrollRef.current?.scrollTo({
      y: 0,
      animated: true,
    });

    showWarning("Unable to Save Changes", message);
  };

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // ========================================
  // LOAD OFFICER
  // ========================================

  useEffect(() => {
    let active = true;

    const loadOfficer = async () => {
      setLoading(true);
      setOfficerLoaded(false);
      setErrorMessage("");

      try {
        if (!officerId || !/^[1-9][0-9]*$/.test(officerId)) {
          throw new Error("Officer ID is missing or invalid.");
        }

        const headers = await getAuthHeaders();

        const response = await fetch(`${API_BASE}/api/officers/${officerId}`, {
          headers,
        });

        const data = await readApiResponse(response);

        if (!data.officer) {
          throw new Error("The server did not return officer information.");
        }

        if (!active) {
          return;
        }

        const officer = data.officer;

        setCurrentProfilePictureUri(officer.profile_picture_uri || null);

        setNewProfilePicture(null);

        setProfileImageFailed(false);

        setEmployeeNumber(officer.employee_number || "");

        setUsername(officer.username || "");

        setFirstName(officer.first_name || "");

        setMiddleName(officer.middle_name || "");

        setLastName(officer.last_name || "");

        setEmail(officer.email || "");

        setContactNumber(officer.contact_number || "");

        setAssignedArea(officer.assigned_area || "");

        setAccountActive(
          String(officer.account_status).toUpperCase() === "ACTIVE",
        );

        setNewPassword("");
        setConfirmPassword("");

        setOfficerLoaded(true);
      } catch (error) {
        if (active) {
          setErrorMessage(errorText(error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOfficer();

    return () => {
      active = false;
    };
  }, [officerId]);

  // ========================================
  // SELECT PROFILE PICTURE
  // ========================================

  const handleChooseProfilePicture = async () => {
    if (busy) {
      return;
    }

    try {
      clearError();

      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          showWarning(
            "Permission Required",

            "Please allow SmartFine to access your photos so you can select an officer profile picture.",
          );

          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],

        allowsEditing: true,

        aspect: [1, 1],

        quality: 0.85,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset) {
        return;
      }

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        showWarning(
          "Picture Too Large",

          "Profile picture must be 5 MB or smaller.",
        );

        return;
      }

      setNewProfilePicture(asset);

      setProfileImageFailed(false);
    } catch (error) {
      showWarning(
        "Photo Error",

        errorText(error),
      );
    }
  };

  const handleCancelNewPicture = () => {
    setNewProfilePicture(null);

    setProfileImageFailed(false);

    clearError();
  };

  // ========================================
  // UPLOAD PROFILE PICTURE
  // ========================================

  const uploadProfilePicture = async (
    asset: ImagePicker.ImagePickerAsset,
  ): Promise<string | null> => {
    const headers = await getAuthHeaders();

    const formData = new FormData();

    if (Platform.OS === "web") {
      if (asset.file) {
        formData.append("profilePicture", asset.file);
      } else {
        const imageResponse = await fetch(asset.uri);

        const blob = await imageResponse.blob();

        const extension = getImageExtension(asset);

        formData.append(
          "profilePicture",
          blob,

          `officer-profile.${extension}`,
        );
      }
    } else {
      const extension = getImageExtension(asset);

      formData.append(
        "profilePicture",

        {
          uri: asset.uri,

          name: asset.fileName || `officer-profile.${extension}`,

          type: getImageMimeType(asset, extension),
        } as any,
      );
    }

    const response = await fetch(
      `${API_BASE}/api/officers/${officerId}/profile-picture`,

      {
        method: "POST",

        headers,

        body: formData,
      },
    );

    const data = await readApiResponse(response);

    return (
      data.profile_picture_uri || data.officer?.profile_picture_uri || null
    );
  };

  // ========================================
  // REMOVE PROFILE PICTURE
  // ========================================

  const performRemoveProfilePicture = async () => {
    if (!officerId || busy) {
      return;
    }

    try {
      setRemovingPicture(true);

      clearError();

      const headers = await getAuthHeaders();

      const response = await fetch(
        `${API_BASE}/api/officers/${officerId}/profile-picture`,

        {
          method: "DELETE",

          headers,
        },
      );

      await readApiResponse(response);

      setCurrentProfilePictureUri(null);

      setNewProfilePicture(null);

      setProfileImageFailed(false);

      setShowRemovePictureModal(false);

      showSuccess(
        "Profile Picture Removed",

        "Officer profile picture removed successfully.",
      );
    } catch (error) {
      setShowRemovePictureModal(false);

      showWarning(
        "Unable to Remove Picture",

        errorText(error),
      );
    } finally {
      setRemovingPicture(false);
    }
  };

  // ========================================
  // SAVE OFFICER
  // ========================================

  const handleSave = async () => {
    if (saveInProgress.current || busy || !officerLoaded) {
      return;
    }

    clearError();

    const normalizedUsername = username.trim().toLowerCase();

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedContact = contactNumber.trim();

    // ====================================
    // REQUIRED FIELDS
    // ====================================

    if (
      !normalizedUsername ||
      !firstName.trim() ||
      !lastName.trim() ||
      !normalizedEmail ||
      !normalizedContact ||
      !assignedArea.trim()
    ) {
      showSaveError("Please complete all required fields.");

      return;
    }

    if (firstName.trim().length < 2) {
      showSaveError("First Name must contain at least 2 characters.");

      return;
    }

    if (lastName.trim().length < 2) {
      showSaveError("Last Name must contain at least 2 characters.");

      return;
    }

    if (!/^[a-z0-9]+$/.test(normalizedUsername)) {
      showSaveError("Username may contain letters and numbers only.");

      return;
    }

    if (normalizedUsername.length < 3) {
      showSaveError("Username must contain at least 3 characters.");

      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showSaveError("Please enter a valid email address.");

      return;
    }

    if (!/^[0-9]{10,15}$/.test(normalizedContact)) {
      showSaveError("Contact Number must contain 10 to 15 digits.");

      return;
    }

    if (assignedArea.trim().length < 2) {
      showSaveError("Please enter a valid assigned area.");

      return;
    }

    // ====================================
    // OPTIONAL PASSWORD CHANGE
    // ====================================

    const changingPassword = newPassword !== "" || confirmPassword !== "";

    if (changingPassword) {
      if (!newPassword || !confirmPassword) {
        showSaveError("New password and confirmation are required.");

        return;
      }

      if (newPassword !== confirmPassword) {
        showSaveError("New password and confirmation do not match.");

        return;
      }

      const passwordError = validatePassword(newPassword);

      if (passwordError) {
        showSaveError(passwordError);

        return;
      }
    }

    // ====================================
    // SAVE
    // ====================================

    saveInProgress.current = true;

    setSaving(true);

    const selectedPicture = newProfilePicture;

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(
        `${API_BASE}/api/officers/${officerId}`,

        {
          method: "PUT",

          headers: {
            ...headers,

            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: normalizedUsername,

            firstName: firstName.trim(),

            middleName: middleName.trim(),

            lastName: lastName.trim(),

            email: normalizedEmail,

            contactNumber: normalizedContact,

            assignedArea: assignedArea.trim(),

            accountStatus: accountActive ? "ACTIVE" : "INACTIVE",

            newPassword,

            confirmPassword,
          }),
        },
      );

      const data = await readApiResponse(response);

      const passwordConfirmed =
        changingPassword && data.passwordChanged === true;

      setNewPassword("");

      setConfirmPassword("");

      setShowNewPassword(false);

      setShowConfirmPassword(false);

      const passwordNotConfirmed = changingPassword && !passwordConfirmed;

      // ==================================
      // PROFILE PICTURE
      // ==================================

      if (selectedPicture) {
        try {
          const uploadedUri = await uploadProfilePicture(selectedPicture);

          if (uploadedUri) {
            setCurrentProfilePictureUri(uploadedUri);
          }

          setNewProfilePicture(null);

          setProfileImageFailed(false);
        } catch (error) {
          const savedMessage = passwordConfirmed
            ? "Officer information and password were saved."
            : "Officer information was saved.";

          showWarning(
            "Officer Updated with Warning",

            `${savedMessage} The profile picture could not be uploaded. ${errorText(
              error,
            )}${
              passwordNotConfirmed
                ? " The server did not confirm the password change; check that officers.js was updated."
                : ""
            }`,
          );

          return;
        }
      }

      if (passwordNotConfirmed) {
        showWarning(
          "Password Change Not Confirmed",

          "Officer information was saved, but the server did not confirm the password change. Make sure the updated officers.js is installed and restart the backend.",
        );

        return;
      }

      const message = passwordConfirmed
        ? selectedPicture
          ? "Officer information, password, and profile picture updated successfully."
          : "Officer information and password updated successfully."
        : selectedPicture
          ? "Officer information and profile picture updated successfully."
          : "Officer information updated successfully.";

      showSuccess(
        "Officer Updated",

        message,

        `/admin/officers/${officerId}`,
      );
    } catch (error) {
      showSaveError(errorText(error));
    } finally {
      saveInProgress.current = false;

      setSaving(false);
    }
  };

  // ========================================
  // NAVIGATION AND MODALS
  // ========================================

  const handleBack = () => {
    if (busy) {
      return;
    }

    if (officerId) {
      router.replace(`/admin/officers/${officerId}` as any);
    } else {
      router.replace("/admin/officers" as any);
    }
  };

  const handleNavigation = (item: NavItem) => {
    if (!busy) {
      router.push(item.route as any);
    }
  };

  const handleSuccessModalClose = () => {
    const redirect = successRedirectRoute;

    setShowSuccessModal(false);

    setSuccessRedirectRoute(null);

    if (redirect) {
      router.replace(redirect as any);
    }
  };

  const performLogout = async () => {
    if (logoutLoading) {
      return;
    }

    try {
      setLogoutLoading(true);

      await logout();

      setShowLogoutModal(false);

      router.replace("/login" as any);
    } catch (error) {
      setShowLogoutModal(false);

      showWarning(
        "Logout Error",

        errorText(error),
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  // ========================================
  // DISPLAY VALUES
  // ========================================

  const initials =
    `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() ||
    "OF";

  const displayPictureUri =
    newProfilePicture?.uri || getProfilePictureUrl(currentProfilePictureUri);

  const showProfilePicture = Boolean(displayPictureUri) && !profileImageFailed;

  // ========================================
  // SCREEN
  // ========================================

  return (
    <View style={styles.screen}>
      {isTablet && (
        <View style={styles.sidebar}>
          <View style={styles.logoArea}>
            <Image
              source={require("../../../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.navigation}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.navItem,

                  item.label === "Officers" && styles.navItemActive,
                ]}
                onPress={() => handleNavigation(item)}
                disabled={busy}
                activeOpacity={0.8}
              >
                <View style={styles.navIconContainer}>
                  <Image
                    source={item.icon}
                    style={styles.navImageIcon}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.navText}>{item.label}</Text>
                <AdminNavBadge label={item.label} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            disabled={busy}
            onPress={() => setShowLogoutModal(true)}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.main}>
        {loading ? (
          <View style={styles.centerState}>
            <SkeletonForm
              label="Loading officer information"
              fields={6}
              style={styles.formSkeleton}
            />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.scrollContent,

              isCompact && styles.scrollContentCompact,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.pageHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Back to Officer Profile"
              >
                <Image
                  source={require("../../../../../assets/icons/back_icon.png")}
                  style={styles.backIconImage}
                  resizeMode="contain"
                />

                <Text
                  style={[styles.backText, isCompact && styles.backTextCompact]}
                >
                  Edit Officer
                </Text>
              </TouchableOpacity>

              <View style={styles.headerSubtitle}>
                <Text style={styles.pageSubtitle}>
                  Update officer information and account settings.
                </Text>
              </View>
            </View>

            {!isTablet && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mobileNav}
              >
                {navItems.map((item) => {
                  const active = item.label === "Officers";

                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.mobileNavItem,

                        active && styles.mobileNavItemActive,
                      ]}
                      onPress={() => handleNavigation(item)}
                      disabled={busy}
                    >
                      <Text
                        style={[
                          styles.mobileNavText,

                          active && styles.mobileNavTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <AdminNavBadge label={item.label} variant="menu" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {errorMessage !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>
                  {officerLoaded
                    ? "Unable to Save Changes"
                    : "Unable to Load Officer"}
                </Text>

                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {officerLoaded && (
              <>
                <View style={styles.formCard}>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Officer Information</Text>

                    <View style={styles.pictureSection}>
                      {showProfilePicture ? (
                        <Image
                          source={{
                            uri: displayPictureUri!,
                          }}
                          style={[
                            styles.profilePicture,

                            isCompact && styles.profilePictureCompact,
                          ]}
                          resizeMode="cover"
                          onError={() => setProfileImageFailed(true)}
                        />
                      ) : (
                        <View
                          style={[
                            styles.profilePicture,

                            styles.profilePlaceholder,

                            isCompact && styles.profilePictureCompact,
                          ]}
                        >
                          <Text style={styles.profileInitials}>{initials}</Text>
                        </View>
                      )}

                      <Text style={styles.pictureLabel}>Profile Picture</Text>

                      <Text style={styles.pictureHint}>
                        JPG, PNG or WEBP • Maximum 5 MB
                      </Text>

                      <View style={styles.pictureActions}>
                        <TouchableOpacity
                          style={[
                            styles.pictureButton,

                            busy && styles.saveButtonDisabled,
                          ]}
                          onPress={handleChooseProfilePicture}
                          disabled={busy}
                        >
                          <Text style={styles.pictureButtonText}>
                            {displayPictureUri
                              ? "Change Picture"
                              : "Add Picture"}
                          </Text>
                        </TouchableOpacity>

                        {newProfilePicture && (
                          <TouchableOpacity
                            style={[
                              styles.pictureButton,

                              styles.cancelPictureButton,

                              busy && styles.saveButtonDisabled,
                            ]}
                            onPress={handleCancelNewPicture}
                            disabled={busy}
                          >
                            <Text style={styles.cancelPictureText}>
                              Cancel New Picture
                            </Text>
                          </TouchableOpacity>
                        )}

                        {!newProfilePicture && currentProfilePictureUri && (
                          <TouchableOpacity
                            style={[
                              styles.pictureButton,

                              styles.removePictureButton,

                              busy && styles.saveButtonDisabled,
                            ]}
                            onPress={() => setShowRemovePictureModal(true)}
                            disabled={busy}
                          >
                            {removingPicture ? (
                              <ActivityIndicator size="small" color="#D32F2F" />
                            ) : (
                              <Text style={styles.removePictureText}>
                                Remove Picture
                              </Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>

                      {newProfilePicture && (
                        <Text style={styles.pictureSelectedText}>
                          New picture selected. Tap Save Changes to upload it.
                        </Text>
                      )}
                    </View>

                    <Text style={styles.label}>Employee Number</Text>

                    <View style={styles.readOnlyBox}>
                      <Text style={styles.readOnlyText}>{employeeNumber}</Text>
                    </View>

                    <Text style={styles.helperText}>
                      Employee Number is permanent and cannot be changed.
                    </Text>

                    <View style={styles.twoColumnRow}>
                      <View style={styles.flexField}>
                        <Text style={styles.label}>First Name *</Text>

                        <TextInput
                          style={styles.input}
                          value={firstName}
                          onChangeText={(text) => {
                            setFirstName(text);

                            clearError();
                          }}
                          placeholder="First name"
                          placeholderTextColor="#8C939F"
                          editable={!busy}
                        />
                      </View>

                      <View style={styles.flexField}>
                        <Text style={styles.label}>Middle Name</Text>

                        <TextInput
                          style={styles.input}
                          value={middleName}
                          onChangeText={(text) => {
                            setMiddleName(text);

                            clearError();
                          }}
                          placeholder="Middle name"
                          placeholderTextColor="#8C939F"
                          editable={!busy}
                        />
                      </View>
                    </View>

                    <Text style={styles.label}>Last Name *</Text>

                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text);

                        clearError();
                      }}
                      placeholder="Last name"
                      placeholderTextColor="#8C939F"
                      editable={!busy}
                    />

                    <Text style={styles.label}>Email Address *</Text>

                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);

                        clearError();
                      }}
                      placeholder="officer@example.com"
                      placeholderTextColor="#8C939F"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                    />

                    <Text style={styles.label}>Contact Number *</Text>

                    <TextInput
                      style={styles.input}
                      value={contactNumber}
                      onChangeText={(text) => {
                        setContactNumber(text.replace(/[^0-9]/g, ""));

                        clearError();
                      }}
                      placeholder="09123456789"
                      placeholderTextColor="#8C939F"
                      keyboardType="phone-pad"
                      maxLength={15}
                      editable={!busy}
                    />

                    <Text style={styles.label}>Assigned Area *</Text>

                    <TextInput
                      style={styles.input}
                      value={assignedArea}
                      onChangeText={(text) => {
                        setAssignedArea(text);

                        clearError();
                      }}
                      placeholder="Example: Main Campus"
                      placeholderTextColor="#8C939F"
                      editable={!busy}
                    />
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Information</Text>

                    <Text style={styles.label}>Username *</Text>

                    <TextInput
                      style={styles.input}
                      value={username}
                      onChangeText={(text) => {
                        setUsername(
                          text.toLowerCase().replace(/[^a-z0-9]/g, ""),
                        );

                        clearError();
                      }}
                      placeholder="Officer username"
                      placeholderTextColor="#8C939F"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                    />

                    <Text style={styles.helperText}>
                      Username is used by the officer to log in to SmartFine.
                    </Text>

                    <View style={styles.passwordSection}>
                      <Text style={styles.passwordTitle}>Change Password</Text>

                      <Text style={styles.passwordHint}>
                        Optional. Leave both fields blank to keep the current
                        password.
                      </Text>

                      <Text style={styles.label}>New Password</Text>

                      <View style={styles.passwordInputRow}>
                        <TextInput
                          style={styles.passwordInput}
                          value={newPassword}
                          onChangeText={(text) => {
                            setNewPassword(text);

                            clearError();
                          }}
                          placeholder="Enter new password"
                          placeholderTextColor="#8C939F"
                          secureTextEntry={!showNewPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!busy}
                        />

                        <TouchableOpacity
                          style={styles.passwordToggle}
                          onPress={() =>
                            setShowNewPassword((current) => !current)
                          }
                          disabled={busy}
                          accessibilityRole="button"
                          accessibilityLabel={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                        >
                          <Image
                            source={
                              showNewPassword
                                ? require("../../../../../assets/icons/hide.png")
                                : require("../../../../../assets/icons/view.png")
                            }
                            style={styles.passwordIcon}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.passwordRules}>
                        At least 8 characters with uppercase, lowercase, number,
                        and special character.
                      </Text>

                      <Text style={styles.label}>Confirm New Password</Text>

                      <View style={styles.passwordInputRow}>
                        <TextInput
                          style={styles.passwordInput}
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);

                            clearError();
                          }}
                          placeholder="Re-enter new password"
                          placeholderTextColor="#8C939F"
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!busy}
                        />

                        <TouchableOpacity
                          style={styles.passwordToggle}
                          onPress={() =>
                            setShowConfirmPassword((current) => !current)
                          }
                          disabled={busy}
                          accessibilityRole="button"
                          accessibilityLabel={
                            showConfirmPassword
                              ? "Hide password confirmation"
                              : "Show password confirmation"
                          }
                        >
                          <Image
                            source={
                              showConfirmPassword
                                ? require("../../../../../assets/icons/hide.png")
                                : require("../../../../../assets/icons/view.png")
                            }
                            style={styles.passwordIcon}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.statusCard}>
                      <View style={styles.statusInfo}>
                        <Text style={styles.statusLabel}>Account Status</Text>

                        <Text
                          style={[
                            styles.statusValue,

                            accountActive
                              ? styles.activeText
                              : styles.inactiveText,
                          ]}
                        >
                          {accountActive ? "Active" : "Inactive"}
                        </Text>

                        <Text style={styles.statusDescription}>
                          {accountActive
                            ? "Officer can log in and use SmartFine."
                            : "Officer cannot log in while this account is inactive."}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.switchTrack,

                          accountActive && styles.switchTrackActive,
                        ]}
                        onPress={() => {
                          setAccountActive((current) => !current);

                          clearError();
                        }}
                        disabled={busy}
                        accessibilityRole="switch"
                        accessibilityLabel="Officer account active"
                        accessibilityState={{
                          checked: accountActive,

                          disabled: busy,
                        }}
                      >
                        <View
                          style={[
                            styles.switchThumb,

                            accountActive && styles.switchThumbActive,
                          ]}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleBack}
                    disabled={busy}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,

                      busy && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={busy}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        )}
      </View>

      <DeleteModal
        visible={showRemovePictureModal}
        loading={removingPicture}
        title="Remove Profile Picture?"
        message="Remove this officer profile picture? The officer will return to the initials avatar."
        onCancel={() => {
          if (!removingPicture) {
            setShowRemovePictureModal(false);
          }
        }}
        onConfirm={performRemoveProfilePicture}
      />

      <SuccessModal
        visible={showSuccessModal}
        title={successTitle}
        message={successMessage}
        buttonText="OK"
        onClose={handleSuccessModalClose}
      />

      <WarningModal
        visible={showWarningModal}
        title={warningTitle}
        message={warningMessage}
        buttonText="OK"
        onClose={() => setShowWarningModal(false)}
      />

      <LogoutModal
        visible={showLogoutModal}
        loading={logoutLoading}
        onCancel={() => {
          if (!logoutLoading) {
            setShowLogoutModal(false);
          }
        }}
        onConfirm={performLogout}
      />
    </View>
  );
}
