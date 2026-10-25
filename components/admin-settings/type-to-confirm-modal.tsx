import { ReactNode, useEffect, useState } from "react";

import { Banner } from "@/components/form-popup";
import { haptics } from "@/utils/haptics";

import { FormField, FormInput, FormPopup, PopupButton } from "./form";

// ==========================================
// TYPE-TO-CONFIRM POP-UP
// ==========================================

// "Are you sure?" for changes that are hard to undo. The button stays off until
// the administrator types `word` (the account's username). The server checks
// the same word again, so calling the API directly can't skip this step.
export function TypeToConfirmModal({
  visible,
  busy,
  title,
  subtitle,
  message,
  word,
  confirmLabel,
  busyLabel,
  cancelLabel = "Cancel",
  danger = false,
  error = "",
  children,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  busy: boolean;
  title: string;
  subtitle: string;
  message: string;
  // What must be typed, e.g. the username ADM002.
  word: string;
  confirmLabel: string;
  busyLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  error?: string;
  // Extra detail under the warning, such as a list of the changes.
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: (typed: string) => void;
}) {
  const [typed, setTyped] = useState("");

  // Every opening starts with an empty box.
  useEffect(() => {
    if (visible) {
      setTyped("");
    }
  }, [visible]);

  const matches = typed.trim().toUpperCase() === word.toUpperCase();

  const submit = () => {
    if (!matches) {
      haptics.warning();
      return;
    }

    onConfirm(typed.trim());
  };

  return (
    <FormPopup
      visible={visible}
      busy={busy}
      title={title}
      subtitle={subtitle}
      icon={require("../../assets/icons/user.png")}
      onClose={onCancel}
      notice={error ? <Banner tone="error" title="Not Done" message={error} /> : null}
      footer={
        <>
          <PopupButton
            label={cancelLabel}
            variant="outline"
            disabled={busy}
            onPress={onCancel}
          />

          <PopupButton
            label={confirmLabel}
            busyLabel={busyLabel}
            busy={busy}
            disabled={!matches}
            variant={danger ? "danger" : "green"}
            onPress={submit}
          />
        </>
      }
    >
      <Banner
        tone="warning"
        title="Are you sure?"
        message={message}
      />

      {children}

      <FormField
        label={`Type ${word} to confirm`}
        required
        hint="This makes sure it is not done by accident."
      >
        <FormInput
          value={typed}
          onChangeText={setTyped}
          placeholder={word}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!busy}
          onSubmitEditing={submit}
          accessibilityLabel={`Type ${word} to confirm`}
        />
      </FormField>
    </FormPopup>
  );
}
