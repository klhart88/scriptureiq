/**
 * Spoken questions via the browser's built-in speech recognition (free; no extra service).
 * Chrome and Edge use their maker's speech service; Safari uses Apple's. Firefox has none, so the mic is hidden there.
 */
type Alt = { transcript: string };
type Result = { isFinal: boolean; 0: Alt; length: number };
type ResultEvent = { resultIndex: number; results: { length: number; [i: number]: Result } };
export type Recognizer = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: ResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
};
type Ctor = new () => Recognizer;

function ctor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported() {
  return ctor() !== null;
}

/** Joins all results heard so far into one string (final and in-progress). */
export function transcriptOf(e: ResultEvent) {
  let text = "";
  for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
  return text.replace(/\s+/g, " ").trim();
}

export function speechError(code: string) {
  if (code === "not-allowed" || code === "service-not-allowed") return "Microphone access is blocked. Allow it for this site in your browser settings, then try again.";
  if (code === "no-speech") return "I didn't hear anything. Tap the mic and try again.";
  if (code === "audio-capture") return "No microphone was found on this device.";
  if (code === "network") return "Speech recognition needs an internet connection.";
  return "Speech recognition stopped unexpectedly. You can type your question instead.";
}

export function newRecognizer(): Recognizer | null {
  const C = ctor();
  if (!C) return null;
  const r = new C();
  r.lang = "en-US";
  r.continuous = true; // keep listening through pauses until the member taps Stop
  r.interimResults = true; // show words as they're heard
  return r;
}
