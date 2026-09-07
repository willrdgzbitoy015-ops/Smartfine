import { useEffect, useState } from "react";

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

import { useLocalSearchParams, useRouter } from "expo-router";

import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";

import DeleteModal from "@/components/deletationmodal";
import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";

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

  created_at: string | null;

  updated_at: string | null;
};

type NavItem = {
  label: string;

  route: string;

  icon: any;
};

// ==========================================
// EDIT OFFICER
// ==========================================

export default function EditOfficer() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const isCompact = width < 600;

  // ==========================================
  // OFFICER ID
  // ==========================================

  const rawId = params.id;

  const officerId = Array.isArray(rawId) ? rawId[0] : rawId;

  // ==========================================
  // PROFILE PICTURE
  // ==========================================

  const [currentProfilePictureUri, setCurrentProfilePictureUri] = useState<
    string | null
  >(null);

  const [newProfilePicture, setNewProfilePicture] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [profileImageFailed, setProfileImageFailed] = useState(false);

  const [removingPicture, setRemovingPicture] = useState(false);

  // ==========================================
  // REMOVE PICTURE MODAL
  // ==========================================

  const [showRemovePictureModal, setShowRemovePictureModal] = useState(false);

  // ==========================================
  // SUCCESS MODAL
  // ==========================================

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successTitle, setSuccessTitle] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [successRedirectRoute, setSuccessRedirectRoute] = useState<
    string | null
  >(null);

  // ==========================================
  // WARNING MODAL
  // ==========================================

  const [showWarningModal, setShowWarningModal] = useState(false);

  const [warningTitle, setWarningTitle] = useState("");

  const [warningMessage, setWarningMessage] = useState("");

  // ==========================================
  // LOGOUT MODAL
  // ==========================================

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==========================================
  // FORM
  // ==========================================

  const [employeeNumber, setEmployeeNumber] = useState("");

  const [username, setUsername] = useState("");

  const [firstName, setFirstName] = useState("");

  const [middleName, setMiddleName] = useState("");

  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [contactNumber, setContactNumber] = useState("");

  const [assignedArea, setAssignedArea] = useState("");

  const [accountActive, setAccountActive] = useState(true);

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

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
  // SHOW WARNING
  // ==========================================

  const showWarning = (title: string, message: string) => {
    setWarningTitle(title);

    setWarningMessage(message);

    setShowWarningModal(true);
  };

  // ==========================================
  // SHOW SUCCESS
  // ==========================================

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

  // ==========================================
  // PROFILE PICTURE URL
  // ==========================================

  const getProfilePictureUrl = (uri: string | null | undefined) => {
    if (!uri) {
      return null;
    }

    const normalizedUri = String(uri).trim();

    if (
      normalizedUri.startsWith("http://") ||
      normalizedUri.startsWith("https://")
    ) {
      return normalizedUri;
    }

    return `${API_BASE}${normalizedUri}`;
  };

  // ==========================================
  // OFFICER INITIALS
  // ==========================================

  const getOfficerInitials = () => {
    const firstInitial = firstName.trim().charAt(0).toUpperCase();

    const lastInitial = lastName.trim().charAt(0).toUpperCase();

    return `${firstInitial}${lastInitial}` || "OF";
  };

  // ==========================================
  // LOAD OFFICER
  // ==========================================

  const loadOfficer = async () => {
    if (!officerId) {
      setErrorMessage("Officer ID is missing.");

      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      setErrorMessage("");

      setProfileImageFailed(false);

      const response = await fetch(`${API_BASE}/api/officers/${officerId}`);

      const data = await response.json();

      console.log("Edit officer response:", data);

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to load officer information.");

        return;
      }

      const officer: Officer = data.officer;

      setCurrentProfilePictureUri(officer.profile_picture_uri || null);

      setNewProfilePicture(null);

      setEmployeeNumber(officer.employee_number || "");

      setUsername(officer.username || "");

      setFirstName(officer.first_name || "");

      setMiddleName(officer.middle_name || "");

      setLastName(officer.last_name || "");

      setEmail(officer.email || "");

      setContactNumber(officer.contact_number || "");

      setAssignedArea(officer.assigned_area || "");

      setAccountActive(
        String(officer.account_status || "").toUpperCase() === "ACTIVE",
      );
    } catch (error) {
      console.error("Load officer error:", error);

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfficer();
  }, [officerId]);

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // ==========================================
  // CHOOSE NEW PROFILE PICTURE
  // ==========================================

  const handleChooseProfilePicture = async () => {
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

      setNewProfilePicture(asset);

      setProfileImageFailed(false);
    } catch (error) {
      console.error("Choose officer picture error:", error);

      showWarning("Photo Error", "Could not select the profile picture.");
    }
  };

  // ==========================================
  // CANCEL NEW PICTURE
  // ==========================================

  const handleCancelNewPicture = () => {
    setNewProfilePicture(null);

    setProfileImageFailed(false);

    clearError();
  };

  // ==========================================
  // UPLOAD NEW PROFILE PICTURE
  // ==========================================

  const uploadProfilePicture = async () => {
    if (!officerId || !newProfilePicture) {
      return null;
    }

    const formData = new FormData();

    if (Platform.OS === "web") {
      if (newProfilePicture.file) {
        formData.append("profilePicture", newProfilePicture.file);
      } else {
        const imageResponse = await fetch(newProfilePicture.uri);

        const blob = await imageResponse.blob();

        const extension = getImageExtension(newProfilePicture);

        formData.append("profilePicture", blob, `officer-profile.${extension}`);
      }
    } else {
      const extension = getImageExtension(newProfilePicture);

      const mimeType = getImageMimeType(newProfilePicture, extension);

      formData.append("profilePicture", {
        uri: newProfilePicture.uri,

        name: newProfilePicture.fileName || `officer-profile.${extension}`,

        type: mimeType,
      } as any);
    }

    const response = await fetch(
      `${API_BASE}/api/officers/${officerId}/profile-picture`,
      {
        method: "POST",

        body: formData,
      },
    );

    const data = await response.json();

    console.log("Update officer profile picture response:", data);

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Could not update officer profile picture.",
      );
    }

    return (
      data.profile_picture_uri || data.officer?.profile_picture_uri || null
    );
  };

  // ==========================================
  // REMOVE PROFILE PICTURE
  // ==========================================

  const performRemoveProfilePicture = async () => {
    if (!officerId) {
      return;
    }

    try {
      setRemovingPicture(true);

      setErrorMessage("");

      const response = await fetch(
        `${API_BASE}/api/officers/${officerId}/profile-picture`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      console.log("Remove officer profile picture response:", data);

      // ======================================
      // FAILED
      // ======================================

      if (!response.ok || !data.success) {
        setShowRemovePictureModal(false);

        showWarning(
          "Unable to Remove Picture",
          data.message || "Could not remove officer profile picture.",
        );

        return;
      }

      // ======================================
      // SUCCESS
      // ======================================

      setCurrentProfilePictureUri(null);

      setNewProfilePicture(null);

      setProfileImageFailed(false);

      setShowRemovePictureModal(false);

      showSuccess(
        "Profile Picture Removed",
        "Officer profile picture removed successfully.",
      );
    } catch (error) {
      console.error("Remove officer profile picture error:", error);

      setShowRemovePictureModal(false);

      showWarning(
        "Unable to Remove Picture",
        "Could not connect to the SmartFine server.",
      );
    } finally {
      setRemovingPicture(false);
    }
  };

  // ==========================================
  // OPEN REMOVE PICTURE MODAL
  // ==========================================

  const handleRemoveProfilePicture = () => {
    if (!currentProfilePictureUri) {
      return;
    }

    setShowRemovePictureModal(true);
  };

  // ==========================================
  // CANCEL REMOVE PICTURE
  // ==========================================

  const handleCancelRemovePicture = () => {
    if (removingPicture) {
      return;
    }

    setShowRemovePictureModal(false);
  };

  // ==========================================
  // SAVE OFFICER
  // ==========================================

  const handleSave = async () => {
    setErrorMessage("");

    if (
      !username.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !contactNumber.trim() ||
      !assignedArea.trim()
    ) {
      setErrorMessage("Please complete all required fields.");

      return;
    }

    if (firstName.trim().length < 2) {
      setErrorMessage("First Name must contain at least 2 characters.");

      return;
    }

    if (lastName.trim().length < 2) {
      setErrorMessage("Last Name must contain at least 2 characters.");

      return;
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9]+$/.test(normalizedUsername)) {
      setErrorMessage("Username may contain letters and numbers only.");

      return;
    }

    if (normalizedUsername.length < 3) {
      setErrorMessage("Username must contain at least 3 characters.");

      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setErrorMessage("Please enter a valid email address.");

      return;
    }

    const normalizedContact = contactNumber.trim();

    if (!/^[0-9]+$/.test(normalizedContact)) {
      setErrorMessage("Contact Number must contain numbers only.");

      return;
    }

    if (normalizedContact.length < 10 || normalizedContact.length > 15) {
      setErrorMessage("Contact Number must contain 10 to 15 digits.");

      return;
    }

    if (assignedArea.trim().length < 2) {
      setErrorMessage("Please enter a valid assigned area.");

      return;
    }

    // Remember whether a new picture was selected
    // before it gets cleared after upload.

    const hadNewProfilePicture = Boolean(newProfilePicture);

    try {
      setSaving(true);

      // ======================================
      // UPDATE OFFICER INFORMATION
      // ======================================

      const response = await fetch(`${API_BASE}/api/officers/${officerId}`, {
        method: "PUT",

        headers: {
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
        }),
      });

      const data = await response.json();

      console.log("Update officer response:", data);

      if (!response.ok || !data.success) {
        setErrorMessage(
          data.message || "Could not update officer information.",
        );

        return;
      }

      // ======================================
      // UPDATE PROFILE PICTURE
      // ======================================

      if (newProfilePicture) {
        try {
          const uploadedUri = await uploadProfilePicture();

          if (uploadedUri) {
            setCurrentProfilePictureUri(uploadedUri);
          }

          setNewProfilePicture(null);

          setProfileImageFailed(false);
        } catch (profileError) {
          console.error(
            "Officer information saved but picture upload failed:",
            profileError,
          );

          const message =
            profileError instanceof Error
              ? profileError.message
              : "Profile picture upload failed.";

          showWarning(
            "Officer Updated with Warning",
            `Officer information was saved successfully, but the profile picture could not be updated. ${message}`,
          );

          return;
        }
      }

      // ======================================
      // SUCCESS
      // ======================================

      const message = hadNewProfilePicture
        ? "Officer information and profile picture updated successfully."
        : "Officer information updated successfully.";

      showSuccess("Officer Updated", message, `/admin/officers/${officerId}`);
    } catch (error) {
      console.error("Update officer error:", error);

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // SUCCESS MODAL CLOSE
  // ==========================================

  const handleSuccessModalClose = () => {
    const redirectRoute = successRedirectRoute;

    setShowSuccessModal(false);

    setSuccessRedirectRoute(null);

    if (redirectRoute) {
      router.replace(redirectRoute as any);
    }
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = () => {
    router.replace(`/admin/officers/${officerId}` as any);
  };

  // ==========================================
  // BACK
  // ==========================================

  const handleBack = () => {
    router.replace(`/admin/officers/${officerId}` as any);
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleNavigation = (item: NavItem) => {
    router.push(item.route as any);
  };

  // ==========================================
  // OPEN LOGOUT MODAL
  // ==========================================

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // ==========================================
  // CANCEL LOGOUT
  // ==========================================

  const handleCancelLogout = () => {
    if (logoutLoading) {
      return;
    }

    setShowLogoutModal(false);
  };

  // ==========================================
  // PERFORM LOGOUT
  // ==========================================

  const performLogout = async () => {
    try {
      setLogoutLoading(true);

      await logout();

      setShowLogoutModal(false);

      router.replace("/login" as any);
    } catch (error) {
      console.error("Logout error:", error);

      setShowLogoutModal(false);

      showWarning("Logout Error", "Could not log out. Please try again.");
    } finally {
      setLogoutLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
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
          </View>
        )}

        <View style={styles.main}>
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#173A73" />

            <Text style={styles.stateText}>Loading officer information...</Text>
          </View>
        </View>
      </View>
    );
  }

  // ==========================================
  // DISPLAY PICTURE
  // ==========================================

  const existingProfilePictureUrl = getProfilePictureUrl(
    currentProfilePictureUri,
  );

  const displayPictureUri = newProfilePicture
    ? newProfilePicture.uri
    : existingProfilePictureUrl;

  const showProfilePicture = Boolean(displayPictureUri) && !profileImageFailed;

  const busy = saving || removingPicture;

  // ==========================================
  // UI
  // ==========================================

  return (
    <View style={styles.screen}>
      {/* ======================================
          SIDEBAR
      ====================================== */}

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
            {navItems.map((item) => {
              const active = item.label === "Officers";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => handleNavigation(item)}
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
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================
          MAIN
      ====================================== */}

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,

            isCompact && styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================
              BACK / PAGE TITLE
          ================================== */}

          <View style={styles.pageHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
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
                numberOfLines={1}
              >
                Edit Officer
              </Text>
            </TouchableOpacity>

            <Text style={[styles.pageSubtitle, styles.headerSubtitle]}>
              Update officer account and assignment information
            </Text>
          </View>

          {/* ==================================
              MOBILE NAV
          ================================== */}

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
                  >
                    <Text
                      style={[
                        styles.mobileNavText,

                        active && styles.mobileNavTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ==================================
              ERROR
          ================================== */}

          {errorMessage !== "" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Unable to Save Changes</Text>

              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* ==================================
              FORM
          ================================== */}

          <View style={styles.formCard}>
            {/* ==================================
                OFFICER INFORMATION
            ================================== */}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Officer Information</Text>

              {/* PROFILE PICTURE */}

              <View
                style={{
                  alignItems: "center",

                  marginBottom: 26,
                }}
              >
                {showProfilePicture ? (
                  <Image
                    source={{
                      uri: displayPictureUri!,
                    }}
                    style={{
                      width: isCompact ? 95 : 115,

                      height: isCompact ? 95 : 115,

                      borderRadius: isCompact ? 48 : 58,

                      backgroundColor: "#E6E8EC",

                      borderWidth: 3,

                      borderColor: "#173A73",
                    }}
                    resizeMode="cover"
                    onError={() => {
                      setProfileImageFailed(true);
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: isCompact ? 95 : 115,

                      height: isCompact ? 95 : 115,

                      borderRadius: isCompact ? 48 : 58,

                      backgroundColor: "#173A73",

                      borderWidth: 3,

                      borderColor: "#D6DFEA",

                      alignItems: "center",

                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",

                        fontSize: isCompact ? 27 : 31,

                        fontWeight: "800",
                      }}
                    >
                      {getOfficerInitials()}
                    </Text>
                  </View>
                )}

                <Text
                  style={{
                    color: "#123266",

                    fontSize: 13,

                    fontWeight: "700",

                    marginTop: 12,
                  }}
                >
                  Profile Picture
                </Text>

                <Text
                  style={{
                    color: "#8C939F",

                    fontSize: 10,

                    textAlign: "center",

                    marginTop: 4,

                    marginBottom: 12,
                  }}
                >
                  JPG, PNG or WEBP • Maximum 5 MB
                </Text>

                <View
                  style={{
                    flexDirection: "row",

                    flexWrap: "wrap",

                    justifyContent: "center",

                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      minWidth: 145,

                      minHeight: 40,

                      borderRadius: 8,

                      paddingHorizontal: 16,

                      backgroundColor: "#173A73",

                      alignItems: "center",

                      justifyContent: "center",

                      opacity: busy ? 0.5 : 1,
                    }}
                    onPress={handleChooseProfilePicture}
                    disabled={busy}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",

                        fontSize: 11,

                        fontWeight: "700",
                      }}
                    >
                      {displayPictureUri ? "Change Picture" : "Add Picture"}
                    </Text>
                  </TouchableOpacity>

                  {newProfilePicture && (
                    <TouchableOpacity
                      style={{
                        minWidth: 125,

                        minHeight: 40,

                        borderRadius: 8,

                        paddingHorizontal: 16,

                        backgroundColor: "#F2F3F5",

                        borderWidth: 1,

                        borderColor: "#CFD4DB",

                        alignItems: "center",

                        justifyContent: "center",

                        opacity: busy ? 0.5 : 1,
                      }}
                      onPress={handleCancelNewPicture}
                      disabled={busy}
                    >
                      <Text
                        style={{
                          color: "#173A73",

                          fontSize: 11,

                          fontWeight: "700",
                        }}
                      >
                        Cancel New Picture
                      </Text>
                    </TouchableOpacity>
                  )}

                  {!newProfilePicture && currentProfilePictureUri && (
                    <TouchableOpacity
                      style={{
                        minWidth: 125,

                        minHeight: 40,

                        borderRadius: 8,

                        paddingHorizontal: 16,

                        backgroundColor: "#FFF0F0",

                        borderWidth: 1,

                        borderColor: "#F3B6B6",

                        alignItems: "center",

                        justifyContent: "center",

                        opacity: busy ? 0.5 : 1,
                      }}
                      onPress={handleRemoveProfilePicture}
                      disabled={busy}
                    >
                      {removingPicture ? (
                        <ActivityIndicator size="small" color="#D32F2F" />
                      ) : (
                        <Text
                          style={{
                            color: "#D32F2F",

                            fontSize: 11,

                            fontWeight: "700",
                          }}
                        >
                          Remove Picture
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {newProfilePicture && (
                  <Text
                    style={{
                      color: "#45B94F",

                      fontSize: 10,

                      fontWeight: "700",

                      marginTop: 10,

                      textAlign: "center",
                    }}
                  >
                    New picture selected. Tap Save Changes to upload it.
                  </Text>
                )}
              </View>

              {/* EMPLOYEE NUMBER */}

              <Text style={styles.label}>Employee Number</Text>

              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{employeeNumber}</Text>
              </View>

              <Text style={styles.helperText}>
                Employee Number is permanent and cannot be changed.
              </Text>

              {/* FIRST + MIDDLE */}

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

              {/* LAST NAME */}

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

              {/* EMAIL */}

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

              {/* CONTACT */}

              <Text style={styles.label}>Contact Number *</Text>

              <TextInput
                style={styles.input}
                value={contactNumber}
                onChangeText={(text) => {
                  const numbersOnly = text.replace(/[^0-9]/g, "");

                  setContactNumber(numbersOnly);

                  clearError();
                }}
                placeholder="09123456789"
                placeholderTextColor="#8C939F"
                keyboardType="phone-pad"
                maxLength={15}
                editable={!busy}
              />

              {/* ASSIGNED AREA */}

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

            {/* ==================================
                ACCOUNT INFORMATION
            ================================== */}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Information</Text>

              {/* USERNAME */}

              <Text style={styles.label}>Username *</Text>

              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(text) => {
                  const cleaned = text.toLowerCase().replace(/[^a-z0-9]/g, "");

                  setUsername(cleaned);

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

              {/* STATUS */}

              <View style={styles.statusCard}>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusLabel}>Account Status</Text>

                  <Text
                    style={[
                      styles.statusValue,

                      accountActive ? styles.activeText : styles.inactiveText,
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
                    setAccountActive(!accountActive);

                    clearError();
                  }}
                  disabled={busy}
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

          {/* ==================================
              ACTIONS
          ================================== */}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={busy}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, busy && styles.saveButtonDisabled]}
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
        </ScrollView>
      </View>

      {/* ======================================
          REMOVE PROFILE PICTURE MODAL
      ====================================== */}

      <DeleteModal
        visible={showRemovePictureModal}
        loading={removingPicture}
        title="Remove Profile Picture?"
        message="Remove this officer profile picture? The officer will return to the initials avatar."
        onCancel={handleCancelRemovePicture}
        onConfirm={performRemoveProfilePicture}
      />

      {/* ======================================
          SUCCESS MODAL
      ====================================== */}

      <SuccessModal
        visible={showSuccessModal}
        title={successTitle}
        message={successMessage}
        buttonText="OK"
        onClose={handleSuccessModalClose}
      />

      {/* ======================================
          WARNING MODAL
      ====================================== */}

      <WarningModal
        visible={showWarningModal}
        title={warningTitle}
        message={warningMessage}
        buttonText="OK"
        onClose={() => {
          setShowWarningModal(false);
        }}
      />

      {/* ======================================
          LOGOUT MODAL
      ====================================== */}

      <LogoutModal
        visible={showLogoutModal}
        loading={logoutLoading}
        onCancel={handleCancelLogout}
        onConfirm={performLogout}
      />
    </View>
  );
}

// ==========================================
// IMAGE EXTENSION
// ==========================================

function getImageExtension(asset: ImagePicker.ImagePickerAsset) {
  const fileName = asset.fileName || "";

  const match = fileName.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);

  if (match?.[1]) {
    const extension = match[1];

    return extension === "jpeg" ? "jpg" : extension;
  }

  const mimeType = String(asset.mimeType || "").toLowerCase();

  if (mimeType.includes("png")) {
    return "png";
  }

  if (mimeType.includes("webp")) {
    return "webp";
  }

  return "jpg";
}

// ==========================================
// IMAGE MIME TYPE
// ==========================================

function getImageMimeType(
  asset: ImagePicker.ImagePickerAsset,
  extension: string,
) {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  switch (extension) {
    case "png":
      return "image/png";

    case "webp":
      return "image/webp";

    default:
      return "image/jpeg";
  }
}
