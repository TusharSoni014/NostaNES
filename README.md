<div align="center">

# 🎮 NostaNES

**A modern, console-grade web application for browsing and playing NES games directly in your browser.**

Inspired by classic console operating systems and modern media shells, NostaNES combines nostalgic 8-bit gaming with fluid 60 FPS WebAssembly emulation, dynamic cloud library streaming, authentic CRT shaders, full gamepad support, 2-player local multiplayer, and seamless cheat engine integration.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Nostalgist.js](https://img.shields.io/badge/Emulation-Nostalgist.js-red?style=for-the-badge)](https://nostalgist.js.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Cloudflare R2](https://img.shields.io/badge/Storage-Cloudflare_R2-f38020?style=for-the-badge&logo=cloudflare)](https://www.cloudflare.com/products/r2/)

</div>

---

## 🌟 What is NostaNES?

**NostaNES** transforms any modern web browser into a retro gaming console. Instead of dealing with separate emulators, complex directory mappings, and clunky file pickers, NostaNES streams an entire library of NES games directly from high-speed Cloudflare R2 cloud storage. It packages everything into a luxurious, console-like UI complete with custom procedural WebGL background animations, authentic sound effects, and native gamepad navigation.

Load games in one click, drop your own `.nes` or `.zip` ROMs right onto the screen, save and load states across 10 persistent slots, toggle live Game Genie cheats from Libretro's official database, and enjoy pixel-perfect retro aesthetics with hardware-accelerated CRT shader filters.

---

## ✨ Features

### 🏛️ Cloud Game Library & Smart Catalog
* **Dynamic Cloudflare R2 / S3 Streaming**: Automatically indexes and streams ROMs directly from a Cloudflare R2 bucket. Newly uploaded ROMs appear in your library without needing code updates or manual JSON catalogs.
* **In-Memory Server Caching**: 60-second server cache ensures fast catalog queries and zero overhead on cloud storage.
* **Smart ROM Metadata Parsing**: Cleanly strips GoodNES bracket flags (`[!]`, `[b]`, `[h]`, `[t]`, `[a]`) and extracts title, region, and release year automatically.
* **Intelligent Version Grouping**: Multiple regional releases (USA, Europe, Japan, World) and revisions of the same game are automatically bundled into a single entry with a dedicated **Version Select Dialog**.
* **Drag-and-Drop Local ROMs**: Drop any `.nes` or `.zip` file straight into the browser window or use the file picker to play private ROMs locally with zero server upload.
* **Instant Search & Region Filtering**: Real-time filtering by game title, filename, and regional tags (All, USA, Europe, Japan, World).
* **Favorites System**: Bookmark favourite titles with one click; filter your shelf to favorites instantly.

### 🕹️ High-Performance Emulation
* **WebAssembly NES Core**: Powered by [Nostalgist.js](https://nostalgist.js.org/) running official libretro cores in WebAssembly for authentic 60 FPS gameplay, low input latency, and cycle-accurate audio.
* **Integer Pixel Scaling**: Automatically calculates optimal integer-ratio scaling for razor-sharp pixel fidelity on any display resolution.
* **Screen Wake Lock API**: Automatically prevents your monitor or mobile device from sleeping during gameplay sessions.
* **Fullscreen Experience**: Seamless one-key / one-button fullscreen mode with auto-hiding header and footer HUDs.

### 📺 Authentic CRT & Retro Display Shaders
Switch between 6 visual display presets in real time via the in-game menu:
1. **Crisp Pixel (Off)**: Raw 1:1 pixel rendering with pure, razor-sharp edges.
2. **CRT Scanlines (Recommended)**: Fine horizontal phosphor scanline grid replicating a classic 90s TV tube.
3. **Arcade Cabinet**: Curved glass curvature distortion, aperture grille lines, corner vignette falloff, and specular screen glare.
4. **Warm Vintage NTSC**: Amber-tinted composite NTSC color grading with soft bloom and scanlines.
5. **Smooth Bilinear**: Bilinear interpolation removing harsh pixel edges for a softer modern display.
6. **Monochrome Dot Matrix**: Classic Game Boy DMG greenish phosphor palette with an authentic LCD dot matrix grid.

### 🎮 Native Gamepad & 2-Player Local Support
* **Plug-and-Play Controller Detection**: Full support for Xbox, PlayStation (DualShock / DualSense), Nintendo Switch Pro, and generic USB/Bluetooth gamepads.
* **Dynamic Input HUD**: On-screen prompts automatically adapt their visual badges between keyboard (`<Kbd />`) and controller buttons (`<GamepadKey />`), including PlayStation shapes (✕, ○, □, △) and Xbox buttons (A, B, X, Y).
* **Hold-to-Exit Protection**: Dedicated 5-second circular hold timer on `Select` prevents accidental exits during intense gameplay.
* **2-Player Local Multiplayer**: Dedicated Player 2 mappings for dual controllers or split-keyboard play (using the Number Pad).
* **Full Control Rebinding**: In-game rebinding modal with interactive key/button listening for both Player 1 and Player 2.
* **Turbo Buttons**: Dedicated Turbo A and Turbo B buttons for rapid-fire action.

### 💾 10-Slot Persistent Save States
* **IndexedDB Save Storage**: Save states are stored persistently in browser IndexedDB—never lost when refreshing or clearing session storage.
* **10 Independent Slots per Game**: Switch between 10 dedicated save slots with timestamp tracking and file size information.
* **Quick Save / Quick Load**: Save and restore gameplay progress in milliseconds directly from the in-game menu.

### 🧙‍♂️ Integrated Libretro Cheat Database & Custom Cheats
* **Official Libretro Database Integration**: Automatically searches and pulls Game Genie / Action Replay `.cht` cheat files from the official Libretro GitHub repository.
* **Automatic Title Matching**: Matches cheat files to the active game title and region automatically.
* **Live Cheat Toggles**: Toggle individual cheats (Infinite Lives, Invincibility, Level Select, Unlimited Ammo) on and off with instant in-game effect.
* **Custom `.cht` Upload**: Load your own custom cheat files directly into the emulator.
* **Persistent Cheat Sessions**: Active cheat selections are remembered between gameplay sessions.

### 🎨 Console UX, Sound & WebGL Visuals
* **Three.js WebGL Wave Field**: Dynamic procedural silk wave background with continuous fluid motion, depth layering, dithered shading, pointer parallax, and navigation reactivity.
* **Interactive Boot Screen**: Authentic console boot sequence with animated logo, retro audio chime, and reduced-motion bypass support.
* **Tactile Audio Feedback**: Dedicated sound effects for navigation, selection, launch, pause, cancel, notifications, and favoriting.
* **Virtualized Game List & 3D Cartridge Shelf**: Smooth, fluid navigation designed to comfortably browse hundreds of games without frame drops.

---

## 🎮 Controls Reference

### ⌨️ Keyboard Controls

#### Player 1 (Default)
| Action | Keyboard Key | Description |
| :--- | :--- | :--- |
| **D-Pad / Movement** | <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | Up, Down, Left, Right |
| **NES B Button** | <kbd>Z</kbd> | Run / Attack |
| **NES A Button** | <kbd>X</kbd> | Jump / Confirm |
| **Turbo B Button** | <kbd>A</kbd> | Rapid-fire B |
| **Turbo A Button** | <kbd>S</kbd> | Rapid-fire A |
| **Start** | <kbd>Enter</kbd> | Start / Pause |
| **Select** | <kbd>Shift</kbd> | Select / Mode |
| **In-Game Menu** | <kbd>F1</kbd> | Open in-game menu (Save, Load, Cheats, Shaders) |
| **Pause / Exit** | <kbd>Esc</kbd> | Pause gameplay or exit |
| **Fullscreen** | <kbd>F</kbd> | Toggle fullscreen mode |

#### Player 2 (Numpad Layout)
| Action | Keyboard Key | Description |
| :--- | :--- | :--- |
| **D-Pad / Movement** | <kbd>Num 5</kbd> <kbd>Num 2</kbd> <kbd>Num 1</kbd> <kbd>Num 3</kbd> | Up, Down, Left, Right |
| **NES B Button** | <kbd>Num 8</kbd> | Run / Attack |
| **NES A Button** | <kbd>Num 7</kbd> | Jump / Action |
| **Turbo B Button** | <kbd>Num −</kbd> | Rapid-fire B |
| **Turbo A Button** | <kbd>Num +</kbd> | Rapid-fire A |
| **Start** | <kbd>Num Enter</kbd> | Player 2 Start |
| **Select** | <kbd>Num 0</kbd> | Player 2 Select |

---

### 🎮 Gamepad Controls

| Action | Xbox Controller | PlayStation Controller | Nintendo Controller |
| :--- | :--- | :--- | :--- |
| **Movement** | D-Pad / Left Stick | D-Pad / Left Stick | D-Pad / Left Stick |
| **NES B Button** | <kbd>A</kbd> | <kbd>✕</kbd> | <kbd>B</kbd> |
| **NES A Button** | <kbd>B</kbd> | <kbd>○</kbd> | <kbd>A</kbd> |
| **Turbo B** | <kbd>X</kbd> | <kbd>□</kbd> | <kbd>Y</kbd> |
| **Turbo A** | <kbd>Y</kbd> | <kbd>△</kbd> | <kbd>X</kbd> |
| **Start** | <kbd>Menu</kbd> | <kbd>Options</kbd> | <kbd>+</kbd> |
| **Select** | <kbd>View</kbd> | <kbd>Share</kbd> | <kbd>−</kbd> |
| **In-Game Menu** | <kbd>Select</kbd> + <kbd>Start</kbd> | <kbd>Share</kbd> + <kbd>Options</kbd> | <kbd>−</kbd> + <kbd>+</kbd> |
| **Fullscreen** | <kbd>R3</kbd> (Right Stick Click) | <kbd>R3</kbd> (Right Stick Click) | <kbd>R3</kbd> |
| **Hold to Exit** | Hold <kbd>Select</kbd> (5s) | Hold <kbd>Share</kbd> (5s) | Hold <kbd>−</kbd> (5s) |

> 💡 *All buttons and keys can be completely customized and rebound for both Player 1 and Player 2 in the **In-Game Menu > Controls** panel.*

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router, Server Components & Route Handlers with Turbopack |
| **UI Library** | [React 19](https://react.dev/) | Modern concurrent UI architecture |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Cutting-edge CSS styling with OKLCH color palettes |
| **Emulation Core** | [Nostalgist.js](https://nostalgist.js.org/) | Libretro NES core compiled to WebAssembly |
| **3D & Shaders** | [Three.js](https://threejs.org/) | WebGL shader background with reactive fluid dynamics |
| **Motion & FX** | [Motion](https://motion.dev/) | 60 FPS transitions, spring physics, and animated dialogs |
| **Cloud Storage** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) via `@aws-sdk/client-s3` | S3-compatible, zero-egress ROM storage |
| **State Persistence** | IndexedDB & `localStorage` | Client-side save state records and user configuration |
| **Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) | Efficient caching and synchronization of library and cheats data |
| **Icons & UI Primitives** | [Lucide React](https://lucide.dev/) & [Base UI](https://base-ui.com/) | Accessible, polished UI components |

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (version 20 or higher recommended)
* [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), or [bun](https://bun.sh/)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/nostanes.git
cd nostanes
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
# or
bun install
```

### 3. Configure Environment Variables
Copy the example environment file and set your Cloudflare R2 credentials (optional if using local ROM drag-and-drop):

```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

```env
# Public URL where NES ROMs are served
NEXT_PUBLIC_BUCKET_URL="https://pub-your-bucket-id.r2.dev"

# Cloudflare R2 S3-compatible credentials for server-side ROM catalog listing
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your_r2_access_key"
R2_SECRET_ACCESS_KEY="your_r2_secret_key"
R2_BUCKET_NAME="nostanes"
```

> **Note**: Even without R2 configured, you can launch the app and play immediately by dragging and dropping any `.nes` or `.zip` ROM files onto the screen.

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience NostaNES.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```text
nostanes/
├── app/
│   ├── api/
│   │   ├── cheats/route.ts       # Libretro GitHub cheat source & search
│   │   ├── library/route.ts      # Cloudflare R2 catalog fetching & caching
│   │   └── rom/route.ts          # Safe streaming proxy for ROM binaries
│   ├── globals.css               # Tailwind v4 styles & theme definition
│   ├── layout.tsx                # App root layout with font and provider setup
│   └── page.tsx                  # Home stage entry point
├── components/
│   ├── boot-screen.tsx           # Console boot sequence with audio sync
│   ├── clock.tsx                 # System header clock
│   ├── controls-dialog.tsx       # Quick controls help dialog
│   ├── exit-confirm-dialog.tsx   # Pause & exit confirmation modal
│   ├── game-cover.tsx            # Dynamic cartridge cover art generator
│   ├── game-details-panel.tsx    # Game metadata, region, and launch panel
│   ├── game-list.tsx             # Virtualized scrollable game list
│   ├── game-shelf.tsx            # 3D interactive cartridge shelf carousel
│   ├── gamepad-status-indicator  # Live controller connection pill
│   ├── home-stage.tsx            # Main library browser & stage coordinator
│   ├── player-stage.tsx          # Game screen coordinator & fullscreen manager
│   ├── version-select-dialog.tsx # Regional revision / version selection modal
│   ├── wave-field.tsx            # Three.js procedural silk wave background
│   ├── player/
│   │   ├── in-game-menu/         # In-game pause menu (Save, Load, Shaders, Controls, Cheats)
│   │   ├── gamepad-exit-hud.tsx  # Hold-to-exit circular countdown HUD
│   │   ├── shader-overlay.tsx    # CRT scanlines, aperture, and DMG overlays
│   │   ├── use-gamepad-controls  # In-game controller polling & mapping
│   │   ├── use-keyboard-controls # In-game keyboard bindings
│   │   └── use-nostalgist-emulator.ts # Nostalgist WASM emulator hook
│   └── ui/                       # Accessible Base UI / Shadcn UI components
├── hooks/                        # Custom hooks (favorites, input mode, cheats, library)
├── lib/
│   ├── cheats/                   # Cheat matching and session management
│   ├── display/                  # Wake lock API and safe resize observers
│   ├── gamepad/                  # Gamepad dispatcher, remapper, and timing
│   ├── storage/                  # IndexedDB save states & localStorage stores
│   ├── games.ts                  # ROM filename parsing and game grouping
│   ├── r2.ts                     # AWS S3 / Cloudflare R2 bucket client
│   └── ui-sounds.ts              # Console sound effects manager
└── public/
    ├── nostanes.png              # App icon
    └── sounds/                   # Tactile console audio sound bites
```

---

## 📜 Legal & Disclaimer

* **NostaNES** is an independent open-source emulator frontend created for preservation and educational purposes.
* NostaNES does not distribute copyrighted ROM files. Users must provide their own legally acquired game backups.
* Nintendo and Nintendo Entertainment System are registered trademarks of Nintendo of America Inc. NostaNES is not affiliated with, endorsed by, or sponsored by Nintendo.
* Emulation cores are powered by libretro and distributed under their respective open-source licenses.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check out the [Issues page](https://github.com/your-username/nostanes/issues) if you have ideas or bug reports.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
