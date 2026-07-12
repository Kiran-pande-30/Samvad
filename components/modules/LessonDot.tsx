import Link from 'next/link'
import { Check } from 'lucide-react'
import { LessonState, LessonWithState } from '@/lib/types'

interface LessonDotProps {
  lesson: LessonWithState;
  sequenceNumber: number;
}

const CORAL_CLASSES = 'bg-coral text-white border-[#C7431F] shadow-xl';
const GREY_CLASSES = 'bg-[#E4E4E7] border-[#A1A1AA] shadow-xl';
const CURRENT_RING_CLASSES =
  'ring-8 ring-white outline outline-2 outline-offset-8 outline-coral shadow-2xl';

const LessonIcon = ({ state, sequenceNumber }: { state: LessonState; sequenceNumber: number }) => {
  if (state === 'completed') {
    return <Check className="w-8 h-8 stroke-[3.5]" />;
  }
  return <span className="text-2xl font-black font-sans">{sequenceNumber}</span>;
};

const LessonDot = ({ lesson, sequenceNumber }: LessonDotProps) => {
  const { state } = lesson;
  const isLocked = state === 'locked';

  const content = (
    <div className="flex flex-col items-center select-none group max-w-[110px] text-center">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center border-b-[6px] transition-all duration-150 ease-in-out hover:brightness-105 active:translate-y-[3px] active:border-b-[2px] ${
          state === 'completed' || state === 'current' ? CORAL_CLASSES : GREY_CLASSES
        } ${state === 'current' ? CURRENT_RING_CLASSES : ''}`}
      >
        <LessonIcon state={state} sequenceNumber={sequenceNumber} />
      </div>

      <span className="mt-3 text-xs font-semibold tracking-wide line-clamp-2">
        {lesson.title}
      </span>
    </div>
  );

  if (isLocked) {
    return <div className="pointer-events-none">{content}</div>;
  }

  return (
    <Link href={`/lesson/${lesson.id}`} className="block focus:outline-none">
      {content}
    </Link>
  );
};

export default LessonDot;
