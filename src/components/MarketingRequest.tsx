"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface MarketingRequestProps {
  onSubmit: (request: string) => void;
  loading: boolean;
}

const progressSteps = [
  "Analyzing your profile...",
  "Matching brands to your niche...",
  "Crafting personalized pitches...",
  "Finalizing your strategy...",
];

export default function MarketingRequest({
  onSubmit,
  loading,
}: MarketingRequestProps) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Fake progress steps while loading
  useEffect(() => {
    if (!loading) {
      setProgressStep(0);
      return;
    }
    const interval = setInterval(() => {
      setProgressStep((s) =>
        s < progressSteps.length - 1 ? s + 1 : s
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const toggleVoice = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input isn't supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="mb-1 text-base font-bold text-white">
          What&apos;s your next campaign about?
        </h2>
        <p className="text-sm text-muted">
          Tell us what you want to promote and we&apos;ll write the pitches.
        </p>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "I want to promote my new 30-day fitness challenge. Looking for athletic wear and supplement brands..."'
          rows={3}
          disabled={loading}
          className="w-full resize-none rounded-2xl border border-white/[0.08] bg-surface-2 p-4 pr-14 text-sm text-white placeholder-subtle outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={toggleVoice}
          disabled={loading}
          aria-label={listening ? "Stop recording" : "Start voice input"}
          className={`absolute right-3 top-3 rounded-xl p-3 transition ${
            listening
              ? "bg-brand text-white shadow-lg shadow-brand/25"
              : "bg-white/[0.04] text-muted hover:bg-white/[0.08] hover:text-white"
          } disabled:opacity-50`}
        >
          {listening ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Listening indicator */}
      <AnimatePresence>
        {listening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-brand"
                  animate={{
                    height: [8, 20, 8],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-brand">
              Listening — speak your campaign idea
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit button or progress indicator */}
      {loading ? (
        <div className="space-y-3 rounded-2xl border border-white/[0.04] bg-surface-2 p-4">
          {progressSteps.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center">
                {i < progressStep ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-2 w-2 rounded-full bg-success"
                  />
                ) : i === progressStep ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-white/10" />
                )}
              </div>
              <span
                className={`text-sm ${
                  i <= progressStep ? "text-white" : "text-subtle"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-base font-semibold text-white transition hover:bg-brand/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Wand2 className="h-4 w-4" />
          Write my pitches
        </button>
      )}
    </form>
  );
}
