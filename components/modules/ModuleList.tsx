import { ModuleWithLessons, LessonState, ProgressData } from '@/lib/types'
import ModuleCard from '@/components/modules/ModuleCard'

const ModuleList = ({ modules, progress}: { modules: ModuleWithLessons[];  progress: ProgressData; }) => {
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

  return (
    <div className="flex flex-col w-full">
      {modules.map((module, index) => {
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

          return {
            ...lesson,
            state,
          };
        });

        return (
          <ModuleCard
            key={module.id}
            module={module}
            lessons={lessonsWithStates}
            moduleNumber={index + 1}
          />
        );
      })}
    </div>
  );
};

export default ModuleList;
