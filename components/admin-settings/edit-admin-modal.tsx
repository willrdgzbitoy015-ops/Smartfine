import { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";

import { Banner } from "@/components/form-popup";
import { useShake } from "@/components/motion";
import { useActionLock } from "@/hooks/use-action-lock";
import { haptics } from "@/utils/haptics";

import { styles } from "./admin-settings.styles";
import { adminRequest, FormField, FormInput, FormPopup, PopupButton } from "./form";
import { TypeToConfirmModal } from "./type-to-confirm-modal";
import type { AdminAccount } from "./types";

type Draft = {
  firstName: string;
  middleName: string;
  lastName: string;
  contactNumber: string;
};

const LABELS: Record<keyof Draft, string> = {
  firstName: "First name",
  middleName: "Middle name",
  lastName: "Last name",
  contactNumber: "Contact number",
};

function draftOf(admin: AdminAccount | null): Draft {
  return {
    firstName: admin?.firstName ?? "",
    middleName: admin?.middleName ?? "",
    lastName: admin?.lastName ?? "",
    contactNumber: admin?.contactNumber ?? "",
  };
}

// ==========================================
// EDIT ADMINISTRATOR POP-UP
// ==========================================

// Changes another administrator's name and contact number. Step 1 is the form;
// step 2 lists what will change and asks for the username to be typed. The
// username, email and role are not changed here (email changes need that
// person's own verification code; Access handles lock and role).
export function EditAdminModal({
  visible,
  admin,
  onClose,
  onSaved,
}: {
  visible: boolean;
  admin: AdminAccount | null;
  onClose: () => void;
  onSaved: (admin: AdminAccount | undefined, message: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(draftOf(null));
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { shake, shakeStyle } = useShake();

  // Saving, paying and changing records run once per tap.
  const runLocked = useActionLock();

  // Every opening starts from the person's saved details.
  useEffect(() => {
    if (visible) {
      setDraft(draftOf(admin));
      setStep("form");
      setError("");
    }
  }, [visible, admin]);

  const name = admin?.fullName?.trim() || admin?.username || "this administrator";

  const original = draftOf(admin);

  const changes = (Object.keys(LABELS) as (keyof Draft)[])
    .filter((key) => draft[key].trim() !== original[key].trim())
    .map(
      (key) =>
        `${LABELS[key]}: ${original[key].trim() || "(none)"} → ${draft[key].trim() || "(none)"}`,
    );

  const fail = (message: string) => {
    setError(message);
    haptics.warning();
    shake();
  };

  const validate = () => {
    const names: [string, string, boolean][] = [
      ["First name", draft.firstName.trim(), true],
      ["Middle name", draft.middleName.trim(), false],
      ["Last name", draft.lastName.trim(), true],
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

    if (draft.contactNumber.trim() && !/^\+?[0-9]{7,15}$/.test(draft.contactNumber.trim())) {
      return "Please enter a valid contact number.";
    }

    if (changes.length === 0) {
      return "Nothing has been changed.";
    }

    return "";
  };

  const review = () => {
    const problem = validate();

    if (problem) {
      fail(problem);
      return;
    }

    setError("");
    setStep("confirm");
  };

  const save = (typed: string) =>
    runLocked(async () => {
      if (!admin) {
        return;
      }

      setSaving(true);
      setError("");

      const { ok, data } = await adminRequest<{
        success: boolean;
        message?: string;
        code?: string;
        admin?: AdminAccount;
      }>(`/api/admins/${admin.id}`, {
        method: "PATCH",
        body: {
          firstName: draft.firstName.trim(),
          middleName: draft.middleName.trim(),
          lastName: draft.lastName.trim(),
          contactNumber: draft.contactNumber.trim(),
          confirmation: typed,
        },
      });

      setSaving(false);

      if (!ok) {
        haptics.error();

        // A wrong detail goes back to the form; a wrong word stays here.
        if (data.code && !data.code.startsWith("CONFIRMATION")) {
          setStep("form");
          fail(data.message || "Failed to update the administrator.");
        } else {
          setError(data.message || "Failed to update the administrator.");
        }

        return;
      }

      haptics.success();
      onSaved(data.admin, data.message || "Administrator updated.");
    });

  // Any edit clears the last error.
  const edit = (key: keyof Draft) => (value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));

    if (error) {
      setError("");
    }
  };

  return (
    <>
      <FormPopup
        visible={visible && step === "form"}
        busy={saving}
        wide
        title="Edit Administrator"
        subtitle={`${name} (@${admin?.username ?? ""})`}
        icon={require("../../assets/icons/user.png")}
        onClose={onClose}
        footer={
          <>
            <PopupButton label="Cancel" variant="outline" onPress={onClose} />

            <PopupButton label="Review Changes" variant="green" onPress={review} />
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
              value={draft.firstName}
              onChangeText={edit("firstName")}
              maxLength={50}
              accessibilityLabel="First name"
              autoFocus
            />
          </FormField>

          <FormField inRow label="Middle Name">
            <FormInput
              value={draft.middleName}
              onChangeText={edit("middleName")}
              placeholder="Optional"
              maxLength={50}
              accessibilityLabel="Middle name"
            />
          </FormField>

          <FormField inRow label="Last Name" required>
            <FormInput
              value={draft.lastName}
              onChangeText={edit("lastName")}
              maxLength={50}
              accessibilityLabel="Last name"
            />
          </FormField>
        </View>

        <Text style={[styles.groupLabel, styles.groupGap]}>CONTACT</Text>

        <View style={styles.row}>
          <FormField inRow label="Contact Number">
            <FormInput
              value={draft.contactNumber}
              onChangeText={edit("contactNumber")}
              placeholder="09xxxxxxxxx"
              keyboardType="phone-pad"
              maxLength={16}
              accessibilityLabel="Contact number"
            />
          </FormField>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteIcon}>i</Text>

          <Text style={styles.noteText}>
            The username and email can&apos;t be changed here. Use Access to lock
            the account or change its role. You will be asked to confirm before
            anything is saved.
          </Text>
        </View>
      </FormPopup>

      <TypeToConfirmModal
        visible={visible && step === "confirm"}
        busy={saving}
        title="Save These Changes?"
        subtitle={`${name} (@${admin?.username ?? ""})`}
        message={`You are changing another administrator's details. ${name} will see the new details the next time the page loads.`}
        word={admin?.username ?? ""}
        confirmLabel="Save Changes"
        busyLabel="Saving..."
        cancelLabel="Back"
        error={error}
        onCancel={() => {
          setError("");
          setStep("form");
        }}
        onConfirm={save}
      >
        <Banner tone="info" title="What will change" message={changes.join("\n")} />
      </TypeToConfirmModal>
    </>
  );
}
