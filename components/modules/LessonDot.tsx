import { LessonSummary } from '@/lib/types'

const LessonDot = ({ lesson }: { lesson: LessonSummary }) => {
  return (
    <div>
      <span>{lesson.title}</span>
    </div>
  )
}

export default LessonDot
