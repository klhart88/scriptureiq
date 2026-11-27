import Link from "next/link";
import { requireMember } from "@/lib/data";

export const metadata = { title: "How to use ScriptureIQ" };

/** The member guide (Settings → How to use ScriptureIQ). Plain, task-based help for members. */
export default async function GuidePage() {
  await requireMember();
  return (
    <article className="guide">
      <div className="eyebrow"><Link href="/settings">Settings</Link></div>
      <h1>How to use ScriptureIQ</h1>
      <p className="muted">
        ScriptureIQ walks you through BibleProject&rsquo;s 358-day reading plan, <em>One Story That Leads to Jesus</em>, one day at a
        time: read the passage, reflect on three questions, and talk it over with your group. Tap a topic to open it.
      </p>

      <details className="card" open>
        <summary>Getting started</summary>
        <ol>
          <li>Create an account with your name, email and a password of at least 8 characters, then open the confirmation email and tap the link.</li>
          <li>Choose your <strong>plan start date</strong>. That date is Day 1, and each day after follows in order. Started earlier? Pick the earlier date and ScriptureIQ opens on the right day.</li>
          <li><strong>Add it to your home screen</strong> so it opens like an app. iPhone (Safari): tap Share, then Add to Home Screen. Android (Chrome): tap the ⋮ menu, then Add to Home screen or Install app.</li>
        </ol>
      </details>

      <details className="card">
        <summary>The Know Him More home page</summary>
        <ul>
          <li>ScriptureIQ opens on the home page for your study, <em>Know Him More</em>.</li>
          <li>Tap the large <strong>Day … of 358</strong> button to open today&rsquo;s reading. It shows <strong>Completed ✓</strong> once you&rsquo;ve finished the day.</li>
          <li>Swipe the strip of days at the bottom to see every day with its date (today is centred and highlighted, finished days are green). Tap any day to open it.</li>
          <li>From any other screen, tap <strong>ScriptureIQ</strong> at the top to come back here.</li>
        </ul>
      </details>

      <details className="card">
        <summary>Your daily reading (Today)</summary>
        <p>Each day has three steps, shown at the top of the screen. Move between them by tapping a step.</p>
        <ol>
          <li><strong>Before you read:</strong> where the story is, what to watch for, and a BibleProject video when there is one.</li>
          <li><strong>Reading:</strong> the day&rsquo;s passages in the NIV. Tap <strong>▶ Listen</strong> to hear them read aloud with the words highlighted as you go.</li>
          <li><strong>Reflections:</strong> the day&rsquo;s three questions, which save to your Study Notes.</li>
        </ol>
        <p>The bar above the reading shows your progress:</p>
        <ul>
          <li><span className="swatch navy" /> a navy line marks where you are;</li>
          <li><span className="swatch light" /> light green means read, whether you listened or spent time on it;</li>
          <li><span className="swatch solid" /> solid green means that passage is complete.</li>
        </ul>
        <p>You can also open a passage on Bible.com and tap <strong>Mark as read</strong>. Use the links at the bottom to go to the previous or next day.</p>
      </details>

      <details className="card">
        <summary>Study Notes</summary>
        <ul>
          <li>Each day loads three questions: <strong>Observe</strong>, <strong>Connect</strong> and <strong>Respond</strong>. Type your answers; they save automatically.</li>
          <li>Use <strong>Add my own question</strong> for anything else you want to explore. Reorder questions with the arrows, or remove them with ✕.</li>
          <li>Browse past notes by day or by book from the Study Notes tab.</li>
          <li>Your notes are private. Only you can see them.</li>
        </ul>
      </details>

      <details className="card">
        <summary>Discuss It (groups)</summary>
        <ul>
          <li><strong>Join a group</strong> by opening the invite link someone sent you, then tapping Join group.</li>
          <li><strong>Start a group</strong> from Discuss It, then copy its invite link and send it to people you want in it.</li>
          <li>Each plan day has its own thread. Open <strong>Today&rsquo;s thread</strong>, or any recent conversation, and post a reply. You can edit or delete your own posts.</li>
          <li><strong>Share a copy</strong> of a note answer from Study Notes to post it in a group. Your private note stays private; the answer then shows &ldquo;✓ Shared with&rdquo; the group and the date.</li>
          <li>Group owners can make a new invite link (current members stay), remove members, or delete the group.</li>
        </ul>
      </details>

      <details className="card">
        <summary>Study Aggregate (optional)</summary>
        <p>
          Ask questions about your own notes, such as &ldquo;What have I learned about God&rsquo;s mercy?&rdquo; Claude reads only what you&rsquo;ve
          written and drafts an answer in your own voice, with links to the days it drew from. The more notes you write, the
          better the answers get.
        </p>
        <ol>
          <li>It uses your own Anthropic account, so you control it and pay Anthropic directly, typically a few cents a question. At <strong>console.anthropic.com</strong>, create an API key and set a monthly spending limit.</li>
          <li>In <Link href="/settings#aggregate">Settings → Study Aggregate</Link>, paste the key and tap <strong>Save and test</strong>. The key is saved only on that device, so add it on each phone or computer you use.</li>
          <li>On the Aggregate tab, type a question and tap <strong>Ask</strong>, or tap <strong>🎤 Speak</strong>, say your question, and tap <strong>Stop and ask</strong>. Speak works in Chrome, Edge and Safari.</li>
        </ol>
        <p className="small muted">Speak in a quiet place: background noise can add stray words. Your past questions are saved privately, and you can delete any of them.</p>
      </details>

      <details className="card">
        <summary>Calendar and catching up</summary>
        <p>The Calendar shows all 358 days. Completed days are green and today is outlined. If you&rsquo;ve missed days, they&rsquo;re listed under <strong>Catch up</strong>; tap one to read it. Your notes and progress always stay with their plan day.</p>
      </details>

      <details className="card">
        <summary>Settings</summary>
        <ul>
          <li><strong>Your name</strong> is what group members see.</li>
          <li><strong>Plan start date</strong> sets which day is today.</li>
          <li><strong>Read-aloud voice</strong>: pick a voice and speed, and tap Preview. Voices come from your device; the Google, Natural, Enhanced or Premium ones sound most natural. On iPhone or Mac you can download more in system settings (Accessibility → Spoken Content).</li>
          <li><strong>Change password</strong>, <strong>Sign out</strong>, and <strong>Delete my account</strong>, which permanently removes your account and everything in it.</li>
        </ul>
      </details>

      <details className="card">
        <summary>If something isn&rsquo;t working</summary>
        <dl className="faq">
          <dt>The confirmation or reset email didn&rsquo;t arrive.</dt>
          <dd>Check your spam folder, wait a few minutes and try again. Still nothing? Ask the person who invited you.</dd>
          <dt>I forgot my password.</dt>
          <dd>On the sign-in page, tap Forgot password and open the link on the same device.</dd>
          <dt>It&rsquo;s showing the wrong day.</dt>
          <dd>Check your plan start date in Settings.</dd>
          <dt>An invite link doesn&rsquo;t work.</dt>
          <dd>The group owner may have made a new link. Ask them for the current one.</dd>
          <dt>A page says &ldquo;Something didn&rsquo;t load.&rdquo;</dt>
          <dd>Tap Reload page. This can happen right after ScriptureIQ is updated.</dd>
          <dt>Study Aggregate shows a key or credit message.</dt>
          <dd>Follow what it says: check your key in Settings, or add credits or raise your limit in the Anthropic Console.</dd>
          <dt>There&rsquo;s no Speak button, or the microphone is blocked.</dt>
          <dd>Use Chrome, Edge or Safari (Firefox doesn&rsquo;t support it), and allow the microphone for this site in your browser settings.</dd>
        </dl>
      </details>

      <details className="card">
        <summary>Your privacy</summary>
        <p>Your notes, reading progress and Study Aggregate answers are private to your account. Only what you post or share in a group is seen, and only by that group. Your Anthropic key never leaves your device except to go to Anthropic.</p>
      </details>

      <p className="small muted">Reading plan, videos and links: BibleProject, <em>One Story That Leads to Jesus</em>. BibleProject is the author and owner of this content.</p>
    </article>
  );
}
