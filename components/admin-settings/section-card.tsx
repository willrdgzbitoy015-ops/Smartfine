import { ReactNode } from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";

import AppIcon, { IconName } from "@/components/AppIcon";

import { sectionStyles as styles } from "./admin-settings.styles";

// ==========================================
// SECTION CARD
// ==========================================

// A titled card for one Settings section, with optional header actions and
// a footer for the section's save buttons.
export function SectionCard({
  title,
  description,
  icon,
  actions,
  footer,
  bodyStyle,
  children,
}: {
  title: string;
  description?: string;
  icon?: IconName;
  actions?: ReactNode;
  footer?: ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.heading}>
          {icon && (
            <View style={styles.icon}>
              <AppIcon name={icon} size={19} color="#173A73" />
            </View>
          )}

          <View style={styles.headingText}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>

            {description ? (
              <Text style={styles.description}>{description}</Text>
            ) : null}
          </View>
        </View>

        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>

      <View style={[styles.body, bodyStyle]}>{children}</View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}
