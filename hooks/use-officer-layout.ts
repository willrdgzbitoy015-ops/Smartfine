import { useMemo } from "react";
import {
  ImageStyle,
  TextStyle,
  useWindowDimensions,
  ViewStyle,
} from "react-native";

import { OFFICER_COLUMN } from "@/constants/officer-theme";

type Style = ViewStyle | TextStyle | ImageStyle;

// Scale layout values within a bounded phone column, never physical pixels.
export function buildOfficerStyles<T extends Record<string, Style>>(
  base: T,
  width: number,
  height: number,
): T {
  const column = Math.min(width, 480);
  const scale = Math.max(0.85, Math.min(column / 390, 1.2));
  const short = height < 720;
  const result: Record<string, any> = {};
  const dimensions =
    /^(width|height|minWidth|minHeight|maxWidth|maxHeight|padding.*|margin.*|gap|rowGap|columnGap|borderRadius)$/;

  for (const [name, original] of Object.entries(base)) {
    const style: Record<string, any> = { ...original };
    for (const [key, value] of Object.entries(style)) {
      if (typeof value !== "number") continue;
      if (key === "fontSize")
        style[key] = Math.round(Math.max(12, value) * Math.max(1, scale));
      else if (key === "lineHeight")
        style[key] = Math.round(value * Math.max(1, scale));
      else if (
        dimensions.test(key) &&
        !(key === "maxWidth" && (value === 480 || value === OFFICER_COLUMN))
      ) {
        const verticalGap = /^(padding|margin)(Top|Bottom|Vertical)$/.test(key);
        style[key] = Math.round(
          value * (verticalGap && short ? Math.min(scale, 0.85) : scale),
        );
      }
    }
    if (style.backgroundColor === "#E8E8E8") style.backgroundColor = "#DADADA";
    if (style.fontSize && style.lineHeight)
      style.lineHeight = Math.max(
        style.lineHeight,
        Math.ceil(style.fontSize * 1.35),
      );
    if (name === "navIcon") {
      style.width = 28;
      style.height = 28;
    }
    if (name === "navLabel") {
      style.fontSize = 11;
      style.marginTop = 4;
    }
    if (name === "navItem") {
      style.minHeight = 60;
      style.flexShrink = 0;
    }
    if (name === "bottomArea") style.flexShrink = 0;
    if (/Button$/.test(name))
      style.minHeight = Math.max(style.minHeight || 0, 44);
    if (name === "input" || name === "searchInput")
      style.minHeight = Math.max(style.minHeight || 0, 44);
    result[name] = style;
  }
  return result as T;
}

export function useOfficerLayout<T extends Record<string, Style>>(base: T): T {
  const { width, height } = useWindowDimensions();
  return useMemo(
    () => buildOfficerStyles(base, width, height),
    [base, width, height],
  );
}
