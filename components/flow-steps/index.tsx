import { Fragment } from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";

import { styles } from "./flow-steps.styles";

// ==========================================
// FLOW STEPS
// ==========================================

// The three steps of recording a fine, shown on each screen along the way so
// an Officer always knows where they are and what comes next.
export const FLOW_STEPS = ["Find student", "Check student", "Record fine"];

export function FlowSteps({
  current,
  tone = "light",
  style,
}: {
  // 1 = find the student (scan or search), 2 = check them, 3 = record the fine.
  current: 1 | 2 | 3;
  // "dark" for the navy scanner screen.
  tone?: "light" | "dark";
  style?: StyleProp<ViewStyle>;
}) {
  const dark = tone === "dark";

  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityLabel={`Step ${current} of ${FLOW_STEPS.length}: ${FLOW_STEPS[current - 1]}`}
    >
      {FLOW_STEPS.map((label, index) => {
        const number = index + 1;

        const done = number < current;

        const active = number === current;

        return (
          <Fragment key={label}>
            {index > 0 && (
              <View
                style={[
                  styles.line,
                  dark ? styles.lineDark : styles.lineLight,
                  (done || active) && styles.lineOn,
                ]}
              />
            )}

            <View style={styles.step}>
              <View
                style={[
                  styles.dot,
                  dark ? styles.dotDark : styles.dotLight,
                  done && styles.dotDone,
                  active && (dark ? styles.dotActiveDark : styles.dotActiveLight),
                ]}
              >
                <Text
                  style={[
                    styles.dotText,
                    dark ? styles.dotTextDark : styles.dotTextLight,
                    (done || active) && styles.dotTextOn,
                    active && dark && styles.dotTextActiveDark,
                  ]}
                >
                  {number}
                </Text>
              </View>

              <Text
                style={[
                  styles.label,
                  dark ? styles.labelDark : styles.labelLight,
                  active && (dark ? styles.labelActiveDark : styles.labelActiveLight),
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}
