import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Short vibrations that confirm an action on phones and tablets.
// Web has no haptics, and a failed vibration must never break the action.
const supported = Platform.OS === "android" || Platform.OS === "ios";

function run(effect: () => Promise<void>) {
  if (!supported) {
    return;
  }

  effect().catch(() => {});
}

export const haptics = {
  // A tab, chip, or toggle changed.
  selection: () => run(() => Haptics.selectionAsync()),

  // A QR code was read.
  impact: () =>
    run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  // Something was saved or recorded.
  success: () =>
    run(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),

  // Something needs attention (validation, a warning pop-up).
  warning: () =>
    run(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    ),

  // Something failed or was rejected.
  error: () =>
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
