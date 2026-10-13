"use client"

import { useEffect, useState } from "react"

export function Clock() {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date())

    const update = () => setLabel(format())
    update()
    const id = window.setInterval(update, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <p
      className="font-mono text-sm text-muted-foreground tabular-nums"
      aria-label="Current time"
    >
      {label ?? "––"}
    </p>
  )
}
