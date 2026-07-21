import { ModuleSummary, LessonWithState } from '@/lib/types'
import LessonPath from './LessonPath'

interface ModuleCardProps {
  module: ModuleSummary;
  lessons: LessonWithState[];
  moduleNumber: number;
}

const ModuleCard = ({ module, lessons, moduleNumber }: ModuleCardProps) => {
  if (lessons.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center px-4">
      <div className="flex items-center gap-4 w-full py-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-base font-bold text-stone text-center">{module.title}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <LessonPath lessons={lessons} moduleNumber={moduleNumber} />
    </div>
  )
}

export default ModuleCard
