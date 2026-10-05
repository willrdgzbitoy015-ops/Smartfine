import { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";

import { useShake } from "@/components/motion";
import { haptics } from "@/utils/haptics";
import { useActionLock } from "@/hooks/use-action-lock";

import {
  adminRequest,
  FormField,
  FormInput,
  FormPopup,
  meetsPasswordPolicy,
  PasswordChecklist,
  PasswordInput,
  PopupButton,
} from "./form";
import { styles } from "./admin-settings.styles";
import type { AdminAccount } from "./types";

// ==========================================
// ADD ADMINISTRATOR POP-UP
// ==========================================

export function AddAdminModal({
  visible,
  suggestedUsername,
  onClose,
  onAdded,
}: {
  visible: boolean;
  suggestedUsername: string;
  onClose: () => void;
  onAdded: (admin: AdminAccount | undefined, message: string) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { shake, shakeStyle } = useShake();

  // Saving, paying and changing records run once per tap.
  const runLocked = useActionLock();

  // Every opening starts with an empty form and the next free username.
  useEffect(() => {
    if (visible) {
      setFirstName("");
      setMiddleName("");
      setLastName("");
      setUsername(suggestedUsername);
      setEmail("");
      setContactNumber("");
      setPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [visible, suggestedUsername]);

  const fail = (message: string) => {
    setError(message);
    haptics.warning();
    shake();
  };

  const validate = () => {
    const names: [string, string, boolean][] = [
      ["First name", firstName.trim(), true],
      ["Middle name", middleName.trim(), false],
      ["Last name", lastName.trim(), true],
    ];

    for (const [label, value, required] of names) {
      if (!value) {
        if (required) {
          return `${label} is required.`;
        }

        continue;
      }

      // The server also checks which characters are allowed.
      if (value.length < 2 || value.length > 50) {
        return `${label} must be 2 to 50 characters.`;
      }
    }

    if (!/^[A-Za-z0-9]{3,30}$/.test(username.trim())) {
      return "Username must be 3 to 30 letters or numbers, with no spaces.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }

    if (contactNumber.trim() && !/^\+?[0-9]{7,15}$/.test(contactNumber.trim())) {
      return "Please enter a valid contact number.";
    }

    if (!meetsPasswordPolicy(password)) {
      return "The password doesn't meet every requirement below.";
    }

    if (password !== confirmPassword) {
      return "The password and confirmation do not match.";
    }

    return "";
  };

  const handleSubmit = () =>
    runLocked(async () => {
      const problem = validate();

      if (problem) {
        fail(problem);
        return;
      }

      setSaving(true);
      setError("");

      const { ok, data } = await adminRequest<{
        success: boolean;
        message?: string;
        admin?: AdminAccount;
      }>("/api/admins", {
        method: "POST",
        body: {
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
          email: email.trim(),
          contactNumber: contactNumber.trim(),
          password,
          confirmPassword,
        },
      });

      setSaving(false);

      if (!ok) {
        fail(data.message || "Failed to add the administrator.");
        return;
      }

      onAdded(data.admin, data.message || "Administrator added successfully.");
    });

  // Any edit clears the last error.
  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);

    if (error) {
      setError("");
    }
  };

  return (
    <FormPopup
      visible={visible}
      busy={saving}
      wide
      title="Add Administrator"
      subtitle="The new administrator gets full access to SmartFine's admin tools."
      icon={require("../../assets/icons/user.png")}
      onClose={onClose}
      footer={
        <>
          <PopupButton
            label="Cancel"
            variant="outline"
            disabled={saving}
            onPress={onClose}
          />

          <PopupButton
            label="Add Administrator"
            busyLabel="Adding..."
            busy={saving}
            variant="green"
            onPress={handleSubmit}
          />
        </>
      }
    >
      {error !== "" && (
        <Animated.View style={shakeStyle}>
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        </Animated.View>
      )}

      <Text style={styles.groupLabel}>NAME</Text>

      <View style={styles.row}>
        <FormField inRow label="First Name" required>
          <FormInput
            value={firstName}
            onChangeText={edit(setFirstName)}
            placeholder="Juan"
            maxLength={50}
            editable={!saving}
            autoFocus
          />
        </FormField>

        <FormField inRow label="Middle Name">
          <FormInput
            value={middleName}
            onChangeText={edit(setMiddleName)}
            placeholder="Optional"
            maxLength={50}
            editable={!saving}
          />
        </FormField>

        <FormField inRow label="Last Name" required>
          <FormInput
            value={lastName}
            onChangeText={edit(setLastName)}
            placeholder="Dela Cruz"
            maxLength={50}
            editable={!saving}
          />
        </FormField>
      </View>

      <Text style={[styles.groupLabel, styles.groupGap]}>SIGN-IN & CONTACT</Text>

      <View style={styles.row}>
        <FormField
          inRow
          label="Username"
          required
          hint="Used to sign in. Letters and numbers only."
        >
          <FormInput
            value={username}
            onChangeText={edit(setUsername)}
            placeholder="ADM002"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            editable={!saving}
          />
        </FormField>

        <FormField
          inRow
          label="Email Address"
          required
          hint="Receives password reset codes."
        >
          <FormInput
            value={email}
            onChangeText={edit(setEmail)}
            placeholder="name@school.edu.ph"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
          />
        </FormField>

        <FormField inRow label="Contact Number">
          <FormInput
            value={contactNumber}
            onChangeText={edit(setContactNumber)}
            placeholder="09xxxxxxxxx"
            keyboardType="phone-pad"
            maxLength={16}
            editable={!saving}
          />
        </FormField>
      </View>

      <Text style={[styles.groupLabel, styles.groupGap]}>TEMPORARY PASSWORD</Text>

      <View style={styles.row}>
        <FormField inRow label="Password" required>
          <PasswordInput
            label="password"
            value={password}
            onChangeText={edit(setPassword)}
            placeholder="Choose a password"
            editable={!saving}
          />
        </FormField>

        <FormField inRow label="Confirm Password" required>
          <PasswordInput
            label="password confirmation"
            value={confirmPassword}
            onChangeText={edit(setConfirmPassword)}
            placeholder="Repeat the password"
            editable={!saving}
            onSubmitEditing={handleSubmit}
          />
        </FormField>
      </View>

      <PasswordChecklist password={password} confirmation={confirmPassword} />

      <View style={styles.note}>
        <Text style={styles.noteIcon}>i</Text>

        <Text style={styles.noteText}>
          Share the username and password with the new administrator privately.
          They can change the password from Settings → Security after signing
          in.
        </Text>
      </View>
    </FormPopup>
  );
}
