"use client";

import { useState, useRef, useCallback } from "react";

interface MarketingRequestProps {
  onSubmit: (request: string) => void;
  loading: boolean;
}

export default function MarketingRequest({
  onSubmit,
  loading,
}: MarketingRequestProps) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const toggleVoice = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
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
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-violet-400">
          Marketing Request
        </h2>
        <p className="text-sm text-zinc-500">
          Describe what you want to promote, your goals, preferred content
          formats, or any specific campaign ideas.
        </p>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "I want to promote my new 30-day fitness challenge series. Looking for athletic wear and supplement brands. Open to product reviews, sponsored posts, and workout integration content."'
          rows={4}
          disabled={loading}
          className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 p-4 pr-14 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={toggleVoice}
          disabled={loading}
          className={`absolute right-3 top-3 rounded-lg p-2 transition ${
            listening
              ? "bg-red-600 text-white animate-pulse"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
          } disabled:opacity-50`}
          title={listening ? "Stop recording" : "Start voice input"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
            <path d="M6 10a1 1 0 0 0-2 0 8 8 0 0 0 7 7.93V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.07A8 8 0 0 0 20 10a1 1 0 1 0-2 0 6 6 0 0 1-12 0Z" />
          </svg>
        </button>
      </div>

      {listening && (
        <p className="flex items-center gap-2 text-sm text-red-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Listening... speak your marketing request
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="rounded-xl bg-violet-600 py-3 text-base font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Mistral is crafting your PR strategy...
          </span>
        ) : (
          "Generate PR Strategy"
        )}
      </button>
    </form>
  );
}
