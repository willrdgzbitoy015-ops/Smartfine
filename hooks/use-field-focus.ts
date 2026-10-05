import { useState } from "react";

// Tracks which text field has focus so its border can highlight. It changes
// only on focus and blur, never while typing.
//
//   const { focused, bind } = useFieldFocus();
//   <TextInput {...bind("email")} style={[styles.input, focused === "email" && styles.inputFocused]} />
export function useFieldFocus<Name extends string = string>() {
  const [focused, setFocused] = useState<Name | null>(null);

  const bind = (name: Name) => ({
    onFocus: () => setFocused(name),
    onBlur: () =>
      setFocused((current) => (current === name ? null : current)),
  });

  return { focused, bind };
}
