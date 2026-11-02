// Small UI sounds synthesized with the Web Audio API (no audio files needed).

let ctx: AudioContext | null = null

function getContext() {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  // Browsers suspend audio until the user interacts with the page; by the time
  // someone is walking around, they already have, so resuming works.
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(ac: AudioContext, freq: number, start: number, duration: number, volume: number) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

let lastPlayed = 0

/** Soft two-note "plim" played when someone enters talking range. */
export function playProximitySound() {
  const now = Date.now()
  if (now - lastPlayed < 400) return // several people arriving together → one sound
  lastPlayed = now

  const ac = getContext()
  if (!ac) return
  const t = ac.currentTime
  tone(ac, 880, t, 0.35, 0.12) // A5
  tone(ac, 1318.5, t + 0.11, 0.5, 0.1) // E6
}
