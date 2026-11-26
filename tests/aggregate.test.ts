import { test } from "node:test";
import assert from "node:assert/strict";
import { answerParts, citedDays, runAgent, testKey } from "../src/lib/aggregate-agent.ts";

test("citedDays finds [Day n] in order without repeats or out-of-range days", () => {
  assert.deepEqual(citedDays("Mercy [Day 2] and faith [Day 5], again [Day 2]; bad [Day 400]"), [2, 5]);
  assert.deepEqual(citedDays("No citations"), []);
});

test("answerParts turns citations into day links", () => {
  assert.deepEqual(answerParts("I saw mercy [Day 2]."), [{ text: "I saw mercy " }, { day: 2 }, { text: "." }]);
});

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("runAgent searches notes, sends results back, keeps only citations of days it read", async () => {
  const sent: { headers: Record<string, string>; body: { messages: { content: unknown }[]; model: string } }[] = [];
  const replies = [
    { content: [{ type: "tool_use", id: "t1", name: "search_notes", input: { query: "mercy" } }], stop_reason: "tool_use" },
    { content: [{ type: "text", text: "Justice and mercy sit together for me [Day 2]. I also trust more [Day 9]." }], stop_reason: "end_turn" },
  ];
  const fetchImpl = (async (_u: string, init: RequestInit) => {
    sent.push({ headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    return json(200, replies[sent.length - 1]);
  }) as unknown as typeof fetch;
  const tools: unknown[] = [];
  const r = await runAgent({
    question: "What about mercy?", key: "sk-ant-test", model: "claude-sonnet-5-5", system: "s", fetchImpl,
    callTool: async (name, input) => { tools.push([name, input]); return { text: "[Day 2] Genesis 4–7\nQ: q\nA: mercy", days: [2] }; },
  });
  assert.deepEqual(r, { answer: "Justice and mercy sit together for me [Day 2]. I also trust more.", cited: [2] });
  assert.deepEqual(tools, [["search_notes", { query: "mercy" }]]);
  assert.equal(sent[0].headers["x-api-key"], "sk-ant-test");
  assert.equal(sent[0].headers["anthropic-dangerous-direct-browser-access"], "true");
  assert.match(JSON.stringify(sent[1].body.messages[2]), /tool_result.*t1/);
});

test("errors become plain messages", async () => {
  const f = (status: number, msg = "x") => (async () => json(status, { type: "error", error: { message: msg } })) as unknown as typeof fetch;
  assert.match((await testKey("k", "m", f(401)) as { error: string }).error, /didn't accept/);
  assert.match((await testKey("k", "m", f(400, "Your credit balance is too low")) as { error: string }).error, /out of credits/);
  assert.deepEqual(await testKey("k", "m", (async () => json(200, {})) as unknown as typeof fetch), { ok: true });
  const offline = (async () => { throw new Error("net"); }) as unknown as typeof fetch;
  assert.match((await runAgent({ question: "q", key: "k", model: "m", system: "s", fetchImpl: offline, callTool: async () => ({ text: "", days: [] }) }) as { error: string }).error, /Couldn't reach/);
});
