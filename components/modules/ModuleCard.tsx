import { ModuleWithLessons } from '@/lib/types'
import LessonDot from '@/components/modules/LessonDot'

const ModuleCard = ({ module }: { module: ModuleWithLessons }) => {
  return (
    <div>
      <h2>{module.title}</h2>
      <p>{module.description}</p>
      <div>
        {module.lessons.map((lesson) => (
          <LessonDot key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  )
}

export default ModuleCard
