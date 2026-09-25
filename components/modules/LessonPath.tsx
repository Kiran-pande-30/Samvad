import LessonRow from './LessonRow'
import { LessonWithState } from '@/lib/types'

interface LessonPathProps {
  lessons: LessonWithState[];
}

const LessonPath = ({ lessons }: LessonPathProps) => {
  if (lessons.length === 0) return null;

  return (
    <ol className="flex flex-col pt-1 pb-8">
      {lessons.map((lesson, idx) => (
        <LessonRow
          key={lesson.id}
          lesson={lesson}
          sequenceNumber={idx + 1}
          isFirst={idx === 0}
          isLast={idx === lessons.length - 1}
        />
      ))}
    </ol>
  );
};

export default LessonPath;
