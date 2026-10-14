import { test } from 'node:test'
import assert from 'node:assert/strict'
import { remainingStepIds } from './lessons'

const steps = ['A', 'B', 'C', 'D', 'E']
let clock = 0
const answer = (step_id: string, is_correct: boolean) => ({
  step_id,
  is_correct,
  attempted_at: new Date(2026, 0, 1, 0, 0, clock++).toISOString(),
})

test('no answers → every step, in order', () => {
  assert.deepEqual(remainingStepIds(steps, []), ['A', 'B', 'C', 'D', 'E'])
})

test('correct answers are removed', () => {
  assert.deepEqual(remainingStepIds(steps, [answer('A', true), answer('B', true)]), ['C', 'D', 'E'])
})

test('a wrong answer moves the step to the end', () => {
  assert.deepEqual(remainingStepIds(steps, [answer('A', true), answer('B', false)]), ['C', 'D', 'E', 'B'])
})

test('wrong then right → done', () => {
  const run = [answer('A', true), answer('B', false), answer('C', true), answer('D', true), answer('E', true), answer('B', true)]
  assert.deepEqual(remainingStepIds(steps, run), [])
})

test('wrong twice → listed once', () => {
  const run = [answer('A', true), answer('B', false), answer('C', true), answer('D', true), answer('E', true), answer('B', false)]
  assert.deepEqual(remainingStepIds(steps, run), ['B'])
})

test('retries keep the order of their wrong answers', () => {
  const run = [answer('A', false), answer('B', false), answer('C', true)]
  assert.deepEqual(remainingStepIds(steps, run), ['D', 'E', 'A', 'B'])
})

test('answers arriving out of order are sorted by time', () => {
  const first = answer('A', false)
  const second = answer('A', true)
  assert.deepEqual(remainingStepIds(steps, [second, first]), ['B', 'C', 'D', 'E'])
})

test('answers for steps not in the lesson are ignored', () => {
  assert.deepEqual(remainingStepIds(steps, [answer('Z', false)]), ['A', 'B', 'C', 'D', 'E'])
})

import { stepMeanings } from './lessons'

const hindi = new Map([
  ['सरळ जा', 'सीधे जाओ'],
  ['डावीकडे वळा', 'बाएं मुड़िए'],
  ['मी राज आहे', 'मैं राज हूँ'],
  ['तू', 'तुम'],
  ['तू कोण आहेस', 'तुम कौन हो?'],
])

test('recall: meaning of the answer and of a known wrong option', () => {
  const step = {
    step_type: 'recall',
    prompt: "How do you say 'Go straight' in Marathi?",
    data: { options: ['सरळ जा', 'डावीकडे वळा', 'मागे वळा'] },
    correct_answer: 'सरळ जा',
  }
  assert.deepEqual(stepMeanings(step, hindi), {
    answer_meaning: { marathi: 'सरळ जा', hindi: 'सीधे जाओ' },
    option_meanings: { 'डावीकडे वळा': 'बाएं मुड़िए' },
  })
})

test('fill_blank: meaning of the whole sentence, not just the missing word', () => {
  const step = {
    step_type: 'fill_blank',
    prompt: '"I am Raj."',
    data: { sentence: '___ राज आहे.', word_bank: ['मी', 'तू', 'तो'] },
    correct_answer: 'मी',
  }
  assert.deepEqual(stepMeanings(step, hindi), {
    answer_meaning: { marathi: 'मी राज आहे', hindi: 'मैं राज हूँ' },
    option_meanings: { 'तू': 'तुम' },
  })
})

test('match with a Marathi prompt: meaning of the prompt; English options are skipped', () => {
  const step = {
    step_type: 'match',
    prompt: 'तू कोण आहेस?',
    data: { options: ['Who are you?', 'Where are you?'] },
    correct_answer: 'Who are you?',
  }
  assert.deepEqual(stepMeanings(step, hindi), {
    answer_meaning: { marathi: 'तू कोण आहेस?', hindi: 'तुम कौन हो?' },
    option_meanings: {},
  })
})

test('no matching phrase → no meaning', () => {
  const step = { step_type: 'recall', prompt: '', data: { options: [] }, correct_answer: 'अनोळखी' }
  assert.deepEqual(stepMeanings(step, hindi), { answer_meaning: null, option_meanings: {} })
})
