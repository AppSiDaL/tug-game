"use client"

import { useCallback, useRef } from "react"

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  return new Ctx()
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  gain: number,
) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.connect(env)
  env.connect(ctx.destination)
  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)
  env.gain.setValueAtTime(gain, startTime)
  env.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)

  const ctx = useCallback((): AudioContext | null => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = getAudioContext()
    }
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const playCorrect = useCallback(() => {
    const c = ctx()
    if (!c) return
    const t = c.currentTime
    // Two ascending tones — happy chime
    playTone(c, 523, "sine", t,        0.15, 0.4)
    playTone(c, 659, "sine", t + 0.12, 0.2,  0.4)
    playTone(c, 784, "sine", t + 0.24, 0.25, 0.4)
  }, [ctx])

  const playWrong = useCallback(() => {
    const c = ctx()
    if (!c) return
    const t = c.currentTime
    // Low descending buzz
    playTone(c, 220, "sawtooth", t,       0.12, 0.3)
    playTone(c, 180, "sawtooth", t + 0.1, 0.15, 0.3)
  }, [ctx])

  const playTick = useCallback(() => {
    const c = ctx()
    if (!c) return
    const t = c.currentTime
    // Short click for countdown
    playTone(c, 1000, "square", t, 0.05, 0.15)
  }, [ctx])

  const playExpire = useCallback(() => {
    const c = ctx()
    if (!c) return
    const t = c.currentTime
    // Alarm-like descending triple beep
    playTone(c, 440, "square", t,        0.08, 0.25)
    playTone(c, 400, "square", t + 0.12, 0.08, 0.25)
    playTone(c, 360, "square", t + 0.24, 0.10, 0.25)
  }, [ctx])

  return { playCorrect, playWrong, playTick, playExpire }
}
