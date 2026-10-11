"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Flag, Loader2, Mic, RotateCcw, SkipForward, Square, Volume2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RealtimeMic } from "@/components/home-dashboard/chat-input/RealtimeMic"
import { speak, unlockAudio, type Speech } from "@/services/tts.service"
import type { Message } from "@/types/api.types"
import { cn } from "@/lib/utils"

/** Answer is submitted after this much silence once the candidate has said something. */
const SILENCE_MS = 4000
const QUESTION_LIMIT_S = 180
const SESSION_LIMIT_S = 30 * 60
const START_MESSAGE = "I'm ready to start the interview."

type Phase = "idle" | "speaking" | "listening" | "thinking"

type MicHandle = {
  startRecording: () => Promise<void>
  stopRecording: () => void
  resetTranscription: () => void
}

interface VoiceInterviewPanelProps {
  /** Latest question already in the session, if any (resume where the user left off). */
  lastQuestion: string | null
  /** Send an answer (streamed); resolves with the messages stored for the turn. */
  onAnswer: (text: string, speakingSeconds?: number) => Promise<Message[]>
  onEnd: () => void
  accessToken?: string
}

function mmss(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  speaking: "Interviewer is speaking…",
  listening: "Listening — answer out loud",
  thinking: "Evaluating your answer…",
}

export function VoiceInterviewPanel({ lastQuestion, onAnswer, onEnd, accessToken }: VoiceInterviewPanelProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [transcript, setTranscript] = useState("")
  const [question, setQuestion] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  // Mirrors of the timing refs, for rendering the timers.
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null)
  const [listenStartedAt, setListenStartedAt] = useState<number | null>(null)

  const micRef = useRef<MicHandle | null>(null)
  const speechRef = useRef<Speech | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const phaseRef = useRef<Phase>("idle")
  const transcriptRef = useRef("")
  const sessionStartRef = useRef<number | null>(null)
  const listenStartRef = useRef<number>(0)
  const lastSpeechRef = useRef<number | null>(null)
  const endedRef = useRef(false)

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }

  const stopAll = useCallback(() => {
    speechRef.current?.stop()
    micRef.current?.stopRecording()
  }, [])

  useEffect(
    () => () => {
      stopAll()
      void audioCtxRef.current?.close()
    },
    [stopAll]
  )

  const startListening = useCallback(async () => {
    if (endedRef.current) return
    micRef.current?.resetTranscription()
    transcriptRef.current = ""
    setTranscript("")
    lastSpeechRef.current = null
    listenStartRef.current = Date.now()
    setListenStartedAt(listenStartRef.current)
    setPhaseBoth("listening")
    await micRef.current?.startRecording()
  }, [])

  const say = useCallback(
    async (text: string) => {
      setPhaseBoth("speaking")
      speechRef.current = await speak(text, accessToken, audioCtxRef.current)
      await speechRef.current.done
      speechRef.current = null
    },
    [accessToken]
  )

  const ask = useCallback(
    async (q: string) => {
      setQuestion(q)
      await say(q)
      await startListening()
    },
    [say, startListening]
  )

  const finish = useCallback(() => {
    endedRef.current = true
    stopAll()
    setPhaseBoth("idle")
    setSessionStartedAt(null)
    onEnd()
  }, [onEnd, stopAll])

  /** Send text (answer / skip / start) and continue with whatever the interviewer says next. */
  const sendTurn = useCallback(
    async (text: string, speakingSeconds?: number) => {
      setPhaseBoth("thinking")
      let messages: Message[]
      try {
        messages = await onAnswer(text, speakingSeconds)
      } catch {
        toast.error("Couldn't send your answer. Try again.")
        await startListening()
        return
      }
      if (endedRef.current) return
      const sessionStart = sessionStartRef.current ?? Date.now()
      if ((Date.now() - sessionStart) / 1000 >= SESSION_LIMIT_S) {
        toast.info("Time's up — building your report.")
        finish()
        return
      }
      const nextQuestion = [...messages].reverse().find((m) => m.type === "QUESTION")
      if (nextQuestion) {
        await ask(nextQuestion.content)
        return
      }
      // No new question (e.g. the coach asked you to answer the current one): say it, keep listening.
      const reply = [...messages].reverse().find((m) => m.sender === "ASSISTANT")
      if (reply?.meta?.redirect === "true" || reply?.metadata?.redirect === "true") await say(reply.content)
      await startListening()
    },
    [ask, finish, onAnswer, say, startListening]
  )

  const submitAnswer = useCallback(async () => {
    if (phaseRef.current !== "listening") return
    micRef.current?.stopRecording()
    const text = transcriptRef.current.trim()
    if (!text) {
      toast.info("I didn't catch that — please answer out loud.")
      await startListening()
      return
    }
    const endOfSpeech = lastSpeechRef.current ?? Date.now()
    const seconds = Math.max(0, (endOfSpeech - listenStartRef.current) / 1000)
    await sendTurn(text, Math.round(seconds * 10) / 10)
  }, [sendTurn, startListening])

  // Clock: drives timers, silence detection and the per-question limit.
  useEffect(() => {
    if (phase === "idle") return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (phaseRef.current !== "listening") return
      const silentFor = lastSpeechRef.current != null ? t - lastSpeechRef.current : 0
      const answeredFor = (t - listenStartRef.current) / 1000
      if ((lastSpeechRef.current != null && silentFor >= SILENCE_MS) || answeredFor >= QUESTION_LIMIT_S) {
        void submitAnswer()
      }
    }, 250)
    return () => clearInterval(id)
  }, [phase, submitAnswer])

  const handleTranscript = useCallback((text: string) => {
    if (text !== transcriptRef.current) {
      transcriptRef.current = text
      setTranscript(text)
      if (text.trim()) lastSpeechRef.current = Date.now()
    }
  }, [])

  async function handleStart() {
    // Must happen inside the click: later playback (after network calls) relies on it.
    audioCtxRef.current ??= unlockAudio()
    endedRef.current = false
    sessionStartRef.current = Date.now()
    setSessionStartedAt(sessionStartRef.current)
    setNow(Date.now())
    if (lastQuestion) await ask(lastQuestion)
    else await sendTurn(START_MESSAGE)
  }

  async function handleRepeat() {
    if (!question) return
    micRef.current?.stopRecording()
    await ask(question)
  }

  async function handleSkip() {
    stopAll()
    await sendTurn("skip")
  }

  const started = phase !== "idle" && sessionStartedAt != null
  const sessionElapsed = sessionStartedAt != null ? Math.max(0, now - sessionStartedAt) / 1000 : 0
  const questionElapsed =
    phase === "listening" && listenStartedAt != null ? Math.max(0, now - listenStartedAt) / 1000 : 0

  return (
    <div className="sticky bottom-0 z-10 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        {!started ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Voice mock interview</p>
              <p className="text-xs text-muted-foreground">
                Questions are read aloud and you answer by speaking. Pause for a few seconds or press
                “Done answering” when you finish. A {SESSION_LIMIT_S / 60}-minute round, up to{" "}
                {QUESTION_LIMIT_S / 60} minutes per answer.
              </p>
            </div>
            <Button onClick={handleStart}>
              <Mic className="size-4" />
              {lastQuestion ? "Resume interview" : "Start interview"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                {phase === "speaking" ? (
                  <Volume2 className="size-4 text-violet-500" />
                ) : phase === "thinking" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                  </span>
                )}
                {PHASE_LABEL[phase]}
              </span>
              <span className="tabular-nums">
                Answer {mmss(questionElapsed)} / {mmss(QUESTION_LIMIT_S)}
              </span>
              <span className="ml-auto tabular-nums">
                Session {mmss(sessionElapsed)} / {mmss(SESSION_LIMIT_S)}
              </span>
            </div>
            <div
              className={cn(
                "min-h-12 rounded-lg border px-3 py-2 text-sm",
                phase === "listening" ? "border-red-400/50" : "border-border/60 text-muted-foreground"
              )}
              aria-live="polite"
            >
              {transcript || (phase === "listening" ? "Start speaking…" : "")}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => void submitAnswer()} disabled={phase !== "listening"}>
                <Square className="size-3.5" />
                Done answering
              </Button>
              <Button size="sm" variant="outline" onClick={() => void handleRepeat()} disabled={!question || phase === "thinking"}>
                <RotateCcw className="size-3.5" />
                Repeat question
              </Button>
              <Button size="sm" variant="outline" onClick={() => void handleSkip()} disabled={phase === "thinking"}>
                <SkipForward className="size-3.5" />
                Skip
              </Button>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={finish}>
                <Flag className="size-3.5" />
                End interview
              </Button>
            </div>
          </>
        )}
        {/* The mic drives speech-to-text over Socket.IO; it is controlled by the panel. */}
        <div className="sr-only" aria-hidden>
          <RealtimeMic ref={micRef} onUpdateText={handleTranscript} />
        </div>
      </div>
    </div>
  )
}
