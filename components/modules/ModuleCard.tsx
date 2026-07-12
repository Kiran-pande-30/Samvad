import { ModuleSummary, LessonWithState } from '@/lib/types'
import LessonPath from './LessonPath'

interface ModuleCardProps {
  module: ModuleSummary;
  lessons: LessonWithState[];
  moduleNumber: number;
}

const ModuleCard = ({ module, lessons, moduleNumber }: ModuleCardProps) => {
  const completedCount = lessons.filter((l) => l.state === 'completed').length;
  const totalCount = lessons.length;
  const isModuleCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <div className="w-full flex flex-col items-center px-4">
      <div className="w-full bg-linear-to-br from-coral to-coral-light text-white rounded-xl p-3 relative overflow-hidden shadow-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs uppercase tracking-widest font-semibold">Module {moduleNumber}</span>
            {totalCount > 0 && (
              <span className="text-white/80 text-xs font-medium tabular-nums">
                {isModuleCompleted ? 'Done' : `${completedCount} / ${totalCount}`}
              </span>
            )}
          </div>

          <h2 className="text-[19px] font-bold tracking-tight">{module.title}</h2>
        </div>
      </div>

      {lessons.length > 0 && (
        <LessonPath lessons={lessons} />
      )}
    </div>
  )
}

export default ModuleCard
