"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/lib/context/SocketProvider";
import { cn } from "@/lib/utils";

interface TranscriptionData {
  transcript: string;
  is_partial: boolean;
}

const SAMPLE_RATE = 44100;

interface RealtimeMicProps {
  onUpdateText: (text: string) => void;
  disabled?: boolean;
}

export const RealtimeMic = forwardRef(({ onUpdateText, disabled }: RealtimeMicProps, ref) => {
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  // We keep track of the transcriptions in state so we can pass them up
  const [transcription, setTranscription] = useState<string>("");
  const [partialTranscription, setPartialTranscription] = useState<string>("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const { isConnected, sendMessage, subscribeToEvent, unsubscribeFromEvent } = useSocket();

  const handleNotAllowedOrFound = useCallback((exception: DOMException): void => {
    toast.error("Microphone Access Error. Please check your browser permissions.");
  }, []);

  const pcmEncode = (input: Float32Array): ArrayBuffer => {
    let offset = 0;
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  const downsampleBuffer = (
    buffer: Float32Array,
    inputSampleRate: number = SAMPLE_RATE,
    outputSampleRate: number = 16000
  ): Float32Array => {
    if (outputSampleRate === inputSampleRate) {
      return buffer;
    }

    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);

      let accum = 0,
        count = 0;

      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }

      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }

    return result;
  };

  const startAudioRecording = useCallback(async (): Promise<void> => {
    if (disabled || !isConnected) {
      if (!isConnected) toast.error("Not connected to server yet.");
      return;
    }

    try {
      setLoading(true);
      setTranscription("");
      setPartialTranscription("");

      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/processor.js");

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const audioWorkletNode = new AudioWorkletNode(
        audioContext,
        "pcm-worklet-processor",
        {
          numberOfInputs: 1,
          numberOfOutputs: 0,
          outputChannelCount: [],
        }
      );

      processorRef.current = audioWorkletNode;

      audioWorkletNode.port.onmessage = (event) => {
        const inputData = new Float32Array(event.data);
        const downsampledBuffer = downsampleBuffer(inputData, SAMPLE_RATE, 16000);
        const pcmEncodedBuffer = pcmEncode(downsampledBuffer);
        sendMessage("AUDIO_DATA", pcmEncodedBuffer);
      };

      source.connect(audioWorkletNode);
      sendMessage("START_AUDIO", { message: "audio recording started" });
      setIsRecording(true);
    } catch (error) {
      if (error instanceof DOMException) {
        handleNotAllowedOrFound(error);
      } else {
        console.error("An unexpected error occurred:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [disabled, isConnected, handleNotAllowedOrFound, sendMessage]);

  const stopAudioRecording = useCallback((): void => {
    if (isRecording) {
      setIsRecording(false);

      sendMessage("END_AUDIO", { message: "audio recording stopped" });

      if (processorRef.current) {
        processorRef.current.port.onmessage = null;
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isRecording, sendMessage]);

  const resetTranscription = () => {
    setTranscription("");
    setPartialTranscription("");
  };

  const handleTranscribeStream = useCallback((transcribeData: TranscriptionData) => {
    if (transcribeData.is_partial) {
      setPartialTranscription(transcribeData.transcript);
    } else {
      setTranscription((prev) => prev + (prev ? " " : "") + transcribeData.transcript);
      setPartialTranscription("");
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      subscribeToEvent("TRANSCRIBE", handleTranscribeStream);
    }

    return () => {
      if (isConnected) {
        unsubscribeFromEvent("TRANSCRIBE", handleTranscribeStream);
      }
    };
  }, [isConnected, subscribeToEvent, unsubscribeFromEvent, handleTranscribeStream]);

  useEffect(() => {
    // Whenever transcription updates, push it back to the parent
    let textToUpdateValue = "";

    if (transcription !== "" && partialTranscription !== "") {
      textToUpdateValue = `${transcription} ${partialTranscription}`;
    } else if (transcription !== "" && partialTranscription === "") {
      textToUpdateValue = transcription;
    } else if (transcription === "" && partialTranscription !== "") {
      textToUpdateValue = partialTranscription;
    }

    onUpdateText(textToUpdateValue);
  }, [transcription, partialTranscription]);

  useImperativeHandle(ref, () => ({
    stopRecording: stopAudioRecording,
    resetTranscription: resetTranscription,
  }));

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudioRecording();
    };
  }, [stopAudioRecording]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={isRecording ? stopAudioRecording : startAudioRecording}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mb-0.5 relative",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted hover:text-foreground",
        isRecording && "bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 dark:bg-red-900/50 dark:text-red-400"
      )}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      title={isRecording ? "Stop recording" : "Start voice to text"}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          {isRecording && (
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400/50" />
          )}
          <Mic className={cn("size-4", isRecording && "relative z-10")} />
        </>
      )}
    </button>
  );
});

RealtimeMic.displayName = "RealtimeMic";
