import type { Metadata } from "next"
import { pageMetadata } from "@/lib/site"
import { InfoSection, InfoShell } from "@/components/info/info-shell"
import {
  GAMEPAD_NES_CONTROLS,
  KEYBOARD_NES_CONTROLS,
  KEYBOARD_P2_CONTROLS,
  type ControlItem,
} from "@/components/controls-data"

const TITLE = "NES Emulator Controls: Keyboard, Gamepad and Touch"
const DESCRIPTION =
  "Every NostaNES control: keyboard keys for player 1 and 2, Xbox and PlayStation gamepad buttons, quick save, fast forward and custom touch controls on mobile."

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/controls" })

function ControlsTable({ caption, items }: { caption: string; items: ControlItem[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-xs uppercase tracking-wide text-muted-foreground">
          <tr className="border-b border-border">
            <th scope="col" className="px-4 py-3 font-medium">Action</th>
            <th scope="col" className="px-4 py-3 font-medium">Input</th>
            <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.label}>
              <th scope="row" className="px-4 py-2.5 font-medium text-foreground">{item.label}</th>
              <td className="px-4 py-2.5">
                <span className="flex flex-wrap gap-1">
                  {item.keys.map((key) => (
                    <kbd
                      key={key}
                      className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground"
                    >
                      {key}
                    </kbd>
                  ))}
                </span>
              </td>
              <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">{item.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ControlsPage() {
  return (
    <InfoShell
      path="/controls"
      title="Controls"
      intro="NostaNES works with a keyboard, a gamepad or touch. Every button can be remapped from the in-game menu."
    >
      <InfoSection title="Keyboard, player 1">
        <ControlsTable caption="Keyboard controls for player 1" items={KEYBOARD_NES_CONTROLS} />
      </InfoSection>

      <InfoSection title="Keyboard, player 2">
        <p>Player 2 uses the number pad on the same keyboard.</p>
        <ControlsTable caption="Keyboard controls for player 2" items={KEYBOARD_P2_CONTROLS} />
      </InfoSection>

      <InfoSection title="Gamepad">
        <p>
          Xbox, PlayStation, Switch Pro and most USB or Bluetooth gamepads work. Where two buttons are
          shown, the first is Xbox and the second is PlayStation.
        </p>
        <ControlsTable caption="Gamepad controls" items={GAMEPAD_NES_CONTROLS} />
      </InfoSection>

      <InfoSection title="Touch screens">
        <p>
          Phones and tablets get an on-screen D-pad with A, B, Turbo A, Turbo B, Select and Start. Tap
          MENU for save slots, cheats and display filters.
        </p>
        <p>
          Tap LAYOUT during a game to drag any button where you want it and resize it from 50% to 180%.
          Layouts are saved for each game, separately for portrait and landscape, and you can apply one
          layout to every game.
        </p>
      </InfoSection>
    </InfoShell>
  )
}
