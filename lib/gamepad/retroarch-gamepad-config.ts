import { getCustomControls } from "@/lib/storage/controls-storage"

/**
 * Provides comprehensive RetroArch input configuration for web gamepads and keyboards.
 * Fully supports Xbox, PlayStation, Nintendo, and standard USB/Bluetooth gamepads out of the box,
 * and incorporates user custom control bindings from browser localStorage.
 */
export const getRetroArchInputConfig = () => {
  const custom = getCustomControls()

  return {
    video_smooth: false,
    video_force_aspect: true,
    audio_enable: true,
    input_exit_emulator: "nul",
    input_menu_toggle: "nul",

    // Keyboard mappings: default Z & X are standard action buttons; A & S are Turbo buttons
    input_player1_up: custom.keyboard.up,
    input_player1_down: custom.keyboard.down,
    input_player1_left: custom.keyboard.left,
    input_player1_right: custom.keyboard.right,
    input_player1_b: custom.keyboard.b,
    input_player1_a: custom.keyboard.a,
    input_player1_y: custom.keyboard.turboB,
    input_player1_x: custom.keyboard.turboA,
    input_player1_start: custom.keyboard.start,
    input_player1_select: custom.keyboard.select,

    // Gamepad / Joypad mappings (W3C Standard Gamepad Specification)
    input_player1_joypad_index: 0,
    // 1 = Left analog stick also controls the D-Pad
    input_player1_analog_dpad_mode: 1,

    // NES Action buttons
    input_player1_b_btn: custom.gamepad.b,
    input_player1_a_btn: custom.gamepad.a,
    input_player1_y_btn: custom.gamepad.turboB,
    input_player1_x_btn: custom.gamepad.turboA,

    // Menu / Select
    input_player1_select_btn: custom.gamepad.select,
    input_player1_start_btn: custom.gamepad.start,

    // D-Pad buttons
    input_player1_up_btn: custom.gamepad.up,
    input_player1_down_btn: custom.gamepad.down,
    input_player1_left_btn: custom.gamepad.left,
    input_player1_right_btn: custom.gamepad.right,

    // Bumpers
    input_player1_l_btn: "4",
    input_player1_r_btn: "5",
  }
}

/**
 * Core-level options for NES emulators (e.g. FCEUmm).
 * Explicitly enables Turbo buttons for both players and sets rapid-fire delay.
 */
export const getRetroArchCoreConfig = () => ({
  fceumm_turbo_enable: "Both",
  fceumm_turbo_delay: "3",
})
