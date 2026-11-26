/**
 * Read-aloud voice preferences. Voices come from the device (browser speech synthesis), so the list and
 * quality differ by phone/computer; the choice is saved per device.
 */
export type VoicePrefs = { voiceURI: string | null; rate: number };

const KEY = "siq.voice";
const NATURAL = /(natural|neural|premium|enhanced|siri|online|wavenet|studio)/i;
const GOOD = /(google|samantha|ava|allison|zoe|evan|nathan|serena|daniel|karen|moira|aria|jenny|guy|libby|sonia)/i;

export function loadVoicePrefs(): VoicePrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<VoicePrefs>;
      return { voiceURI: p.voiceURI ?? null, rate: typeof p.rate === "number" ? p.rate : 1 };
    }
  } catch { /* storage unavailable */ }
  return { voiceURI: null, rate: 1 };
}

export function saveVoicePrefs(p: VoicePrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

/** Higher is more natural-sounding. Neural/"Natural"/"Enhanced" voices first, robotic defaults last. */
export function voiceScore(v: SpeechSynthesisVoice) {
  let s = 0;
  if (NATURAL.test(v.name)) s += 10;
  if (GOOD.test(v.name)) s += 4;
  if (/^en[-_]US/i.test(v.lang)) s += 2;
  else if (/^en/i.test(v.lang)) s += 1;
  if (/(compact|espeak|robot|novelty|whisper|bells|zarvox|trinoids|albert|bad news|good news|bahh|bubbles|cellos|jester|organ|superstar|wobble)/i.test(v.name)) s -= 20;
  return s;
}

export function englishVoices(all: SpeechSynthesisVoice[]) {
  return all.filter((v) => /^en/i.test(v.lang)).sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name));
}

/** The saved voice if it's on this device, otherwise the most natural English voice available. */
export function pickVoice(all: SpeechSynthesisVoice[], prefs: VoicePrefs) {
  const en = englishVoices(all);
  return (prefs.voiceURI && all.find((v) => v.voiceURI === prefs.voiceURI)) || en[0] || null;
}

export function isNatural(v: SpeechSynthesisVoice) {
  return voiceScore(v) >= 10;
}
