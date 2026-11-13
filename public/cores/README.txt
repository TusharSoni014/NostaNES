NES emulator core served by NostaNES

fceumm-v1.22.2/ holds the FCE Ultra mm libretro core (fceumm_libretro.js and
fceumm_libretro.wasm), unchanged from the RetroArch Emscripten build that
Nostalgist uses by default:
https://github.com/arianrhodsandlot/retroarch-emscripten-build (tag v1.22.2,
retroarch/fceumm_libretro.zip)

The site serves these files itself instead of loading them from a public CDN,
so a game starts as fast as the site loads. When upgrading, put the new
version in a new folder (the files are cached for a year under their path)
and update CORE_BASE_PATH in components/player/use-nostalgist-emulator.ts.

FCE Ultra mm is free software under the GNU General Public License v2.
Source: https://github.com/libretro/libretro-fceumm
