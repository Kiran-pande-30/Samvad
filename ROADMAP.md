# Samvad Roadmap

Samvad (संवाद, "dialogue") teaches Marathi to Hindi speakers. Stack: Next.js 16 + Supabase (Postgres, Auth, Storage).
Plan agreed on 2026-09-26. Tick tasks off (`- [x]`) as they are completed.

## How we work

- **Kiran builds the backend** (schema, migrations, RLS, SQL, API routes, scripts) to learn it. For these tasks Claude explains the concept first, gives hints, and reviews the code — it does not write it unless asked.
- **Claude builds the frontend** (tasks marked 🤖), following the style rules and design system in `CLAUDE.md`. Kiran reviews how it uses the backend.
- Tasks are 30–60 minutes each. One task at a time; commit when done.
- Stuck more than an hour → ask Claude to explain the concept, not write the code.
- New ideas go into **Later**, not into the current week.

## Current state (2026-10-04)

- 10 modules (9 shown — "First Words & Greetings" is hidden in `ModuleList.tsx`), 61 lessons, 264 phrases, 586 lesson steps (`fill_blank`, `match`, `recall`, `arrange`, `conversation`, `context`).
- Tables: `language_pairs`, `modules`, `lessons`, `phrases`, `lesson_steps`, `step_attempts`, `user_progress` (+ `started_at`), `profiles`, `audio_clips`, `conversation_scenarios`. Storage bucket `audio`.
- DB functions: `start_lesson`, `record_attempt`, `complete_lesson` (scores from saved answers).
- Audio for modules 1–2 (111 clips). Every answer is saved as it's given. Lessons can be resumed.
- Tests: `npm test` (node:test via tsx, `lib/**/*.test.ts`).
- A few friends use it (since Oct 2026). Not chasing more users yet — their feedback decides what gets fixed. Real users now have data at stake, so test migrations carefully and don't wipe tables.

## Decisions

- **Text-to-speech provider:** Sarvam AI (`bulbul:v3`, speaker `ishita`, `language_code: mr-IN`) — no card needed, free signup credit covers all 264 phrases (~3,280 characters, ~₹10). Free alternatives considered: AI4Bharat Indic Parler-TTS (runs locally, Apache 2.0), Azure for Students.
- **Audio:** generate once with a script, upload to Supabase Storage bucket `audio` (public read, no public write), and record each file in the `audio_clips` table keyed by `(text, model, speaker)` — one table for words and sentences, so the same sentence is generated once. File name = hash of model + speaker + text, so re-runs skip finished texts and edited text gets new audio. Upload with a long cache time. **No Redis** — the stored file plus CDN/browser caching is the cache.
- **Word progress:** new table `user_phrase_mastery` (user_id, phrase_id, box 0–5, times_seen, times_correct, last_seen_at, next_due_at), shared by the dictionary and daily practice.
- **Review schedule:** Leitner boxes, intervals 1 / 3 / 7 / 14 / 30 days. Clean retire → box + 1; retire with mistakes → back to box 1.
- **Daily practice:** 10 active cards. A card retires after **3 correct in a row** (a wrong answer resets the count and moves the card 3–4 places back); the next word from the pool replaces it. The 3 correct answers get harder: Marathi→Hindi choice, Hindi→Marathi choice, then typed/arranged recall. Pool order: due words → weak words → new words. Wrong options come from the same module with similar length. Session ends at `daily_goal` retired words (default 15).
- **`step_attempts`:** `step_id` becomes nullable and a `source` column (`'lesson'` / `'practice'`) is added so practice answers can be stored.
- **Answers are saved the moment they're given** (`record_attempt`), never trusted from the browser at the end. `complete_lesson` scores from saved answers and refuses unfinished lessons. A run = answers since `user_progress.started_at`; the resume point is derived from them (`remainingStepIds`), not stored.
- **Shown modules:** "First Words & Greetings" is hidden (overlaps modules 1–2) until a content review.
- **AI conversation (test version, free stack, 2026-10-26):** listening = the browser's speech recognition (`mr-IN`, Chrome), the AI partner = Gemini Flash on Google's free tier (called only from the server, key in `GEMINI_API_KEY`), speaking = the phone's own Marathi voice with the reply always shown as text. No paid APIs, no signup credits. Every logged-in user can use it — no tester list; when Gemini's free limit runs out (429) the screen says "Try again after some time". About 12 turns per conversation. Conversations aren't saved yet. Google may use free-tier prompts for training, so tell users not to share anything personal.
- **Scenarios:** one row per scenario in `conversation_scenarios` (who the AI plays, setting, opening line, goals, key phrases). The rules shared by every scenario — JSON reply shape, transliteration in the app's style, correct only real mistakes, respectful आप Hindi, gender-neutral "अहो" — live in the API route's code, not the table.

## Now

### Week 1 — Audio, one lesson at a time (start with lesson 1 "Pronouns And Being")

Voice whole correct sentences, never wrong options, and never play audio that gives away the answer before Check.

- [x] 1. Sign up at Sarvam; `SARVAM_API_KEY` in `.env.local`; `.gitignore` already covers it (checked)
- [x] 2. Pick a speaker → `ishita` (`bulbul:v3`)

**A. Migration**
- [x] A1. Design `audio_clips` (text, model, speaker, storage_path, created_at)
- [x] A2. Migration `create_audio_clips`: unique `(text, model, speaker)`, unique `storage_path`
- [x] A3. RLS: public read only; no write policies (the script uses the service-role key, which bypasses RLS)

**B. Storage**
- [x] B1. Create bucket `audio` (public read); confirm an anon-key upload fails
- [x] B2. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`; learn why it must stay server-only

**C. Script — `scripts/generate-audio.ts <lessonId>`**
- [x] C1. SQL: collect the lesson's texts (phrase words, completed `fill_blank` sentences, conversation `speaker_says`, conversation/arrange correct answers); print them
- [x] C2. Dedupe, strip a trailing `.` (keep `?`), skip texts already in `audio_clips`
- [x] C3. Generate one text with Sarvam; decode base64; save locally
- [x] C4. Upload as `mr/<hash>.wav` with a long cache time; insert the `audio_clips` row
- [x] C5. Run for all of lesson 1; run again → generates nothing

**D. UI**
- [x] D1. Lesson data function returns a `{ text → audio URL }` map (one `.in('text', texts)` query); fix `transliration` typo in `lib/types.ts`
- [x] D2. 🤖 Play buttons: intro word list, conversation speaker line, answer feedback sheet (after Check)
- [x] D3. Test modules 1–2 on phone (play buttons, auto-play after Check)
  - Audio generated for modules 1–2 only (16 lessons, 111 clips, ₹3.60); later modules stay silent until learners reach them — generate a module at a time then (~₹1–2 each). Billing verified on the dashboard: exactly ₹30 per 10K characters, no per-request minimum; 429 rate-limit errors aren't charged.

### Resume lessons (before Week 2)

Leave a lesson mid-way → home shows "Continue learning · Step 4 of 11" → reopening starts at the step you left. Every answer is saved the moment it's given (`step_attempts`), and the resume point is *worked out* from this run's answers (`attempted_at >= user_progress.started_at`) — no position column. Steps answered wrong go to the end, exactly as `LessonEngine` does.

- [x] R1. `user_progress.started_at` + `start_lesson` sets it when a new run begins (first open, or replaying a completed lesson); resuming keeps it
- [x] R2. DB function `record_attempt(step_id, is_correct)`: saves one answer for `auth.uid()`, only for a lesson the user has started
- [x] R3. `complete_lesson` stops trusting answers sent by the browser; scores from this run's saved answers instead
- [x] R4. TypeScript function: remaining queue from this run's answers (+ a few tests)
- [x] R5. `getLessonDetail` returns the remaining queue; `getProgress` says which lessons are resumable and how far along
- [x] R6. 🤖 `LessonEngine` starts from the remaining queue (saving each answer on Check is done)
- [x] R7. 🤖 Home: "Continue learning · Step 4 of 11"

R2, R3 and R6 must ship together — otherwise answers are saved twice or not at all.

### Also shipped (outside the plan)

- [x] Answer options shuffled every time (correct answer was first in up to 84% of steps)
- [x] Log out (Server Action), ✕ to leave a lesson, hint behind "Need a hint?", 44px answer chips
- [x] Login/signup in coral with friendly empty-form errors; profile redesign; no tab bar for logged-out visitors; page title "Samvad"
- [x] Supabase security warnings fixed (function search_path, `handle_new_user` execute rights)
- [x] Vercel Analytics via `AnalyticsGate` (own test accounts excluded with `NEXT_PUBLIC_ANALYTICS_EXCLUDED_USERS`)
- [ ] "Forgot password?" flow (Vedant's feedback) — `/forgot-password`, `/reset-password`, `next` param in `/auth/callback`, new `/auth/confirm` (token_hash). Built; tick once tested end to end on a phone. Optional: switch the Supabase "Reset password" email template to `/auth/confirm` so links work in any browser.
- [ ] Answer sheet shows meanings (Alok's feedback) — Hindi meaning of the full correct answer on right and wrong attempts, plus "You picked X, which means …" when the wrong option is a known phrase (`stepMeanings` in `lib/data/lessons.ts`). Tick once checked on a phone. Explaining *why* an option is wrong is still open (content work).

### Hindi-first questions — trial on "Words to Get Started" (before Week 2)

Samvad teaches Marathi *through Hindi*, but a check on 2026-10-14 found 433 of 586 step prompts (74%) are English-only and 109 more mix English and Marathi. Match options, hints, context cards, lesson intros and UI labels are English too. Only `phrases.source` and the answer-sheet meanings are Hindi. Try Hindi on one module first, then decide the rollout.

- `phrases.source` holds the Hindi for the *word* only, not the full sentence, so sentence prompts need translating (by hand or Claude, then reviewed), not a template.
- Code treats "Devanagari with no Latin letters" as Marathi (`isMarathi` in `lib/data/lessons.ts`, and the audio script). A Hindi prompt with Marathi inside it would get voiced as Marathi. That's safe for this module, where match prompts are already pure Marathi, but fix it before the rollout.

- [ ] H1. 🤖 Draft Hindi for all 77 steps: prompts, match options, hints, context cards (`drafts/hindi-prompts-words-to-get-started.md`)
- [ ] H2. Review the draft: natural everyday Hindi, `तुम`/`आप` matching Marathi `तू`/`तुम्ही`, nothing that gives away the answer by accident
- [ ] H3. Migration: back up the current English (`prompt`, `hint`, `data`, `correct_answer`) before touching anything, e.g. a `lesson_steps_en` copy table, so the change can be undone
- [ ] H4. Apply the reviewed draft to the module's steps; for match steps, `data.options` and `correct_answer` change together. Check a lesson still completes and scores.
- [ ] H5. 🤖 Make Hindi and Marathi easy to tell apart on a question (e.g. small "हिंदी" label or gray Hindi), and decide about Hindi button labels ("आगे बढ़ें", "शाबाश!")
- [ ] H6. Try it on a phone and with one friend → decide: Hindi only or Hindi + English on tap; then plan the other 9 modules (fix `isMarathi` first)

### AI conversation — test version (first scenario: bargaining with an auto driver)

Learner opens a scenario → sees the scene, goals and helpful phrases → the driver speaks first → learner holds the mic (or types) → driver replies, goals tick off, mistakes get a gentle correction → summary at the end. Decisions are under **Decisions** above.

**A. Check it can work**
- [x] AC1. Speech test: 20 Marathi sentences on the Web Speech demo (मराठी) in Chrome — caught almost every word (tested on Mac; try 5 on an Android phone before the screens)
- [x] AC2. Gemini key from AI Studio in `.env.local` (`GEMINI_API_KEY`); check the real daily limit at aistudio.google.com/rate-limit
- [x] AC3. Tune the auto-driver prompt by hand in AI Studio (3 rounds: transliteration style, no over-correcting, neutral "अहो", confirm the price, आप Hindi) — final prompt saved

**B. Scenario data**
- [x] AC4. Migration `create_conversation_scenarios`: jsonb `goals` / `key_phrases` / `opening_line` with type checks, unique `slug`, `module_id` → `on delete set null`, public read only
- [x] AC5. Insert `auto-bargain`; checked: anyone can read, a logged-in user can't insert, a duplicate slug fails
- [x] AC6. Types in `lib/types.ts` (`ConversationScenario`, `ScenarioGoal`, `ScenarioPhrase`, `ConversationReply`, …); `getScenarios()` and `getScenario(slug)` in `lib/data/scenarios.ts`

**C. API route — `POST /api/conversation`** (built by Claude on request, 2026-10-26 — worth reading through to learn from)
- [x] AC7. Login check; validate the body (slug, history, goals so far, the learner's text); load the scenario; enforce 12 turns (`MAX_CONVERSATION_TURNS`)
- [x] AC8. Prompt = shared rules + scenario fields (`lib/data/conversation.ts`); Gemini with a JSON response schema. Models tried in order: `gemini-flash-latest` → `gemini-flash-lite-latest` → `gemini-3.5-flash-lite`. Goals only ever add up; `finished` = all goals done (worked out on the server). Tested with 3 real turns.
- [ ] AC9. Errors: Gemini 429/503/timeout on every model → our 429 ("Try again after some time"); anything else → 502. Built and tested; **still to do: add `GEMINI_API_KEY` to Vercel.** Note: on 2026-10-26 Flash was overloaded all day and Lite replies took 24–48s.

**D. Screens** — built and type-checked, not yet checked in a logged-in browser; tick each once tried on a phone
- [ ] AC10. 🤖 `/conversations` list of scenario cards (+ empty state)
- [ ] AC11. 🤖 `/conversations/[slug]` intro: scene, goals, helpful phrases, privacy note, Start
- [ ] AC12. 🤖 Chat: bubbles (Marathi, transliteration, Hindi on tap), hold-to-talk (`mr-IN`), typing fallback, goal chips, correction note, reply spoken with the phone's Marathi (or Hindi) voice
- [ ] AC13. 🤖 End summary (goals, phrases to remember) + Practise again
- [ ] AC14. 🤖 Waiting dots + "Still thinking…" after 8s, "busy — try again after some time", general error; the learner's line is put back to resend
- [ ] AC15. 🤖 "Practise speaking" card at the top of home; tab bar hidden inside a conversation

**E. Try it**
- [ ] AC16. Test on 2–3 friends' phones (Android and iPhone); note what breaks
- [ ] AC17. Add the next scenario as one more row (vegetable seller or kirana)

### Week 2 — Word progress and dictionary

Every answer is now saved as it happens, so the backfill (task 25) also counts lessons left half-way.

- [ ] 18. On paper: `user_phrase_mastery` columns and why each exists
- [ ] 19. Migration: table with two-column key, foreign keys `on delete cascade`
- [ ] 20. Check `box` between 0 and 5; index on `(user_id, next_due_at)`
- [ ] 21. RLS on; read rule for own rows
- [ ] 22. Insert/update rules; test a second user sees nothing
- [ ] 23. `SELECT` attempts and correct answers per user + phrase from `step_attempts`
- [ ] 24. Write down the starting-box rule based on accuracy
- [ ] 25. Backfill with `INSERT … SELECT … ON CONFLICT DO NOTHING`; check counts
- [ ] 26. Types in `lib/types.ts`: `UserPhraseMastery`, `DictionaryEntry`
- [ ] 27. SQL: phrases from lessons the user completed
- [ ] 28. `LEFT JOIN` progress; understand why `LEFT`
- [ ] 29. `getDictionary(userId)` in `lib/data/`; log it from a page
- [ ] 30. 🤖 Dictionary list with strength bars
- [ ] 31. 🤖 Search, filters, detail sheet; trace the data flow

### Week 3 — Daily practice backend

- [ ] 32. Write the Leitner rules in plain words
- [ ] 33. `nextReview(box, hadMistake, now)` pure function
- [ ] 34. 4 tests with `node:test` via `tsx`
- [ ] 35. Decide how "due" works with timezones; write it down
- [ ] 36. Selection query part 1: due words
- [ ] 37. Parts 2–3: weak words, new words
- [ ] 38. Combine with `ORDER BY CASE … LIMIT 30`; check `EXPLAIN` uses the index
- [ ] 39. Wrong-option query: 3 random phrases, same module, similar length, never the answer
- [ ] 40. Types: `PracticeCard`, `PracticeSession`
- [ ] 41. `GET /api/practice/session`: login check, queries, JSON
- [ ] 42. Migration: `step_attempts.step_id` nullable + `source` column
- [ ] 43. `complete_practice(jsonb)` part 1: insert attempts
- [ ] 44. Part 2: upsert progress with new box and due date
- [ ] 45. Test with fake input; force an error and confirm nothing saved
- [ ] 46. `POST /api/practice/complete`: validate body, call the function

### Week 4 — Finish and use it

- [ ] 47. 🤖 Practice screen: queue + 3 card types
- [ ] 48. 🤖 Results screen; explain the queue logic back in 3 sentences
- [ ] 49. Practice completion updates the streak (reuse `effectiveStreak`)
- [ ] 50. Count retired words toward `daily_goal`; include in response
- [ ] 51. "Words due today" query in `lib/data/`
- [ ] 52. 🤖 "12 words due" card on the home screen
- [ ] 53. Use it for a day; note bugs; fix one
- [ ] 54. Same
- [ ] 55. Same

## Later (not now)

- **Hindi↔Marathi similarity tags** — tag each phrase same / similar / different / false friend (one-time Claude batch, ~₹10, then native review); show as dictionary badges; practice weights different and false-friend words.
- **Home-screen install (PWA) + daily reminders** — web push at the user's timezone; iPhones only allow it once installed.
- **Stories** — scripted two-voice dialogues (rickshaw, market) where the learner picks replies at key moments. No running cost; tests interest before AI conversation.
- **AI voice conversation, paid version** — a free test version is now under **Now** (AI conversation — test version). The original paid plan, kept for if the free one outgrows Gemini's limits: turn-by-turn: learner holds mic → speech-to-text → Claude (scenario prompt with the learner's known phrases, returns reply + correction + goals as JSON) → text-to-speech; both sides shown as transcript bubbles. Hold-to-talk, not silence detection. Biggest risk: speech-to-text on Hindi-accented, broken Marathi — test providers on ~20 real clips before building. Rough cost with Sonnet 5: ₹8.5–16 per 12-turn session including GST and forex fees (Haiku 4.5 ₹5.5–10, Opus 5 ₹19–32). About 4–6 weeks of work. Scenarios map to modules: Out And About → rickshaw, Talk About Food → vegetable seller, Feeling Unwell → pharmacy, Shops And Errands → kirana.
- **"Report a problem" button** — friends can message directly for now; add one if feedback gets lost.
- **Signed-in users opening `/login` land on `/profile`** — should probably go home (`/`); one line in `lib/supabase/middleware.ts`.
- **Upgrade Node 20 → 22** — Node 20 is past end-of-life; also lets `scripts/generate-audio.ts` drop the `ws` workaround.
- **Decide what "daily goal" means** — profile shows "1 lesson / day", the practice plan counts retired words. Settle before Week 3.
- **"First Words & Greetings"** — hidden for now; decide after a native-speaker content review (also: a match step says Suresh greets with नमस्कार but the answer is नमस्ते).
- **Native-speaker review of modules 1–2** — 586 hand-made steps are unverified.
- **Landing page** — use the stronger tagline "Learn the language of your new home"; the illustration says नमस्ते, Marathi is नमस्कार.
- **Lesson page as a Server Component** — load the lesson directly instead of fetching `/api/lessons` in `useEffect` (removes "Loading lesson…").
- **Lesson-complete celebration + home "today" section** — words learned, accuracy, streak; streak/goal/continue at the top of home. Build alongside daily practice.
- **Dark mode** — ~122 hardcoded light colours across 17 files today; new screens should use theme tokens (`bg-background`, `text-foreground`, `border-border`) so a later pass is cheap.
