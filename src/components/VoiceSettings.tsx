"use client";

import { useState, useSyncExternalStore } from "react";
import { englishVoices, loadVoicePrefs, offeredVoices, pickVoice, saveVoicePrefs, type VoicePrefs } from "@/lib/voice";

const SAMPLE = "In the beginning God created the heavens and the earth.";
const RATES = [0.8, 0.9, 1, 1.1, 1.25];

// The device's voice list, kept in a small external store (it loads asynchronously in some browsers).
let cached: SpeechSynthesisVoice[] = [];
const EMPTY: SpeechSynthesisVoice[] = [];
function subscribe(cb: () => void) {
  if (!("speechSynthesis" in window)) return () => {};
  const update = () => { cached = englishVoices(window.speechSynthesis.getVoices()); cb(); };
  update();
  window.speechSynthesis.addEventListener("voiceschanged", update);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
}

export default function VoiceSettings() {
  const supported = useSyncExternalStore(() => () => {}, () => "speechSynthesis" in window, () => true);
  const voices = useSyncExternalStore(subscribe, () => cached, () => EMPTY);
  const [prefs, setPrefs] = useState<VoicePrefs>(() => (typeof window === "undefined" ? { voiceURI: null, rate: 1 } : loadVoicePrefs()));

  const current = pickVoice(voices, prefs);
  const update = (p: VoicePrefs) => { setPrefs(p); saveVoicePrefs(p); };
  const preview = () => {
    if (!current) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(SAMPLE);
    u.voice = current; u.lang = current.lang; u.rate = prefs.rate;
    window.speechSynthesis.speak(u);
  };

  if (!supported) return <section className="card"><h2>Read-aloud voice</h2><p className="muted small">This browser doesn&rsquo;t support read-aloud.</p></section>;

  // Until the device's voices load (always the case on the server), show a placeholder so the page hydrates cleanly.
  if (voices.length === 0) return <section className="card"><h2>Read-aloud voice</h2><p className="muted small">Loading this device&rsquo;s voices…</p></section>;

  const { voices: offered, allNatural } = offeredVoices(voices);
  return (
    <section className="card">
      <h2>Read-aloud voice</h2>
      <p className="small muted">Voices come from this device, so the choices differ between your phone and computer. Your choice is saved on this device.</p>
      <div className="field">
        <label htmlFor="voice">Voice</label>
        <select id="voice" value={current?.voiceURI ?? ""} onChange={(e) => update({ ...prefs, voiceURI: e.target.value || null })}>
          {offered.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name.replace(/\s*\(.*\)$/, "")} ({v.lang})</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="rate">Speed</label>
        <select id="rate" value={prefs.rate} onChange={(e) => update({ ...prefs, rate: Number(e.target.value) })}>
          {RATES.map((r) => <option key={r} value={r}>{r === 1 ? "Normal" : `${r}×`}</option>)}
        </select>
      </div>
      <button type="button" className="btn secondary" onClick={preview} disabled={!current}>▶ Preview</button>
      {!allNatural && (
        <p className="small muted" style={{ marginTop: ".75rem", marginBottom: 0 }}>
          This device has no natural-sounding voices yet, so the best available are listed. On a Mac or iPhone, download one in Settings → Accessibility → Spoken Content → Voices (choose an &ldquo;Enhanced&rdquo; or &ldquo;Premium&rdquo; English voice). On a computer, Chrome includes Google voices and Microsoft Edge includes &ldquo;Natural&rdquo; voices.
        </p>
      )}
    </section>
  );
}
