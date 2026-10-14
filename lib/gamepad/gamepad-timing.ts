/**
 * Centralized timing constants for console-grade gamepad and keyboard navigation.
 * Standardizes the delay before repeat starts, the steady stepping pace,
 * and the turbo interval across all shelves, menus, and dialogs.
 */
export const GAMEPAD_TIMING = {
  INITIAL_REPEAT_DELAY_MS: 380, // Initial hold threshold before repeat begins (ms)
  STEADY_REPEAT_INTERVAL_MS: 160, // Console-grade steady stepping (~6 items/sec)
  FAST_SCROLL_HOLD_THRESHOLD_MS: 2500, // Hold 2.5s to unlock turbo scrubbing
  TURBO_REPEAT_INTERVAL_MS: 70, // Turbo scrubbing interval (ms)
} as const
