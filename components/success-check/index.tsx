import { StyleProp, ViewStyle } from "react-native";

import { ResultMark } from "@/components/result-mark";

// ==========================================
// SUCCESS CHECK
// ==========================================

// The success mark used by every success pop-up in SmartFine: the app's
// check icon with a pop-in and a one-time ripple (see ResultMark).
export function SuccessCheck({
  delay = 0,
  style,
}: {
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <ResultMark status="success" delay={delay} style={style} />;
}
