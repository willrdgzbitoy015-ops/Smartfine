// ==========================================
// MOTION TOKENS
// ==========================================

// One set of timings for the whole app, so every role moves the same way.
// Durations are in milliseconds.
export const MOTION = {
  duration: {
    // Press feedback on cards and tiles.
    press: 120,

    // Small state changes: badges, focus rings, chips.
    quick: 180,

    // Content replaced in place: tabs, filters, pop-up views.
    switch: 220,

    // Pop-up cards and screen content appearing.
    enter: 280,
  },

  // Distance content travels as it fades in.
  distance: {
    enter: 12,
    switch: 8,
  },

  // List items that fade in one after another.
  stagger: {
    step: 45,
    // Items after this share the last delay, so long lists never wait.
    maxStaggered: 8,
    // Items after this appear without animating.
    maxAnimated: 24,
  },

  // Springs settle with at most a small overshoot.
  spring: {
    popIn: { friction: 9, tension: 100 },
    press: { friction: 7, tension: 180 },
    indicator: { friction: 8, tension: 80 },
  },

  // Pop-up cards start slightly smaller than full size.
  popInFrom: 0.94,

  // Cards shrink to this while pressed.
  pressScale: 0.97,
} as const;
