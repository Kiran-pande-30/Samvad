import Link from 'next/link'
import { Check } from 'lucide-react'
import { LessonState, LessonWithState } from '@/lib/types'
import { MODULE_COLORS } from '@/utils/constants'

interface LessonDotProps {
  lesson: LessonWithState;
  sequenceNumber: number;
  moduleNumber: number;
}

const GREY_CLASSES = 'bg-[#E4E4E7] border-[#A1A1AA] shadow-xl';

const LessonIcon = ({ state, sequenceNumber }: { state: LessonState; sequenceNumber: number }) => {
  if (state === 'completed') {
    return <Check className="w-8 h-8 stroke-[3.5]" />;
  }
  return <span className="text-2xl font-black font-sans">{sequenceNumber}</span>;
};

const LessonDot = ({ lesson, sequenceNumber, moduleNumber }: LessonDotProps) => {
  const { state } = lesson;
  const isLocked = state === 'locked';
  const isActive = state === 'completed' || state === 'current';
  const moduleColor = MODULE_COLORS[(moduleNumber - 1) % MODULE_COLORS.length];

  const content = (
    <div className="flex flex-col items-center select-none group max-w-[110px] text-center">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center border-b-[6px] transition-all duration-150 ease-in-out hover:brightness-105 active:translate-y-[3px] active:border-b-[2px] ${
          isActive ? `${moduleColor.bg} text-white ${moduleColor.border}` : GREY_CLASSES
        } ${state === 'current' ? `ring-8 ring-white outline outline-2 outline-offset-8 ${moduleColor.outline} shadow-2xl` : ''}`}
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
