export const MIN_GAME_SPEED = 1
export const MAX_GAME_SPEED = 10

export function clampGameSpeed(speed: number): number {
  return Math.max(MIN_GAME_SPEED, Math.min(MAX_GAME_SPEED, Math.round(speed)))
}
