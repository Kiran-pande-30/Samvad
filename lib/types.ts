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
    intro_text: string;
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

export type LessonSummary = Omit<Lesson, 'created_at'>;

export interface ModuleWithLessons extends ModuleSummary {
    lessons: LessonSummary[];
}

export type LessonState = 'completed' | 'current' | 'upcoming' | 'locked';

export interface LessonWithState extends LessonSummary {
    state: LessonState;
}

export interface ModuleColor {
    bg: string;
    border: string;
    outline: string;
}

export interface Phrase {
    id: string;
    lesson_id: string;
    source: string;
    target: string;
    transliration: string;
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
  }[];
  modules_completed: string[];
  streak: number;
  last_active_date: string | null;
}