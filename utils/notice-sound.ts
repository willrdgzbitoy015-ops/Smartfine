import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";

// The chime that plays with the notice banner. It mixes with whatever else is
// playing (music keeps going), follows the phone's silent switch, and never
// plays in the background. A sound that cannot play is skipped: the banner
// must never fail because of it.
let player: AudioPlayer | null = null;

let lastPlayed = 0;

// Notices that arrive together play the chime once.
const MIN_GAP_MS = 900;

function getPlayer() {
  if (!player) {
    setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: "mixWithOthers",
      shouldPlayInBackground: false,
    }).catch(() => {});

    player = createAudioPlayer(require("../assets/sounds/notice.wav"));
  }

  return player;
}

export function playNoticeSound() {
  const now = Date.now();

  if (now - lastPlayed < MIN_GAP_MS) {
    return;
  }

  lastPlayed = now;

  try {
    const chime = getPlayer();

    void chime.seekTo(0);
    chime.play();
  } catch {
    // Silent is fine.
  }
}
