// FAQ copy for /faq and its FAQPage JSON-LD. Plain data so other files
// (llms.txt notes, future pages) can reuse it.
export type FaqItem = { question: string; answer: string }

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is NostaNES free?",
    answer:
      "Yes. NostaNES is free to play in your browser. There is no download, no account and no sign-up.",
  },
  {
    question: "Do I need to install an emulator?",
    answer:
      "No. The NES emulator (a libretro core run through Nostalgist.js) is compiled to WebAssembly and runs inside your browser tab. It works in current versions of Chrome, Edge, Firefox and Safari.",
  },
  {
    question: "Can I play NES games on my phone or tablet?",
    answer:
      "Yes. On phones and tablets NostaNES shows an on-screen D-pad, A, B, Turbo A, Turbo B, Select and Start. Tap LAYOUT during a game to drag and resize any button. Layouts are saved per game, separately for portrait and landscape.",
  },
  {
    question: "Which controllers work?",
    answer:
      "Xbox, PlayStation (DualShock 4 and DualSense), Nintendo Switch Pro and most USB or Bluetooth gamepads. Connect the controller and press any button; the on-screen hints switch to its buttons. You can remap every button from the in-game menu.",
  },
  {
    question: "How do I save my progress?",
    answer:
      "Open the in-game menu (F1 on a keyboard, Select + Start on a gamepad, or MENU on touch) and pick one of 10 save slots. There is also a quick save: hold \".\" or RB for 2 seconds to save, and \",\" or LB to load it. Saves are stored in your browser, so clearing this site's data deletes them.",
  },
  {
    question: "Can I use cheats?",
    answer:
      "Yes. NostaNES finds cheats for the game you are playing in the libretro cheat database, and you can switch each one on or off while you play. You can also enter your own Game Genie codes.",
  },
  {
    question: "Can I play my own ROM files?",
    answer:
      "Yes. Drag a .nes or .zip file onto the page, or press Load ROM. The file is read in your browser and is never uploaded.",
  },
  {
    question: "Can two people play at once?",
    answer:
      "Yes. Connect a second gamepad, or let player 2 use the number pad on the same keyboard.",
  },
  {
    question: "Can I speed up a game?",
    answer:
      "Yes. Press ] or RT to go faster, up to 10x, and [ or LT to slow back down. The in-game menu also has a Game Speed setting, which works on touch devices.",
  },
  {
    question: "What display filters are there?",
    answer:
      "Crisp pixels, CRT scanlines, an arcade cabinet look with a curved screen, warm vintage NTSC, smooth bilinear and a green monochrome LCD look. Change them from the in-game menu at any time.",
  },
]
