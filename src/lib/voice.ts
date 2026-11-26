/**
 * Read-aloud voice preferences. Voices come from the device (browser speech synthesis), so the list and
 * quality differ by phone/computer; the choice is saved per device.
 */
export type VoicePrefs = { voiceURI: string | null; rate: number };

const KEY = "siq.voice";
// Free, good-quality voices: Google (Chrome), Microsoft "Natural"/"Online" (Edge), and Apple
// "Enhanced"/"Premium" voices once downloaded on a Mac or iPhone. Everything else sounds robotic.
const NATURAL = /(google|natural|neural|premium|enhanced|online|wavenet|studio)/i;
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
  if (/(compact|espeak|robot|novelty|whisper|bells|boing|zarvox|trinoids|albert|bad news|good news|bahh|bubbles|cellos|jester|organ|superstar|wobble|deranged|hysterical|pipe organ)/i.test(v.name)) s -= 20;
  return s;
}

export function englishVoices(all: SpeechSynthesisVoice[]) {
  return all.filter((v) => /^en/i.test(v.lang)).sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name));
}

/**
 * The voices worth offering: the natural-sounding ones. If a device has none, the three best of what
 * it does have, so read-aloud still works.
 */
export function offeredVoices(all: SpeechSynthesisVoice[]) {
  const en = englishVoices(all);
  const natural = en.filter(isNatural);
  return { voices: natural.length ? natural : en.filter((v) => voiceScore(v) > -20).slice(0, 3), allNatural: natural.length > 0 };
}

/** The saved voice if it's on this device, otherwise the most natural English voice available. */
export function pickVoice(all: SpeechSynthesisVoice[], prefs: VoicePrefs) {
  const { voices } = offeredVoices(all);
  return (prefs.voiceURI && voices.find((v) => v.voiceURI === prefs.voiceURI)) || voices[0] || null;
}

export function isNatural(v: SpeechSynthesisVoice) {
  return voiceScore(v) >= 10;
}
