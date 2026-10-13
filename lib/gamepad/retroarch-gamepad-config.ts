/**
 * Provides comprehensive RetroArch input configuration for web gamepads and keyboards.
 * Fully supports Xbox, PlayStation, Nintendo, and standard USB/Bluetooth gamepads out of the box.
 */
export const getRetroArchInputConfig = () => ({
  video_smooth: false,
  video_force_aspect: true,
  audio_enable: true,
  input_exit_emulator: "nul",
  input_menu_toggle: "f1",

  // Keyboard mappings
  input_player1_up: "up",
  input_player1_down: "down",
  input_player1_left: "left",
  input_player1_right: "right",
  input_player1_a: "x",
  input_player1_b: "z",
  input_player1_start: "enter",
  input_player1_select: "shift",

  // Gamepad / Joypad mappings (W3C Standard Gamepad Specification)
  input_player1_joypad_index: 0,
  // 1 = Left analog stick also controls the D-Pad
  input_player1_analog_dpad_mode: 1,

  // NES Action buttons (Xbox A / PS ✕ = B, Xbox B / PS ○ = A)
  input_player1_b_btn: "0",
  input_player1_a_btn: "1",
  // Turbo alternate buttons (Xbox X / PS □ = Turbo B, Xbox Y / PS △ = Turbo A)
  input_player1_y_btn: "2",
  input_player1_x_btn: "3",

  // Menu / Select
  input_player1_select_btn: "8",
  input_player1_start_btn: "9",

  // D-Pad buttons
  input_player1_up_btn: "12",
  input_player1_down_btn: "13",
  input_player1_left_btn: "14",
  input_player1_right_btn: "15",

  // Bumpers
  input_player1_l_btn: "4",
  input_player1_r_btn: "5",
})
