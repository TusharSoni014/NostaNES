/** Letters injected for player 2. They are not the keys a person presses. */
export const PLAYER2_KEYBOARD_WIRES = ["i", "k", "j", "l", "u", "o", "h", "n"] as const

/**
 * Provides comprehensive RetroArch input configuration for web gamepads and keyboards.
 * Fully supports Xbox, PlayStation, Nintendo, and standard USB/Bluetooth gamepads out of the box,
 * and sets up canonical baseline mappings for live in-memory input translation.
 */
export const getRetroArchInputConfig = (isMobile = false) => ({
    video_smooth: false,
    video_force_aspect: true,
    audio_enable: true,
    audio_sync: true,
    // Phones underrun a short buffer whenever the audio clock drifts, and audio sync
    // then stalls the core. A deeper buffer plus a wider rate window absorbs that.
    audio_latency: isMobile ? 192 : 96,
    // Linear audio resampler reduces DRC CPU usage by ~80% compared to heavy sinc interpolation
    audio_resampler: "linear",
    audio_resampler_quality: 1,
    audio_rate_control: true,
    audio_rate_control_delta: isMobile ? 0.03 : 0.005,
    audio_max_timing_skew: isMobile ? 0.15 : 0.05,
    // Phones are 90/120Hz. Vsync waits on that refresh and presents a 60Hz game in
    // uneven steps. Audio sync already paces the core, so vsync only adds hitching.
    // Threaded video also copies every frame on the single-threaded web build.
    video_threaded: isMobile ? false : true,
    video_vsync: isMobile ? false : true,
    video_frame_delay: 0,
    video_max_swapchain_images: 2,
    ...(isMobile
      ? {
          audio_out_rate: 48000,
          video_hard_sync: false,
          video_black_frame_insertion: false,
          video_refresh_rate: 60,
          video_font_enable: false,
          video_shader_enable: false,
          rewind_enable: false,
          run_ahead_enabled: false,
        }
      : {}),
    pause_nonactive: false,
    fps_update_interval: 60,
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

    // Private wires for player 2. The number pad the player actually presses is
    // translated in JS, then Nostalgist injects these keys. RetroArch treats
    // "num5" as the top-row 5, not Numpad5, so the wires are letters (and the
    // keypad plus/minus, which already match on both sides).
    input_player2_up: "i",
    input_player2_down: "k",
    input_player2_left: "j",
    input_player2_right: "l",
    input_player2_a: "u",
    input_player2_b: "o",
    input_player2_x: "kp_plus",
    input_player2_y: "kp_minus",
    input_player2_start: "h",
    input_player2_select: "n",

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

    // Slot 1 is the second controller. Buttons stay unbound so RetroArch does
    // not apply its own layout on top of the player 2 mapping.
    input_player2_joypad_index: 1,
    input_player2_analog_dpad_mode: 0,
    input_player2_b_btn: "nul",
    input_player2_a_btn: "nul",
    input_player2_y_btn: "nul",
    input_player2_x_btn: "nul",
    input_player2_select_btn: "nul",
    input_player2_start_btn: "nul",
    input_player2_up_btn: "nul",
    input_player2_down_btn: "nul",
    input_player2_left_btn: "nul",
    input_player2_right_btn: "nul",
    input_player2_l_btn: "nul",
    input_player2_r_btn: "nul",
    input_player2_l_x_plus_axis: "nul",
    input_player2_l_x_minus_axis: "nul",
    input_player2_l_y_plus_axis: "nul",
    input_player2_l_y_minus_axis: "nul",
})

/**
 * Core-level options for NES emulators (e.g. FCEUmm).
 * Explicitly enables Turbo buttons for both players and sets rapid-fire delay.
 */
export const getRetroArchCoreConfig = (isMobile = false) => ({
  fceumm_turbo_enable: "Both",
  fceumm_turbo_delay: "3",
  // "Low" sound quality prevents complex audio synthesis / expansion chips (MMC5, VRC6/7) from stuttering on mobile
  fceumm_sndquality: isMobile ? "Low" : "High",
  // NTSC composite filtering is a full-frame CPU pass and is what makes heavier carts hitch
  ...(isMobile ? { fceumm_ntsc_filter: "disabled" } : {}),
  fceumm_overclocking: "Disabled",
  fceumm_nospritelimit: "Disabled",
  fceumm_region: "Auto",
})
