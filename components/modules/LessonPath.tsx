import React from 'react'
import LessonDot from './LessonDot'
import { LessonWithState } from '@/lib/types'

interface LessonPathProps {
  lessons: LessonWithState[];
  moduleNumber: number;
}

const WAVE_AMPLITUDE = 70; // px — how far a dot swings left/right of center
const WAVE_PERIOD = 5; // lessons per full left-right-left cycle

const LessonPath = ({ lessons, moduleNumber }: LessonPathProps) => {
  if (lessons.length === 0) return null;

  return (
    <div className="flex w-full flex-col items-center gap-6 py-6">
      {lessons.map((lesson, idx) => {
        const offsetX = Math.sin((idx / WAVE_PERIOD) * Math.PI * 2) * WAVE_AMPLITUDE;

        return (
          <div key={lesson.id} style={{ transform: `translateX(${offsetX}px)` }}>
            <LessonDot lesson={lesson} sequenceNumber={idx + 1} moduleNumber={moduleNumber} />
          </div>
        );
      })}
    </div>
  );
};

export default LessonPath;
