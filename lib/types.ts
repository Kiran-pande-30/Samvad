export interface languagePair {
    id: string;
    source_lang: string;
    target_lang: string;
    slug: string;
    is_active: boolean;
    created_at: string;
}

export interface LessonStep {
    id: string;
    lesson_id: string;
    phrase_id: string;
    step_type: string;
    order_index: number;
    prompt: string;
    data: string;
    correct_answer: string;
    created_at: string;
}

export interface Lesson {
    id: string;
    module_id: string;
    title: string;
    order_index: number;
    created_at: string;
}

export interface Module {
    id: string;
    language_pair_id: string;
    title: string;
    description: string;
    order_index: number;
    is_locked_initially: boolean;
    created_at: string;
}

export type ModuleSummary = Omit<Module, 'language_pair_id' | 'created_at'>;

export interface LessonSummary extends Omit<Lesson, 'created_at'> {
    preview_phrase: string | null;
    phrase_count: number;
}

export interface ModuleWithLessons extends ModuleSummary {
    lessons: LessonSummary[];
}

export type LessonState = 'completed' | 'current' | 'upcoming' | 'locked';

export interface LessonWithState extends LessonSummary {
    state: LessonState;
    progress: LessonRunProgress | null;
}

export interface Phrase {
    id: string;
    lesson_id: string;
    source: string;
    target: string;
    transliteration: string;
    order_index: number;
    created_at: string;
}

export interface Profile {
    id: string;
    display_name: string;
    avatar_url: string;
    native_language: string;
    active_language_pair_id: string;
    onboarding_completed: boolean;
    daily_goal: number;
    current_streak: number;
    last_active_date: string | null;
    timezone: string;
    created_at: string;
    updated_at: string;
}

export interface StepAteempty {
    id: string;
    user_id: string;
    step_id: string;
    phrase_id: string;
    is_correct: boolean;
    ateempted_at: string;
}

export type UserProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface UserProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    module_id: string;
    status: UserProgressStatus;
    score: number;
    completed_at: string;
    created_at: string;
    updated_at: string;
}

export interface ProgressData {
  lessons: {
    lesson_id: string;
    module_id: string;
    status: UserProgressStatus;
    completed_at: string | null;
    run_progress: LessonRunProgress | null;
  }[];
  modules_completed: string[];
  streak: number;
  last_active_date: string | null;
}
export interface AudioClip {
    id: string;
    text: string;
    model: string;
    speaker: string;
    storage_path: string;
    created_at: string;
}

export interface StepAudio {
    prompt: string | null;
    speaker: string | null;
    answer: string | null;
}

// A Marathi text and its Hindi meaning, shown on the answer sheet after Check.
export interface StepMeaning {
    marathi: string;
    hindi: string;
}

export interface PlayAudioButtonProps {
    src: string;
    autoPlay?: boolean;
    label?: string;
    className?: string;
}

export interface RunAttempt {
    step_id: string;
    is_correct: boolean;
    attempted_at: string;   // ISO timestamp from the database
}

// How far the current run of an in-progress lesson has got (steps answered correctly).
export interface LessonRunProgress {
    done: number;
    total: number;
}

// Where to pick a lesson back up: the steps still to do, in order.
export interface LessonResume {
    remaining_step_ids: string[];
    done: number;
}

// Auth pages that read `?error=` from the URL (e.g. an expired reset link).
export interface AuthPageProps {
    searchParams: Promise<{ error?: string }>;
}

// Set-new-password page: checking the reset session → form → done (or the link expired).
export type ResetPasswordStatus = 'checking' | 'ready' | 'expired' | 'done';

// AI conversation: one row of `conversation_scenarios`.
export interface ScenarioGoal {
    id: string;       // what Gemini returns in goals_done, e.g. "say_destination"
    label: string;    // what the learner sees, e.g. "Say where you're going"
}

// A Marathi line with its transliteration and Hindi meaning.
export interface ScenarioPhrase {
    mr: string;
    translit: string;
    hi: string;
}

export interface ConversationScenario {
    id: string;
    module_id: string | null;
    slug: string;
    title: string;
    title_mr: string;
    ai_role: string;
    setting: string;
    opening_line: ScenarioPhrase;
    goals: ScenarioGoal[];
    key_phrases: ScenarioPhrase[];
    order_index: number;
}

export type ScenarioSummary = Pick<ConversationScenario, 'slug' | 'title' | 'title_mr' | 'setting' | 'goals'>;

// One line of the conversation as sent to the API. The opening line is not included.
export interface ConversationMessage {
    role: 'learner' | 'partner';
    text: string;
}

export interface ConversationRequest {
    slug: string;
    history: ConversationMessage[];
    goals_done: string[];
    learner_text: string;
}

export interface ConversationCorrection {
    said: string;
    better: string;
    note_hi: string;
}

// The AI partner's reply, as returned by POST /api/conversation.
export interface ConversationReply {
    reply_mr: string;
    reply_translit: string;
    reply_hi: string;
    correction: ConversationCorrection | null;
    goals_done: string[];   // every goal done so far, not just this turn's
    finished: boolean;
}

// A bubble on the chat screen.
export type ChatEntry =
    | { role: 'learner'; text: string; correction: ConversationCorrection | null }
    | ({ role: 'partner' } & ScenarioPhrase);

// Chat screen: scene + goals → talking → summary.
export type ConversationScreen = 'intro' | 'chat' | 'summary';

// The browser's speech recognition (Chrome ships it as webkitSpeechRecognition).
export interface SpeechRecognitionLike {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
}
