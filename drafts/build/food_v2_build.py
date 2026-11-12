import itertools, json, re, sys, random
sys.path.insert(0, sys.argv[1])
import importlib
CONTENT = importlib.import_module(sys.argv[3] if len(sys.argv) > 3 else "food_v2_content")
LESSONS = CONTENT.LESSONS
# INTERLEAVE: mix match, fill_blank and arrange phrase by phrase (each sentence is matched before it is
# filled or arranged); conversation and recall stay at the end. Modules without it keep the grouped order.
INTERLEAVE = getattr(CONTENT, "INTERLEAVE", False)
MIDDLE = [(1, "match"), (1, "fill_blank"), (2, "match"), (2, "arrange"), (3, "fill_blank"),
          (4, "match"), (4, "arrange"), (5, "fill_blank"), (5, "arrange")]
MODULE_TITLE = sys.argv[4] if len(sys.argv) > 4 else "Talk About Food"

PUNCT = ".,?!।"
strip_end = lambda t: t.rstrip(PUNCT)
is_question = lambda s: s.strip().endswith("?")

PLAN = {1: ["match", "fill_blank", "conversation"], 2: ["match", "arrange", "recall"],
        3: ["fill_blank", "conversation", "recall"], 4: ["match", "arrange", "recall"],
        5: ["fill_blank", "arrange", "conversation"]}
ORDER = ["context", "match", "fill_blank", "arrange", "conversation", "recall"]

def shuffled_words(words, seed):
    rnd = random.Random(seed)
    out = words[:]
    for _ in range(20):
        rnd.shuffle(out)
        if out != words: break
    return out

def mixed_order(seq):
    # A lesson with a removed sentence can leave two steps of the same type side by side.
    # Then pick the closest order that keeps each sentence's own steps in order and never repeats a type.
    ok = lambda o: all(a[1] != b[1] for a, b in zip(o, o[1:]))
    if ok(seq): return seq
    keeps_phrase_order = lambda o: all(o.index(a) < o.index(b) for a in seq for b in seq if a[0] == b[0] and seq.index(a) < seq.index(b))
    cands = [list(o) for o in itertools.permutations(seq) if ok(o) and keeps_phrase_order(list(o))]
    return min(cands, key=lambda o: sum(abs(o.index(k) - seq.index(k)) for k in seq)) if cands else seq

errors = []
def check(cond, msg):
    if not cond: errors.append(msg)

module = {"module": MODULE_TITLE, "version": 2, "made": "2026-10-31", "lessons": []}
for li, L in enumerate(LESSONS, 1):
    # A slot set to None is a removed sentence: its 3 steps are skipped and the lesson keeps 4 sentences.
    # Keys stay tied to the slot (p1, p2, p3, p5) so review flags keep pointing at the same sentence.
    phrases, P = [], {}
    for i, entry in enumerate(L["p"], 1):
        if entry is None: continue
        t, tr, hi, src = entry
        P[i] = {"key": f"p{i}", "order_index": len(phrases) + 1, "target": t, "transliteration": tr, "source": hi,
                "origin": src if src in ("existing", "draft") else "tatoeba", "tatoeba_id": src if isinstance(src, int) else None}
        phrases.append(P[i])
    steps = [{"step_type": "context", "phrase": phrases[0]["key"], "prompt": L["context"], "data": {}, "correct_answer": None}]
    for i in sorted(P):
        p = P[i]; t = p["target"]; hi = p["source"]
        for typ in PLAN[i]:
            if typ == "match":
                wrong = L["match"][i]
                steps.append({"step_type": "match", "phrase": p["key"], "prompt": t,
                              "data": {"options": [hi] + wrong}, "correct_answer": hi})
            elif typ == "fill_blank":
                word, wrong = L["fill"][i]
                tokens = t.split(" ")
                idx = tokens.index(word) if word in tokens else -1
                check(idx >= 0, f"L{li} p{i} fill: '{word}' is not a whole word of '{t}'")
                sentence = " ".join("___" if k == idx else w for k, w in enumerate(tokens))
                steps.append({"step_type": "fill_blank", "phrase": p["key"], "prompt": f"\"{hi}\"",
                              "data": {"sentence": sentence, "word_bank": [word] + wrong, "blank_index": idx},
                              "correct_answer": word})
            elif typ == "arrange":
                words = [w.strip(PUNCT) for w in t.split(" ")]
                # Long sentences can use word groups as tiles ("दोन समोसे"); they still join into the same answer.
                tiles = L.get("chunks", {}).get(i, words)
                check(" ".join(tiles) == " ".join(words), f"L{li} p{i} chunks don't rebuild '{t}'")
                steps.append({"step_type": "arrange", "phrase": p["key"],
                              "prompt": f"शब्द सही क्रम में लगाइए: \"{hi}\"",
                              "data": {"words": shuffled_words(tiles, f"{li}-{i}")}, "correct_answer": " ".join(words)})
            elif typ == "conversation":
                speaker, says, situation, wrong = L["conv"][i]
                steps.append({"step_type": "conversation", "phrase": p["key"], "prompt": situation,
                              "data": {"options": [t] + wrong, "speaker": speaker, "speaker_says": says},
                              "correct_answer": t})
            elif typ == "recall":
                verb = "पूछेंगे" if is_question(t) else "कहेंगे"
                steps.append({"step_type": "recall", "phrase": p["key"],
                              "prompt": f"मराठी में कैसे {verb} — \"{strip_end(hi)}\"",
                              "data": {"options": [t] + L["recall"][i]}, "correct_answer": t})
    if INTERLEAVE:
        slot = {p["key"]: i for i, p in P.items()}
        mid = mixed_order([k for k in MIDDLE if k[0] in P])
        def rank(s):
            k = (slot[s["phrase"]], s["step_type"])
            if k in mid: return (1, mid.index(k))
            return (ORDER.index(s["step_type"]), 0)
        steps.sort(key=rank)
    else:
        steps.sort(key=lambda s: ORDER.index(s["step_type"]))
    for k, s in enumerate(steps, 1): s["order_index"] = k
    steps = [{"order_index": s["order_index"], **{k: v for k, v in s.items() if k != "order_index"}} for s in steps]
    module["lessons"].append({"order_index": li, "title": L["title"], "phrases": phrases, "steps": steps})

# ---- validation (mirrors how components/lesson/* read each step) ----
for L in module["lessons"]:
    tag = L["title"]
    keys = {p["key"]: p for p in L["phrases"]}
    types = [s["step_type"] for s in L["steps"]]
    check(len(L["phrases"]) in (4, 5), f"{tag}: {len(L['phrases'])} phrases")
    check(len(L["steps"]) == 1 + 3 * len(L["phrases"]), f"{tag}: {len(L['steps'])} steps")
    for t in ["match", "fill_blank", "arrange", "conversation", "recall"]:
        check(2 <= types.count(t) <= 3, f"{tag}: {types.count(t)} {t} steps")
    if INTERLEAVE:
        mid = [t for t in types if t in ("match", "fill_blank", "arrange")]
        check(all(a != b for a, b in zip(mid, mid[1:])), f"{tag}: same step type twice in a row: {mid}")
        check(types[1 + len(mid):] == sorted(types[1 + len(mid):], key=ORDER.index), f"{tag}: conversation/recall not at the end")
    per_phrase = {k: 0 for k in keys}
    for s in L["steps"]:
        if s["step_type"] != "context": per_phrase[s["phrase"]] += 1
        ph = keys[s["phrase"]]; d = s["data"]; ca = s["correct_answer"]; where = f"{tag} step {s['order_index']} ({s['step_type']})"
        if "options" in d:
            check(len(d["options"]) == 4, f"{where}: {len(d['options'])} options")
            check(len(set(d["options"])) == 4, f"{where}: duplicate options")
            check(ca in d["options"], f"{where}: answer not in options")
            check(d["options"].count(ca) == 1, f"{where}: answer repeated")
        if s["step_type"] == "fill_blank":
            parts = d["sentence"].split(" ")
            check(parts[d["blank_index"]] == "___", f"{where}: blank_index does not point at ___")
            check(d["sentence"].replace("___", ca) == ph["target"], f"{where}: filled sentence != phrase")
            check(len(set(d["word_bank"])) == 3 and ca in d["word_bank"], f"{where}: word bank")
            check(not parts[-1].startswith("___") or len(parts) == 1, f"{where}: blank is the last word")
        if s["step_type"] == "arrange":
            # The engine marks it right when the tiles, joined with spaces, equal the answer.
            check(any(" ".join(perm) == ca for perm in itertools.permutations(d["words"])), f"{where}: tiles don't rebuild answer")
            check(3 <= len(d["words"]) <= 6, f"{where}: {len(d['words'])} tiles (want 3-6)")
            check(" ".join(d["words"]) != ca, f"{where}: tiles already in order")
        if s["step_type"] in ("conversation", "recall"):
            check(ca == ph["target"], f"{where}: answer is not the phrase")
        if s["step_type"] == "match":
            check(s["prompt"] == ph["target"] and ca == ph["source"], f"{where}: match not phrase -> Hindi")
            check(not re.search(r"[A-Za-z]", "".join(d["options"])), f"{where}: English in options")
    for k, n in per_phrase.items():
        check(n == 3, f"{tag}: {k} practised {n} times")

json.dump(module, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
n_steps = sum(len(L["steps"]) for L in module["lessons"]); n_ph = sum(len(L["phrases"]) for L in module["lessons"])
new = sum(1 for L in module["lessons"] for p in L["phrases"] if p["origin"] == "tatoeba")
print(f"{len(module['lessons'])} lessons, {n_ph} phrases ({new} new from Tatoeba), {n_steps} steps")
print("problems:", len(errors)); print("\n".join(errors))
