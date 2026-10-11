import { API_V1 } from "@/lib/api-client"

export type Speech = { done: Promise<void>; stop: () => void }

/** Upper bound for one utterance, so a playback that never reports "ended" cannot stall the flow. */
function maxDurationMs(text: string) {
  const words = text.trim().split(/\s+/).length
  return Math.min(90_000, (words / 2.2) * 1000 + 4000)
}

function withTimeout(text: string, done: Promise<void>, stop: () => void): Speech {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      stop()
      resolve()
    }, maxDurationMs(text))
  })
  return {
    done: Promise.race([done, timeout]).finally(() => clearTimeout(timer)),
    stop,
  }
}

function speakWithBrowser(text: string): Speech {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined
  if (!synth) return { done: Promise.resolve(), stop: () => {} }
  const utterance = new SpeechSynthesisUtterance(text)
  const done = new Promise<void>((resolve) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
  })
  synth.cancel()
  synth.speak(utterance)
  return withTimeout(text, done, () => synth.cancel())
}

/**
 * Create (and resume) an AudioContext. Call this from a click handler: browsers only allow
 * audio after a user gesture, and a resumed context stays usable for later playback.
 */
export function unlockAudio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null
  const ctx = new AudioContext()
  void ctx.resume()
  return ctx
}

/**
 * Read text aloud: server text-to-speech (POST /tts, mp3) played through the unlocked
 * AudioContext, with the browser's speechSynthesis as a fallback when TTS is disabled or fails.
 */
export async function speak(text: string, accessToken?: string, ctx?: AudioContext | null): Promise<Speech> {
  try {
    if (!ctx) throw new Error("no audio context")
    const res = await fetch(`${API_V1}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error(`TTS ${res.status}`)
    const buffer = await ctx.decodeAudioData(await res.arrayBuffer())
    if (ctx.state === "suspended") await ctx.resume()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    const done = new Promise<void>((resolve) => {
      source.onended = () => resolve()
    })
    source.start()
    return withTimeout(text, done, () => {
      try {
        source.stop()
      } catch {
        // already stopped
      }
    })
  } catch {
    return speakWithBrowser(text)
  }
}
