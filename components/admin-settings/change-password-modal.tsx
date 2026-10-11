import { useEffect, useState } from "react";
import { Animated, Text } from "react-native";

import { useShake } from "@/components/motion";
import { haptics } from "@/utils/haptics";
import { useActionLock } from "@/hooks/use-action-lock";

import {
  adminRequest,
  FormField,
  FormPopup,
  meetsPasswordPolicy,
  PasswordChecklist,
  PasswordInput,
  PopupButton,
} from "./form";
import { styles } from "./admin-settings.styles";

// ==========================================
// CHANGE PASSWORD POP-UP
// ==========================================

// Errors stay inside the pop-up so the form can be corrected without a
// second modal; `onChanged` runs after the server confirms the change.
export function ChangePasswordModal({
  visible,
  onClose,
  onChanged,
}: {
  visible: boolean;
  onClose: () => void;
  onChanged: (message: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { shake, shakeStyle } = useShake();

  // Saving, paying and changing records run once per tap.
  const runLocked = useActionLock();

  // Every opening starts with an empty form.
  useEffect(() => {
    if (visible) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [visible]);

  const fail = (message: string) => {
    setError(message);
    haptics.warning();
    shake();
  };

  const handleSubmit = () =>
    runLocked(async () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        fail("Please complete all password fields.");
        return;
      }

      if (!meetsPasswordPolicy(newPassword)) {
        fail("The new password doesn't meet every requirement below.");
        return;
      }

      if (newPassword !== confirmPassword) {
        fail("The new password and confirmation do not match.");
        return;
      }

      setSaving(true);
      setError("");

      const { ok, data } = await adminRequest("/api/auth/me/password", {
        method: "PUT",
        body: { currentPassword, newPassword, confirmPassword },
      });

      setSaving(false);

      if (!ok) {
        fail(data.message || "Failed to change password.");
        return;
      }

      onChanged(data.message || "Password changed successfully.");
    });

  const clearError = () => {
    if (error) {
      setError("");
    }
  };

  return (
    <FormPopup
      visible={visible}
      busy={saving}
      title="Change Password"
      subtitle="Enter your current password, then choose a new one for signing in to SmartFine."
      icon="lock"
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
            label="Update Password"
            busyLabel="Updating..."
            busy={saving}
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

      <FormField label="Current Password" required>
        <PasswordInput
          label="current password"
          value={currentPassword}
          onChangeText={(value) => {
            setCurrentPassword(value);
            clearError();
          }}
          placeholder="Enter current password"
          editable={!saving}
          autoFocus
        />
      </FormField>

      <FormField label="New Password" required>
        <PasswordInput
          label="new password"
          value={newPassword}
          onChangeText={(value) => {
            setNewPassword(value);
            clearError();
          }}
          placeholder="Choose a new password"
          editable={!saving}
        />
      </FormField>

      <FormField label="Confirm New Password" required>
        <PasswordInput
          label="password confirmation"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            clearError();
          }}
          placeholder="Repeat the new password"
          editable={!saving}
          onSubmitEditing={handleSubmit}
        />
      </FormField>

      <PasswordChecklist
        password={newPassword}
        confirmation={confirmPassword}
      />
    </FormPopup>
  );
}
