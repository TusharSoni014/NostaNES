"use client"

import { memo, useCallback, useState } from "react"
import { HeartIcon } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useFavorites } from "@/hooks/use-favorites"
import { playUiSound } from "@/lib/ui-sounds"
import { cn } from "@/lib/utils"
import type { Game, GameGroup } from "@/lib/games"

export type FavoriteButtonProps = {
  game: Game | GameGroup | string
  variant?: "icon" | "button" | "badge"
  size?: "sm" | "md" | "lg"
  className?: string
  showLabel?: boolean
  stopPropagation?: boolean
}

// 6 particle angles for radial heart burst
const BURST_PARTICLES = [
  { x: 0, y: -16, delay: 0 },
  { x: 14, y: -8, delay: 0.02 },
  { x: 14, y: 10, delay: 0.03 },
  { x: 0, y: 16, delay: 0.01 },
  { x: -14, y: 10, delay: 0.03 },
  { x: -14, y: -8, delay: 0.02 },
]

export const FavoriteButton = memo(function FavoriteButton({
  game,
  variant = "icon",
  size = "md",
  className,
  showLabel = false,
  stopPropagation = true,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const isFav = isFavorite(game)
  const [burstKey, setBurstKey] = useState(0)

  const title = typeof game === "string" ? game : game.title || game.file || "Game"

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      if (stopPropagation) {
        e.preventDefault()
        e.stopPropagation()
      }
      const nextFav = toggleFavorite(game)
      if (nextFav) {
        setBurstKey((prev) => prev + 1)
        playUiSound("heart")
      } else {
        playUiSound("unheart")
      }
    },
    [game, stopPropagation, toggleFavorite],
  )

  const iconSizes = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
  }

  const containerSizes = {
    sm: "size-7 rounded-lg",
    md: "size-8 rounded-xl",
    lg: "size-9 rounded-xl",
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        role="button"
        aria-pressed={isFav}
        aria-label={isFav ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
        onClick={handleToggle}
        className={cn(
          "group/fav relative inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold select-none outline-none transition-all duration-200 cursor-pointer border",
          isFav
            ? "border-rose-500/50 bg-rose-500/15 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:bg-rose-500/25 hover:border-rose-400"
            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white",
          className,
        )}
      >
        <span className="relative flex items-center justify-center">
          <HeartAnimation isFav={isFav} burstKey={burstKey} iconClass={iconSizes[size]} animated />
        </span>
        {showLabel ? (
          <span className="truncate">
            {isFav ? "Favorited" : "Favorite"}
          </span>
        ) : null}
      </button>
    )
  }

  if (variant === "badge") {
    return (
      <button
        type="button"
        aria-pressed={isFav}
        aria-label={isFav ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
        onClick={handleToggle}
        className={cn(
          "group/fav relative inline-flex items-center justify-center rounded-full p-1.5 transition-colors cursor-pointer",
          isFav ? "text-rose-500 hover:text-rose-400" : "text-current opacity-60 hover:text-rose-400 hover:opacity-100",
          className,
        )}
      >
        <HeartIcon className={cn(iconSizes[size], isFav ? "fill-current stroke-[2.2]" : "stroke-[1.8]")} />
      </button>
    )
  }

  return (
    <button
      type="button"
      role="button"
      aria-pressed={isFav}
      aria-label={isFav ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
      onClick={handleToggle}
      className={cn(
        "group/fav relative inline-flex items-center justify-center border select-none outline-none transition-all duration-200 cursor-pointer",
        containerSizes[size],
        isFav
          ? "border-rose-500/50 bg-rose-500/20 text-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.35)] hover:bg-rose-500/30 hover:border-rose-400"
          : "border-white/10 bg-white/5 text-white/50 hover:border-white/25 hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      <HeartAnimation isFav={isFav} burstKey={burstKey} iconClass={iconSizes[size]} animated />
    </button>
  )
})

function HeartAnimation({
  isFav,
  burstKey,
  iconClass,
  animated,
}: {
  isFav: boolean
  burstKey: number
  iconClass: string
  animated: boolean
}) {
  if (!animated) {
    return <HeartIcon className={cn(iconClass, isFav ? "fill-current stroke-[2.2]" : "stroke-[1.8]")} />
  }

  return (
    <span className="relative inline-flex items-center justify-center">
      {/* Expanding Ripple Shockwave Ring when Favorited */}
      <AnimatePresence>
        {isFav && burstKey > 0 ? (
          <motion.span
            key={`ring-${burstKey}`}
            initial={{ scale: 0.5, opacity: 0.95 }}
            animate={{ scale: 2.3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 -m-1 rounded-full border-2 border-rose-400/80"
          />
        ) : null}
      </AnimatePresence>

      {/* Sparkle Burst Particles when Favorited */}
      <AnimatePresence>
        {isFav && burstKey > 0 ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {BURST_PARTICLES.map((p, idx) => (
              <motion.span
                key={`p-${burstKey}-${idx}`}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: [0, 1.2, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 0.42,
                  delay: p.delay,
                  ease: "easeOut",
                }}
                className="absolute size-1 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.9)]"
              />
            ))}
          </span>
        ) : null}
      </AnimatePresence>

      {/* Heart Icon: Animated In and Out */}
      <AnimatePresence mode="wait" initial={false}>
        {isFav ? (
          <motion.span
            key="favorited"
            initial={{ scale: 0.2, rotate: -25, opacity: 0 }}
            animate={{
              scale: [0.2, 1.42, 0.92, 1],
              rotate: [-25, 12, -4, 0],
              opacity: 1,
            }}
            exit={{
              scale: [1, 1.25, 0],
              rotate: [0, -15, -25],
              opacity: [1, 1, 0],
              transition: { duration: 0.2, ease: "easeIn" },
            }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative inline-flex items-center justify-center text-rose-500 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.65)]"
          >
            <HeartIcon className={cn(iconClass, "fill-current stroke-[2.2]")} />
          </motion.span>
        ) : (
          <motion.span
            key="unfavorited"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            exit={{
              scale: 0.3,
              opacity: 0,
              transition: { duration: 0.15, ease: "easeIn" },
            }}
            transition={{
              duration: 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative inline-flex items-center justify-center group-hover/fav:text-rose-400 group-hover/fav:scale-110 transition-transform duration-150"
          >
            <HeartIcon className={cn(iconClass, "stroke-[1.8]")} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
