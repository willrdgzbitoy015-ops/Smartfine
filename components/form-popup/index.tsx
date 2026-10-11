import { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import AppIcon from "@/components/AppIcon";
import { FadeIn } from "@/components/motion";
import { WarningMark } from "@/components/result-mark";
import { SuccessCheck } from "@/components/success-check";
import { haptics } from "@/utils/haptics";

import { styles } from "./form-popup.styles";

// Pop-up shell and fields shared by Settings and the Admin record forms.
export {
  FormField,
  FormInput,
  FormPopup,
  meetsPasswordPolicy,
  PasswordChecklist,
  PasswordInput,
  PopupButton,
} from "@/components/admin-settings/form";

// ==========================================
// LAYOUT
// ==========================================

// A titled group of fields.
export function FormSection({
  title,
  description,
  style,
  children,
}: {
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>

      {description ? (
        <Text style={styles.sectionDescription}>{description}</Text>
      ) : null}

      {children}
    </View>
  );
}

// Sections side by side on tablets, stacked on phones.
export function FormColumns({ children }: { children: ReactNode }) {
  return <View style={styles.columns}>{children}</View>;
}

export function FormColumn({ children }: { children: ReactNode }) {
  return <View style={styles.column}>{children}</View>;
}

// Fields that share a line (use FormField with inRow).
export function FormRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

// A read-only value shown like an input.
export function ReadOnlyValue({
  value,
  placeholder,
  loading = false,
}: {
  value: string;
  placeholder: string;
  loading?: boolean;
}) {
  return (
    <View style={styles.readOnly}>
      {loading ? (
        <ActivityIndicator size="small" color="#173A73" />
      ) : (
        <Text style={value ? styles.readOnlyText : styles.readOnlyPlaceholder}>
          {value || placeholder}
        </Text>
      )}
    </View>
  );
}

// ==========================================
// CHOICES
// ==========================================

// Looks like an input; opens its options in an OptionList under it.
export function SelectButton({
  value,
  placeholder,
  open,
  onPress,
  disabled = false,
  accessibilityLabel,
}: {
  value: string;
  placeholder: string;
  open: boolean;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.select, open && styles.selectOpen, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: open, disabled }}
    >
      <Text
        style={value ? styles.selectText : styles.selectPlaceholder}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>

      <AppIcon
        name={open ? "chevronUp" : "chevronDown"}
        size={14}
        color="#173A73"
      />
    </TouchableOpacity>
  );
}

export type Option = {
  key: number | string;
  title: string;
  subtitle?: string;
};

// Options shown in place under a field, so they push the form down instead
// of floating over it (a floating menu gets cut off inside a scrolling
// pop-up).
export function OptionList({
  options,
  selectedKey,
  onSelect,
  emptyText,
}: {
  options: Option[];
  selectedKey?: number | string | null;
  onSelect: (key: number | string) => void;
  emptyText: string;
}) {
  return (
    <FadeIn distance={4} duration={160} style={styles.options}>
      <ScrollView
        style={styles.optionsScroll}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {options.length === 0 ? (
          <Text style={styles.optionEmpty}>{emptyText}</Text>
        ) : (
          options.map((option) => {
            const selected = option.key === selectedKey;

            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => {
                  haptics.selection();
                  onSelect(option.key);
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={styles.optionTitle}>{option.title}</Text>

                {option.subtitle ? (
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </FadeIn>
  );
}

// A tick box with a title and a line of explanation.
export function CheckOption({
  checked,
  onChange,
  title,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.checkOption, checked && styles.checkOptionOn, disabled && styles.disabled]}
      onPress={() => {
        haptics.selection();
        onChange(!checked);
      }}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="checkbox"
      accessibilityLabel={title}
      accessibilityState={{ checked, disabled }}
    >
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked ? <AppIcon name="check" size={15} color="#FFFFFF" /> : null}
      </View>

      <View style={styles.checkText}>
        <Text style={styles.checkTitle}>{title}</Text>

        {description ? (
          <Text style={styles.checkDescription}>{description}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ==========================================
// ACCOUNT STATUS SWITCH
// ==========================================

export function StatusSwitch({
  active,
  onChange,
  disabled = false,
  note,
}: {
  active: boolean;
  onChange: (active: boolean) => void;
  disabled?: boolean;
  note: string;
}) {
  return (
    <>
      <TouchableOpacity
        style={[styles.statusCard, disabled && styles.disabled]}
        onPress={() => {
          haptics.selection();
          onChange(!active);
        }}
        disabled={disabled}
        activeOpacity={0.85}
        accessibilityRole="switch"
        accessibilityLabel="Account status"
        accessibilityState={{ checked: active, disabled }}
      >
        <View>
          <Text style={styles.statusLabel}>Account Status</Text>
          <Text
            style={[
              styles.statusValue,
              active ? styles.statusActive : styles.statusInactive,
            ]}
          >
            {active ? "Active" : "Inactive"}
          </Text>
        </View>

        <View style={[styles.switchTrack, active && styles.switchTrackOn]}>
          <View style={[styles.switchThumb, active && styles.switchThumbOn]} />
        </View>
      </TouchableOpacity>

      <Text style={styles.hint}>{note}</Text>
    </>
  );
}

// ==========================================
// PROFILE PICTURE
// ==========================================

// Avatar preview with its picture actions. `onRemove` asks for confirmation
// inside the pop-up before running.
export function PhotoField({
  uri,
  initials,
  hint,
  chooseLabel,
  onChoose,
  undoLabel,
  onUndo,
  removeLabel,
  removeConfirm,
  onRemove,
  busy = false,
  removing = false,
}: {
  uri: string | null;
  initials: string;
  hint: string;
  chooseLabel: string;
  onChoose: () => void;
  // Drops a picked picture that is not saved yet.
  undoLabel?: string;
  onUndo?: () => void;
  // Deletes the saved picture on the server.
  removeLabel?: string;
  removeConfirm?: string;
  onRemove?: () => void;
  busy?: boolean;
  removing?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const [confirming, setConfirming] = useState(false);

  const showImage = Boolean(uri) && !imageFailed;

  return (
    <View style={styles.photo}>
      <View style={styles.avatar}>
        {showImage ? (
          <Image
            source={{ uri: uri as string }}
            style={styles.avatarImage}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>

      <View style={styles.photoText}>
        <Text style={styles.photoTitle}>Profile Picture</Text>
        <Text style={styles.hint}>{hint}</Text>

        {confirming && onRemove ? (
          <FadeIn distance={6} duration={180} style={styles.photoConfirm}>
            <Text style={styles.photoConfirmText}>
              {removeConfirm || "Remove the saved profile picture?"}
            </Text>

            <View style={styles.photoActions}>
              <SmallButton
                label="Keep"
                onPress={() => setConfirming(false)}
                disabled={removing}
              />
              <SmallButton
                label={removing ? "Removing..." : "Remove"}
                tone="danger"
                busy={removing}
                onPress={() => {
                  onRemove();
                  setConfirming(false);
                }}
              />
            </View>
          </FadeIn>
        ) : (
          <View style={styles.photoActions}>
            <SmallButton
              label={chooseLabel}
              tone="primary"
              onPress={() => {
                setImageFailed(false);
                onChoose();
              }}
              disabled={busy || removing}
            />

            {onUndo && undoLabel ? (
              <SmallButton
                label={undoLabel}
                onPress={onUndo}
                disabled={busy || removing}
              />
            ) : null}

            {onRemove && removeLabel ? (
              <SmallButton
                label={removeLabel}
                tone="danger-outline"
                onPress={() => setConfirming(true)}
                disabled={busy || removing}
                busy={removing}
              />
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

function SmallButton({
  label,
  tone = "outline",
  busy = false,
  disabled = false,
  onPress,
}: {
  label: string;
  tone?: "primary" | "outline" | "danger" | "danger-outline";
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.smallButton,
        tone === "primary" && styles.smallPrimary,
        tone === "danger" && styles.smallDanger,
        tone === "danger-outline" && styles.smallDangerOutline,
        (disabled || busy) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.smallText,
          (tone === "primary" || tone === "danger") && styles.smallTextLight,
          tone === "danger-outline" && styles.smallTextDanger,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ==========================================
// MESSAGES
// ==========================================

export function Banner({
  tone,
  title,
  message,
}: {
  tone: "error" | "warning" | "info";
  title?: string;
  message: string;
}) {
  return (
    <View
      style={[
        styles.banner,
        tone === "error" && styles.bannerError,
        tone === "warning" && styles.bannerWarning,
        tone === "info" && styles.bannerInfo,
      ]}
      accessibilityLiveRegion="polite"
    >
      {title ? (
        <Text
          style={[
            styles.bannerTitle,
            tone === "error" && styles.bannerTitleError,
            tone === "warning" && styles.bannerTitleWarning,
          ]}
        >
          {title}
        </Text>
      ) : null}
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

// Shown in place of the form once it has been saved.
export function SuccessPanel({
  title,
  lines,
  warning,
}: {
  title: string;
  lines: string[];
  warning?: string;
}) {
  return (
    <View style={styles.success} accessibilityLiveRegion="polite">
      {warning ? (
        <WarningMark style={styles.successCheck} />
      ) : (
        <SuccessCheck style={styles.successCheck} />
      )}

      <Text style={styles.successTitle}>{title}</Text>

      {lines.map((line) => (
        <Text key={line} style={styles.successLine}>
          {line}
        </Text>
      ))}

      {warning ? (
        <View style={styles.successWarning}>
          <Banner tone="warning" message={warning} />
        </View>
      ) : null}
    </View>
  );
}
