import { ModuleSummary, LessonWithState } from '@/lib/types'
import LessonPath from './LessonPath'

interface ModuleCardProps {
  module: ModuleSummary;
  lessons: LessonWithState[];
  moduleNumber: number;
  completedCount: number;
}

const ModuleCard = ({ module, lessons, moduleNumber, completedCount }: ModuleCardProps) => {
  if (lessons.length === 0) return null;

  const isDone = completedCount === lessons.length;

  return (
    <section className="w-full px-4">
      {/* Each header sticks until the next module's header pushes it off */}
      <header className="sticky top-0 z-10 bg-white pt-4 pb-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Module {String(moduleNumber).padStart(2, '0')}
          </span>
          <span className="text-xs font-medium text-gray-500 tabular-nums">
            {isDone ? 'Done' : `${completedCount} of ${lessons.length}`}
          </span>
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{module.title}</h2>
        {module.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{module.description}</p>
        )}
        <div className="mt-3 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-coral transition-[width] duration-300"
            style={{ width: `${(completedCount / lessons.length) * 100}%` }}
          />
        </div>
      </header>

      <LessonPath lessons={lessons} />
    </section>
  )
}

export default ModuleCard
