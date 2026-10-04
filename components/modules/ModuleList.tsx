import { ModuleWithLessons, LessonState, ProgressData } from '@/lib/types'
import ModuleCard from '@/components/modules/ModuleCard'

// Modules kept in the database but not shown in the app.
// "First Words & Greetings" overlaps modules 1–2 and is hidden for now.
const HIDDEN_MODULE_IDS = new Set(['ef2e7ae2-2540-4b50-9562-921899e0750e'])

const ModuleList = ({ modules: allModules, progress}: { modules: ModuleWithLessons[];  progress: ProgressData; }) => {
  const modules = allModules.filter((m) => !HIDDEN_MODULE_IDS.has(m.id))

  // Flatten all lessons across all modules to compute global sequence
  const globalLessons = modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, module_id: m.id }))
  );

  // Find the first uncompleted lesson in the global learning path
  const currentLessonIndex = globalLessons.findIndex((gl) => {
    const lessonProgress = progress.lessons.find((pl) => pl.lesson_id === gl.id);
    return lessonProgress?.status !== 'completed';
  });

  const activeLesson = currentLessonIndex !== -1 ? globalLessons[currentLessonIndex] : null;
  const activeModuleId = activeLesson ? activeLesson.module_id : null;
  const activeModuleIndex = activeModuleId
    ? modules.findIndex((m) => m.id === activeModuleId)
    : modules.length;

  const moduleSections = modules.map((module, index) => {
    // Map states for each lesson in this module
    const lessonsWithStates = module.lessons.map((lesson) => {
      const isCompleted = progress.lessons.some(
        (p) => p.lesson_id === lesson.id && p.status === 'completed'
      );

      let state: LessonState;

      if (isCompleted) {
        state = 'completed';
      } else if (activeLesson && lesson.id === activeLesson.id) {
        state = 'current';
      } else if (currentLessonIndex === -1) {
        state = 'upcoming';
      } else if (index <= activeModuleIndex) {
        state = 'upcoming';
      } else {
        state = 'locked';
      }

      const runProgress = progress.lessons.find((p) => p.lesson_id === lesson.id)?.run_progress ?? null;

      return {
        ...lesson,
        state,
        progress: state === 'completed' ? null : runProgress,
      };
    });

    return {
      module,
      lessonsWithStates,
      completedCount: lessonsWithStates.filter((l) => l.state === 'completed').length,
    };
  });

  return (
    <div className="flex flex-col w-full">
      {moduleSections.map(({ module, lessonsWithStates, completedCount }, index) => (
        <ModuleCard
          key={module.id}
          module={module}
          lessons={lessonsWithStates}
          moduleNumber={index + 1}
          completedCount={completedCount}
        />
      ))}
    </div>
  );
};

export default ModuleList;
