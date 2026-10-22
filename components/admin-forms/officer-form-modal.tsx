import { isValidEmail } from "@/utils/validation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";

import {
  Banner,
  FormColumn,
  FormColumns,
  FormField,
  FormInput,
  FormPopup,
  FormRow,
  FormSection,
  PasswordChecklist,
  PasswordInput,
  PhotoField,
  PopupButton,
  ReadOnlyValue,
  StatusSwitch,
  SuccessPanel,
} from "@/components/form-popup";
import { SkeletonForm } from "@/components/skeleton";
import { API_BASE } from "@/constants/api";
import { apiFetch } from "@/utils/api-fetch";
import { useActionLock } from "@/hooks/use-action-lock";
import { haptics } from "@/utils/haptics";

import {
  imageExtension,
  imageMimeType,
  pictureUrl,
  validatePassword,
} from "./shared";

type Mode = "add" | "edit";

type Officer = {
  id: number;
  employee_number: string;
  username: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
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
  employeeNumber?: string;
  officer?: Officer & {
    employeeNumber?: string;
    username?: string;
  };
  profile_picture_uri?: string | null;
};

type Done = {
  title: string;
  lines: string[];
  warning?: string;
  officerId: number | null;
};

const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

// ==========================================
// API HELPERS
// ==========================================

async function authHeaders(): Promise<Record<string, string>> {
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

async function readResponse(response: Response): Promise<ApiResponse> {
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

function suggestUsername(first: string, last: string) {
  const cleanFirst = first.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanLast = last.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  return cleanFirst && cleanLast ? cleanFirst.charAt(0) + cleanLast : "";
}

// ==========================================
// ADD / EDIT OFFICER POP-UP
// ==========================================

// The Add New Officer and Edit Information forms as one pop-up. Requests,
// validation and messages are the same as the former screens.
export function OfficerFormModal({
  visible,
  mode,
  officerId,
  onClose,
  onSaved,
  onOpenProfile,
}: {
  visible: boolean;
  mode: Mode;
  officerId?: number | string | null;
  onClose: () => void;
  onSaved: (officerId: number | null) => void;
  onOpenProfile?: (officerId: number) => void;
}) {
  const editing = mode === "edit";

  const runLocked = useActionLock();

  // ----- record -----
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [employeeNumberLoading, setEmployeeNumberLoading] = useState(false);
  const [savedPictureUri, setSavedPictureUri] = useState<string | null>(null);
  const [newPicture, setNewPicture] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  // ----- officer information -----
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [assignedArea, setAssignedArea] = useState("");

  // ----- account information -----
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountActive, setAccountActive] = useState(true);

  // ----- pop-up state -----
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingPicture, setRemovingPicture] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  const busy = saving || removingPicture;

  const fail = (message: string) => {
    haptics.warning();
    setNotice("");
    setErrorMessage(message);
  };

  const clearMessages = () => {
    if (errorMessage) setErrorMessage("");
    if (notice) setNotice("");
  };

  // ========================================
  // OPEN
  // ========================================

  const resetForAdd = () => {
    setEmployeeNumber("");
    setSavedPictureUri(null);
    setNewPicture(null);
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setEmail("");
    setContactNumber("");
    setAssignedArea("");
    setUsername("");
    setUsernameEdited(false);
    setPassword("");
    setConfirmPassword("");
    setAccountActive(true);
    setErrorMessage("");
    setNotice("");
    setLoadError("");
    setDone(null);

    void loadNextEmployeeNumber();
  };

  const loadNextEmployeeNumber = async () => {
    try {
      setEmployeeNumberLoading(true);

      const response = await apiFetch(`${API_BASE}/api/officers/next-id`);
      const data = await response.json();

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

  const loadOfficer = async () => {
    try {
      setLoading(true);
      setLoadError("");
      setErrorMessage("");
      setNotice("");
      setDone(null);

      if (!officerId || !/^[1-9][0-9]*$/.test(String(officerId))) {
        throw new Error("Officer ID is missing or invalid.");
      }

      const response = await fetch(`${API_BASE}/api/officers/${officerId}`, {
        headers: await authHeaders(),
      });

      const data = await readResponse(response);

      if (!data.officer) {
        throw new Error("The server did not return officer information.");
      }

      const officer = data.officer;

      setSavedPictureUri(officer.profile_picture_uri || null);
      setNewPicture(null);
      setEmployeeNumber(officer.employee_number || "");
      setUsername(officer.username || "");
      setUsernameEdited(true);
      setFirstName(officer.first_name || "");
      setMiddleName(officer.middle_name || "");
      setLastName(officer.last_name || "");
      setEmail(officer.email || "");
      setContactNumber(officer.contact_number || "");
      setAssignedArea(officer.assigned_area || "");
      setAccountActive(String(officer.account_status).toUpperCase() === "ACTIVE");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setLoadError(errorText(error));
    } finally {
      setLoading(false);
    }
  };

  // Every opening starts from the saved record (edit) or a blank form (add).
  useEffect(() => {
    if (!visible) {
      return;
    }

    if (editing) {
      void loadOfficer();
    } else {
      resetForAdd();
    }
  }, [visible, editing, officerId]);

  // ========================================
  // FIELDS
  // ========================================

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    clearMessages();
  };

  const changeFirstName = (value: string) => {
    setFirstName(value);
    if (!editing && !usernameEdited) {
      setUsername(suggestUsername(value, lastName));
    }
    clearMessages();
  };

  const changeLastName = (value: string) => {
    setLastName(value);
    if (!editing && !usernameEdited) {
      setUsername(suggestUsername(firstName, value));
    }
    clearMessages();
  };

  const changeUsername = (value: string) => {
    setUsername(value.toLowerCase().replace(/[^a-z0-9]/g, ""));
    setUsernameEdited(true);
    clearMessages();
  };

  // ========================================
  // PROFILE PICTURE
  // ========================================

  const choosePicture = async () => {
    if (busy) {
      return;
    }

    try {
      clearMessages();

      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          fail(
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

      if (asset.fileSize && asset.fileSize > MAX_PICTURE_BYTES) {
        fail("Profile picture must be 5 MB or smaller.");
        return;
      }

      setNewPicture(asset);
    } catch (error) {
      fail(errorText(error));
    }
  };

  const uploadPicture = async (id: number): Promise<string | null> => {
    if (!newPicture) {
      return null;
    }

    const formData = new FormData();
    const extension = imageExtension(newPicture);

    if (Platform.OS === "web") {
      if (newPicture.file) {
        formData.append("profilePicture", newPicture.file);
      } else {
        const imageResponse = await fetch(newPicture.uri);
        formData.append(
          "profilePicture",
          await imageResponse.blob(),
          `officer-profile.${extension}`,
        );
      }
    } else {
      formData.append("profilePicture", {
        uri: newPicture.uri,
        name: newPicture.fileName || `officer-profile.${extension}`,
        type: imageMimeType(newPicture, extension),
      } as any);
    }

    const response = await fetch(
      `${API_BASE}/api/officers/${id}/profile-picture`,
      { method: "POST", headers: await authHeaders(), body: formData },
    );

    const data = await readResponse(response);

    return data.profile_picture_uri || data.officer?.profile_picture_uri || null;
  };

  const removeSavedPicture = () =>
    runLocked(async () => {
      if (!officerId) return;

      try {
        setRemovingPicture(true);
        clearMessages();

        const response = await fetch(
          `${API_BASE}/api/officers/${officerId}/profile-picture`,
          { method: "DELETE", headers: await authHeaders() },
        );

        await readResponse(response);

        setSavedPictureUri(null);
        setNewPicture(null);
        setNotice("Officer profile picture removed successfully.");
        onSaved(Number(officerId));
      } catch (error) {
        fail(errorText(error));
      } finally {
        setRemovingPicture(false);
      }
    });

  // ========================================
  // VALIDATION (same rules as the server)
  // ========================================

  const validate = () => {
    const changingPassword = password !== "" || confirmPassword !== "";
    const contact = contactNumber.trim();

    if (!editing && !employeeNumber) {
      return "Employee Number is not available. Close the form and try again.";
    }

    if (
      !username.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !contact ||
      !assignedArea.trim() ||
      (!editing && (!password || !confirmPassword))
    ) {
      return "Please complete all required fields.";
    }

    if (firstName.trim().length < 2) {
      return "First Name must contain at least 2 characters.";
    }

    if (lastName.trim().length < 2) {
      return "Last Name must contain at least 2 characters.";
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9]+$/.test(normalizedUsername)) {
      return "Username may contain letters and numbers only.";
    }

    if (normalizedUsername.length < 3) {
      return "Username must contain at least 3 characters.";
    }

    if (!isValidEmail(email)) {
      return "Please enter a valid email address.";
    }

    if (!/^[0-9]+$/.test(contact)) {
      return "Contact Number must contain numbers only.";
    }

    if (contact.length < 10 || contact.length > 15) {
      return "Contact Number must contain 10 to 15 digits.";
    }

    if (assignedArea.trim().length < 2) {
      return "Please enter a valid assigned area.";
    }

    if (!editing || changingPassword) {
      if (editing && (!password || !confirmPassword)) {
        return "New password and confirmation are required.";
      }

      if (editing && password !== confirmPassword) {
        return "New password and confirmation do not match.";
      }

      const passwordError = validatePassword(password);

      if (passwordError) {
        return passwordError;
      }

      if (password !== confirmPassword) {
        return "Password and Confirm Password do not match.";
      }
    }

    return "";
  };

  // ========================================
  // SAVE
  // ========================================

  const save = () =>
    runLocked(async () => {
      setErrorMessage("");
      setNotice("");

      const problem = validate();

      if (problem) {
        fail(problem);
        return;
      }

      const body = {
        username: username.trim().toLowerCase(),
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        contactNumber: contactNumber.trim(),
        assignedArea: assignedArea.trim(),
        accountStatus: accountActive ? "ACTIVE" : "INACTIVE",
      };

      const changingPassword = editing && (password !== "" || confirmPassword !== "");

      try {
        setSaving(true);

        const response = await fetch(
          editing
            ? `${API_BASE}/api/officers/${officerId}`
            : `${API_BASE}/api/officers`,
          {
            method: editing ? "PUT" : "POST",
            headers: {
              ...(await authHeaders()),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              editing
                ? { ...body, newPassword: password, confirmPassword }
                : { ...body, password, confirmPassword },
            ),
          },
        );

        const data = await readResponse(response);

        const id = editing ? Number(officerId) : Number(data.officer?.id);
        const validId = Number.isInteger(id) && id > 0 ? id : null;
        const passwordConfirmed = changingPassword && data.passwordChanged === true;
        const passwordNotConfirmed = changingPassword && !passwordConfirmed;
        const hadPicture = Boolean(newPicture);

        setPassword("");
        setConfirmPassword("");

        let pictureProblem = "";

        if (hadPicture && validId) {
          try {
            const uploaded = await uploadPicture(validId);

            if (uploaded) {
              setSavedPictureUri(uploaded);
            }

            setNewPicture(null);
          } catch (error) {
            pictureProblem = errorText(error);
          }
        }

        haptics.success();

        if (editing) {
          const warnings = [
            pictureProblem
              ? `The profile picture could not be uploaded. ${pictureProblem}`
              : "",
            passwordNotConfirmed
              ? "The server did not confirm the password change. Make sure the updated officers.js is installed and restart the backend."
              : "",
          ].filter(Boolean);

          setDone({
            title: warnings.length ? "Officer Updated with Warning" : "Officer Updated",
            lines: [
              passwordConfirmed
                ? hadPicture && !pictureProblem
                  ? "Officer information, password, and profile picture updated successfully."
                  : "Officer information and password updated successfully."
                : hadPicture && !pictureProblem
                  ? "Officer information and profile picture updated successfully."
                  : "Officer information updated successfully.",
            ],
            warning: warnings.length ? warnings.join(" ") : undefined,
            officerId: validId,
          });
        } else {
          const createdNumber =
            data.officer?.employeeNumber ||
            data.officer?.employee_number ||
            employeeNumber;

          setDone({
            title: pictureProblem
              ? "Officer Created with Warning"
              : "Officer Account Created",
            lines: [
              `Employee Number: ${createdNumber}`,
              `Username: ${data.officer?.username || body.username}`,
              ...(hadPicture && !pictureProblem ? ["Profile picture uploaded."] : []),
            ],
            warning: pictureProblem
              ? `The officer account was created, but the profile picture could not be uploaded. ${pictureProblem} You can add the picture later from Edit Information.`
              : undefined,
            officerId: validId,
          });
        }

        onSaved(validId);
      } catch (error) {
        fail(errorText(error));
      } finally {
        setSaving(false);
      }
    });

  // ========================================
  // UI
  // ========================================

  const initials =
    `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() ||
    "OF";

  const displayedPicture = newPicture?.uri || pictureUrl(savedPictureUri);

  const typingPassword = password !== "" || confirmPassword !== "";

  const footer = done ? (
    <>
      {!editing && (
        <PopupButton label="Add Another" variant="outline" onPress={resetForAdd} />
      )}
      {!editing && done.officerId && onOpenProfile ? (
        <PopupButton
          label="View Profile"
          variant="outline"
          onPress={() => onOpenProfile(done.officerId as number)}
        />
      ) : null}
      <PopupButton label="Done" onPress={onClose} />
    </>
  ) : (
    <>
      <PopupButton
        label="Cancel"
        variant="outline"
        disabled={busy}
        onPress={onClose}
      />
      <PopupButton
        label={editing ? "Save Changes" : "Create Officer Account"}
        busyLabel={editing ? "Saving..." : "Creating..."}
        busy={saving}
        disabled={loading || Boolean(loadError) || removingPicture}
        variant={editing ? "primary" : "green"}
        onPress={() => void save()}
      />
    </>
  );

  return (
    <FormPopup
      visible={visible}
      busy={busy}
      size="xl"
      title={editing ? "Edit Officer Information" : "Add New Officer"}
      subtitle={
        editing
          ? "Update the officer's details, profile picture and account"
          : "Create a new SmartFine fines officer account"
      }
      icon={require("../../assets/icons/officers.png")}
      onClose={onClose}
      notice={
        !done && (errorMessage || notice) ? (
          <Banner
            tone={errorMessage ? "error" : "info"}
            title={
              errorMessage
                ? editing
                  ? "Unable to Save Changes"
                  : "Unable to Create Officer"
                : undefined
            }
            message={errorMessage || notice}
          />
        ) : null
      }
      footer={footer}
    >
      {done ? (
        <SuccessPanel title={done.title} lines={done.lines} warning={done.warning} />
      ) : loading ? (
        <SkeletonForm label="Loading officer information" fields={6} />
      ) : loadError ? (
        <View>
          <Banner tone="error" title="Unable to Load Officer" message={loadError} />
          <PopupButton
            label="Try Again"
            variant="outline"
            onPress={() => void loadOfficer()}
          />
        </View>
      ) : (
        <>
          <PhotoField
            uri={displayedPicture}
            initials={initials}
            hint={
              newPicture
                ? editing
                  ? "The new picture is uploaded when you save. JPG, PNG or WEBP, up to 5 MB."
                  : "This picture is uploaded after the officer account is created."
                : "Optional · JPG, PNG or WEBP · Maximum 5 MB"
            }
            chooseLabel={displayedPicture ? "Change Picture" : "Choose Picture"}
            onChoose={() => void choosePicture()}
            undoLabel={newPicture ? (editing ? "Keep Current" : "Remove") : undefined}
            onUndo={newPicture ? () => setNewPicture(null) : undefined}
            removeLabel={editing && !newPicture && savedPictureUri ? "Remove Picture" : undefined}
            removeConfirm="Remove this officer's profile picture?"
            onRemove={
              editing && !newPicture && savedPictureUri
                ? () => void removeSavedPicture()
                : undefined
            }
            busy={busy}
            removing={removingPicture}
          />

          <FormColumns>
            <FormColumn>
              <FormSection title="Officer Information">
                <FormField
                  label="Employee Number"
                  hint="Employee Number is generated automatically and cannot be changed."
                >
                  <ReadOnlyValue
                    value={employeeNumber}
                    placeholder="Unavailable"
                    loading={employeeNumberLoading}
                  />
                </FormField>

                <FormRow>
                  <FormField inRow label="First Name" required>
                    <FormInput
                      value={firstName}
                      onChangeText={changeFirstName}
                      placeholder="First name"
                      editable={!busy}
                    />
                  </FormField>

                  <FormField inRow label="Middle Name">
                    <FormInput
                      value={middleName}
                      onChangeText={edit(setMiddleName)}
                      placeholder="Middle name"
                      editable={!busy}
                    />
                  </FormField>
                </FormRow>

                <FormField label="Last Name" required>
                  <FormInput
                    value={lastName}
                    onChangeText={changeLastName}
                    placeholder="Last name"
                    editable={!busy}
                  />
                </FormField>

                <FormField label="Email Address" required>
                  <FormInput
                    value={email}
                    onChangeText={edit(setEmail)}
                    placeholder="officer@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                  />
                </FormField>

                <FormRow>
                  <FormField inRow label="Contact Number" required>
                    <FormInput
                      value={contactNumber}
                      onChangeText={(value) =>
                        edit(setContactNumber)(value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="09123456789"
                      keyboardType="phone-pad"
                      maxLength={15}
                      editable={!busy}
                    />
                  </FormField>

                  <FormField inRow label="Assigned Area" required>
                    <FormInput
                      value={assignedArea}
                      onChangeText={edit(setAssignedArea)}
                      placeholder="Example: Main Campus"
                      editable={!busy}
                    />
                  </FormField>
                </FormRow>
              </FormSection>
            </FormColumn>

            <FormColumn>
              <FormSection title="Account Information">
                <FormField
                  label="Username"
                  required
                  hint={
                    editing
                      ? "Used by the officer to sign in."
                      : "Suggested automatically from the officer's name. You may change it before creating the account."
                  }
                >
                  <FormInput
                    value={username}
                    onChangeText={changeUsername}
                    placeholder="Username"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                  />
                </FormField>

                <View style={{ marginBottom: 14 }}>
                  <StatusSwitch
                    active={accountActive}
                    onChange={(value) => {
                      setAccountActive(value);
                      clearMessages();
                    }}
                    disabled={busy}
                    note={
                      editing
                        ? "Inactive officers cannot sign in. The fines they recorded are kept."
                        : "Active officers can log in immediately. Inactive officers cannot access their account."
                    }
                  />
                </View>
              </FormSection>

              <FormSection
                title={editing ? "Change Password" : "Password"}
                description={
                  editing
                    ? "Optional. Leave both fields blank to keep the current password."
                    : undefined
                }
              >
                <FormField
                  label={editing ? "New Password" : "Enter Password"}
                  required={!editing}
                >
                  <PasswordInput
                    label={editing ? "new password" : "password"}
                    value={password}
                    onChangeText={edit(setPassword)}
                    placeholder={editing ? "Enter new password" : "Enter password"}
                    editable={!busy}
                  />
                </FormField>

                <FormField
                  label={editing ? "Confirm New Password" : "Confirm Password"}
                  required={!editing}
                >
                  <PasswordInput
                    label="password confirmation"
                    value={confirmPassword}
                    onChangeText={edit(setConfirmPassword)}
                    placeholder={editing ? "Re-enter new password" : "Confirm password"}
                    editable={!busy}
                    onSubmitEditing={() => void save()}
                  />
                </FormField>

                {(!editing || typingPassword) && (
                  <PasswordChecklist
                    password={password}
                    confirmation={confirmPassword}
                  />
                )}
              </FormSection>
            </FormColumn>
          </FormColumns>
        </>
      )}
    </FormPopup>
  );
}
