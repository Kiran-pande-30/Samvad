import json,sys
draft,mid,out=sys.argv[1],sys.argv[2],sys.argv[3]
d=json.load(open(draft,encoding='utf-8'))
rows=[]
for L in d['lessons']:
    po={p['key']:p['order_index'] for p in L['phrases']}
    rows.append({"o":L['order_index'],"t":L['title'],
      "p":[[p['order_index'],p['source'],p['target'],p['transliteration']] for p in L['phrases']],
      "s":[[s['order_index'],s['step_type'],po[s['phrase']],s['prompt'],s['data'],s['correct_answer']] for s in L['steps']]})
j=json.dumps(rows,ensure_ascii=False,separators=(',',':')); assert '$j$' not in j
open(out,'w',encoding='utf-8').write(f"""begin;
delete from public.lessons where module_id='{mid}';
with src as (select $j${j}$j$::jsonb j),
L as (select (x->>'o')::int o, x from src, jsonb_array_elements(src.j) x),
il as (insert into public.lessons (module_id,title,order_index) select '{mid}', x->>'t', o from L returning id, order_index),
P as (select il.id lid, (p->>0)::int po, p from L join il on il.order_index=L.o, jsonb_array_elements(L.x->'p') p),
ip as (insert into public.phrases (lesson_id,order_index,source,target,transliteration) select lid, po, p->>1, p->>2, p->>3 from P returning id, lesson_id, order_index),
St as (select il.id lid, s from L join il on il.order_index=L.o, jsonb_array_elements(L.x->'s') s)
insert into public.lesson_steps (lesson_id,phrase_id,order_index,step_type,prompt,data,correct_answer)
select St.lid, ip.id, (s->>0)::int, (s->>1)::step_type, s->>3, s->4, s->>5 from St join ip on ip.lesson_id=St.lid and ip.order_index=(s->>2)::int;
commit;
select l.order_index, l.title, (select count(*) from phrases p where p.lesson_id=l.id) phrases, (select count(*) from lesson_steps s where s.lesson_id=l.id) steps, (select count(*) from lesson_steps s where s.lesson_id=l.id and s.step_type<>'context' and (s.correct_answer is null or s.phrase_id is null)) bad from lessons l where l.module_id='{mid}' order by 1;
""")
