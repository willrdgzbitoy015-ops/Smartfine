import { File as ExpoFile } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { useCallback, useEffect, useState } from "react";

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

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";

import DeleteModal from "@/components/deletationmodal";
import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";

import { styles } from "./settings.styles";

// ==========================================
// TYPES
// ==========================================

type NavItem = {
  label: string;
  route: string;
  icon?: any;
};

type AdminUser = {
  id: number;

  username: string | null;

  firstName: string | null;
  middleName: string | null;
  lastName: string | null;

  fullName: string | null;

  email: string | null;
  contactNumber: string | null;

  role: string | null;

  accountStatus: string | null;

  isVerified: boolean;

  profilePictureUri: string | null;

  createdAt: string | null;
  updatedAt: string | null;
};

type SystemSettings = {
  id: number;

  schoolName: string | null;

  academicYear: string | null;

  systemName: string | null;

  updatedAt: string | null;
};

type FineType = {
  id: number;

  violation_code: string;

  violation_name: string;

  description: string | null;

  amount_centavos: number;

  amount: number;

  is_active: number;
};

type MeResponse = {
  success: boolean;

  user?: AdminUser;

  message?: string;
};

type SystemSettingsResponse = {
  success: boolean;

  settings?: SystemSettings;

  message?: string;
};

type FineTypesResponse = {
  success: boolean;

  violations?: FineType[];

  violation?: FineType;

  nextCode?: string;

  message?: string;
};

type BasicResponse = {
  success: boolean;

  message?: string;

  user?: AdminUser;

  profilePictureUri?: string;

  settings?: SystemSettings;
};

// ==========================================
// ADMIN SETTINGS
// ==========================================

export default function AdminSettings() {
  const router = useRouter();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const isWide = width >= 1050;

  // ========================================
  // SUCCESS MODAL
  // ========================================

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successTitle, setSuccessTitle] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

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

  // ========================================
  // REMOVE PHOTO
  // ========================================

  const [showRemovePhotoModal, setShowRemovePhotoModal] = useState(false);

  // ========================================
  // ADMIN
  // ========================================

  const [admin, setAdmin] = useState<AdminUser | null>(null);

  // ========================================
  // ACCOUNT SETTINGS
  // ========================================

  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");

  const [contactNumber, setContactNumber] = useState("");

  // ========================================
  // PASSWORD
  // ========================================

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // ========================================
  // SYSTEM SETTINGS
  // ========================================

  const [schoolName, setSchoolName] = useState("");

  const [academicYear, setAcademicYear] = useState("");

  const [systemName, setSystemName] = useState("SmartFine");

  // ========================================
  // FINE TYPES
  // ========================================

  const [fineTypes, setFineTypes] = useState<FineType[]>([]);

  const [fineTypesLoading, setFineTypesLoading] = useState(false);

  const [fineTypesRefreshing, setFineTypesRefreshing] = useState(false);

  const [fineTypesError, setFineTypesError] = useState("");

  const [showFineTypeForm, setShowFineTypeForm] = useState(false);

  const [editingFineTypeId, setEditingFineTypeId] = useState<number | null>(
    null,
  );

  const [fineCode, setFineCode] = useState("");

  const [nextFineCode, setNextFineCode] = useState("V001");

  const [fineName, setFineName] = useState("");

  const [fineDescription, setFineDescription] = useState("");

  const [fineAmount, setFineAmount] = useState("");

  const [fineActive, setFineActive] = useState(true);

  const [savingFineType, setSavingFineType] = useState(false);

  const [changingFineStatusId, setChangingFineStatusId] = useState<
    number | null
  >(null);

  // ========================================
  // PAGE STATE
  // ========================================

  const [loading, setLoading] = useState(true);

  const [savingAccount, setSavingAccount] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);

  const [savingSystemSettings, setSavingSystemSettings] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [removingPhoto, setRemovingPhoto] = useState(false);

  const [imageFailed, setImageFailed] = useState(false);

  const [pageError, setPageError] = useState("");

  // ========================================
  // MESSAGE
  // ========================================

  const showMessage = (title: string, message: string) => {
    if (String(title).trim().toUpperCase() === "SUCCESS") {
      setSuccessTitle(title);

      setSuccessMessage(message);

      setShowSuccessModal(true);

      return;
    }

    setWarningTitle(title);

    setWarningMessage(message);

    setShowWarningModal(true);
  };

  // ========================================
  // NAVIGATION
  // ========================================

  const navItems: NavItem[] = [
    {
      label: "Dashboard",

      route: "/admin/dashboard",

      icon: require("../../../assets/icons/dashboard.png"),
    },

    {
      label: "Students",

      route: "/admin/students",

      icon: require("../../../assets/icons/students.png"),
    },

    {
      label: "Fines",

      route: "/admin/fines",

      icon: require("../../../assets/icons/fines.png"),
    },

    {
      label: "QR Scanner",

      route: "/admin/qr-scanner",

      icon: require("../../../assets/icons/qr-codeWhite.png"),
    },

    {
      label: "Reports",

      route: "/admin/reports",

      icon: require("../../../assets/icons/reports.png"),
    },

    {
      label: "Settings",

      route: "/admin/settings",

      icon: require("../../../assets/icons/settings.png"),
    },

    {
      label: "Officers",

      route: "/admin/officers",

      icon: require("../../../assets/icons/officers.png"),
    },
  ];

  // ========================================
  // TOKEN
  // ========================================

  const getStoredToken = async () => {
    return AsyncStorage.getItem("token");
  };

  // ========================================
  // AUTHENTICATED FETCH
  // ========================================

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getStoredToken();

    if (!token) {
      throw new Error("AUTH_TOKEN_NOT_FOUND");
    }

    const headers = new Headers(options.headers || {});

    headers.set("Authorization", `Bearer ${token}`);

    return fetch(url, {
      ...options,

      headers,
    });
  };

  // ========================================
  // LOAD FINE TYPES
  // ========================================

  const loadFineTypes = async (
    showWarning = false,
    preserveCurrentList = false,
  ) => {
    if (fineTypesRefreshing) {
      return;
    }

    try {
      if (preserveCurrentList) {
        setFineTypesRefreshing(true);
      } else {
        setFineTypesLoading(true);
      }

      setFineTypesError("");

      const response = await authenticatedFetch(
        `${API_BASE}/api/fines/maintenance/violation-types`,
      );

      const data: FineTypesResponse = await response.json();

      if (!response.ok || !data.success) {
        const message = data.message || "Failed to load fine types.";

        if (!preserveCurrentList) {
          setFineTypesError(message);
        }

        if (showWarning || preserveCurrentList) {
          showMessage("Fine Types", message);
        }

        return;
      }

      const loadedFineTypes = data.violations || [];

      setFineTypes(loadedFineTypes);

      setNextFineCode(
        data.nextCode || getNextFineCodeFromTypes(loadedFineTypes),
      );
    } catch (error) {
      console.error("Load fine types error:", error);

      const message = "Could not load Fine Types Maintenance.";

      if (!preserveCurrentList) {
        setFineTypesError(message);
      }

      if (showWarning || preserveCurrentList) {
        showMessage("Connection Error", message);
      }
    } finally {
      setFineTypesLoading(false);

      setFineTypesRefreshing(false);
    }
  };

  // ========================================
  // REFRESH FINE TYPES
  // ========================================

  const handleRefreshFineTypes = async () => {
    if (
      fineTypesLoading ||
      fineTypesRefreshing ||
      savingFineType ||
      changingFineStatusId !== null
    ) {
      return;
    }

    await loadFineTypes(true, true);
  };

  // ========================================
  // LOAD SETTINGS
  // ========================================

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);

      setPageError("");

      const token = await getStoredToken();

      if (!token) {
        setPageError(
          "Your login session could not be found. Please log in again.",
        );

        return;
      }

      const [adminResponse, settingsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API_BASE}/api/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const adminData: MeResponse = await adminResponse.json();

      const settingsData: SystemSettingsResponse =
        await settingsResponse.json();

      if (!adminResponse.ok || !adminData.success || !adminData.user) {
        setPageError(
          adminData.message || "Failed to load administrator account.",
        );

        return;
      }

      if (
        !settingsResponse.ok ||
        !settingsData.success ||
        !settingsData.settings
      ) {
        setPageError(settingsData.message || "Failed to load system settings.");

        return;
      }

      // ==================================
      // ADMIN
      // ==================================

      setAdmin(adminData.user);

      setUsername(adminData.user.username || "");

      setEmail(adminData.user.email || "");

      setContactNumber(adminData.user.contactNumber || "");

      // ==================================
      // SYSTEM
      // ==================================

      setSchoolName(settingsData.settings.schoolName || "");

      setAcademicYear(settingsData.settings.academicYear || "");

      setSystemName(settingsData.settings.systemName || "SmartFine");

      setImageFailed(false);

      // ==================================
      // FINE TYPES
      // ==================================

      await loadFineTypes(false, false);
    } catch (error) {
      console.error("Load settings error:", error);

      if (error instanceof Error && error.message === "AUTH_TOKEN_NOT_FOUND") {
        setPageError(
          "Your login session could not be found. Please log in again.",
        );
      } else {
        setPageError("Could not connect to the SmartFine server.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ========================================
  // SAVE ACCOUNT
  // ========================================

  const handleSaveAccount = async () => {
    const cleanedUsername = username.trim();

    const cleanedEmail = email.trim();

    const cleanedContact = contactNumber.trim();

    if (!cleanedUsername) {
      showMessage("Validation", "Username is required.");

      return;
    }

    if (!cleanedEmail) {
      showMessage("Validation", "Email address is required.");

      return;
    }

    if (!isValidEmail(cleanedEmail)) {
      showMessage("Validation", "Please enter a valid email address.");

      return;
    }

    if (cleanedContact && !/^\+?[0-9]{7,15}$/.test(cleanedContact)) {
      showMessage("Validation", "Please enter a valid contact number.");

      return;
    }

    try {
      setSavingAccount(true);

      const response = await authenticatedFetch(`${API_BASE}/api/auth/me`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: cleanedUsername,

          email: cleanedEmail,

          contactNumber: cleanedContact,
        }),
      });

      const data: BasicResponse = await response.json();

      if (!response.ok || !data.success) {
        showMessage(
          "Unable to Save",
          data.message || "Failed to update account settings.",
        );

        return;
      }

      if (data.user) {
        setAdmin(data.user);

        setUsername(data.user.username || "");

        setEmail(data.user.email || "");

        setContactNumber(data.user.contactNumber || "");

        await AsyncStorage.setItem(
          "userEmail",

          data.user.email || data.user.username || "",
        );
      }

      showMessage(
        "Success",
        data.message || "Account settings updated successfully.",
      );
    } catch (error) {
      console.error("Save account settings error:", error);

      showMessage(
        "Connection Error",
        "Could not connect to the SmartFine server.",
      );
    } finally {
      setSavingAccount(false);
    }
  };

  // ========================================
  // CHANGE PASSWORD
  // ========================================

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage("Validation", "Please complete all password fields.");

      return;
    }

    if (newPassword.length < 8) {
      showMessage(
        "Validation",
        "New password must contain at least 8 characters.",
      );

      return;
    }

    if (
      !/[a-z]/.test(newPassword) ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9\s]/.test(newPassword)
    ) {
      showMessage(
        "Validation",
        "New password must contain uppercase, lowercase, number, and special character.",
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("Validation", "New password and confirmation do not match.");

      return;
    }

    try {
      setChangingPassword(true);

      const response = await authenticatedFetch(
        `${API_BASE}/api/auth/me/password`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            currentPassword,

            newPassword,

            confirmPassword,
          }),
        },
      );

      const data: BasicResponse = await response.json();

      if (!response.ok || !data.success) {
        showMessage(
          "Unable to Change Password",
          data.message || "Failed to change password.",
        );

        return;
      }

      setCurrentPassword("");

      setNewPassword("");

      setConfirmPassword("");

      setShowPasswordForm(false);

      showMessage("Success", data.message || "Password changed successfully.");
    } catch (error) {
      console.error("Change password error:", error);

      showMessage(
        "Connection Error",
        "Could not connect to the SmartFine server.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ========================================
  // SAVE SYSTEM SETTINGS
  // ========================================

  const handleSaveSystemSettings = async () => {
    const cleanedSchoolName = schoolName.trim();

    const cleanedAcademicYear = academicYear.trim();

    const cleanedSystemName = systemName.trim();

    if (!cleanedSchoolName) {
      showMessage("Validation", "School name is required.");

      return;
    }

    if (!cleanedAcademicYear) {
      showMessage("Validation", "Academic year is required.");

      return;
    }

    if (!cleanedSystemName) {
      showMessage("Validation", "System name is required.");

      return;
    }

    try {
      setSavingSystemSettings(true);

      const response = await authenticatedFetch(`${API_BASE}/api/settings`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          schoolName: cleanedSchoolName,

          academicYear: cleanedAcademicYear,

          systemName: cleanedSystemName,
        }),
      });

      const data: BasicResponse = await response.json();

      if (!response.ok || !data.success) {
        showMessage(
          "Unable to Save",
          data.message || "Failed to update system settings.",
        );

        return;
      }

      if (data.settings) {
        setSchoolName(data.settings.schoolName || "");

        setAcademicYear(data.settings.academicYear || "");

        setSystemName(data.settings.systemName || "SmartFine");
      }

      showMessage(
        "Success",
        data.message || "System settings updated successfully.",
      );
    } catch (error) {
      console.error("Save system settings error:", error);

      showMessage("Connection Error", "Could not save system settings.");
    } finally {
      setSavingSystemSettings(false);
    }
  };

  // ========================================
  // RESET FINE TYPE FORM
  // ========================================

  const resetFineTypeForm = () => {
    setEditingFineTypeId(null);

    setFineCode("");

    setFineName("");

    setFineDescription("");

    setFineAmount("");

    setFineActive(true);

    setShowFineTypeForm(false);
  };

  // ========================================
  // ADD FINE TYPE
  // ========================================

  const handleAddFineType = () => {
    if (fineTypesLoading || fineTypesRefreshing || savingFineType) {
      return;
    }

    setEditingFineTypeId(null);

    setFineCode(nextFineCode || getNextFineCodeFromTypes(fineTypes));

    setFineName("");

    setFineDescription("");

    setFineAmount("");

    setFineActive(true);

    setShowFineTypeForm(true);
  };

  // ========================================
  // EDIT FINE TYPE
  // ========================================

  const handleEditFineType = (fineType: FineType) => {
    if (
      fineTypesRefreshing ||
      savingFineType ||
      changingFineStatusId !== null
    ) {
      return;
    }

    setEditingFineTypeId(fineType.id);

    setFineCode(fineType.violation_code || "");

    setFineName(fineType.violation_name || "");

    setFineDescription(fineType.description || "");

    setFineAmount(
      Number(fineType.amount || Number(fineType.amount_centavos) / 100).toFixed(
        2,
      ),
    );

    setFineActive(Number(fineType.is_active) === 1);

    setShowFineTypeForm(true);
  };

  // ========================================
  // SAVE FINE TYPE
  // ========================================

  const handleSaveFineType = async () => {
    const cleanedName = fineName.trim();

    const cleanedDescription = fineDescription.trim();

    const amount = Number(fineAmount);

    if (!cleanedName) {
      showMessage("Validation", "Fine type name is required.");

      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage("Validation", "Fine amount must be greater than zero.");

      return;
    }

    try {
      setSavingFineType(true);

      const isEditing = editingFineTypeId !== null;

      const url = isEditing
        ? `${API_BASE}/api/fines/maintenance/violation-types/${editingFineTypeId}`
        : `${API_BASE}/api/fines/maintenance/violation-types`;

      const response = await authenticatedFetch(url, {
        method: isEditing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          violationName: cleanedName,

          description: cleanedDescription,

          amount,

          isActive: fineActive,
        }),
      });

      const data: FineTypesResponse = await response.json();

      if (!response.ok || !data.success) {
        showMessage(
          isEditing ? "Unable to Update" : "Unable to Add",

          data.message || "Failed to save the fine type.",
        );

        return;
      }

      if (data.nextCode) {
        setNextFineCode(data.nextCode);
      }

      resetFineTypeForm();

      await loadFineTypes(false, true);

      showMessage(
        "Success",

        data.message ||
          (isEditing
            ? "Fine type updated successfully."
            : "Fine type added successfully."),
      );
    } catch (error) {
      console.error("Save fine type error:", error);

      showMessage("Connection Error", "Could not save the fine type.");
    } finally {
      setSavingFineType(false);
    }
  };

  // ========================================
  // ACTIVATE / DEACTIVATE FINE TYPE
  // ========================================

  const handleToggleFineTypeStatus = async (fineType: FineType) => {
    if (fineTypesRefreshing || savingFineType) {
      return;
    }

    try {
      setChangingFineStatusId(fineType.id);

      const currentlyActive = Number(fineType.is_active) === 1;

      const response = await authenticatedFetch(
        `${API_BASE}/api/fines/maintenance/violation-types/${fineType.id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            isActive: !currentlyActive,
          }),
        },
      );

      const data: FineTypesResponse = await response.json();

      if (!response.ok || !data.success) {
        showMessage(
          "Unable to Update Status",
          data.message || "Failed to update the fine type status.",
        );

        return;
      }

      if (data.nextCode) {
        setNextFineCode(data.nextCode);
      }

      await loadFineTypes(false, true);

      showMessage(
        "Success",

        data.message ||
          (currentlyActive
            ? "Fine type deactivated successfully."
            : "Fine type activated successfully."),
      );
    } catch (error) {
      console.error("Update fine type status error:", error);

      showMessage("Connection Error", "Could not update the fine type status.");
    } finally {
      setChangingFineStatusId(null);
    }
  };

  // ========================================
  // CHOOSE PHOTO
  // ========================================

  const handleChoosePhoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          showMessage(
            "Permission Required",
            "Please allow access to your photos to change your profile picture.",
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

      if (result.canceled || !result.assets?.length) {
        return;
      }

      await uploadProfilePicture(result.assets[0]);
    } catch (error) {
      console.error("Choose profile picture error:", error);

      showMessage("Photo Error", "Unable to select the profile picture.");
    }
  };

  // ========================================
  // UPLOAD PROFILE PICTURE
  // ========================================

  const uploadProfilePicture = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploadingPhoto(true);

      const token = await getStoredToken();

      if (!token) {
        showMessage(
          "Session Error",
          "Your login session could not be found. Please log in again.",
        );

        return;
      }

      const formData = new FormData();

      const filename = createImageFilename(asset);

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        throw new Error("Profile picture must be 5 MB or smaller.");
      }

      if (Platform.OS === "web") {
        let blob: Blob | undefined = asset.file;

        if (!blob) {
          const imageResponse = await fetch(asset.uri);

          if (!imageResponse.ok) {
            throw new Error("Unable to read the selected photo.");
          }

          blob = await imageResponse.blob();
        }

        if (!blob) {
          throw new Error("Please select the photo again.");
        }

        if (blob.size > 5 * 1024 * 1024) {
          throw new Error("Profile picture must be 5 MB or smaller.");
        }

        formData.append("profilePicture", blob, filename);
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

        formData.append("profilePicture", file, filename);
      }

      const uploadFetch = Platform.OS === "web" ? fetch : expoFetch;

      const response = await uploadFetch(
        `${API_BASE}/api/auth/me/profile-picture`,
        {
          method: "POST",

          headers: {
            Accept: "application/json",

            Authorization: `Bearer ${token}`,

            "ngrok-skip-browser-warning": "true",
          },

          body: formData,
        },
      );

      const data: BasicResponse = await response.json();

      if (!response.ok || !data.success) {
        showMessage(
          "Upload Failed",
          data.message || "Failed to update profile picture.",
        );

        return;
      }

      if (data.user) {
        setAdmin(data.user);
      } else {
        await loadSettings();
      }

      setImageFailed(false);

      showMessage(
        "Success",
        data.message || "Profile picture updated successfully.",
      );
    } catch (error) {
      console.error("Upload admin photo error:", error);

      showMessage(
        "Upload Failed",

        error instanceof Error
          ? error.message
          : "Could not upload the profile picture.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ========================================
  // REMOVE PROFILE PICTURE
  // ========================================

  const performRemovePhoto = async () => {
    try {
      setRemovingPhoto(true);

      const response = await authenticatedFetch(
        `${API_BASE}/api/auth/me/profile-picture`,
        {
          method: "DELETE",
        },
      );

      const data: BasicResponse = await response.json();

      if (!response.ok || !data.success) {
        setShowRemovePhotoModal(false);

        showMessage(
          "Unable to Remove Photo",

          data.message || "Failed to remove profile picture.",
        );

        return;
      }

      if (data.user) {
        setAdmin(data.user);
      } else {
        await loadSettings();
      }

      setImageFailed(false);

      setShowRemovePhotoModal(false);

      showMessage(
        "Success",
        data.message || "Profile picture removed successfully.",
      );
    } catch (error) {
      console.error("Remove profile picture error:", error);

      setShowRemovePhotoModal(false);

      showMessage("Connection Error", "Could not remove the profile picture.");
    } finally {
      setRemovingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    if (!admin?.profilePictureUri) {
      return;
    }

    setShowRemovePhotoModal(true);
  };

  const handleCancelRemovePhoto = () => {
    if (removingPhoto) {
      return;
    }

    setShowRemovePhotoModal(false);
  };

  // ========================================
  // NAVIGATION HANDLER
  // ========================================

  const handleNavigation = (item: NavItem) => {
    router.push(item.route as any);
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    if (logoutLoading) {
      return;
    }

    setShowLogoutModal(false);
  };

  const performLogout = async () => {
    try {
      setLogoutLoading(true);

      await logout();

      setShowLogoutModal(false);

      router.replace("/login" as any);
    } catch (error) {
      console.error("Logout error:", error);

      setShowLogoutModal(false);

      setWarningTitle("Logout Error");

      setWarningMessage("Could not log out. Please try again.");

      setShowWarningModal(true);
    } finally {
      setLogoutLoading(false);
    }
  };

  // ========================================
  // PROFILE
  // ========================================

  const profilePictureUrl = getProfilePictureUrl(admin?.profilePictureUri);

  const initials = getInitials(admin);

  // ========================================
  // UI
  // ========================================

  return (
    <View style={styles.screen}>
      {/* =====================================
          SIDEBAR
      ====================================== */}

      {isTablet && (
        <View style={styles.sidebar}>
          <View style={styles.logoArea}>
            <Image
              source={require("../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.navigation}>
            {navItems.map((item) => {
              const active = item.label === "Settings";

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

      {/* =====================================
          MAIN
      ====================================== */}

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* MOBILE NAV */}

          {!isTablet && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileNav}
            >
              {navItems.map((item) => {
                const active = item.label === "Settings";

                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.mobileNavItem,

                      active && styles.mobileNavItemActive,
                    ]}
                    onPress={() => handleNavigation(item)}
                    activeOpacity={0.8}
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

          {/* =================================
              HEADER
          ================================= */}

          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Settings</Text>

            <Text style={styles.pageSubtitle}>
              Manage your administrator account, system preferences, and fine
              types
            </Text>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#173A73" />

              <Text style={styles.stateText}>Loading settings...</Text>
            </View>
          ) : pageError ? (
            <View style={styles.centerState}>
              <Text style={styles.errorTitle}>Unable to Load Settings</Text>

              <Text style={styles.errorText}>{pageError}</Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadSettings}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.settingsLayout,

                !isWide && styles.settingsLayoutStacked,
              ]}
            >
              {/* =============================
                  PROFILE
              ============================== */}

              <View
                style={[
                  styles.profileCard,

                  !isWide && styles.profileCardStacked,
                ]}
              >
                <View style={styles.avatarWrapper}>
                  {profilePictureUrl && !imageFailed ? (
                    <Image
                      source={{
                        uri: profilePictureUrl,
                      }}
                      style={styles.avatar}
                      resizeMode="cover"
                      onError={() => setImageFailed(true)}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.cameraButton,

                      (uploadingPhoto || removingPhoto) && {
                        opacity: 0.65,
                      },
                    ]}
                    onPress={handleChoosePhoto}
                    disabled={uploadingPhoto || removingPhoto}
                    activeOpacity={0.8}
                  >
                    {uploadingPhoto ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Image
                        source={require("../../../assets/icons/edit-image.png")}
                        style={{
                          width: 18,

                          height: 18,
                        }}
                        resizeMode="contain"
                      />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.profileName}>
                  {admin?.fullName || "System Administrator"}
                </Text>

                <Text style={styles.profileRole}>System Administrator</Text>

                <Text style={styles.profileUsername}>
                  @{admin?.username || "admin"}
                </Text>

                <View style={styles.profileDivider} />

                <View style={styles.profileInfoBlock}>
                  <Text style={styles.profileInfoLabel}>CONTACT NUMBER</Text>

                  <Text style={styles.profileInfoValue}>
                    {admin?.contactNumber || "Not provided"}
                  </Text>
                </View>

                <View style={styles.profileInfoBlock}>
                  <Text style={styles.profileInfoLabel}>EMAIL</Text>

                  <Text style={styles.profileInfoValue}>
                    {admin?.email || "Not provided"}
                  </Text>
                </View>

                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={[
                      styles.changePhotoButton,

                      (uploadingPhoto || removingPhoto) && {
                        opacity: 0.65,
                      },
                    ]}
                    onPress={handleChoosePhoto}
                    disabled={uploadingPhoto || removingPhoto}
                    activeOpacity={0.8}
                  >
                    {uploadingPhoto ? (
                      <View
                        style={{
                          flexDirection: "row",

                          alignItems: "center",

                          gap: 7,
                        }}
                      >
                        <ActivityIndicator size="small" color="#FFFFFF" />

                        <Text style={styles.changePhotoButtonText}>
                          Uploading...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.changePhotoButtonText}>
                        {admin?.profilePictureUri
                          ? "Change Photo"
                          : "Add Photo"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {admin?.profilePictureUri && (
                    <TouchableOpacity
                      style={[
                        styles.removePhotoButton,

                        (uploadingPhoto || removingPhoto) && {
                          opacity: 0.65,
                        },
                      ]}
                      onPress={handleRemovePhoto}
                      disabled={uploadingPhoto || removingPhoto}
                      activeOpacity={0.8}
                    >
                      {removingPhoto ? (
                        <View
                          style={{
                            flexDirection: "row",

                            alignItems: "center",

                            gap: 6,
                          }}
                        >
                          <ActivityIndicator size="small" color="#D32F2F" />

                          <Text style={styles.removePhotoButtonText}>
                            Removing...
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.removePhotoButtonText}>Remove</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.photoHint}>
                  JPG, PNG or WEBP • Max 5 MB
                </Text>
              </View>

              {/* =============================
                  RIGHT COLUMN
              ============================== */}

              <View style={styles.rightColumn}>
                {/* =============================
                    ACCOUNT SETTINGS
                ============================== */}

                <View>
                  <Text style={styles.sectionTitle}>Account Settings</Text>

                  <View style={styles.settingsCard}>
                    <View style={styles.formRow}>
                      <View style={styles.formField}>
                        <Text style={styles.inputLabel}>Username</Text>

                        <TextInput
                          value={username}
                          onChangeText={setUsername}
                          placeholder="Username"
                          placeholderTextColor="#A0A7B2"
                          style={styles.input}
                          autoCapitalize="none"
                          editable={!savingAccount}
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.inputLabel}>Primary Email</Text>

                        <TextInput
                          value={email}
                          onChangeText={setEmail}
                          placeholder="Email address"
                          placeholderTextColor="#A0A7B2"
                          style={styles.input}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          editable={!savingAccount}
                        />
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={styles.formField}>
                        <Text style={styles.inputLabel}>Contact Number</Text>

                        <TextInput
                          value={contactNumber}
                          onChangeText={setContactNumber}
                          placeholder="09xxxxxxxxx"
                          placeholderTextColor="#A0A7B2"
                          style={styles.input}
                          keyboardType="phone-pad"
                          editable={!savingAccount}
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.inputLabel}>Account Role</Text>

                        <View style={[styles.input, styles.readOnlyInput]}>
                          <Text style={styles.readOnlyText}>
                            System Administrator
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardActionRow}>
                      <TouchableOpacity
                        style={[
                          styles.primaryButton,

                          savingAccount && {
                            opacity: 0.7,
                          },
                        ]}
                        onPress={handleSaveAccount}
                        disabled={savingAccount}
                        activeOpacity={0.8}
                      >
                        {savingAccount ? (
                          <View
                            style={{
                              flexDirection: "row",

                              alignItems: "center",

                              gap: 8,
                            }}
                          >
                            <ActivityIndicator size="small" color="#FFFFFF" />

                            <Text style={styles.primaryButtonText}>
                              Saving...
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.primaryButtonText}>
                            Save Account Changes
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* =============================
                    PASSWORD
                ============================== */}

                <View>
                  <Text style={styles.sectionTitle}>Password & Security</Text>

                  <View style={styles.settingsCard}>
                    {!showPasswordForm ? (
                      <View style={styles.passwordClosedRow}>
                        <View style={styles.passwordDescription}>
                          <Text style={styles.passwordTitle}>
                            Change Password
                          </Text>

                          <Text style={styles.passwordSubtitle}>
                            Update the password used to access your SmartFine
                            administrator account.
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() => setShowPasswordForm(true)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.secondaryButtonText}>
                            Change Password
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <View style={styles.formRow}>
                          <View style={styles.formField}>
                            <Text style={styles.inputLabel}>
                              Current Password
                            </Text>

                            <TextInput
                              value={currentPassword}
                              onChangeText={setCurrentPassword}
                              secureTextEntry
                              placeholder="Enter current password"
                              placeholderTextColor="#A0A7B2"
                              style={styles.input}
                              editable={!changingPassword}
                            />
                          </View>

                          <View style={styles.formField}>
                            <Text style={styles.inputLabel}>New Password</Text>

                            <TextInput
                              value={newPassword}
                              onChangeText={setNewPassword}
                              secureTextEntry
                              placeholder="At least 8 characters"
                              placeholderTextColor="#A0A7B2"
                              style={styles.input}
                              editable={!changingPassword}
                            />
                          </View>
                        </View>

                        <View style={styles.formRow}>
                          <View style={styles.formField}>
                            <Text style={styles.inputLabel}>
                              Confirm New Password
                            </Text>

                            <TextInput
                              value={confirmPassword}
                              onChangeText={setConfirmPassword}
                              secureTextEntry
                              placeholder="Repeat new password"
                              placeholderTextColor="#A0A7B2"
                              style={styles.input}
                              editable={!changingPassword}
                            />
                          </View>

                          <View style={styles.formField} />
                        </View>

                        <View style={styles.passwordActions}>
                          <TouchableOpacity
                            style={[
                              styles.cancelButton,

                              changingPassword && {
                                opacity: 0.6,
                              },
                            ]}
                            disabled={changingPassword}
                            onPress={() => {
                              setCurrentPassword("");

                              setNewPassword("");

                              setConfirmPassword("");

                              setShowPasswordForm(false);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.primaryButton,

                              changingPassword && {
                                opacity: 0.7,
                              },
                            ]}
                            onPress={handleChangePassword}
                            disabled={changingPassword}
                            activeOpacity={0.8}
                          >
                            {changingPassword ? (
                              <View
                                style={{
                                  flexDirection: "row",

                                  alignItems: "center",

                                  gap: 8,
                                }}
                              >
                                <ActivityIndicator
                                  size="small"
                                  color="#FFFFFF"
                                />

                                <Text style={styles.primaryButtonText}>
                                  Updating...
                                </Text>
                              </View>
                            ) : (
                              <Text style={styles.primaryButtonText}>
                                Update Password
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                </View>

                {/* ==================================
                    FINE TYPES MAINTENANCE
                ================================== */}

                <View>
                  <View style={styles.fineTypesSectionHeader}>
                    <View style={styles.fineTypesSectionHeading}>
                      <Text
                        style={[
                          styles.sectionTitle,

                          styles.fineTypesSectionTitle,
                        ]}
                      >
                        Fine Types Maintenance
                      </Text>

                      <Text style={styles.fineTypesDescription}>
                        Manage the violation types and official fine amounts
                        used when recording new fines.
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",

                        alignItems: "center",

                        flexWrap: "wrap",

                        gap: 8,
                      }}
                    >
                      {/* REFRESH FINE TYPES */}

                      <TouchableOpacity
                        style={[
                          styles.secondaryButton,

                          (fineTypesLoading ||
                            fineTypesRefreshing ||
                            savingFineType ||
                            changingFineStatusId !== null) && {
                            opacity: 0.6,
                          },
                        ]}
                        onPress={handleRefreshFineTypes}
                        disabled={
                          fineTypesLoading ||
                          fineTypesRefreshing ||
                          savingFineType ||
                          changingFineStatusId !== null
                        }
                        activeOpacity={0.8}
                      >
                        {fineTypesRefreshing ? (
                          <View
                            style={{
                              flexDirection: "row",

                              alignItems: "center",

                              gap: 7,
                            }}
                          >
                            <ActivityIndicator size="small" color="#173A73" />

                            <Text style={styles.secondaryButtonText}>
                              Refreshing...
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              flexDirection: "row",

                              alignItems: "center",

                              gap: 7,
                            }}
                          >
                            <Text
                              style={{
                                color: "#173A73",

                                fontSize: 15,

                                fontWeight: "800",
                              }}
                            >
                              ↻
                            </Text>

                            <Text style={styles.secondaryButtonText}>
                              Refresh
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* ADD FINE TYPE */}

                      <TouchableOpacity
                        style={[
                          styles.addFineTypeButton,

                          (fineTypesLoading ||
                            fineTypesRefreshing ||
                            savingFineType) && {
                            opacity: 0.6,
                          },
                        ]}
                        onPress={handleAddFineType}
                        disabled={
                          fineTypesLoading ||
                          fineTypesRefreshing ||
                          savingFineType
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addFineTypeButtonText}>
                          + Add Fine Type
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.settingsCard}>
                    {/* =============================
                        ADD / EDIT FORM
                    ============================== */}

                    {showFineTypeForm && (
                      <View style={styles.fineTypeForm}>
                        <View style={styles.fineTypeFormHeader}>
                          <View>
                            <Text style={styles.fineTypeFormTitle}>
                              {editingFineTypeId
                                ? "Edit Fine Type"
                                : "Add Fine Type"}
                            </Text>

                            <Text style={styles.fineTypeFormSubtitle}>
                              The amount configured here will be used
                              automatically for future fines.
                            </Text>
                          </View>
                        </View>

                        <View style={styles.formRow}>
                          {/* AUTOMATIC FINE CODE */}

                          <View style={styles.formField}>
                            <Text style={styles.inputLabel}>Fine Code</Text>

                            <TextInput
                              value={fineCode}
                              editable={false}
                              selectTextOnFocus={false}
                              placeholder="Automatically generated"
                              placeholderTextColor="#A0A7B2"
                              style={[styles.input, styles.readOnlyInput]}
                            />

                            <Text
                              style={[
                                styles.fineTypeFormSubtitle,

                                {
                                  marginTop: 6,
                                },
                              ]}
                            >
                              {editingFineTypeId
                                ? "Fine codes are permanent and cannot be changed."
                                : "SmartFine automatically assigns the next fine code."}
                            </Text>
                          </View>

                          {/* FINE TYPE */}

                          <View style={styles.formField}>
                            <Text style={styles.inputLabel}>Fine Type *</Text>

                            <TextInput
                              value={fineName}
                              onChangeText={setFineName}
                              placeholder="Example: Unauthorized Gadget Use"
                              placeholderTextColor="#A0A7B2"
                              style={styles.input}
                              maxLength={120}
                              editable={!savingFineType}
                            />
                          </View>
                        </View>

                        <View style={styles.formRow}>
                          {/* AMOUNT */}

                          <View style={styles.formField}>
                            <Text style={styles.inputLabel}>Fine Amount *</Text>

                            <View style={styles.amountInputContainer}>
                              <Text style={styles.amountPeso}>₱</Text>

                              <TextInput
                                value={fineAmount}
                                onChangeText={(value) => {
                                  let cleaned = value.replace(/[^0-9.]/g, "");

                                  const firstDot = cleaned.indexOf(".");

                                  if (firstDot !== -1) {
                                    cleaned =
                                      cleaned.substring(0, firstDot + 1) +
                                      cleaned
                                        .substring(firstDot + 1)
                                        .replace(/\./g, "");
                                  }

                                  setFineAmount(cleaned);
                                }}
                                placeholder="0.00"
                                placeholderTextColor="#A0A7B2"
                                style={styles.amountInput}
                                keyboardType="decimal-pad"
                                editable={!savingFineType}
                              />
                            </View>
                          </View>

                          {/* STATUS */}

                          <View style={styles.formField}>
                            <Text style={styles.inputLabel}>Status</Text>

                            <View style={styles.statusSelector}>
                              <TouchableOpacity
                                style={[
                                  styles.statusSelectorButton,

                                  fineActive &&
                                    styles.statusSelectorButtonActive,
                                ]}
                                onPress={() => setFineActive(true)}
                                disabled={savingFineType}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.statusSelectorText,

                                    fineActive &&
                                      styles.statusSelectorTextActive,
                                  ]}
                                >
                                  Active
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.statusSelectorButton,

                                  !fineActive &&
                                    styles.statusSelectorButtonInactive,
                                ]}
                                onPress={() => setFineActive(false)}
                                disabled={savingFineType}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.statusSelectorText,

                                    !fineActive &&
                                      styles.statusSelectorTextInactive,
                                  ]}
                                >
                                  Inactive
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>

                        {/* DESCRIPTION */}

                        <View style={styles.fineDescriptionField}>
                          <Text style={styles.inputLabel}>Description</Text>

                          <TextInput
                            value={fineDescription}
                            onChangeText={setFineDescription}
                            placeholder="Optional description of the violation"
                            placeholderTextColor="#A0A7B2"
                            style={styles.fineDescriptionInput}
                            multiline
                            maxLength={500}
                            textAlignVertical="top"
                            editable={!savingFineType}
                          />
                        </View>

                        {/* FORM ACTIONS */}

                        <View style={styles.fineTypeFormActions}>
                          <TouchableOpacity
                            style={[
                              styles.cancelButton,

                              savingFineType && {
                                opacity: 0.6,
                              },
                            ]}
                            onPress={resetFineTypeForm}
                            disabled={savingFineType}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.primaryButton,

                              savingFineType && {
                                opacity: 0.7,
                              },
                            ]}
                            onPress={handleSaveFineType}
                            disabled={savingFineType}
                            activeOpacity={0.8}
                          >
                            {savingFineType ? (
                              <View
                                style={{
                                  flexDirection: "row",

                                  alignItems: "center",

                                  gap: 8,
                                }}
                              >
                                <ActivityIndicator
                                  size="small"
                                  color="#FFFFFF"
                                />

                                <Text style={styles.primaryButtonText}>
                                  {editingFineTypeId
                                    ? "Saving..."
                                    : "Adding..."}
                                </Text>
                              </View>
                            ) : (
                              <Text style={styles.primaryButtonText}>
                                {editingFineTypeId
                                  ? "Save Changes"
                                  : "Add Fine Type"}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* =============================
                        INFO
                    ============================== */}

                    <View style={styles.fineTypeNotice}>
                      <Text style={styles.systemNoticeIcon}>i</Text>

                      <Text style={styles.fineTypeNoticeText}>
                        Only Active fine types are available when recording new
                        fines. Existing fine records keep their original saved
                        amount even if the official amount changes later.
                      </Text>
                    </View>

                    {/* =============================
                        LOADING / ERROR / TABLE
                    ============================== */}

                    {fineTypesLoading ? (
                      <View style={styles.fineTypesLoading}>
                        <ActivityIndicator size="small" color="#173A73" />

                        <Text style={styles.fineTypesLoadingText}>
                          Loading fine types...
                        </Text>
                      </View>
                    ) : fineTypesError ? (
                      <View style={styles.fineTypesErrorBox}>
                        <Text style={styles.fineTypesErrorText}>
                          {fineTypesError}
                        </Text>

                        <TouchableOpacity
                          style={styles.fineTypesRetryButton}
                          onPress={() => loadFineTypes(true, false)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.fineTypesRetryText}>
                            Try Again
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        {fineTypesRefreshing && (
                          <View
                            style={{
                              flexDirection: "row",

                              alignItems: "center",

                              justifyContent: "center",

                              gap: 8,

                              paddingBottom: 12,
                            }}
                          >
                            <ActivityIndicator size="small" color="#173A73" />

                            <Text style={styles.fineTypesLoadingText}>
                              Refreshing fine types...
                            </Text>
                          </View>
                        )}

                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                        >
                          <View style={styles.fineTypesTable}>
                            {/* HEADER */}

                            <View style={styles.fineTypesTableHeader}>
                              <Text
                                style={[
                                  styles.fineTypesHeaderText,

                                  styles.fineCodeColumn,
                                ]}
                              >
                                Code
                              </Text>

                              <Text
                                style={[
                                  styles.fineTypesHeaderText,

                                  styles.fineNameColumn,
                                ]}
                              >
                                Fine Type
                              </Text>

                              <Text
                                style={[
                                  styles.fineTypesHeaderText,

                                  styles.fineAmountColumn,
                                ]}
                              >
                                Amount
                              </Text>

                              <Text
                                style={[
                                  styles.fineTypesHeaderText,

                                  styles.fineStatusColumn,
                                ]}
                              >
                                Status
                              </Text>

                              <Text
                                style={[
                                  styles.fineTypesHeaderText,

                                  styles.fineActionColumn,
                                ]}
                              >
                                Actions
                              </Text>
                            </View>

                            {/* ROWS */}

                            {fineTypes.length === 0 ? (
                              <View style={styles.fineTypesEmpty}>
                                <Text style={styles.fineTypesEmptyTitle}>
                                  No fine types found
                                </Text>

                                <Text style={styles.fineTypesEmptyText}>
                                  Add your first fine type to begin using it in
                                  SmartFine.
                                </Text>
                              </View>
                            ) : (
                              fineTypes.map((fineType) => {
                                const active = Number(fineType.is_active) === 1;

                                const changingStatus =
                                  changingFineStatusId === fineType.id;

                                return (
                                  <View
                                    key={fineType.id}
                                    style={[
                                      styles.fineTypesTableRow,

                                      fineTypesRefreshing && {
                                        opacity: 0.7,
                                      },
                                    ]}
                                  >
                                    {/* CODE */}

                                    <View style={styles.fineCodeColumn}>
                                      <Text style={styles.fineCodeText}>
                                        {fineType.violation_code}
                                      </Text>
                                    </View>

                                    {/* NAME */}

                                    <View style={styles.fineNameColumn}>
                                      <Text style={styles.fineNameText}>
                                        {fineType.violation_name}
                                      </Text>

                                      {fineType.description ? (
                                        <Text
                                          numberOfLines={2}
                                          style={styles.fineDescriptionText}
                                        >
                                          {fineType.description}
                                        </Text>
                                      ) : null}
                                    </View>

                                    {/* AMOUNT */}

                                    <View style={styles.fineAmountColumn}>
                                      <Text style={styles.fineAmountText}>
                                        ₱
                                        {Number(
                                          fineType.amount ??
                                            Number(fineType.amount_centavos) /
                                              100,
                                        ).toFixed(2)}
                                      </Text>
                                    </View>

                                    {/* STATUS */}

                                    <View style={styles.fineStatusColumn}>
                                      <View
                                        style={[
                                          styles.fineStatusBadge,

                                          active
                                            ? styles.fineStatusActiveBadge
                                            : styles.fineStatusInactiveBadge,
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.fineStatusText,

                                            active
                                              ? styles.fineStatusActiveText
                                              : styles.fineStatusInactiveText,
                                          ]}
                                        >
                                          {active ? "Active" : "Inactive"}
                                        </Text>
                                      </View>
                                    </View>

                                    {/* ACTIONS */}

                                    <View style={styles.fineActionColumn}>
                                      <View style={styles.fineActionButtons}>
                                        <TouchableOpacity
                                          style={[
                                            styles.editFineTypeButton,

                                            (changingStatus ||
                                              savingFineType ||
                                              fineTypesRefreshing) && {
                                              opacity: 0.55,
                                            },
                                          ]}
                                          onPress={() =>
                                            handleEditFineType(fineType)
                                          }
                                          disabled={
                                            changingStatus ||
                                            savingFineType ||
                                            fineTypesRefreshing
                                          }
                                          activeOpacity={0.8}
                                        >
                                          <Text style={styles.editFineTypeText}>
                                            Edit
                                          </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                          style={[
                                            styles.fineStatusActionButton,

                                            active
                                              ? styles.deactivateFineTypeButton
                                              : styles.activateFineTypeButton,

                                            (changingStatus ||
                                              savingFineType ||
                                              fineTypesRefreshing) && {
                                              opacity: 0.6,
                                            },
                                          ]}
                                          onPress={() =>
                                            handleToggleFineTypeStatus(fineType)
                                          }
                                          disabled={
                                            changingStatus ||
                                            savingFineType ||
                                            fineTypesRefreshing
                                          }
                                          activeOpacity={0.8}
                                        >
                                          {changingStatus ? (
                                            <View
                                              style={{
                                                flexDirection: "row",

                                                alignItems: "center",

                                                gap: 5,
                                              }}
                                            >
                                              <ActivityIndicator
                                                size="small"
                                                color={
                                                  active ? "#D32F2F" : "#2E9D43"
                                                }
                                              />

                                              <Text
                                                style={[
                                                  styles.fineStatusActionText,

                                                  active
                                                    ? styles.deactivateFineTypeText
                                                    : styles.activateFineTypeText,
                                                ]}
                                              >
                                                Updating...
                                              </Text>
                                            </View>
                                          ) : (
                                            <Text
                                              style={[
                                                styles.fineStatusActionText,

                                                active
                                                  ? styles.deactivateFineTypeText
                                                  : styles.activateFineTypeText,
                                              ]}
                                            >
                                              {active
                                                ? "Deactivate"
                                                : "Activate"}
                                            </Text>
                                          )}
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  </View>
                                );
                              })
                            )}
                          </View>
                        </ScrollView>
                      </>
                    )}
                  </View>
                </View>

                {/* ==================================
                    SYSTEM SETTINGS
                ================================== */}

                <View>
                  <Text style={styles.sectionTitle}>System Settings</Text>

                  <View style={styles.settingsCard}>
                    <View style={styles.formRow}>
                      <View style={styles.formField}>
                        <Text style={styles.inputLabel}>School Name</Text>

                        <TextInput
                          value={schoolName}
                          onChangeText={setSchoolName}
                          placeholder="Enter school name"
                          placeholderTextColor="#A0A7B2"
                          style={styles.input}
                          editable={!savingSystemSettings}
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.inputLabel}>Academic Year</Text>

                        <TextInput
                          value={academicYear}
                          onChangeText={setAcademicYear}
                          placeholder="Example: 2026 - 2027"
                          placeholderTextColor="#A0A7B2"
                          style={styles.input}
                          editable={!savingSystemSettings}
                        />
                      </View>
                    </View>

                    <View style={styles.formRow}>
                      <View style={styles.formField}>
                        <Text style={styles.inputLabel}>System Name</Text>

                        <TextInput
                          value={systemName}
                          onChangeText={setSystemName}
                          placeholder="SmartFine"
                          placeholderTextColor="#A0A7B2"
                          style={styles.input}
                          editable={!savingSystemSettings}
                        />
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.inputLabel}>Currency</Text>

                        <View style={[styles.input, styles.readOnlyInput]}>
                          <Text style={styles.readOnlyText}>
                            Philippine Peso (₱)
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.systemNotice}>
                      <Text style={styles.systemNoticeIcon}>i</Text>

                      <Text style={styles.systemNoticeText}>
                        These values are used as SmartFine&apos;s system-wide
                        school information.
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.cardActionRow,

                        {
                          marginTop: 18,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.primaryButton,

                          savingSystemSettings && {
                            opacity: 0.7,
                          },
                        ]}
                        onPress={handleSaveSystemSettings}
                        disabled={savingSystemSettings}
                        activeOpacity={0.8}
                      >
                        {savingSystemSettings ? (
                          <View
                            style={{
                              flexDirection: "row",

                              alignItems: "center",

                              gap: 8,
                            }}
                          >
                            <ActivityIndicator size="small" color="#FFFFFF" />

                            <Text style={styles.primaryButtonText}>
                              Saving...
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.primaryButtonText}>
                            Save System Settings
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* =====================================
          REMOVE PHOTO
      ====================================== */}

      <DeleteModal
        visible={showRemovePhotoModal}
        loading={removingPhoto}
        title="Remove Profile Picture?"
        message="Are you sure you want to remove your current profile picture?"
        onCancel={handleCancelRemovePhoto}
        onConfirm={performRemovePhoto}
      />

      {/* =====================================
          SUCCESS
      ====================================== */}

      <SuccessModal
        visible={showSuccessModal}
        title={successTitle}
        message={successMessage}
        buttonText="OK"
        onClose={() => {
          setShowSuccessModal(false);
        }}
      />

      {/* =====================================
          WARNING
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

      {/* =====================================
          LOGOUT
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
// PROFILE PICTURE URL
// ==========================================

function getProfilePictureUrl(uri: string | null | undefined) {
  if (!uri) {
    return null;
  }

  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  return `${API_BASE}${uri}`;
}

// ==========================================
// INITIALS
// ==========================================

function getInitials(user: AdminUser | null) {
  const first = user?.firstName?.trim().charAt(0).toUpperCase() || "";

  const last = user?.lastName?.trim().charAt(0).toUpperCase() || "";

  return `${first}${last}` || "AD";
}

// ==========================================
// IMAGE FILENAME
// ==========================================

function createImageFilename(asset: ImagePicker.ImagePickerAsset) {
  if (asset.fileName) {
    return asset.fileName;
  }

  const extension = getImageExtension(asset.uri);

  return `admin-profile-${Date.now()}.${extension}`;
}

// ==========================================
// IMAGE EXTENSION
// ==========================================

function getImageExtension(uri: string) {
  const cleanUri = uri.split("?")[0].toLowerCase();

  if (cleanUri.endsWith(".png")) {
    return "png";
  }

  if (cleanUri.endsWith(".webp")) {
    return "webp";
  }

  if (cleanUri.endsWith(".jpeg")) {
    return "jpeg";
  }

  return "jpg";
}

// ==========================================
// MIME TYPE
// ==========================================

function getMimeType(uri: string) {
  const extension = getImageExtension(uri);

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

// ==========================================
// NEXT FINE CODE FALLBACK
// ==========================================

function getNextFineCodeFromTypes(fineTypes: FineType[]) {
  let highestNumber = 0;

  for (const fineType of fineTypes) {
    const match = String(fineType.violation_code || "")
      .trim()
      .toUpperCase()
      .match(/^V(\d+)$/);

    if (!match) {
      continue;
    }

    const numericPart = Number(match[1]);

    if (Number.isSafeInteger(numericPart) && numericPart > highestNumber) {
      highestNumber = numericPart;
    }
  }

  return `V${String(highestNumber + 1).padStart(3, "0")}`;
}

// ==========================================
// EMAIL VALIDATION
// ==========================================

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
