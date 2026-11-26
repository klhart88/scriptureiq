import { test } from "node:test";
import assert from "node:assert/strict";
import { offeredVoices, pickVoice } from "../src/lib/voice.ts";

const v = (name: string, lang: string) => ({ name, lang, voiceURI: name, default: false, localService: true }) as SpeechSynthesisVoice;
// The voices Chrome on a Mac listed in testing.
const macChrome = ["Google US English|en-US", "Samantha|en-US", "Daniel|en-GB", "Google UK English Female|en-GB", "Google UK English Male|en-GB",
  "Karen|en-AU", "Moira|en-IE", "Boing|en-US", "Eddy (English (United States))|en-US", "Fred|en-US", "Grandma (English (United States))|en-US",
  "Junior|en-US", "Ralph|en-US", "Reed (English (United States))|en-US", "Google español|es-ES"].map((s) => v(...(s.split("|") as [string, string])));

test("only the Google voices are offered on Chrome for Mac", () => {
  const { voices, allNatural } = offeredVoices(macChrome);
  assert.equal(allNatural, true);
  assert.deepEqual(voices.map((x) => x.name).sort(), ["Google UK English Female", "Google UK English Male", "Google US English"]);
});

test("Edge Natural and Apple Enhanced voices count as natural", () => {
  const { voices } = offeredVoices([v("Microsoft Aria Online (Natural) - English (United States)", "en-US"), v("Ava (Enhanced)", "en-US"), v("Fred", "en-US")]);
  assert.equal(voices.length, 2);
});

test("a device with no natural voices still gets the best three, without novelty voices", () => {
  const { voices, allNatural } = offeredVoices([v("Samantha", "en-US"), v("Daniel", "en-GB"), v("Boing", "en-US"), v("Fred", "en-US"), v("Karen", "en-AU"), v("Bubbles", "en-US")]);
  assert.equal(allNatural, false);
  assert.equal(voices.length, 3);
  assert.ok(!voices.some((x) => /boing|bubbles/i.test(x.name)));
});

test("a saved voice that is no longer offered falls back to the best one", () => {
  assert.equal(pickVoice(macChrome, { voiceURI: "Fred", rate: 1 })?.name, "Google US English");
  assert.equal(pickVoice(macChrome, { voiceURI: "Google UK English Male", rate: 1 })?.name, "Google UK English Male");
});
