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
