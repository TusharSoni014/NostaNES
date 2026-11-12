import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ImageResponse } from "next/og"

// No request-time APIs, so Next renders this once at build time and serves
// the PNG as a static file. Every page inherits it.
export const alt = "NostaNES - play classic NES games online in your browser"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const FEATURES = ["Gamepad & touch", "Save states", "Cheats", "CRT filters", "2 players"]

export default function OpengraphImage() {
  // Sync read on purpose: with Cache Components an async fs call would stop
  // prerendering and turn this into a per-request function.
  const logo = readFileSync(join(process.cwd(), "public/nostanes.png"))
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 88px",
          background:
            "radial-gradient(circle at 18% 30%, #16345c 0%, #0b1d36 45%, #071422 100%)",
          color: "#eef5fb",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={300} height={300} alt="" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 30, color: "#8fb3d9", letterSpacing: 4 }}>
            NINTENDO ENTERTAINMENT SYSTEM
          </div>
          <div style={{ fontSize: 92, fontWeight: 700, marginTop: 8 }}>NostaNES</div>
          <div style={{ fontSize: 42, marginTop: 12, color: "#d6e4f2", lineHeight: 1.25 }}>
            Play classic NES games online, free, right in your browser.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 36 }}>
            {FEATURES.map((feature) => (
              <div
                key={feature}
                style={{
                  fontSize: 24,
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: "2px solid rgba(143, 179, 217, 0.4)",
                  color: "#cfe0f1",
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
