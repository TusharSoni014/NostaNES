/**
 * Provides comprehensive RetroArch input configuration for web gamepads and keyboards.
 * Fully supports Xbox, PlayStation, Nintendo, and standard USB/Bluetooth gamepads out of the box,
 * and sets up canonical baseline mappings for live in-memory input translation.
 */
export const getRetroArchInputConfig = () => ({
    video_smooth: false,
    video_force_aspect: true,
    audio_enable: true,
    input_exit_emulator: "nul",
    input_exit_emulator_btn: "nul",
    input_menu_toggle: "nul",
    input_menu_toggle_btn: "nul",

    // Disable internal RetroArch hotkeys to prevent accidental in-game shader switching
    input_shader_next: "nul",
    input_shader_prev: "nul",
    input_shader_toggle: "nul",
    input_shader_next_btn: "nul",
    input_shader_prev_btn: "nul",
    input_shader_toggle_btn: "nul",
    input_shader_next_axis: "nul",
    input_shader_prev_axis: "nul",
    input_shader_toggle_axis: "nul",
    input_pause_toggle: "nul",
    input_reset: "nul",
    input_reset_btn: "nul",
    input_state_slot_increase: "nul",
    input_state_slot_decrease: "nul",
    input_load_state: "nul",
    input_load_state_btn: "nul",
    input_save_state: "nul",
    input_save_state_btn: "nul",

    // Canonical keyboard mappings: Z & X are B & A; A & S are Turbo B & A
    input_player1_up: "up",
    input_player1_down: "down",
    input_player1_left: "left",
    input_player1_right: "right",
    input_player1_b: "z",
    input_player1_a: "x",
    input_player1_y: "a",
    input_player1_x: "s",
    input_player1_start: "enter",
    input_player1_select: "shift",

    // Slot 0 is required. -1 is read as an unsigned pad index and traps in
    // gamepadEventHandlerFunc (index out of bounds) when a pad connects on boot.
    // Buttons and axes stay unbound, and autoconfig stays off, so that slot
    // does not also apply RetroArch's default layout on top of our mapping.
    input_autodetect_enable: false,
    input_player1_joypad_index: 0,
    input_player1_analog_dpad_mode: 0,
    input_player1_b_btn: "nul",
    input_player1_a_btn: "nul",
    input_player1_y_btn: "nul",
    input_player1_x_btn: "nul",
    input_player1_select_btn: "nul",
    input_player1_start_btn: "nul",
    input_player1_up_btn: "nul",
    input_player1_down_btn: "nul",
    input_player1_left_btn: "nul",
    input_player1_right_btn: "nul",
    input_player1_l_btn: "nul",
    input_player1_r_btn: "nul",
    input_player1_l_x_plus_axis: "nul",
    input_player1_l_x_minus_axis: "nul",
    input_player1_l_y_plus_axis: "nul",
    input_player1_l_y_minus_axis: "nul",
})

/**
 * Core-level options for NES emulators (e.g. FCEUmm).
 * Explicitly enables Turbo buttons for both players and sets rapid-fire delay.
 */
export const getRetroArchCoreConfig = () => ({
  fceumm_turbo_enable: "Both",
  fceumm_turbo_delay: "3",
})
