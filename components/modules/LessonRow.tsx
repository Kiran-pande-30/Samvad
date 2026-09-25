import Link from 'next/link'
import { Check, Lock } from 'lucide-react'
import { LessonState, LessonWithState } from '@/lib/types'

interface LessonRowProps {
  lesson: LessonWithState;
  sequenceNumber: number;
  isFirst: boolean;
  isLast: boolean;
}

const LessonMarker = ({ state, sequenceNumber }: { state: LessonState; sequenceNumber: number }) => {
  if (state === 'completed') {
    return (
      <span className="w-6 h-6 rounded-full bg-coral text-white flex items-center justify-center">
        <Check className="w-3.5 h-3.5 stroke-3" />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span className="w-6 h-6 rounded-full bg-white border-2 border-coral flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-coral" />
      </span>
    );
  }
  if (state === 'locked') {
    return (
      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
        <Lock className="w-3 h-3" />
      </span>
    );
  }
  return (
    <span className="w-6 h-6 rounded-full bg-white border border-gray-300 text-[11px] font-semibold text-gray-500 flex items-center justify-center tabular-nums">
      {sequenceNumber}
    </span>
  );
};

const LessonRow = ({ lesson, sequenceNumber, isFirst, isLast }: LessonRowProps) => {
  const { state } = lesson;
  const isLocked = state === 'locked';

  return (
    <li className="relative pl-10">
      {/* Rail segment: coral once the lesson is done, trimmed at the path's ends */}
      <span
        aria-hidden="true"
        className={`absolute left-[11px] w-0.5 ${isFirst ? 'top-1/2' : 'top-0'} ${isLast ? 'bottom-1/2' : 'bottom-0'} ${
          state === 'completed' ? 'bg-coral' : 'bg-gray-200'
        }`}
      />
      <span className="absolute left-0 top-1/2 -translate-y-1/2">
        <LessonMarker state={state} sequenceNumber={sequenceNumber} />
      </span>

      {state === 'current' ? (
        <Link
          href={`/lesson/${lesson.id}`}
          className="block my-2 rounded-2xl border-[1.5px] border-coral bg-white p-4 shadow-[rgba(0,0,0,0.08)_0px_4px_6px_0px] active:scale-[0.99] transition-transform duration-150"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-coral-strong">
            Up next · Lesson {sequenceNumber}
          </p>
          <p className="mt-1 text-lg font-semibold">{lesson.title}</p>
          {lesson.preview_phrase && (
            <p lang="mr" className="mt-0.5 text-[15px] text-gray-600">{lesson.preview_phrase}</p>
          )}
          <span className="mt-4 h-11 rounded-full bg-coral-strong text-white text-sm font-semibold flex items-center justify-center">
            Start lesson
          </span>
        </Link>
      ) : (
        <LessonRowLink lessonId={lesson.id} isLocked={isLocked}>
          <div className={`flex items-center gap-3 py-3.5 ${isLast ? '' : 'border-b border-gray-100'}`}>
            <div className="flex-1 min-w-0">
              <p className={`text-[15px] font-semibold truncate ${isLocked ? 'text-gray-400' : ''}`}>{lesson.title}</p>
              {lesson.preview_phrase && (
                <p lang="mr" className={`text-sm truncate ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
                  {lesson.preview_phrase}
                </p>
              )}
            </div>
            {!isLocked && (
              <span className="shrink-0 text-xs text-gray-500 tabular-nums">{lesson.phrase_count} phrases</span>
            )}
          </div>
        </LessonRowLink>
      )}
    </li>
  );
};

const LessonRowLink = ({ lessonId, isLocked, children }: { lessonId: string; isLocked: boolean; children: React.ReactNode }) =>
  isLocked ? (
    <div aria-disabled="true">{children}</div>
  ) : (
    <Link href={`/lesson/${lessonId}`} className="block active:opacity-70 transition-opacity">
      {children}
    </Link>
  );

export default LessonRow;
