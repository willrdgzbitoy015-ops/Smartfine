import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, View } from "react-native";

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
import { useActionLock } from "@/hooks/use-action-lock";
import { haptics } from "@/utils/haptics";

import { pictureUrl, validatePassword } from "./shared";

type Mode = "add" | "edit";

type Student = {
  id: number;
  student_id: string;
  username: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  contact_number: string | null;
  grade_level: string | null;
  section: string | null;
  account_status: string;
  profile_picture_uri: string | null;
};

type Done = {
  title: string;
  lines: string[];
  warning?: string;
  studentId: number | null;
};

const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

// ==========================================
// ADD / EDIT STUDENT POP-UP
// ==========================================

// The Add New Student and Edit Student Information forms as one pop-up.
// Requests, validation and messages are the same as the former screens.
export function StudentFormModal({
  visible,
  mode,
  studentId,
  onClose,
  onSaved,
  onOpenProfile,
}: {
  visible: boolean;
  mode: Mode;
  // Database id of the student being edited.
  studentId?: number | string | null;
  onClose: () => void;
  // Runs after a save so the screen underneath can reload.
  onSaved: (studentId: number | null) => void;
  // Add mode: opens the new student's profile from the success step.
  onOpenProfile?: (studentId: number) => void;
}) {
  const editing = mode === "edit";

  const runLocked = useActionLock();

  const bodyRef = useRef<ScrollView | null>(null);

  // ----- record -----
  const [studentNumber, setStudentNumber] = useState("");
  const [studentNumberLoading, setStudentNumberLoading] = useState(false);
  const [savedPictureUri, setSavedPictureUri] = useState<string | null>(null);
  const [newPicture, setNewPicture] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  // ----- student information -----
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [section, setSection] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");

  // ----- account information -----
  const [username, setUsername] = useState("");
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
    setStudentNumber("");
    setSavedPictureUri(null);
    setNewPicture(null);
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setGradeLevel("");
    setSection("");
    setContactNumber("");
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setAccountActive(true);
    setErrorMessage("");
    setNotice("");
    setLoadError("");
    setDone(null);

    void loadNextStudentId();
  };

  const loadNextStudentId = async () => {
    try {
      setStudentNumberLoading(true);

      const response = await fetch(`${API_BASE}/api/students/next-id`);
      const data = await response.json();

      setStudentNumber(response.ok && data.success ? data.studentId : "");
    } catch (error) {
      console.error("Load Student ID error:", error);
      setStudentNumber("");
    } finally {
      setStudentNumberLoading(false);
    }
  };

  const loadStudent = async () => {
    if (!studentId) {
      setLoadError("Student ID is missing.");
      return;
    }

    try {
      setLoading(true);
      setLoadError("");
      setErrorMessage("");
      setNotice("");
      setDone(null);

      const response = await fetch(`${API_BASE}/api/students/${studentId}`);
      const data = await response.json();

      if (!response.ok || !data.success || !data.student) {
        setLoadError(data.message || "Failed to load student information.");
        return;
      }

      const student: Student = data.student;

      setStudentNumber(student.student_id || "");
      setUsername(student.username || "");
      setFirstName(student.first_name || "");
      setMiddleName(student.middle_name || "");
      setLastName(student.last_name || "");
      setGradeLevel(student.grade_level || "");
      setSection(student.section || "");
      setContactNumber(student.contact_number || "");
      setEmail(student.email || "");
      setSavedPictureUri(student.profile_picture_uri || null);
      setNewPicture(null);
      setAccountActive(
        String(student.account_status || "").toUpperCase() === "ACTIVE",
      );
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Load student error:", error);
      setLoadError("Could not connect to the SmartFine server.");
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
      void loadStudent();
    } else {
      resetForAdd();
    }
  }, [visible, editing, studentId]);

  // ========================================
  // FIELDS
  // ========================================

  // The server names new students "firstnamelastname" (students.js), adding
  // a number when that name is taken; this preview follows the same rule.
  const usernamePart = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const suggestUsername = (first: string, last: string) => {
    const cleanFirst = usernamePart(first);
    const cleanLast = usernamePart(last);

    return cleanFirst && cleanLast ? cleanFirst + cleanLast : "";
  };

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    clearMessages();
  };

  const changeFirstName = (value: string) => {
    setFirstName(value);
    if (!editing) {
      setUsername(suggestUsername(value, lastName));
    }
    clearMessages();
  };

  const changeLastName = (value: string) => {
    setLastName(value);
    if (!editing) {
      setUsername(suggestUsername(firstName, value));
    }
    clearMessages();
  };

  const changeUsername = (value: string) => {
    setUsername(value.toLowerCase().replace(/[^a-z0-9]/g, ""));
    clearMessages();
  };

  // ========================================
  // PROFILE PICTURE
  // ========================================

  const choosePicture = async () => {
    try {
      clearMessages();

      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          fail(
            "SmartFine needs access to your photo library so you can select a student profile picture.",
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

      if (asset.fileSize && asset.fileSize > MAX_PICTURE_BYTES) {
        fail("Profile picture must not exceed 5 MB.");
        return;
      }

      setNewPicture(asset);
    } catch (error) {
      console.error("Select profile picture error:", error);
      fail("Could not select the profile picture.");
    }
  };

  const uploadPicture = async (databaseId: number) => {
    if (!newPicture) {
      return { success: true as const };
    }

    try {
      const formData = new FormData();
      const fileName = newPicture.fileName || `student-${databaseId}.jpg`;

      if (Platform.OS === "web") {
        if (newPicture.file) {
          formData.append("profilePicture", newPicture.file);
        } else {
          const fileResponse = await fetch(newPicture.uri);
          formData.append("profilePicture", await fileResponse.blob(), fileName);
        }
      } else {
        formData.append("profilePicture", {
          uri: newPicture.uri,
          name: fileName,
          type: newPicture.mimeType || "image/jpeg",
        } as any);
      }

      const response = await fetch(
        `${API_BASE}/api/students/${databaseId}/profile-picture`,
        { method: "POST", body: formData },
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false as const,
          message: data.message || "Profile picture could not be uploaded.",
        };
      }

      setSavedPictureUri(data.profilePictureUri || null);
      setNewPicture(null);

      return { success: true as const };
    } catch (error) {
      console.error("Upload profile picture error:", error);

      return {
        success: false as const,
        message: "The profile picture could not be uploaded.",
      };
    }
  };

  const removeSavedPicture = () =>
    runLocked(async () => {
      if (!studentId) return;

      try {
        setRemovingPicture(true);
        clearMessages();

        const response = await fetch(
          `${API_BASE}/api/students/${studentId}/profile-picture`,
          { method: "DELETE" },
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          fail(data.message || "Could not remove the profile picture.");
          return;
        }

        setSavedPictureUri(null);
        setNewPicture(null);
        setNotice("The student profile picture was removed.");
        onSaved(Number(studentId));
      } catch (error) {
        console.error("Remove profile picture error:", error);
        fail("Could not connect to the SmartFine server.");
      } finally {
        setRemovingPicture(false);
      }
    });

  // ========================================
  // VALIDATION (same rules as the server)
  // ========================================

  const validate = () => {
    const changingPassword = password !== "" || confirmPassword !== "";

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !gradeLevel.trim() ||
      !section.trim() ||
      !contactNumber.trim() ||
      !email.trim() ||
      (editing && !username.trim()) ||
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

    // New students get their username from the server.
    const normalizedUsername = username.trim().toLowerCase();

    if (editing && !/^[a-z0-9]+$/.test(normalizedUsername)) {
      return "Username may contain letters and numbers only.";
    }

    if (editing && normalizedUsername.length < 3) {
      return "Username must contain at least 3 characters.";
    }

    const contact = contactNumber.trim().replace(/[^0-9]/g, "");

    if (contact.length < 10 || contact.length > 15) {
      return "Contact Number must contain 10 to 15 digits.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!editing || changingPassword) {
      if (editing && (!password || !confirmPassword)) {
        return "New password and confirmation are required.";
      }

      const passwordError = validatePassword(password);

      if (passwordError) {
        return passwordError;
      }

      if (password !== confirmPassword) {
        return editing
          ? "New password and confirmation do not match."
          : "Password and Confirm Password do not match.";
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
        contactNumber: contactNumber.trim().replace(/[^0-9]/g, ""),
        gradeLevel: gradeLevel.trim(),
        section: section.trim(),
        accountStatus: accountActive ? "ACTIVE" : "INACTIVE",
      };

      try {
        setSaving(true);

        const token = await AsyncStorage.getItem("token");

        const response = await fetch(
          editing
            ? `${API_BASE}/api/students/${studentId}`
            : `${API_BASE}/api/students`,
          {
            method: editing ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(
              editing
                ? { ...body, newPassword: password, confirmPassword }
                : { ...body, password, confirmPassword },
            ),
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          fail(
            data.message ||
              (editing
                ? "Could not update student."
                : "Could not create student account."),
          );
          return;
        }

        const databaseId = editing
          ? Number(studentId)
          : Number(data.student?.id);
        const hadPicture = Boolean(newPicture);
        const passwordChanged =
          editing && password !== "" && data.passwordChanged === true;

        setPassword("");
        setConfirmPassword("");

        let pictureProblem = "";

        if (hadPicture && Number.isInteger(databaseId) && databaseId > 0) {
          const upload = await uploadPicture(databaseId);

          if (!upload.success) {
            pictureProblem = upload.message;
          }
        }

        haptics.success();

        if (editing) {
          const what = [
            "Student information",
            passwordChanged ? "password" : null,
            hadPicture && !pictureProblem ? "profile picture" : null,
          ].filter(Boolean) as string[];

          setDone({
            title: "Student Updated",
            lines: [
              `${
                what.length === 1
                  ? what[0]
                  : `${what.slice(0, -1).join(", ")} and ${what[what.length - 1]}`
              } updated successfully.`,
            ],
            warning: pictureProblem
              ? `Student information was updated, but the profile picture could not be updated. ${pictureProblem}`
              : undefined,
            studentId: databaseId,
          });
        } else {
          setDone({
            title: "Student Account Created",
            lines: [
              `Student ID: ${data.student?.studentId ?? studentNumber}`,
              `Username: ${data.student?.username ?? body.username}`,
              ...(hadPicture && !pictureProblem
                ? ["Profile picture uploaded."]
                : []),
            ],
            warning: pictureProblem
              ? `The account was created, but the profile picture was not uploaded. ${pictureProblem} You can add it from Edit Information.`
              : undefined,
            studentId: Number.isInteger(databaseId) ? databaseId : null,
          });
        }

        onSaved(Number.isInteger(databaseId) ? databaseId : null);
      } catch (error) {
        console.error("Save student error:", error);
        fail(
          editing
            ? "Could not connect to the SmartFine server."
            : "Could not connect to the SmartFine server. Please check the backend connection.",
        );
      } finally {
        setSaving(false);
      }
    });

  // ========================================
  // UI
  // ========================================

  const initials =
    `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() ||
    "ST";

  const displayedPicture = newPicture?.uri || pictureUrl(savedPictureUri);

  const typingPassword = password !== "" || confirmPassword !== "";

  const footer = done ? (
    <>
      {!editing && (
        <PopupButton label="Add Another" variant="outline" onPress={resetForAdd} />
      )}
      {!editing && done.studentId && onOpenProfile ? (
        <PopupButton
          label="View Profile"
          variant="outline"
          onPress={() => onOpenProfile(done.studentId as number)}
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
        label={editing ? "Save Changes" : "Create Student Account"}
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
      title={editing ? "Edit Student Information" : "Add New Student"}
      subtitle={
        editing
          ? "Update student, profile picture, and account information"
          : "Create a new student account in the system"
      }
      icon="students"
      bodyRef={bodyRef}
      onClose={onClose}
      notice={
        !done && (errorMessage || notice) ? (
          <Banner
            tone={errorMessage ? "error" : "info"}
            title={
              errorMessage
                ? editing
                  ? "Unable to Save Changes"
                  : "Unable to Create Student"
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
        <SkeletonForm label="Loading student information" fields={6} />
      ) : loadError ? (
        <View>
          <Banner tone="error" title="Unable to Load Student" message={loadError} />
          <PopupButton
            label="Try Again"
            variant="outline"
            onPress={() => void loadStudent()}
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
                  : "This picture is uploaded after the student account is created."
                : "Optional · JPG, PNG or WEBP · Maximum 5 MB"
            }
            chooseLabel={displayedPicture ? "Change Picture" : "Choose Picture"}
            onChoose={() => void choosePicture()}
            undoLabel={newPicture ? (editing ? "Keep Current" : "Remove") : undefined}
            onUndo={newPicture ? () => setNewPicture(null) : undefined}
            removeLabel={editing && !newPicture && savedPictureUri ? "Remove Picture" : undefined}
            removeConfirm="Remove this student's profile picture?"
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
              <FormSection title="Student Information">
                <FormField
                  label="Student ID"
                  hint={
                    editing
                      ? "Student ID is permanent and cannot be changed."
                      : "SmartFine automatically assigns the next available Student ID."
                  }
                >
                  <ReadOnlyValue
                    value={studentNumber}
                    placeholder="Unable to generate ID"
                    loading={studentNumberLoading}
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

                <FormRow>
                  <FormField inRow label="Grade Level" required>
                    <FormInput
                      value={gradeLevel}
                      onChangeText={edit(setGradeLevel)}
                      placeholder="Grade 12"
                      editable={!busy}
                    />
                  </FormField>

                  <FormField inRow label="Section" required>
                    <FormInput
                      value={section}
                      onChangeText={edit(setSection)}
                      placeholder="STEM - A"
                      editable={!busy}
                    />
                  </FormField>
                </FormRow>

                <FormField label="Contact Number" required>
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

                <FormField label="Email Address" required>
                  <FormInput
                    value={email}
                    onChangeText={edit(setEmail)}
                    placeholder="student@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                  />
                </FormField>
              </FormSection>
            </FormColumn>

            <FormColumn>
              <FormSection title="Account Information">
                <FormField
                  label="Username"
                  required={editing}
                  hint={
                    editing
                      ? "Username is editable and is used by the student when logging in."
                      : "Created from the student's first and last name. If it is already taken, SmartFine adds a number. You can change it later in Edit Information."
                  }
                >
                  {editing ? (
                    <FormInput
                      value={username}
                      onChangeText={changeUsername}
                      placeholder="Username"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                    />
                  ) : (
                    <ReadOnlyValue
                      value={username}
                      placeholder="Enter the first and last name"
                    />
                  )}
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
                        ? "Inactive students cannot log in to SmartFine. Their existing fine and payment records are preserved."
                        : "Active students can log in immediately. Inactive students cannot access their SmartFine account."
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
