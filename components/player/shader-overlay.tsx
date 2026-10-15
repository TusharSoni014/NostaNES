"use client"

import type { GameShader } from "@/lib/storage/shader-storage"

type ShaderOverlayProps = {
  shader: GameShader
}

export function ShaderOverlay({ shader }: ShaderOverlayProps) {
  if (shader === "none") return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
    >
      {/* CRT Scanline Layer */}
      {shader === "crt-scanlines" && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
            backgroundSize: "100% 4px",
          }}
        />
      )}

      {/* CRT Arcade Cabinet: Curved Glass + Vignette + Phosphor Aperture */}
      {shader === "crt-arcade" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.35) 2px, rgba(0,0,0,0.35) 4px)",
              backgroundSize: "100% 4px",
            }}
          />
          {/* Radial Curved Screen Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.65) 100%)",
            }}
          />
          {/* Glass Specular Glare */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%)",
            }}
          />
        </>
      )}

      {/* Warm Vintage NTSC: Amber Warmth + Scanlines */}
      {shader === "crt-warm" && (
        <>
          <div
            className="absolute inset-0 mix-blend-color"
            style={{ backgroundColor: "rgba(255, 175, 75, 0.12)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 4px)",
              backgroundSize: "100% 4px",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,190,100,0.04) 0%, rgba(0,0,0,0.35) 100%)",
            }}
          />
        </>
      )}

      {/* Smooth Bilinear: Hardware texture filtering is applied directly on canvas via image-rendering: auto */}
      {shader === "smooth" && null}

      {/* Monochrome Dot Matrix Game Boy DMG */}
      {shader === "gameboy" && (
        <>
          <div
            className="absolute inset-0 mix-blend-color"
            style={{ backgroundColor: "#8bac0f" }}
          />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{
              backgroundImage:
                "radial-gradient(#9bbc0f 15%, transparent 16%), radial-gradient(#8bac0f 15%, transparent 16%)",
              backgroundSize: "4px 4px",
              opacity: 0.25,
            }}
          />
        </>
      )}
    </div>
  )
}
