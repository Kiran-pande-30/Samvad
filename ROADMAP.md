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

- **Audio:** generate once with a script, upload to Supabase Storage bucket `phrase-audio` (public read, no public write), store the path in `phrases.audio_path`. File name = hash of voice + text, so re-runs skip finished phrases and edited text gets new audio. Upload with a long cache time. **No Redis** — the stored file plus CDN/browser caching is the cache.
- **Word progress:** new table `user_phrase_mastery` (user_id, phrase_id, box 0–5, times_seen, times_correct, last_seen_at, next_due_at), shared by the dictionary and daily practice.
- **Review schedule:** Leitner boxes, intervals 1 / 3 / 7 / 14 / 30 days. Clean retire → box + 1; retire with mistakes → back to box 1.
- **Daily practice:** 10 active cards. A card retires after **3 correct in a row** (a wrong answer resets the count and moves the card 3–4 places back); the next word from the pool replaces it. The 3 correct answers get harder: Marathi→Hindi choice, Hindi→Marathi choice, then typed/arranged recall. Pool order: due words → weak words → new words. Wrong options come from the same module with similar length. Session ends at `daily_goal` retired words (default 15).
- **`step_attempts`:** `step_id` becomes nullable and a `source` column (`'lesson'` / `'practice'`) is added so practice answers can be stored.

## Now

### Week 1 — Phrase audio

- [ ] 1. Create accounts with 2–3 TTS providers (Google, Azure, Sarvam); keys in `.env.local`; check `.gitignore`
- [ ] 2. Pick 10 test phrases (words and sentences) with SQL
- [ ] 3. Call provider A with `curl` for 1 phrase; play the mp3
- [ ] 4. Same for providers B and C
- [ ] 5. Generate the 10 phrases per provider, listen, pick one voice, save its name in `.env.local`
- [ ] 6. Migration: add nullable `phrases.audio_path`
- [ ] 7. Create `phrase-audio` bucket (public read); confirm an anon-key upload fails
- [ ] 8. Learn anon key vs service-role key; add the service-role key to `.env.local`
- [ ] 9. Script step 1: fetch 1 phrase and print it (`npx tsx scripts/…`)
- [ ] 10. Script step 2: turn it into audio, save locally
- [ ] 11. Script step 3: upload with long cache time; open the public URL
- [ ] 12. Script step 4: save `audio_path`; one phrase works end to end
- [ ] 13. Hash-based file names + skip finished phrases; second run does nothing
- [ ] 14. 3 phrases at a time + one retry on failure; test on 20
- [ ] 15. Run all 264; SQL check that no `audio_path` is empty
- [ ] 16. Add `audio_path` to the lesson query (`lib/data/lessons.ts`) and type; fix `transliration` typo in `lib/types.ts`
- [ ] 17. 🤖 Play buttons in lessons; test on phone

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
