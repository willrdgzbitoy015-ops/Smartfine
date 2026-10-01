import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
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
import { AdminNavBadge } from "@/components/notification-badge";

import SuccessModal from "@/components/success-modal";
import { SkeletonForm } from "@/components/skeleton";

import { styles } from "./edit-student.styles";

// ==========================================
// TYPES
// ==========================================

type Student = {
  id: number;

  student_id: string;

  username: string;

  first_name: string;

  middle_name: string | null;

  last_name: string;

  full_name?: string;

  email: string | null;

  contact_number: string | null;

  grade_level: string | null;

  section: string | null;

  account_status: string;

  profile_picture_uri: string | null;
};

type NavItem = {
  label: string;
  route: string;
  icon: any;
};

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
// EDIT STUDENT SCREEN
// ==========================================

export default function EditStudent() {
  const router = useRouter();

  const params = useLocalSearchParams();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const rawId = params.id;

  const studentDatabaseId = Array.isArray(rawId) ? rawId[0] : rawId;

  // ==========================================
  // SUCCESS MODAL
  // ==========================================

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // STUDENT ID
  // ==========================================

  const [studentNumber, setStudentNumber] = useState("");

  // ==========================================
  // PROFILE PICTURE
  // ==========================================

  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(
    null,
  );

  const [selectedProfilePicture, setSelectedProfilePicture] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [removingPicture, setRemovingPicture] = useState(false);

  // ==========================================
  // FORM VALUES
  // ==========================================

  const [username, setUsername] = useState("");

  const [firstName, setFirstName] = useState("");

  const [middleName, setMiddleName] = useState("");

  const [lastName, setLastName] = useState("");

  const [gradeLevel, setGradeLevel] = useState("");

  const [section, setSection] = useState("");

  const [contactNumber, setContactNumber] = useState("");

  const [email, setEmail] = useState("");

  const [accountActive, setAccountActive] = useState(true);

  // ==========================================
  // OPTIONAL PASSWORD CHANGE
  // ==========================================

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==========================================
  // SCREEN STATE
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
  // PROFILE PICTURE URL
  // ==========================================

  const getProfilePictureUrl = (uri: string | null) => {
    if (!uri) {
      return null;
    }

    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      return uri;
    }

    return `${API_BASE}${uri}`;
  };

  // ==========================================
  // DISPLAYED PROFILE PICTURE
  // ==========================================

  const displayedPictureUri = selectedProfilePicture
    ? selectedProfilePicture.uri
    : getProfilePictureUrl(profilePictureUri);

  // ==========================================
  // STUDENT INITIALS
  // ==========================================

  const initials = `${firstName.trim().charAt(0) || ""}${
    lastName.trim().charAt(0) || ""
  }`.toUpperCase();

  // ==========================================
  // LOAD STUDENT
  // ==========================================

  useEffect(() => {
    if (!studentDatabaseId) {
      return;
    }

    loadStudent();
  }, [studentDatabaseId]);

  const loadStudent = async () => {
    try {
      setLoading(true);

      setErrorMessage("");

      const response = await fetch(
        `${API_BASE}/api/students/${studentDatabaseId}`,
      );

      const data = await response.json();

      console.log("Edit student load response:", data);

      if (!response.ok || !data.success || !data.student) {
        setErrorMessage(data.message || "Failed to load student information.");

        return;
      }

      const student: Student = data.student;

      // ======================================
      // PUT DATABASE VALUES INTO FORM
      // ======================================

      setStudentNumber(student.student_id || "");

      setUsername(student.username || "");

      setFirstName(student.first_name || "");

      setMiddleName(student.middle_name || "");

      setLastName(student.last_name || "");

      setGradeLevel(student.grade_level || "");

      setSection(student.section || "");

      setContactNumber(student.contact_number || "");

      setEmail(student.email || "");

      setProfilePictureUri(student.profile_picture_uri || null);

      setSelectedProfilePicture(null);

      setAccountActive(
        String(student.account_status || "").toUpperCase() === "ACTIVE",
      );

      setNewPassword("");

      setConfirmPassword("");

      setShowNewPassword(false);

      setShowConfirmPassword(false);
    } catch (error) {
      console.error("Load student error:", error);

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // ==========================================
  // MESSAGE HELPER
  // ==========================================

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);

      return;
    }

    Alert.alert(title, message);
  };

  // ==========================================
  // SELECT PROFILE PICTURE
  // ==========================================

  const handlePickProfilePicture = async () => {
    try {
      clearError();

      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          showMessage(
            "Permission Required",
            "SmartFine needs access to your photo library to select a student profile picture.",
          );

          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],

        allowsEditing: true,

        aspect: [1, 1],

        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        showMessage("Image Too Large", "Profile picture must not exceed 5 MB.");

        return;
      }

      setSelectedProfilePicture(asset);
    } catch (error) {
      console.error("Pick profile picture error:", error);

      showMessage("Profile Picture", "Could not select the profile picture.");
    }
  };

  // ==========================================
  // CANCEL SELECTED NEW PICTURE
  // ==========================================

  const handleCancelSelectedPicture = () => {
    setSelectedProfilePicture(null);
  };

  // ==========================================
  // UPLOAD PROFILE PICTURE
  // ==========================================

  const uploadProfilePicture = async () => {
    if (!studentDatabaseId || !selectedProfilePicture) {
      return {
        success: true,
      };
    }

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        if (selectedProfilePicture.file) {
          formData.append("profilePicture", selectedProfilePicture.file);
        } else {
          const fileResponse = await fetch(selectedProfilePicture.uri);

          const blob = await fileResponse.blob();

          const fileName =
            selectedProfilePicture.fileName ||
            `student-${studentDatabaseId}.jpg`;

          formData.append("profilePicture", blob, fileName);
        }
      } else {
        const fileName =
          selectedProfilePicture.fileName || `student-${studentDatabaseId}.jpg`;

        const mimeType = selectedProfilePicture.mimeType || "image/jpeg";

        formData.append("profilePicture", {
          uri: selectedProfilePicture.uri,

          name: fileName,

          type: mimeType,
        } as any);
      }

      const response = await fetch(
        `${API_BASE}/api/students/${studentDatabaseId}/profile-picture`,
        {
          method: "POST",

          body: formData,
        },
      );

      const data = await response.json();

      console.log("Edit profile picture upload:", data);

      if (!response.ok || !data.success) {
        return {
          success: false,

          message: data.message || "Could not upload the profile picture.",
        };
      }

      setProfilePictureUri(data.profilePictureUri || null);

      setSelectedProfilePicture(null);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Upload profile picture error:", error);

      return {
        success: false,

        message:
          "Student information was saved, but the profile picture could not be uploaded.",
      };
    }
  };

  // ==========================================
  // REMOVE CURRENT PROFILE PICTURE
  // ==========================================

  const performRemoveProfilePicture = async () => {
    if (!studentDatabaseId) {
      return;
    }

    try {
      setRemovingPicture(true);

      const response = await fetch(
        `${API_BASE}/api/students/${studentDatabaseId}/profile-picture`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      console.log("Remove profile picture response:", data);

      if (!response.ok || !data.success) {
        showMessage(
          "Remove Profile Picture",
          data.message || "Could not remove the profile picture.",
        );

        return;
      }

      setProfilePictureUri(null);

      setSelectedProfilePicture(null);

      showMessage(
        "Profile Picture Removed",
        "The student profile picture was removed successfully.",
      );
    } catch (error) {
      console.error("Remove profile picture error:", error);

      showMessage(
        "Connection Error",
        "Could not connect to the SmartFine server.",
      );
    } finally {
      setRemovingPicture(false);
    }
  };

  // ==========================================
  // CONFIRM REMOVE
  // ==========================================

  const handleRemoveProfilePicture = () => {
    if (!profilePictureUri) {
      return;
    }

    const message =
      "Are you sure you want to remove this student profile picture?";

    if (Platform.OS === "web") {
      const confirmed = window.confirm(message);

      if (confirmed) {
        performRemoveProfilePicture();
      }

      return;
    }

    Alert.alert(
      "Remove Profile Picture",

      message,

      [
        {
          text: "Cancel",

          style: "cancel",
        },

        {
          text: "Remove",

          style: "destructive",

          onPress: performRemoveProfilePicture,
        },
      ],
    );
  };

  // ==========================================
  // USERNAME CHANGE
  // ==========================================

  const handleUsernameChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9]/g, "");

    setUsername(cleaned);

    clearError();
  };

  // ==========================================
  // SAVE STUDENT
  // ==========================================

  const handleSave = async () => {
    setErrorMessage("");

    if (
      !username.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !gradeLevel.trim() ||
      !section.trim() ||
      !contactNumber.trim() ||
      !email.trim()
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

    const usernamePattern = /^[a-z0-9]+$/;

    if (!usernamePattern.test(normalizedUsername)) {
      setErrorMessage("Username may contain letters and numbers only.");

      return;
    }

    if (normalizedUsername.length < 3) {
      setErrorMessage("Username must contain at least 3 characters.");

      return;
    }

    const normalizedContact = contactNumber.trim().replace(/[^0-9]/g, "");

    if (!/^[0-9]+$/.test(normalizedContact)) {
      setErrorMessage("Contact Number must contain numbers only.");

      return;
    }

    if (normalizedContact.length < 10 || normalizedContact.length > 15) {
      setErrorMessage("Contact Number must contain 10 to 15 digits.");

      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setErrorMessage("Please enter a valid email address.");

      return;
    }

    // ======================================
    // OPTIONAL PASSWORD CHANGE
    // ======================================

    const changingPassword = newPassword !== "" || confirmPassword !== "";

    if (changingPassword) {
      if (!newPassword || !confirmPassword) {
        setErrorMessage("New password and confirmation are required.");

        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMessage("New password and confirmation do not match.");

        return;
      }

      const passwordError = validatePassword(newPassword);

      if (passwordError) {
        setErrorMessage(passwordError);

        return;
      }
    }

    try {
      setSaving(true);

      const hadNewProfilePicture = Boolean(selectedProfilePicture);

      const response = await fetch(
        `${API_BASE}/api/students/${studentDatabaseId}`,
        {
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

            gradeLevel: gradeLevel.trim(),

            section: section.trim(),

            accountStatus: accountActive ? "ACTIVE" : "INACTIVE",

            newPassword,

            confirmPassword,
          }),
        },
      );

      const data = await response.json();

      console.log("Update student response:", data);

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Could not update student.");

        return;
      }

      const passwordChanged = changingPassword && data.passwordChanged === true;

      setNewPassword("");

      setConfirmPassword("");

      setShowNewPassword(false);

      setShowConfirmPassword(false);

      // ======================================
      // PROFILE PICTURE UPLOAD
      // ======================================

      if (selectedProfilePicture) {
        const uploadResult = await uploadProfilePicture();

        if (!uploadResult.success) {
          showPartialSuccess(
            uploadResult.message ||
              "The profile picture could not be uploaded.",
          );

          return;
        }
      }

      // ======================================
      // SUCCESS
      // ======================================

      showSuccess(hadNewProfilePicture, passwordChanged);
    } catch (error) {
      console.error("Update student error:", error);

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // FULL SUCCESS
  // ==========================================

  const showSuccess = (
    profilePictureUpdated: boolean,
    passwordChanged: boolean,
  ) => {
    let message = "Student information updated successfully.";

    if (passwordChanged && profilePictureUpdated) {
      message =
        "Student information, password, and profile picture updated successfully.";
    } else if (passwordChanged) {
      message = "Student information and password updated successfully.";
    } else if (profilePictureUpdated) {
      message = "Student information and profile picture updated successfully.";
    }

    setSuccessMessage(message);

    setShowSuccessModal(true);
  };

  // ==========================================
  // SUCCESS MODAL CLOSE
  // ==========================================

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);

    router.replace(`/admin/students/${studentDatabaseId}` as any);
  };

  // ==========================================
  // PARTIAL SUCCESS
  // ==========================================

  const showPartialSuccess = (pictureError: string) => {
    const message =
      `Student information was updated successfully, but the profile picture could not be updated.\n\n` +
      pictureError;

    if (Platform.OS === "web") {
      window.alert(message);

      return;
    }

    Alert.alert("Student Updated", message);
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = () => {
    router.replace(`/admin/students/${studentDatabaseId}` as any);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const performLogout = async () => {
    try {
      await logout();

      router.replace("/login" as any);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to log out?");

      if (confirmed) {
        performLogout();
      }

      return;
    }

    Alert.alert(
      "Log Out",

      "Are you sure you want to log out?",

      [
        {
          text: "Cancel",

          style: "cancel",
        },

        {
          text: "Log Out",

          style: "destructive",

          onPress: performLogout,
        },
      ],
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <SkeletonForm
          label="Loading student information"
          fields={6}
          style={styles.formSkeleton}
        />
      </View>
    );
  }

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
              const active = item.label === "Students";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => router.push(item.route as any)}
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
              );
            })}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================
          MAIN
      ====================================== */}

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================
              BACK BUTTON
          ================================== */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to Student Profile"
          >
            <View style={styles.backIconContainer}>
              <Image
                source={require("../../../../../assets/icons/back_icon.png")}
                style={styles.backIconImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.backText} numberOfLines={1}>
              Student Profile
            </Text>
          </TouchableOpacity>

          {/* ==================================
              MOBILE NAV
          ================================== */}

          {!isTablet && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileNav}
            >
              {navItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.mobileNavItem,

                    item.label === "Students" && styles.mobileNavItemActive,
                  ]}
                  onPress={() => router.push(item.route as any)}
                >
                  <Text
                    style={[
                      styles.mobileNavText,

                      item.label === "Students" && styles.mobileNavTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <AdminNavBadge label={item.label} variant="menu" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ==================================
              HEADER
          ================================== */}

          <View style={styles.header}>
            <Text style={styles.pageTitle}>Edit Student Information</Text>

            <Text style={styles.subtitle}>
              Update student, profile picture, and account information
            </Text>
          </View>

          {/* ==================================
              PROFILE PICTURE CARD
          ================================== */}

          <View
            style={{
              width: "100%",
              maxWidth: 1100,
              alignSelf: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 15,
              padding: 24,
              marginBottom: 22,
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 22,
            }}
          >
            {displayedPictureUri ? (
              <Image
                source={{
                  uri: displayedPictureUri,
                }}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  backgroundColor: "#E8E8E8",
                }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  backgroundColor: "#173A73",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 30,
                    fontWeight: "800",
                  }}
                >
                  {initials || "ST"}
                </Text>
              </View>
            )}

            <View
              style={{
                flex: 1,
                minWidth: 240,
              }}
            >
              <Text
                style={{
                  color: "#123266",
                  fontSize: 18,
                  fontWeight: "800",
                  marginBottom: 5,
                }}
              >
                Profile Picture
              </Text>

              <Text
                style={{
                  color: "#8C939F",
                  fontSize: 11,
                  lineHeight: 17,
                  marginBottom: 15,
                }}
              >
                JPG, PNG, or WEBP. Maximum file size is 5 MB.
              </Text>

              {selectedProfilePicture && (
                <Text
                  style={{
                    color: "#45B94F",
                    fontSize: 11,
                    fontWeight: "700",
                    marginBottom: 12,
                  }}
                >
                  New picture selected. Click Save Changes to upload it.
                </Text>
              )}

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <TouchableOpacity
                  style={{
                    minWidth: 170,
                    height: 42,
                    borderRadius: 8,
                    backgroundColor: "#173A73",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 16,
                    opacity: saving || removingPicture ? 0.5 : 1,
                  }}
                  onPress={handlePickProfilePicture}
                  disabled={saving || removingPicture}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: "800",
                    }}
                  >
                    {profilePictureUri
                      ? "Change Profile Picture"
                      : "Add Profile Picture"}
                  </Text>
                </TouchableOpacity>

                {selectedProfilePicture && (
                  <TouchableOpacity
                    style={{
                      minWidth: 150,
                      height: 42,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#173A73",
                      backgroundColor: "#FFFFFF",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 16,
                    }}
                    onPress={handleCancelSelectedPicture}
                    disabled={saving}
                  >
                    <Text
                      style={{
                        color: "#173A73",
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      Cancel New Picture
                    </Text>
                  </TouchableOpacity>
                )}

                {profilePictureUri && !selectedProfilePicture && (
                  <TouchableOpacity
                    style={{
                      minWidth: 170,
                      height: 42,
                      borderRadius: 8,
                      backgroundColor: "#D32F2F",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 16,
                      opacity: removingPicture ? 0.5 : 1,
                    }}
                    onPress={handleRemoveProfilePicture}
                    disabled={removingPicture || saving}
                  >
                    {removingPicture ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: "800",
                        }}
                      >
                        Remove Profile Picture
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* ==================================
              FORM
          ================================== */}

          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Student Information</Text>

              <Text style={styles.label}>Student ID</Text>

              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{studentNumber}</Text>
              </View>

              <Text style={styles.note}>
                Student ID is permanent and cannot be changed.
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
                    editable={!saving}
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
                    editable={!saving}
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
                editable={!saving}
              />

              <View style={styles.twoColumnRow}>
                <View style={styles.flexField}>
                  <Text style={styles.label}>Grade Level *</Text>

                  <TextInput
                    style={styles.input}
                    value={gradeLevel}
                    onChangeText={(text) => {
                      setGradeLevel(text);

                      clearError();
                    }}
                    editable={!saving}
                  />
                </View>

                <View style={styles.flexField}>
                  <Text style={styles.label}>Section *</Text>

                  <TextInput
                    style={styles.input}
                    value={section}
                    onChangeText={(text) => {
                      setSection(text);

                      clearError();
                    }}
                    editable={!saving}
                  />
                </View>
              </View>

              <Text style={styles.label}>Contact Number *</Text>

              <TextInput
                style={styles.input}
                value={contactNumber}
                onChangeText={(text) => {
                  const numbersOnly = text.replace(/[^0-9]/g, "");

                  setContactNumber(numbersOnly);

                  clearError();
                }}
                keyboardType="phone-pad"
                maxLength={15}
                editable={!saving}
              />

              <Text style={styles.label}>Email Address *</Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);

                  clearError();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
            </View>

            {/* ==================================
                ACCOUNT INFORMATION
            ================================== */}

            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Account Information</Text>

              <Text style={styles.label}>Username *</Text>

              <TextInput
                style={styles.input}
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />

              <Text style={styles.note}>
                Username is editable and is used by the student when logging in.
              </Text>

              {/* ==================================
                  ACCOUNT STATUS
              ================================== */}

              <View style={styles.statusCard}>
                <View>
                  <Text style={styles.statusLabel}>Account Status</Text>

                  <Text
                    style={[
                      styles.statusValue,

                      accountActive
                        ? styles.statusActive
                        : styles.statusInactive,
                    ]}
                  >
                    {accountActive ? "Active" : "Inactive"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.switchTrack,

                    accountActive && styles.switchTrackActive,
                  ]}
                  onPress={() => setAccountActive(!accountActive)}
                  disabled={saving}
                >
                  <View
                    style={[
                      styles.switchThumb,

                      accountActive && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.statusExplanation}>
                Inactive students cannot log in to SmartFine. Their existing
                fine and payment records are preserved.
              </Text>

              {/* ==================================
                  CHANGE PASSWORD
              ================================== */}

              <View style={styles.securityBox}>
                <Text style={styles.securityTitle}>Change Password</Text>

                <Text style={styles.securityText}>
                  Optional. Leave both fields blank to keep the current
                  password.
                </Text>

                {/* NEW PASSWORD */}

                <Text style={styles.label}>New Password</Text>

                <View
                  style={{
                    width: "100%",
                    position: "relative",
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        paddingRight: 52,
                      },
                    ]}
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
                    editable={!saving}
                  />

                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      right: 14,
                      top: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                    }}
                    onPress={() => setShowNewPassword((current) => !current)}
                    disabled={saving}
                    activeOpacity={0.7}
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
                      style={{
                        width: 20,
                        height: 20,
                      }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.note}>
                  Minimum 8 characters with uppercase, lowercase, number, and
                  special character.
                </Text>

                {/* CONFIRM NEW PASSWORD */}

                <Text style={styles.label}>Confirm New Password</Text>

                <View
                  style={{
                    width: "100%",
                    position: "relative",
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        paddingRight: 52,
                      },
                    ]}
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
                    editable={!saving}
                  />

                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      right: 14,
                      top: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                    }}
                    onPress={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    disabled={saving}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    <Image
                      source={
                        showConfirmPassword
                          ? require("../../../../../assets/icons/hide.png")
                          : require("../../../../../assets/icons/view.png")
                      }
                      style={{
                        width: 20,
                        height: 20,
                      }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

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
              ACTIONS
          ================================== */}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving || removingPicture}
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
          SMARTFINE SUCCESS MODAL
      ====================================== */}

      <SuccessModal
        visible={showSuccessModal}
        title="Student Updated"
        message={successMessage}
        buttonText="OK"
        onClose={handleSuccessModalClose}
      />
    </View>
  );
}
