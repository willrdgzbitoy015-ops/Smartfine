import { File as ExpoFile } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { useGuardedRouter } from "@/hooks/use-guarded-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as ImagePicker from "expo-image-picker";

import { returnToLogin, useAuth } from "@/hooks/use-auth";

import { API_BASE } from "@/constants/api";
import { useActionLock } from "@/hooks/use-action-lock";
import { useFieldFocus } from "@/hooks/use-field-focus";
import { AdminNavBadge } from "@/components/notification-badge";

import {
  AdministratorsPanel,
  formatDate,
  initialsOf,
  pictureUrl,
} from "@/components/admin-settings/administrators-panel";
import { ActivityLogPanel } from "@/components/admin-settings/activity-log-panel";
import { ChangePasswordModal } from "@/components/admin-settings/change-password-modal";
import { FormPopup, PopupButton } from "@/components/admin-settings/form";
import { SectionCard } from "@/components/admin-settings/section-card";
import { SystemResetModal } from "@/components/admin-settings/system-reset-modal";
import type { AdminAccount } from "@/components/admin-settings/types";
import DeleteModal from "@/components/deletationmodal";
import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";
import { useSwitchFade } from "@/components/motion";
import { SkeletonProfile, SkeletonTable } from "@/components/skeleton";
import { haptics } from "@/utils/haptics";

import { styles } from "./settings.styles";

// ==========================================
// TYPES
// ==========================================

type NavItem = {
  label: string;
  route: string;
  icon?: any;
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

  user?: AdminAccount;

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

  user?: AdminAccount;

  profilePictureUri?: string;

  settings?: SystemSettings;
};

const FINE_TABLE_MIN_WIDTH = 570;

type SettingsTab =
  | "account"
  | "security"
  | "admins"
  | "fineTypes"
  | "activity"
  | "system";

const TABS: { key: SettingsTab; label: string; icon: any }[] = [
  {
    key: "account",
    label: "Account",
    icon: require("../../../assets/icons/user.png"),
  },
  {
    key: "security",
    label: "Security",
    icon: require("../../../assets/icons/padlock.png"),
  },
  {
    key: "admins",
    label: "Administrators",
    icon: require("../../../assets/icons/officers.png"),
  },
  {
    key: "fineTypes",
    label: "Fine Types",
    icon: require("../../../assets/icons/fines.png"),
  },
  {
    key: "activity",
    label: "Activity Log",
    icon: require("../../../assets/icons/reports.png"),
  },
  {
    key: "system",
    label: "System",
    icon: require("../../../assets/icons/settings.png"),
  },
];

// ==========================================
// ADMIN SETTINGS
// ==========================================

export default function AdminSettings() {
  const router = useGuardedRouter();

  // Saving, paying and changing records run once per tap.
  const runLocked = useActionLock();

  // Highlights the field being typed in.
  const { focused: focusedField, bind: bindFocus } = useFieldFocus();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // Profile card beside the tabs only when the tabs keep about 620 px.
  const isWide = width >= 1250;

  // Below the wide layout the profile card spans the page as a row. Phones
  // get a compact card (the contact details are in the Account tab) so the
  // tabs stay near the top.
  const profileInRow = !isWide;

  const compactProfile = width < 560;

  // Tab icons only where all five tabs fit with them.
  const showTabIcons = width >= 1000;

  // ========================================
  // TABS
  // ========================================

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const tabFade = useSwitchFade(activeTab);

  const selectTab = (tab: SettingsTab) => {
    if (tab === activeTab) {
      return;
    }

    haptics.selection();

    setActiveTab(tab);
  };

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

  const [admin, setAdmin] = useState<AdminAccount | null>(null);

  // ========================================
  // ACCOUNT SETTINGS
  // ========================================

  const [firstName, setFirstName] = useState("");

  const [middleName, setMiddleName] = useState("");

  const [lastName, setLastName] = useState("");

  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");

  const [contactNumber, setContactNumber] = useState("");

  // ========================================
  // PASSWORD
  // ========================================

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);

  // ========================================
  // SYSTEM SETTINGS
  // ========================================

  const [schoolName, setSchoolName] = useState("");

  const [academicYear, setAcademicYear] = useState("");

  const [systemName, setSystemName] = useState("SmartFine");

  const [savedSystem, setSavedSystem] = useState({
    schoolName: "",
    academicYear: "",
    systemName: "SmartFine",
  });

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

  const [fineTypeFormError, setFineTypeFormError] = useState("");

  const [changingFineStatusId, setChangingFineStatusId] = useState<
    number | null
  >(null);

  // The table fills the card and scrolls sideways only below its minimum
  // width; a horizontal ScrollView would otherwise let long descriptions
  // stretch the name column.
  const [fineTableWidth, setFineTableWidth] = useState(0);

  // ========================================
  // PAGE STATE
  // ========================================

  const [loading, setLoading] = useState(true);

  const [savingAccount, setSavingAccount] = useState(false);

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
  // ACCOUNT FORM
  // ========================================

  const fillAccountForm = (user: AdminAccount) => {
    setFirstName(user.firstName || "");

    setMiddleName(user.middleName || "");

    setLastName(user.lastName || "");

    setUsername(user.username || "");

    setEmail(user.email || "");

    setContactNumber(user.contactNumber || "");
  };

  const accountDirty =
    !!admin &&
    (firstName.trim() !== (admin.firstName || "") ||
      middleName.trim() !== (admin.middleName || "") ||
      lastName.trim() !== (admin.lastName || "") ||
      username.trim() !== (admin.username || "") ||
      email.trim() !== (admin.email || "") ||
      contactNumber.trim() !== (admin.contactNumber || ""));

  const systemDirty =
    schoolName.trim() !== savedSystem.schoolName ||
    academicYear.trim() !== savedSystem.academicYear ||
    systemName.trim() !== savedSystem.systemName;

  const applySystemSettings = (settings: SystemSettings) => {
    const values = {
      schoolName: settings.schoolName || "",
      academicYear: settings.academicYear || "",
      systemName: settings.systemName || "SmartFine",
    };

    setSchoolName(values.schoolName);

    setAcademicYear(values.academicYear);

    setSystemName(values.systemName);

    setSavedSystem(values);
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

      fillAccountForm(adminData.user);

      // ==================================
      // SYSTEM
      // ==================================

      applySystemSettings(settingsData.settings);

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

  const handleSaveAccount = () =>
    runLocked(async () => {
      const cleaned = {
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
      };

      if (!cleaned.firstName || !cleaned.lastName) {
        showMessage("Validation", "First name and last name are required.");

        return;
      }

      const names: [string, string][] = [
        ["First name", cleaned.firstName],
        ["Middle name", cleaned.middleName],
        ["Last name", cleaned.lastName],
      ];

      for (const [label, value] of names) {
        if (value && (value.length < 2 || value.length > 50)) {
          showMessage("Validation", `${label} must be 2 to 50 characters.`);

          return;
        }
      }

      if (!cleaned.username) {
        showMessage("Validation", "Username is required.");

        return;
      }

      if (!cleaned.email) {
        showMessage("Validation", "Email address is required.");

        return;
      }

      if (!isValidEmail(cleaned.email)) {
        showMessage("Validation", "Please enter a valid email address.");

        return;
      }

      if (cleaned.contactNumber && !/^\+?[0-9]{7,15}$/.test(cleaned.contactNumber)) {
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

          body: JSON.stringify(cleaned),
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

          fillAccountForm(data.user);

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
    });

  // ========================================
  // SAVE SYSTEM SETTINGS
  // ========================================

  const handleSaveSystemSettings = () =>
    runLocked(async () => {
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
          applySystemSettings(data.settings);
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
    });

  // ========================================
  // RESET FINE TYPE FORM
  // ========================================

  // Closes the form. The fields stay as they are while the pop-up fades out;
  // Add and Edit fill every field again when the form next opens.
  const resetFineTypeForm = () => {
    setFineTypeFormError("");

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

    setFineTypeFormError("");

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

    setFineTypeFormError("");

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

  const handleSaveFineType = () =>
    runLocked(async () => {
      const cleanedName = fineName.trim();

      const cleanedDescription = fineDescription.trim();

      const amount = Number(fineAmount);

      if (!cleanedName) {
        setFineTypeFormError("Fine type name is required.");

        return;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        setFineTypeFormError("Fine amount must be greater than zero.");

        return;
      }

      try {
        setFineTypeFormError("");

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
          setFineTypeFormError(data.message || "Failed to save the fine type.");

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

        setFineTypeFormError("Could not save the fine type.");
      } finally {
        setSavingFineType(false);
      }
    });

  // ========================================
  // ACTIVATE / DEACTIVATE FINE TYPE
  // ========================================

  const handleToggleFineTypeStatus = (fineType: FineType) =>
    runLocked(async () => {
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
    });

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

  const performRemovePhoto = () =>
    runLocked(async () => {
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
    });

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

      returnToLogin();
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

  const profilePictureUrl = pictureUrl(admin?.profilePictureUri);

  const initials = initialsOf(admin);

  const memberSince = formatDate(admin?.createdAt);

  const photoBusy = uploadingPhoto || removingPhoto;

  const fineTypesBusy =
    fineTypesLoading ||
    fineTypesRefreshing ||
    savingFineType ||
    changingFineStatusId !== null;

  // ========================================
  // PROFILE CARD
  // ========================================

  const renderProfileCard = () => (
    <View
      style={[
        styles.profileCard,

        !isWide && styles.profileCardStacked,

        profileInRow && styles.profileCardRow,

        compactProfile && styles.profileCardCompact,
      ]}
    >
      <View
        style={[
          styles.avatarWrapper,
          profileInRow && styles.avatarWrapperRow,
          compactProfile && styles.avatarWrapperCompact,
        ]}
      >
        {profilePictureUrl && !imageFailed ? (
          <Image
            source={{
              uri: profilePictureUrl,
            }}
            style={[styles.avatar, compactProfile && styles.avatarCompact]}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              compactProfile && styles.avatarCompact,
              styles.avatarFallback,
            ]}
          >
            <Text
              style={[
                styles.avatarInitials,
                compactProfile && styles.avatarInitialsCompact,
              ]}
            >
              {initials}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.cameraButton,
            compactProfile && styles.cameraButtonCompact,
            photoBusy && { opacity: 0.65 },
          ]}
          onPress={handleChoosePhoto}
          disabled={photoBusy}
          accessibilityLabel="Change profile photo"
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

      <View
        style={[styles.profileDetails, profileInRow && styles.profileDetailsRow]}
      >
        <Text
          style={[
            styles.profileName,
            profileInRow && styles.textStart,
            compactProfile && styles.profileNameCompact,
          ]}
          numberOfLines={2}
        >
          {admin?.fullName || admin?.username || "Administrator"}
        </Text>

        <View style={[styles.profileChips, profileInRow && styles.rowStart]}>
          <Text style={styles.roleChip}>Administrator</Text>

          <Text style={styles.activeChip}>● Active</Text>
        </View>

        <Text style={[styles.profileUsername, profileInRow && styles.textStart]}>
          @{admin?.username || "admin"}
        </Text>

        {!compactProfile && (
          <>
            <View
              style={[styles.profileDivider, profileInRow && styles.dividerRow]}
            />

            <View
              style={[styles.profileInfoList, profileInRow && styles.infoListRow]}
            >
              <ProfileInfo
                label="EMAIL"
                value={admin?.email || "Not provided"}
                alignStart={profileInRow}
              />

              <ProfileInfo
                label="CONTACT NUMBER"
                value={admin?.contactNumber || "Not provided"}
                alignStart={profileInRow}
              />

              {memberSince ? (
                <ProfileInfo
                  label="MEMBER SINCE"
                  value={memberSince}
                  alignStart={profileInRow}
                />
              ) : null}
            </View>
          </>
        )}

        <View
          style={[
            styles.photoActions,
            profileInRow && styles.rowStart,
            compactProfile && styles.photoActionsCompact,
          ]}
        >
          <TouchableOpacity
            style={[styles.changePhotoButton, photoBusy && { opacity: 0.65 }]}
            onPress={handleChoosePhoto}
            disabled={photoBusy}
            activeOpacity={0.8}
          >
            {uploadingPhoto ? (
              <View style={styles.inlineRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />

                <Text style={styles.changePhotoButtonText}>Uploading...</Text>
              </View>
            ) : (
              <Text style={styles.changePhotoButtonText}>
                {admin?.profilePictureUri ? "Change Photo" : "Add Photo"}
              </Text>
            )}
          </TouchableOpacity>

          {admin?.profilePictureUri && (
            <TouchableOpacity
              style={[styles.removePhotoButton, photoBusy && { opacity: 0.65 }]}
              onPress={handleRemovePhoto}
              disabled={photoBusy}
              activeOpacity={0.8}
            >
              {removingPhoto ? (
                <View style={styles.inlineRow}>
                  <ActivityIndicator size="small" color="#D32F2F" />

                  <Text style={styles.removePhotoButtonText}>Removing...</Text>
                </View>
              ) : (
                <Text style={styles.removePhotoButtonText}>Remove</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.photoHint, profileInRow && styles.textStart]}>
          JPG, PNG or WEBP • Max 5 MB
        </Text>
      </View>
    </View>
  );

  // ========================================
  // TAB BAR
  // ========================================

  const renderTabBar = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBarScroll}
      contentContainerStyle={styles.tabBar}
      accessibilityRole="tablist"
    >
      {TABS.map((tab) => {
        const active = tab.key === activeTab;

        const unsaved =
          (tab.key === "account" && accountDirty) ||
          (tab.key === "system" && systemDirty);

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => selectTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={unsaved ? `${tab.label}, unsaved changes` : tab.label}
            activeOpacity={0.8}
          >
            {showTabIcons && (
              <Image
                source={tab.icon}
                style={[styles.tabIcon, active && styles.tabIconActive]}
                resizeMode="contain"
              />
            )}

            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
            </Text>

            {unsaved && <View style={styles.tabDot} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // ========================================
  // ACCOUNT TAB
  // ========================================

  const renderAccountTab = () => (
    <SectionCard
      title="Profile Details"
      description="Your name, sign-in username and contact details. Your name appears on your profile and in the administrators list."
      icon={require("../../../assets/icons/user.png")}
      footer={
        <>
          {accountDirty && (
            <Text style={styles.unsavedText}>● Unsaved changes</Text>
          )}

          <PopupButton
            label="Discard"
            variant="outline"
            disabled={!accountDirty || savingAccount}
            onPress={() => admin && fillAccountForm(admin)}
          />

          <PopupButton
            label="Save Changes"
            busyLabel="Saving..."
            busy={savingAccount}
            disabled={!accountDirty}
            onPress={handleSaveAccount}
          />
        </>
      }
    >
      <Text style={styles.groupLabel}>NAME</Text>

      <View style={styles.formRow}>
        <View style={styles.formFieldThird}>
          <Text style={styles.inputLabel}>
            First Name <Text style={styles.requiredMark}>*</Text>
          </Text>

          <TextInput
            value={firstName}
            {...bindFocus("firstName")}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor="#A0A7B2"
            style={[
              styles.input,
              focusedField === "firstName" && styles.inputFocused,
            ]}
            maxLength={50}
            editable={!savingAccount}
          />
        </View>

        <View style={styles.formFieldThird}>
          <Text style={styles.inputLabel}>Middle Name</Text>

          <TextInput
            value={middleName}
            {...bindFocus("middleName")}
            onChangeText={setMiddleName}
            placeholder="Optional"
            placeholderTextColor="#A0A7B2"
            style={[
              styles.input,
              focusedField === "middleName" && styles.inputFocused,
            ]}
            maxLength={50}
            editable={!savingAccount}
          />
        </View>

        <View style={styles.formFieldThird}>
          <Text style={styles.inputLabel}>
            Last Name <Text style={styles.requiredMark}>*</Text>
          </Text>

          <TextInput
            value={lastName}
            {...bindFocus("lastName")}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor="#A0A7B2"
            style={[
              styles.input,
              focusedField === "lastName" && styles.inputFocused,
            ]}
            maxLength={50}
            editable={!savingAccount}
          />
        </View>
      </View>

      <Text style={[styles.groupLabel, styles.groupLabelGap]}>
        SIGN-IN & CONTACT
      </Text>

      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>
            Username <Text style={styles.requiredMark}>*</Text>
          </Text>

          <TextInput
            value={username}
            {...bindFocus("username")}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor="#A0A7B2"
            style={[
              styles.input,
              focusedField === "username" && styles.inputFocused,
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!savingAccount}
          />

          <Text style={styles.fieldHint}>Used to sign in to SmartFine.</Text>
        </View>

        <View style={styles.formField}>
          <Text style={styles.inputLabel}>
            Primary Email <Text style={styles.requiredMark}>*</Text>
          </Text>

          <TextInput
            value={email}
            {...bindFocus("email")}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#A0A7B2"
            style={[
              styles.input,
              focusedField === "email" && styles.inputFocused,
            ]}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!savingAccount}
          />

          <Text style={styles.fieldHint}>Receives password reset codes.</Text>
        </View>
      </View>

      <View style={[styles.formRow, styles.formRowLast]}>
        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Contact Number</Text>

          <TextInput
            value={contactNumber}
            {...bindFocus("contactNumber")}
            onChangeText={setContactNumber}
            placeholder="09xxxxxxxxx"
            placeholderTextColor="#A0A7B2"
            style={[
              styles.input,
              focusedField === "contactNumber" && styles.inputFocused,
            ]}
            keyboardType="phone-pad"
            editable={!savingAccount}
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.inputLabel}>Account Role</Text>

          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>Administrator</Text>
          </View>
        </View>
      </View>
    </SectionCard>
  );

  // ========================================
  // SECURITY TAB
  // ========================================

  const renderSecurityTab = () => (
    <View style={styles.tabStack}>
      <SectionCard
        title="Password"
        description="Change the password you use to sign in to SmartFine."
        icon={require("../../../assets/icons/padlock.png")}
      >
        <View style={styles.securityRow}>
          <View style={styles.securityText}>
            <Text style={styles.securityTitle}>Sign-in password</Text>

            <Text style={styles.securityHint}>
              Use at least 8 characters with uppercase and lowercase letters,
              a number and a symbol. You&apos;ll need your current password to
              change it.
            </Text>
          </View>

          <PopupButton
            label="Change Password"
            onPress={() => setShowPasswordModal(true)}
          />
        </View>
      </SectionCard>

      <SectionCard
        title="Sign-in Protection"
        description="How SmartFine protects administrator accounts."
        icon={require("../../../assets/icons/policy-icon.png")}
      >
        <ProtectionItem
          title="Lockout after wrong passwords"
          text="After 3 wrong passwords, sign-in pauses for 30 seconds. Each further lockout lasts longer, up to 5 minutes, until the next successful sign-in."
        />

        <ProtectionItem
          title="Sessions expire"
          text="You're signed out 8 hours after signing in and need to sign in again."
        />

        <ProtectionItem
          title="Forgot your password?"
          text={`Choose Forgot Password on the sign-in screen to get a reset code by email${admin?.email ? ` at ${admin.email}` : ""}.`}
          last
        />
      </SectionCard>
    </View>
  );

  // ========================================
  // FINE TYPES TAB
  // ========================================

  const renderFineTypesTab = () => (
    <SectionCard
      title="Fine Types"
      description="Violation types and the official fine amounts used when recording new fines."
      icon={require("../../../assets/icons/fines.png")}
      actions={
        <>
          <PopupButton
            label="↻ Refresh"
            busyLabel="Refreshing..."
            variant="outline"
            busy={fineTypesRefreshing}
            disabled={fineTypesBusy}
            onPress={handleRefreshFineTypes}
          />

          <PopupButton
            label="+ Add Fine Type"
            variant="green"
            disabled={fineTypesLoading || fineTypesRefreshing || savingFineType}
            onPress={handleAddFineType}
          />
        </>
      }
    >
      <View style={styles.infoNotice}>
        <Text style={styles.infoNoticeIcon}>i</Text>

        <Text style={styles.infoNoticeText}>
          Only Active fine types are available when recording new fines.
          Existing fine records keep their original saved amount even if the
          official amount changes later.
        </Text>
      </View>

      {fineTypesLoading ? (
        <SkeletonTable
          label="Loading fine types"
          rows={4}
          columns={4}
          avatar={false}
        />
      ) : fineTypesError ? (
        <View style={styles.fineTypesErrorBox}>
          <Text style={styles.fineTypesErrorText}>{fineTypesError}</Text>

          <TouchableOpacity
            style={styles.fineTypesRetryButton}
            onPress={() => loadFineTypes(true, false)}
            activeOpacity={0.8}
          >
            <Text style={styles.fineTypesRetryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={(event) =>
            setFineTableWidth(Math.round(event.nativeEvent.layout.width))
          }
        >
          <View
            style={[
              styles.fineTypesTable,
              fineTableWidth > 0 && {
                width: Math.max(fineTableWidth, FINE_TABLE_MIN_WIDTH),
              },
            ]}
          >
            {/* HEADER */}

            <View style={styles.fineTypesTableHeader}>
              <Text style={[styles.fineTypesHeaderText, styles.fineCodeColumn]}>
                Code
              </Text>

              <Text style={[styles.fineTypesHeaderText, styles.fineNameColumn]}>
                Fine Type
              </Text>

              <Text
                style={[styles.fineTypesHeaderText, styles.fineAmountColumn]}
              >
                Amount
              </Text>

              <Text
                style={[styles.fineTypesHeaderText, styles.fineStatusColumn]}
              >
                Status
              </Text>

              <Text
                style={[styles.fineTypesHeaderText, styles.fineActionColumn]}
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
                  Add your first fine type to begin using it in SmartFine.
                </Text>
              </View>
            ) : (
              fineTypes.map((fineType, index) => {
                const active = Number(fineType.is_active) === 1;

                const changingStatus = changingFineStatusId === fineType.id;

                const rowDisabled =
                  changingStatus || savingFineType || fineTypesRefreshing;

                return (
                  <View
                    key={fineType.id}
                    style={[
                      styles.fineTypesTableRow,

                      index % 2 === 1 && styles.fineTypesTableRowAlt,

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
                            Number(fineType.amount_centavos) / 100,
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

                            rowDisabled && {
                              opacity: 0.55,
                            },
                          ]}
                          onPress={() => handleEditFineType(fineType)}
                          disabled={rowDisabled}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.editFineTypeText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.fineStatusActionButton,

                            active
                              ? styles.deactivateFineTypeButton
                              : styles.activateFineTypeButton,

                            rowDisabled && {
                              opacity: 0.6,
                            },
                          ]}
                          onPress={() => handleToggleFineTypeStatus(fineType)}
                          disabled={rowDisabled}
                          activeOpacity={0.8}
                        >
                          {changingStatus ? (
                            <View style={styles.inlineRow}>
                              <ActivityIndicator
                                size="small"
                                color={active ? "#D32F2F" : "#2E9D43"}
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
                              {active ? "Deactivate" : "Activate"}
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
      )}
    </SectionCard>
  );

  // ========================================
  // SYSTEM TAB
  // ========================================

  const renderSystemTab = () => (
    <View style={styles.tabStack}>
      <SectionCard
        title="School & System"
        description="SmartFine's system-wide school information."
        icon={require("../../../assets/icons/settings.png")}
        footer={
          <>
            {systemDirty && (
              <Text style={styles.unsavedText}>● Unsaved changes</Text>
            )}

            <PopupButton
              label="Discard"
              variant="outline"
              disabled={!systemDirty || savingSystemSettings}
              onPress={() => {
                setSchoolName(savedSystem.schoolName);

                setAcademicYear(savedSystem.academicYear);

                setSystemName(savedSystem.systemName);
              }}
            />

            <PopupButton
              label="Save System Settings"
              busyLabel="Saving..."
              busy={savingSystemSettings}
              disabled={!systemDirty}
              onPress={handleSaveSystemSettings}
            />
          </>
        }
      >
        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.inputLabel}>
              School Name <Text style={styles.requiredMark}>*</Text>
            </Text>

            <TextInput
              value={schoolName}
              {...bindFocus("schoolName")}
              onChangeText={setSchoolName}
              placeholder="Enter school name"
              placeholderTextColor="#A0A7B2"
              style={[
                styles.input,
                focusedField === "schoolName" && styles.inputFocused,
              ]}
              editable={!savingSystemSettings}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.inputLabel}>
              Academic Year <Text style={styles.requiredMark}>*</Text>
            </Text>

            <TextInput
              value={academicYear}
              {...bindFocus("academicYear")}
              onChangeText={setAcademicYear}
              placeholder="Example: 2026 - 2027"
              placeholderTextColor="#A0A7B2"
              style={[
                styles.input,
                focusedField === "academicYear" && styles.inputFocused,
              ]}
              editable={!savingSystemSettings}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.inputLabel}>
              System Name <Text style={styles.requiredMark}>*</Text>
            </Text>

            <TextInput
              value={systemName}
              {...bindFocus("systemName")}
              onChangeText={setSystemName}
              placeholder="SmartFine"
              placeholderTextColor="#A0A7B2"
              style={[
                styles.input,
                focusedField === "systemName" && styles.inputFocused,
              ]}
              editable={!savingSystemSettings}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.inputLabel}>Currency</Text>

            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>Philippine Peso (₱)</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoNotice}>
          <Text style={styles.infoNoticeIcon}>i</Text>

          <Text style={styles.infoNoticeText}>
            These values are used as SmartFine&apos;s system-wide school
            information.
          </Text>
        </View>
      </SectionCard>

      <SectionCard
        title="Reset System"
        description="Start fresh for another school or a new school year."
        icon={require("../../../assets/icons/settings.png")}
        footer={
          <PopupButton
            label="Reset System..."
            variant="danger"
            onPress={() => setShowResetModal(true)}
          />
        }
      >
        <Text style={styles.resetText}>
          Deletes every student, officer, other administrator, fine, payment,
          refund and notification. Your account stays, you can keep the fine
          types and school name, and a full backup is saved on the server first.
        </Text>
      </SectionCard>
    </View>
  );

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
                  <AdminNavBadge label={item.label} />
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
          contentContainerStyle={[
            styles.scrollContent,
            !isTablet && styles.scrollContentPhone,
          ]}
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
                    <AdminNavBadge label={item.label} variant="menu" />
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
              Manage your account, security, administrators, fine types and
              school information
            </Text>
          </View>

          {loading ? (
            <SkeletonProfile label="Loading settings" sections={2} />
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
              {renderProfileCard()}

              {/* =============================
                  TABS
              ============================== */}

              <View style={styles.rightColumn}>
                {renderTabBar()}

                <Animated.View style={tabFade}>
                  {activeTab === "account" && renderAccountTab()}

                  {activeTab === "security" && renderSecurityTab()}

                  {activeTab === "admins" && (
                    <AdministratorsPanel onMessage={showMessage} />
                  )}

                  {activeTab === "fineTypes" && renderFineTypesTab()}

                  {activeTab === "activity" && <ActivityLogPanel />}

                  {activeTab === "system" && renderSystemTab()}
                </Animated.View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* =====================================
          CHANGE PASSWORD
      ====================================== */}

      <SystemResetModal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
        onReset={() => {
          setShowResetModal(false);

          // Every list and count changed; start again from the dashboard.
          router.replace("/admin/dashboard" as any);
        }}
      />

      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onChanged={(message) => {
          setShowPasswordModal(false);

          showMessage("Success", message);
        }}
      />

      {/* =====================================
          ADD / EDIT FINE TYPE
      ====================================== */}

      <FormPopup
        visible={showFineTypeForm}
        busy={savingFineType}
        wide
        title={editingFineTypeId ? "Edit Fine Type" : "Add Fine Type"}
        subtitle="The amount configured here will be used automatically for future fines."
        icon={require("../../../assets/icons/fines.png")}
        onClose={resetFineTypeForm}
        footer={
          <>
            <PopupButton
              label="Cancel"
              variant="outline"
              disabled={savingFineType}
              onPress={resetFineTypeForm}
            />

            <PopupButton
              label={editingFineTypeId ? "Save Changes" : "Add Fine Type"}
              busyLabel={editingFineTypeId ? "Saving..." : "Adding..."}
              busy={savingFineType}
              variant={editingFineTypeId ? "primary" : "green"}
              onPress={handleSaveFineType}
            />
          </>
        }
      >
        {fineTypeFormError !== "" && (
          <Text style={styles.fineTypeFormError}>{fineTypeFormError}</Text>
        )}

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

            <Text style={styles.fieldHint}>
              {editingFineTypeId
                ? "Fine codes are permanent and cannot be changed."
                : "SmartFine automatically assigns the next fine code."}
            </Text>
          </View>

          {/* FINE TYPE */}

          <View style={styles.formField}>
            <Text style={styles.inputLabel}>
              Fine Type <Text style={styles.requiredMark}>*</Text>
            </Text>

            <TextInput
              value={fineName}
              {...bindFocus("fineName")}
              onChangeText={setFineName}
              placeholder="Example: Unauthorized Gadget Use"
              placeholderTextColor="#A0A7B2"
              style={[
                styles.input,
                focusedField === "fineName" && styles.inputFocused,
              ]}
              maxLength={120}
              editable={!savingFineType}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          {/* AMOUNT */}

          <View style={styles.formField}>
            <Text style={styles.inputLabel}>
              Fine Amount <Text style={styles.requiredMark}>*</Text>
            </Text>

            <View
              style={[
                styles.amountInputContainer,
                focusedField === "fineAmount" && styles.inputFocused,
              ]}
            >
              <Text style={styles.amountPeso}>₱</Text>

              <TextInput
                value={fineAmount}
                {...bindFocus("fineAmount")}
                onChangeText={(value) => {
                  let cleaned = value.replace(/[^0-9.]/g, "");

                  const firstDot = cleaned.indexOf(".");

                  if (firstDot !== -1) {
                    cleaned =
                      cleaned.substring(0, firstDot + 1) +
                      cleaned.substring(firstDot + 1).replace(/\./g, "");
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

                  fineActive && styles.statusSelectorButtonActive,
                ]}
                onPress={() => setFineActive(true)}
                disabled={savingFineType}
                accessibilityState={{ selected: fineActive }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.statusSelectorText,

                    fineActive && styles.statusSelectorTextActive,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusSelectorButton,

                  !fineActive && styles.statusSelectorButtonInactive,
                ]}
                onPress={() => setFineActive(false)}
                disabled={savingFineType}
                accessibilityState={{ selected: !fineActive }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.statusSelectorText,

                    !fineActive && styles.statusSelectorTextInactive,
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
            {...bindFocus("fineDescription")}
            onChangeText={setFineDescription}
            placeholder="Optional description of the violation"
            placeholderTextColor="#A0A7B2"
            style={[
              styles.fineDescriptionInput,
              focusedField === "fineDescription" && styles.inputFocused,
            ]}
            multiline
            maxLength={500}
            textAlignVertical="top"
            editable={!savingFineType}
          />
        </View>
      </FormPopup>

      {/* =====================================
          REMOVE PHOTO
      ====================================== */}

      <DeleteModal
        visible={showRemovePhotoModal}
        loading={removingPhoto}
        title="Remove Profile Picture?"
        message="Are you sure you want to remove your current profile picture?"
        confirmText="Remove"
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
// PROFILE INFO
// ==========================================

function ProfileInfo({
  label,
  value,
  alignStart,
}: {
  label: string;
  value: string;
  alignStart: boolean;
}) {
  return (
    <View style={[styles.profileInfoBlock, alignStart && styles.infoBlockRow]}>
      <Text style={styles.profileInfoLabel}>{label}</Text>

      <Text
        style={[styles.profileInfoValue, alignStart && styles.textStart]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ==========================================
// SIGN-IN PROTECTION ITEM
// ==========================================

function ProtectionItem({
  title,
  text,
  last = false,
}: {
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.protectionItem, last && styles.protectionItemLast]}>
      <View style={styles.protectionCheck}>
        <Text style={styles.protectionCheckText}>✓</Text>
      </View>

      <View style={styles.protectionText}>
        <Text style={styles.protectionTitle}>{title}</Text>

        <Text style={styles.protectionBody}>{text}</Text>
      </View>
    </View>
  );
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
