# ElevenLabs Voice Input Integration

## Context

The MarketingRequest component (`src/components/MarketingRequest.tsx`) currently uses the browser's native Web Speech Recognition API for voice input. This has poor cross-browser support (mainly Chrome) and limited accuracy. We'll replace it with ElevenLabs Speech-to-Text API for reliable, high-quality transcription.

## Required API Key

**`ELEVENLABS_API_KEY`** — get it from https://elevenlabs.io/ (Settings > API Keys). Add to `.env.example` (uncommented) and `.env.local` (with real value).

## Changes

### 1. Update `.env.example`
Uncomment the `ELEVENLABS_API_KEY=` line so it's clear this is now a required key.

### 2. Create `POST /api/transcribe` route
**New file:** `src/app/api/transcribe/route.ts`

- Receives audio blob as `multipart/form-data`
- Forwards to ElevenLabs STT: `POST https://api.elevenlabs.io/v1/speech-to-text`
  - Header: `xi-api-key: <ELEVENLABS_API_KEY>`
  - Body: `FormData` with `file` (audio) and `model_id` (`scribe_v1`)
- Returns `{ text: "transcribed text" }`
- Error handling: 400 for missing audio, 500 for missing key, 502 for ElevenLabs failures

### 3. Update `MarketingRequest.tsx`
Replace `SpeechRecognition` with `MediaRecorder` + backend transcription:

**State changes:**
- Remove `recognitionRef` → add `mediaRecorderRef` and `chunksRef`
- Add `transcribing` boolean state (true while waiting for API response)

**New `toggleVoice` flow:**
1. Click mic → `navigator.mediaDevices.getUserMedia({ audio: true })`
2. Start `MediaRecorder` (prefer `audio/webm;codecs=opus`)
3. Collect chunks via `ondataavailable`
4. Click mic again → `recorder.stop()`
5. `onstop`: create Blob, POST to `/api/transcribe`, append result to textarea
6. Release mic via `stream.getTracks().forEach(t => t.stop())`

**UI updates:**
- Show animated bars while `listening` (recording)
- Show spinner + "Transcribing your recording..." while `transcribing`
- Disable mic button and submit button during `transcribing`

**Submit behavior:**
- If user submits while recording, stop recorder but don't submit yet (wait for transcription)
- Block submit during `transcribing` state

### 4. Clean up (optional)
Delete `src/types/speech.d.ts` — no longer needed since we're not using the SpeechRecognition API.

## Files Touched

| File | Action |
|------|--------|
| `.env.example` | Edit — uncomment `ELEVENLABS_API_KEY=` |
| `src/app/api/transcribe/route.ts` | Create — ElevenLabs STT proxy |
| `src/components/MarketingRequest.tsx` | Edit — MediaRecorder + fetch flow |
| `src/types/speech.d.ts` | Delete (optional) |

## Verification

1. Set `ELEVENLABS_API_KEY` in `.env.local`
2. Run `npm run dev`
3. Navigate to dashboard, select brands, open marketing request form
4. Click mic → speak → click mic again
5. Verify: spinner shows "Transcribing...", then text appears in textarea
6. Verify: typing + voice append works together
7. Verify: toast error appears if mic is denied or transcription fails
