import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode, RefObject, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { API_BASE } from "@/constants/api";
import AppIcon, { IconName } from "@/components/AppIcon";
import { PopIn } from "@/components/motion";

import { COLORS, styles } from "./admin-settings.styles";

// ==========================================
// REQUEST
// ==========================================

// Sends an authenticated JSON request and returns the parsed body. Network
// failures come back as { success: false } so callers show one message.
export async function adminRequest<T extends { success: boolean; message?: string }>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<{ ok: boolean; data: T }> {
  try {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      return {
        ok: false,
        data: {
          success: false,
          message: "Your login session could not be found. Please log in again.",
        } as T,
      };
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const data = (await response.json()) as T;

    return { ok: response.ok && data.success, data };
  } catch (error) {
    console.error(`Admin request ${path} failed:`, error);

    return {
      ok: false,
      data: {
        success: false,
        message: "Could not connect to the SmartFine server.",
      } as T,
    };
  }
}

// ==========================================
// PASSWORD RULES (same as the server policy)
// ==========================================

export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "An uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "A lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "A number", test: (value: string) => /[0-9]/.test(value) },
  {
    label: "A symbol (! @ # $ % &)",
    test: (value: string) => /[^A-Za-z0-9\s]/.test(value),
  },
];

export function meetsPasswordPolicy(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

export function PasswordChecklist({
  password,
  confirmation,
}: {
  password: string;
  confirmation: string;
}) {
  const items = [
    ...PASSWORD_RULES.map((rule) => ({
      label: rule.label,
      met: rule.test(password),
    })),
    {
      label: "Both passwords match",
      met: confirmation.length > 0 && password === confirmation,
    },
  ];

  return (
    <View style={styles.checklist} accessibilityLabel="Password requirements">
      {items.map((item) => (
        <View key={item.label} style={styles.checkItem}>
          <View style={[styles.checkDot, item.met && styles.checkDotMet]}>
            {item.met && <AppIcon name="check" size={11} color={COLORS.white} />}
          </View>

          <Text style={[styles.checkText, item.met && styles.checkTextMet]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ==========================================
// FIELDS
// ==========================================

export function FormField({
  label,
  required = false,
  inRow = false,
  hint,
  style,
  children,
}: {
  label: string;
  required?: boolean;
  inRow?: boolean;
  hint?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View style={[styles.field, inRow && styles.fieldInRow, style]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {children}

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function FormInput(props: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor="#A0A7B2"
      {...props}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      style={[styles.input, focused && styles.inputFocused, props.style]}
    />
  );
}

export function PasswordInput({
  label,
  ...props
}: TextInputProps & { label: string }) {
  const [visible, setVisible] = useState(false);

  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.passwordBox, focused && styles.inputFocused]}>
      <TextInput
        placeholderTextColor="#A0A7B2"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        secureTextEntry={!visible}
        style={styles.passwordInput}
      />

      <TouchableOpacity
        style={styles.passwordToggle}
        onPress={() => setVisible((current) => !current)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={visible ? `Hide ${label}` : `Show ${label}`}
      >
        <AppIcon name={visible ? "eyeOff" : "eye"} size={20} color="#56657A" />
      </TouchableOpacity>
    </View>
  );
}

// ==========================================
// POP-UP SHELL
// ==========================================

// A pop-up card with a header, a scrolling body and a footer. The card stays
// rendered while the pop-up fades out; forms reset their fields when they
// open, so every opening starts fresh.
export function FormPopup({
  visible,
  busy,
  title,
  subtitle,
  icon,
  wide = false,
  size,
  notice,
  bodyRef,
  onClose,
  footer,
  children,
}: {
  visible: boolean;
  busy: boolean;
  title: string;
  subtitle: string;
  icon: IconName;
  wide?: boolean;
  // md 560 px, lg 680 px (same as wide), xl 1000 px for two-column forms.
  size?: "md" | "lg" | "xl";
  // Shown between the header and the scrolling body, so a message stays in
  // view however far the form is scrolled.
  notice?: ReactNode;
  bodyRef?: RefObject<ScrollView | null>;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  const cardSize = size ?? (wide ? "lg" : "md");

  const close = () => {
    if (!busy) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <PopIn
          style={[
            styles.card,
            cardSize === "lg" && styles.cardWide,
            cardSize === "xl" && styles.cardExtraWide,
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <AppIcon name={icon} size={20} color={COLORS.navy} />
            </View>

            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>

              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={close}
              disabled={busy}
              accessibilityLabel={`Close ${title}`}
              activeOpacity={0.8}
            >
              <AppIcon name="close" size={20} color={COLORS.navy} />
            </TouchableOpacity>
          </View>

          {notice ? <View style={styles.notice}>{notice}</View> : null}

          <ScrollView
            ref={bodyRef}
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          <View style={styles.footer}>{footer}</View>
        </PopIn>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function PopupButton({
  label,
  busyLabel,
  busy = false,
  disabled = false,
  variant = "primary",
  icon,
  onPress,
}: {
  label: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  variant?: "primary" | "green" | "outline" | "danger";
  // Shown before the label; replaced by the spinner while busy.
  icon?: IconName;
  onPress: () => void;
}) {
  const outline = variant === "outline";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "primary" && styles.buttonPrimary,
        variant === "green" && styles.buttonGreen,
        variant === "danger" && styles.buttonDanger,
        outline && styles.buttonOutline,
        (disabled || busy) && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityState={{ disabled: disabled || busy, busy }}
      activeOpacity={0.8}
    >
      {busy && (
        <ActivityIndicator
          size="small"
          color={outline ? COLORS.navy : COLORS.white}
        />
      )}

      {icon && !busy ? (
        <AppIcon
          name={icon}
          size={16}
          color={outline ? "#4D5560" : COLORS.white}
        />
      ) : null}

      <Text style={outline ? styles.buttonOutlineText : styles.buttonText}>
        {busy && busyLabel ? busyLabel : label}
      </Text>
    </TouchableOpacity>
  );
}
