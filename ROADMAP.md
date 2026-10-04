# Samvad Roadmap

Samvad (संवाद, "dialogue") teaches Marathi to Hindi speakers. Stack: Next.js 16 + Supabase (Postgres, Auth, Storage).
Plan agreed on 2026-09-26. Tick tasks off (`- [x]`) as they are completed.

## How we work

- **Kiran builds the backend** (schema, migrations, RLS, SQL, API routes, scripts) to learn it. For these tasks Claude explains the concept first, gives hints, and reviews the code — it does not write it unless asked.
- **Claude builds the frontend** (tasks marked 🤖), following the style rules and design system in `CLAUDE.md`. Kiran reviews how it uses the backend.
- Tasks are 30–60 minutes each. One task at a time; commit when done.
- Stuck more than an hour → ask Claude to explain the concept, not write the code.
- New ideas go into **Later**, not into the current week.

## Current state (2026-09-26)

- 10 modules, 61 lessons, 264 phrases, 586 lesson steps (`fill_blank`, `match`, `recall`, `arrange`, `conversation`, `context`).
- Tables: `language_pairs`, `modules`, `lessons`, `phrases`, `lesson_steps`, `step_attempts`, `user_progress`, `profiles`.
- Streaks work (`effectiveStreak`). `profiles.daily_goal` exists but is unused.
- No audio anywhere yet. Only one user (Kiran) — getting users is not the goal right now.

## Decisions

- **Text-to-speech provider:** Sarvam AI (`bulbul:v3`, speaker `ishita`, `language_code: mr-IN`) — no card needed, free signup credit covers all 264 phrases (~3,280 characters, ~₹10). Free alternatives considered: AI4Bharat Indic Parler-TTS (runs locally, Apache 2.0), Azure for Students.
- **Audio:** generate once with a script, upload to Supabase Storage bucket `audio` (public read, no public write), and record each file in the `audio_clips` table keyed by `(text, model, speaker)` — one table for words and sentences, so the same sentence is generated once. File name = hash of model + speaker + text, so re-runs skip finished texts and edited text gets new audio. Upload with a long cache time. **No Redis** — the stored file plus CDN/browser caching is the cache.
- **Word progress:** new table `user_phrase_mastery` (user_id, phrase_id, box 0–5, times_seen, times_correct, last_seen_at, next_due_at), shared by the dictionary and daily practice.
- **Review schedule:** Leitner boxes, intervals 1 / 3 / 7 / 14 / 30 days. Clean retire → box + 1; retire with mistakes → back to box 1.
- **Daily practice:** 10 active cards. A card retires after **3 correct in a row** (a wrong answer resets the count and moves the card 3–4 places back); the next word from the pool replaces it. The 3 correct answers get harder: Marathi→Hindi choice, Hindi→Marathi choice, then typed/arranged recall. Pool order: due words → weak words → new words. Wrong options come from the same module with similar length. Session ends at `daily_goal` retired words (default 15).
- **`step_attempts`:** `step_id` becomes nullable and a `source` column (`'lesson'` / `'practice'`) is added so practice answers can be stored.

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
- [ ] D2. 🤖 Play buttons: intro word list, conversation speaker line, answer feedback sheet (after Check)
- [ ] D3. Test modules 1–2 on phone (play buttons, auto-play after Check)
  - Audio generated for modules 1–2 only (16 lessons, 111 clips, ₹3.60); later modules stay silent until learners reach them — generate a module at a time then (~₹1–2 each). Billing verified on the dashboard: exactly ₹30 per 10K characters, no per-request minimum; 429 rate-limit errors aren't charged.

### Resume lessons (before Week 2)

Leave a lesson mid-way → home shows "Continue learning · Step 4 of 11" → reopening starts at the step you left. Every answer is saved the moment it's given (`step_attempts`), and the resume point is *worked out* from this run's answers (`attempted_at >= user_progress.started_at`) — no position column. Steps answered wrong go to the end, exactly as `LessonEngine` does.

- [x] R1. `user_progress.started_at` + `start_lesson` sets it when a new run begins (first open, or replaying a completed lesson); resuming keeps it
- [x] R2. DB function `record_attempt(step_id, is_correct)`: saves one answer for `auth.uid()`, only for a lesson the user has started
- [x] R3. `complete_lesson` stops trusting answers sent by the browser; scores from this run's saved answers instead
- [ ] R4. TypeScript function: remaining queue from this run's answers (+ a few tests)
- [ ] R5. `getLessonDetail` returns the remaining queue; `getProgress` says which lessons are resumable and how far along
- [ ] R6. 🤖 `LessonEngine` starts from the remaining queue (saving each answer on Check is done)
- [ ] R7. 🤖 Home: "Continue learning · Step 4 of 11"

R2, R3 and R6 must ship together — otherwise answers are saved twice or not at all.

### Week 2 — Word progress and dictionary

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
- **AI voice conversation (the feature the name promises)** — turn-by-turn: learner holds mic → speech-to-text → Claude (scenario prompt with the learner's known phrases, returns reply + correction + goals as JSON) → text-to-speech; both sides shown as transcript bubbles. Hold-to-talk, not silence detection. Biggest risk: speech-to-text on Hindi-accented, broken Marathi — test providers on ~20 real clips before building. Rough cost with Sonnet 5: ₹8.5–16 per 12-turn session including GST and forex fees (Haiku 4.5 ₹5.5–10, Opus 5 ₹19–32). About 4–6 weeks of work. Scenarios map to modules: Out And About → rickshaw, Talk About Food → vegetable seller, Feeling Unwell → pharmacy, Shops And Errands → kirana.
- **Analytics and a "report a problem" button** — skipped while users aren't the goal.
