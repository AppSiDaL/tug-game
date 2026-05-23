"use client"

import { useEffect, useState } from "react"

export function useCountdown(
  startedAt: string | null,
  timeLimit: number,   // seconds; 0 = disabled
  onTick?: (secondsLeft: number) => void,
  onExpire?: () => void,
) {
  const [secondsLeft, setSecondsLeft] = useState<number>(timeLimit)

  useEffect(() => {
    if (!startedAt || timeLimit <= 0) {
      setSecondsLeft(timeLimit)
      return
    }

    const tick = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
      const left = Math.max(0, Math.ceil(timeLimit - elapsed))
      setSecondsLeft(left)
      onTick?.(left)
      if (left === 0) onExpire?.()
    }

    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, timeLimit])

  const isExpired = timeLimit > 0 && secondsLeft === 0
  const progress  = timeLimit > 0 ? secondsLeft / timeLimit : 1 // 1 → 0

  return { secondsLeft, isExpired, progress }
}
