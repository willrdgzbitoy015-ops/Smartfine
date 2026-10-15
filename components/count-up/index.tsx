import { useEffect, useRef, useState } from "react";
import { type StyleProp, Text, type TextStyle } from "react-native";

import { useReducedMotion } from "@/components/motion";

// A number that counts up to its value when it first appears and eases from
// the old value to the new one whenever it changes (a fine added, a payment
// received). With Reduce Motion on it just shows the value.
export function CountUp({
  value,
  format = (amount) => String(amount),
  style,
  duration = 700,
}: {
  value: number;
  // How to write the number: pesos, thousands separators, ...
  format?: (amount: number) => string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}) {
  const reduced = useReducedMotion();

  // Starts at 0, so the first appearance counts up.
  const [shown, setShown] = useState(reduced ? value : 0);

  const current = useRef(reduced ? value : 0);

  useEffect(() => {
    if (reduced || current.current === value) {
      current.current = value;
      setShown(value);
      return;
    }

    const from = current.current;

    const started = Date.now();

    let frame = 0;

    const tick = () => {
      const progress = Math.min(1, (Date.now() - started) / duration);

      const eased = 1 - Math.pow(1 - progress, 3);

      current.current = from + (value - from) * eased;

      setShown(current.current);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return (
    // A screen reader hears the real value, not the counting.
    <Text style={style} accessibilityLabel={format(value)}>
      {format(Math.round(shown))}
    </Text>
  );
}
