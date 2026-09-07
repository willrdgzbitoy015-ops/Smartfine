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

import { useRouter } from "expo-router";

import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";

import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";

import { styles } from "./add-officer.styles";

// ==========================================
// TYPES
// ==========================================

type NavItem = {
  label: string;

  route: string;

  icon?: any;
};

// ==========================================
// USERNAME SUGGESTION
// ==========================================

function generateSuggestedUsername(firstName: string, lastName: string) {
  const cleanFirstName = firstName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const cleanLastName = lastName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!cleanFirstName || !cleanLastName) {
    return "";
  }

  return cleanFirstName.charAt(0) + cleanLastName;
}

// ==========================================
// ADD OFFICER
// ==========================================

export default function AddOfficer() {
  const router = useRouter();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // ==========================================
  // PROFILE PICTURE
  // ==========================================

  const [profilePicture, setProfilePicture] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  // ==========================================
  // EMPLOYEE NUMBER
  // ==========================================

  const [employeeNumber, setEmployeeNumber] = useState("");

  const [employeeNumberLoading, setEmployeeNumberLoading] = useState(true);

  // ==========================================
  // OFFICER INFORMATION
  // ==========================================

  const [firstName, setFirstName] = useState("");

  const [middleName, setMiddleName] = useState("");

  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");

  const [contactNumber, setContactNumber] = useState("");

  const [assignedArea, setAssignedArea] = useState("");

  // ==========================================
  // ACCOUNT INFORMATION
  // ==========================================

  const [username, setUsername] = useState("");

  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [accountActive, setAccountActive] = useState(true);

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // SUCCESS MODAL
  // ==========================================

  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const [warningRedirectRoute, setWarningRedirectRoute] = useState<
    string | null
  >(null);

  // ==========================================
  // LOGOUT MODAL
  // ==========================================

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: NavItem[] = [
    {
      label: "Dashboard",

      route: "/admin/dashboard",

      icon: require("../../../../assets/icons/dashboard.png"),
    },

    {
      label: "Students",

      route: "/admin/students",

      icon: require("../../../../assets/icons/students.png"),
    },

    {
      label: "Fines",

      route: "/admin/fines",

      icon: require("../../../../assets/icons/fines.png"),
    },

    {
      label: "QR Scanner",

      route: "/admin/qr-scanner",

      icon: require("../../../../assets/icons/qr-codeWhite.png"),
    },

    {
      label: "Reports",

      route: "/admin/reports",

      icon: require("../../../../assets/icons/reports.png"),
    },

    {
      label: "Settings",

      route: "/admin/settings",

      icon: require("../../../../assets/icons/settings.png"),
    },

    {
      label: "Officers",

      route: "/admin/officers",

      icon: require("../../../../assets/icons/officers.png"),
    },
  ];

  // ==========================================
  // LOAD NEXT EMPLOYEE NUMBER
  // ==========================================

  const loadNextEmployeeNumber = async () => {
    try {
      setEmployeeNumberLoading(true);

      setErrorMessage("");

      const response = await fetch(`${API_BASE}/api/officers/next-id`);

      const data = await response.json();

      console.log("Next employee number:", data);

      if (!response.ok || !data.success) {
        setEmployeeNumber("");

        setErrorMessage(data.message || "Could not generate employee number.");

        return;
      }

      setEmployeeNumber(data.employeeNumber || "");
    } catch (error) {
      console.error("Employee number error:", error);

      setEmployeeNumber("");

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setEmployeeNumberLoading(false);
    }
  };

  useEffect(() => {
    loadNextEmployeeNumber();
  }, []);

  // ==========================================
  // AUTOMATIC USERNAME
  // ==========================================

  useEffect(() => {
    if (usernameManuallyEdited) {
      return;
    }

    const suggestion = generateSuggestedUsername(firstName, lastName);

    setUsername(suggestion);
  }, [firstName, lastName, usernameManuallyEdited]);

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // ==========================================
  // PROFILE INITIALS
  // ==========================================

  const getOfficerInitials = () => {
    const firstInitial = firstName.trim().charAt(0).toUpperCase();

    const lastInitial = lastName.trim().charAt(0).toUpperCase();

    return `${firstInitial}${lastInitial}` || "OF";
  };

  // ==========================================
  // SHOW WARNING
  // ==========================================

  const showWarning = (
    title: string,
    message: string,
    redirectRoute: string | null = null,
  ) => {
    setWarningTitle(title);

    setWarningMessage(message);

    setWarningRedirectRoute(redirectRoute);

    setShowWarningModal(true);
  };

  // ==========================================
  // SELECT PROFILE PICTURE
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

      const selectedAsset = result.assets?.[0];

      if (!selectedAsset) {
        return;
      }

      setProfilePicture(selectedAsset);
    } catch (error) {
      console.error("Choose officer profile picture error:", error);

      showWarning("Photo Error", "Could not select the profile picture.");
    }
  };

  // ==========================================
  // REMOVE SELECTED PICTURE
  // ==========================================

  const handleRemoveSelectedPicture = () => {
    setProfilePicture(null);

    clearError();
  };

  // ==========================================
  // UPLOAD PROFILE PICTURE
  // ==========================================

  const uploadOfficerProfilePicture = async (officerId: number) => {
    if (!profilePicture) {
      return;
    }

    const formData = new FormData();

    if (Platform.OS === "web") {
      if (profilePicture.file) {
        formData.append("profilePicture", profilePicture.file);
      } else {
        const imageResponse = await fetch(profilePicture.uri);

        const blob = await imageResponse.blob();

        const extension = getImageExtension(profilePicture);

        formData.append("profilePicture", blob, `officer-profile.${extension}`);
      }
    } else {
      const extension = getImageExtension(profilePicture);

      const mimeType = getImageMimeType(profilePicture, extension);

      formData.append("profilePicture", {
        uri: profilePicture.uri,

        name: profilePicture.fileName || `officer-profile.${extension}`,

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

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Officer account was created, but the profile picture could not be uploaded.",
      );
    }
  };

  // ==========================================
  // CREATE OFFICER
  // ==========================================

  const handleCreateOfficer = async () => {
    setErrorMessage("");

    if (!employeeNumber) {
      setErrorMessage(
        "Employee Number is not available. Please reload the page.",
      );

      return;
    }

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !contactNumber.trim() ||
      !assignedArea.trim() ||
      !username.trim() ||
      !password ||
      !confirmPassword
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

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
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

    if (password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");

      return;
    }

    if (!/[A-Za-z]/.test(password)) {
      setErrorMessage("Password must contain at least one letter.");

      return;
    }

    if (!/[0-9]/.test(password)) {
      setErrorMessage("Password must contain at least one number.");

      return;
    }

    if (!/[^A-Za-z0-9\s]/.test(password)) {
      setErrorMessage(
        "Password must contain at least one special character such as !, @, #, $, %, or &.",
      );

      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Password and Confirm Password do not match.");

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/officers`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: normalizedUsername,

          firstName: firstName.trim(),

          middleName: middleName.trim(),

          lastName: lastName.trim(),

          email: email.trim().toLowerCase(),

          contactNumber: normalizedContact,

          assignedArea: assignedArea.trim(),

          password,

          accountStatus: accountActive ? "ACTIVE" : "INACTIVE",
        }),
      });

      const data = await response.json();

      console.log("Create officer response:", data);

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Could not create officer account.");

        return;
      }

      const createdOfficerId = Number(data.officer?.id);

      const createdEmployeeNumber =
        data.officer?.employeeNumber ||
        data.officer?.employee_number ||
        employeeNumber;

      const createdUsername = data.officer?.username || normalizedUsername;

      // ======================================
      // PROFILE PICTURE
      // ======================================

      if (
        profilePicture &&
        Number.isInteger(createdOfficerId) &&
        createdOfficerId > 0
      ) {
        try {
          await uploadOfficerProfilePicture(createdOfficerId);
        } catch (profileError) {
          console.error(
            "Officer was created but profile upload failed:",
            profileError,
          );

          const profileMessage =
            profileError instanceof Error
              ? profileError.message
              : "Profile picture could not be uploaded.";

          handlePartialSuccess(
            createdOfficerId,
            createdEmployeeNumber,
            createdUsername,
            profileMessage,
          );

          return;
        }
      }

      // ======================================
      // SUCCESS
      // ======================================

      handleSuccess(createdOfficerId, createdEmployeeNumber, createdUsername);
    } catch (error) {
      console.error("Create officer error:", error);

      setErrorMessage("Could not connect to the SmartFine server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SUCCESS
  // ==========================================

  const handleSuccess = (
    createdOfficerId: number,
    createdEmployeeNumber: string,
    createdUsername: string,
  ) => {
    const pictureMessage = profilePicture ? "\nProfile Picture: Uploaded" : "";

    const message =
      `Officer account created successfully.\n\n` +
      `Employee Number: ${createdEmployeeNumber}\n` +
      `Username: ${createdUsername}` +
      pictureMessage;

    const redirectRoute =
      Number.isInteger(createdOfficerId) && createdOfficerId > 0
        ? `/admin/officers/${createdOfficerId}`
        : "/admin/officers";

    setSuccessMessage(message);

    setSuccessRedirectRoute(redirectRoute);

    setShowSuccessModal(true);
  };

  // ==========================================
  // PARTIAL SUCCESS
  // ==========================================

  const handlePartialSuccess = (
    createdOfficerId: number,
    createdEmployeeNumber: string,
    createdUsername: string,
    profileError: string,
  ) => {
    const message =
      `The officer account was created successfully, but the profile picture could not be uploaded.\n\n` +
      `Employee Number: ${createdEmployeeNumber}\n` +
      `Username: ${createdUsername}\n\n` +
      `${profileError}\n\n` +
      `You can add the picture later from Edit Officer.`;

    const redirectRoute =
      Number.isInteger(createdOfficerId) && createdOfficerId > 0
        ? `/admin/officers/${createdOfficerId}`
        : "/admin/officers";

    showWarning("Officer Created with Warning", message, redirectRoute);
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
  // WARNING MODAL CLOSE
  // ==========================================

  const handleWarningModalClose = () => {
    const redirectRoute = warningRedirectRoute;

    setShowWarningModal(false);

    setWarningRedirectRoute(null);

    if (redirectRoute) {
      router.replace(redirectRoute as any);
    }
  };

  // ==========================================
  // CANCEL / BACK
  // ==========================================

  const handleCancel = () => {
    router.replace("/admin/officers" as any);
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleNavigation = (item: NavItem) => {
    router.push(item.route as any);
  };

  // ==========================================
  // OPEN LOGOUT
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
              source={require("../../../../assets/branding/smartfineNoBG.png")}
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================
              BACK / PAGE TITLE
          ================================== */}

          <View
            style={{
              width: "100%",

              maxWidth: 1000,

              alignSelf: "center",

              marginBottom: 28,
            }}
          >
            <TouchableOpacity
              style={{
                alignSelf: "flex-start",

                flexDirection: "row",

                alignItems: "center",

                maxWidth: "100%",

                minHeight: 44,
              }}
              onPress={handleCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back to Officers"
            >
              <Image
                source={require("../../../../assets/icons/back_icon.png")}
                style={{
                  width: 22,

                  height: 22,

                  marginRight: 10,

                  flexShrink: 0,

                  transform: [
                    {
                      rotate: "180deg",
                    },
                  ],
                }}
                resizeMode="contain"
              />

              <Text
                style={{
                  color: "#123266",

                  fontSize: width < 600 ? 18 : 20,

                  fontWeight: "800",

                  flexShrink: 1,
                }}
                numberOfLines={1}
              >
                Add New Officer
              </Text>
            </TouchableOpacity>

            <Text
              style={[
                styles.subtitle,

                {
                  marginLeft: 32,
                },
              ]}
            >
              Create a new SmartFine fines officer account
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
              FORM
          ================================== */}

          <View style={styles.formContainer}>
            {/* ==================================
                OFFICER INFORMATION
            ================================== */}

            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Officer Information</Text>

              {/* PROFILE PICTURE */}

              <View
                style={{
                  alignItems: "center",

                  marginBottom: 24,
                }}
              >
                {profilePicture ? (
                  <Image
                    source={{
                      uri: profilePicture.uri,
                    }}
                    style={{
                      width: 110,

                      height: 110,

                      borderRadius: 55,

                      backgroundColor: "#E6E8EC",

                      borderWidth: 3,

                      borderColor: "#173A73",
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

                      borderWidth: 3,

                      borderColor: "#D6DFEA",
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",

                        fontSize: 30,

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
                  Optional • JPG, PNG or WEBP • Maximum 5 MB
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
                      minWidth: 150,

                      height: 40,

                      paddingHorizontal: 16,

                      borderRadius: 8,

                      backgroundColor: "#173A73",

                      alignItems: "center",

                      justifyContent: "center",

                      opacity: loading ? 0.5 : 1,
                    }}
                    onPress={handleChooseProfilePicture}
                    disabled={loading}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",

                        fontSize: 11,

                        fontWeight: "700",
                      }}
                    >
                      {profilePicture ? "Change Picture" : "Choose Picture"}
                    </Text>
                  </TouchableOpacity>

                  {profilePicture && (
                    <TouchableOpacity
                      style={{
                        minWidth: 100,

                        height: 40,

                        paddingHorizontal: 16,

                        borderRadius: 8,

                        backgroundColor: "#F2F3F5",

                        borderWidth: 1,

                        borderColor: "#CFD4DB",

                        alignItems: "center",

                        justifyContent: "center",

                        opacity: loading ? 0.5 : 1,
                      }}
                      onPress={handleRemoveSelectedPicture}
                      disabled={loading}
                    >
                      <Text
                        style={{
                          color: "#D32F2F",

                          fontSize: 11,

                          fontWeight: "700",
                        }}
                      >
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* EMPLOYEE NUMBER */}

              <Text style={styles.label}>Employee Number</Text>

              <View style={styles.readOnlyBox}>
                {employeeNumberLoading ? (
                  <ActivityIndicator size="small" color="#173A73" />
                ) : (
                  <Text
                    style={
                      employeeNumber
                        ? styles.readOnlyText
                        : styles.readOnlyPlaceholder
                    }
                  >
                    {employeeNumber || "Unable to generate employee number"}
                  </Text>
                )}
              </View>

              <Text style={styles.helperText}>
                Employee Number is generated automatically and cannot be
                changed.
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
                    editable={!loading}
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
                    editable={!loading}
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
                editable={!loading}
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
                editable={!loading}
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
                editable={!loading}
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
                editable={!loading}
              />
            </View>

            {/* ==================================
                ACCOUNT INFORMATION
            ================================== */}

            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Account Information</Text>

              {/* USERNAME */}

              <Text style={styles.label}>Username *</Text>

              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(text) => {
                  const cleaned = text.toLowerCase().replace(/[^a-z0-9]/g, "");

                  setUsername(cleaned);

                  setUsernameManuallyEdited(true);

                  clearError();
                }}
                placeholder="Suggested from officer name"
                placeholderTextColor="#8C939F"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <Text style={styles.helperText}>
                Suggested automatically from the officer&apos;s name. You may
                change it before creating the account.
              </Text>

              {/* PASSWORD */}

              <Text style={styles.label}>Enter Password *</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);

                    clearError();
                  }}
                  placeholder="Enter password"
                  placeholderTextColor="#8C939F"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.helperText}>
                Minimum 8 characters with at least one letter, one number, and
                one special character.
              </Text>

              {/* CONFIRM PASSWORD */}

              <Text style={styles.label}>Confirm Password *</Text>

              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);

                  clearError();
                }}
                placeholder="Confirm password"
                placeholderTextColor="#8C939F"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              {/* STATUS */}

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
                  onPress={() => {
                    setAccountActive(!accountActive);

                    clearError();
                  }}
                  disabled={loading}
                >
                  <View
                    style={[
                      styles.switchThumb,

                      accountActive && styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.statusNote}>
                Active officers can log in immediately. Inactive officers cannot
                access their account.
              </Text>
            </View>
          </View>

          {/* ==================================
              ERROR
          ================================== */}

          {errorMessage !== "" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Unable to Create Officer</Text>

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
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createButton,

                (loading || employeeNumberLoading || !employeeNumber) &&
                  styles.createButtonDisabled,
              ]}
              onPress={handleCreateOfficer}
              disabled={loading || employeeNumberLoading || !employeeNumber}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>
                  Create Officer Account
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* ======================================
          SUCCESS MODAL
      ====================================== */}

      <SuccessModal
        visible={showSuccessModal}
        title="Officer Created"
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
        onClose={handleWarningModalClose}
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

  const fileNameMatch = fileName.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);

  if (fileNameMatch?.[1]) {
    const extension = fileNameMatch[1];

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
