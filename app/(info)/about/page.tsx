import type { Metadata } from "next"
import { InfoSection, InfoShell } from "@/components/info/info-shell"
import { absoluteUrl, GITHUB_URL, SITE_URL, pageMetadata } from "@/lib/site"

const TITLE = "About NostaNES, the Online NES Emulator"
const DESCRIPTION =
  "NostaNES is a free, open-source NES emulator that runs in your browser. Learn what it does, how it works and how it keeps your saves on your device."

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/about" })

const FEATURES = [
  ["No install", "Games run in the browser tab. Nothing to download, no account to make."],
  ["Gamepad and keyboard", "Xbox, PlayStation, Switch Pro and generic pads, with on-screen hints for the pad you use."],
  ["Touch controls", "A full on-screen controller on phones and tablets that you can move and resize per game."],
  ["Save states", "10 save slots and a quick save for every game, stored in your browser."],
  ["Cheats", "Cheats from the libretro database you can toggle mid-game, plus your own Game Genie codes."],
  ["Display filters", "CRT scanlines, an arcade cabinet look, vintage NTSC, LCD and crisp pixels."],
  ["2 players", "A second gamepad or the number pad lets two people play on one screen."],
  ["Fast forward", "Speed any game up to 10x and back down with one button."],
] as const

export default function AboutPage() {
  return (
    <InfoShell
      path="/about"
      title="About NostaNES"
      intro="NostaNES turns your browser into an NES console: pick a cartridge from the library, or drop in your own ROM, and play."
      jsonLd={[
        {
          "@type": "AboutPage",
          url: absoluteUrl("/about"),
          name: TITLE,
          description: DESCRIPTION,
          about: { "@id": `${SITE_URL}/#app` },
          isPartOf: { "@id": `${SITE_URL}/#website` },
        },
      ]}
    >
      <InfoSection title="What you can do">
        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(([name, text]) => (
            <li key={name} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-medium text-foreground">{name}</p>
              <p className="mt-1 text-sm">{text}</p>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="How it works">
        <p>
          NostaNES runs a libretro NES core through Nostalgist.js. The core is compiled to WebAssembly,
          so it runs at full speed inside the page, and the picture is drawn on an HTML canvas with
          optional shader filters on top.
        </p>
        <p>
          The game library loads from cloud storage when you pick a game. ROMs you add yourself are read
          in your browser and are never uploaded.
        </p>
      </InfoSection>

      <InfoSection title="Your data stays on your device">
        <p>
          There are no accounts. Save states, favorites, recently played games, button mappings and touch
          layouts are kept in your browser&apos;s storage. Clearing this site&apos;s data removes them.
        </p>
      </InfoSection>

      <InfoSection title="Open source">
        <p>
          NostaNES is built with Next.js, React, Tailwind CSS and Three.js. The code is on{" "}
          <a
            href={GITHUB_URL}
            className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            GitHub
          </a>
          .
        </p>
      </InfoSection>
    </InfoShell>
  )
}
