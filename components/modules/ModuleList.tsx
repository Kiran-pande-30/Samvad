'use client'

import { useEffect, useRef, useState } from 'react'
import { ModuleWithLessons, LessonState, ProgressData } from '@/lib/types'
import ModuleCard from '@/components/modules/ModuleCard'
import { MODULE_GRADIENTS } from '@/utils/constants'

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

      return {
        ...lesson,
        state,
      };
    });

    return {
      module,
      lessonsWithStates,
      completedCount: lessonsWithStates.filter((l) => l.state === 'completed').length,
    };
  });

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = sectionRefs.current.findIndex((el) => el === entry.target);
          if (index !== -1) setVisibleIndex(index);
        });
      },
      // Detection band near the top of the viewport, so the header switches
      // a little before its module's content actually reaches the top.
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
    );

    const sections = sectionRefs.current;
    sections.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [modules.length]);

  const activeSection = moduleSections[visibleIndex];
  const activeModuleNumber = visibleIndex + 1;
  const activeTotalCount = activeSection?.lessonsWithStates.length ?? 0;
  const isActiveModuleCompleted =
    !!activeSection && activeSection.completedCount === activeTotalCount && activeTotalCount > 0;
  const activeGradient = MODULE_GRADIENTS[visibleIndex % MODULE_GRADIENTS.length];

  return (
    <div className="flex flex-col w-full">
      {activeSection && (
        <div className="w-full px-4 sticky top-0 z-10">
          <div className={`w-full bg-linear-to-br ${activeGradient} text-white rounded-xl p-3 overflow-hidden shadow-md`}>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs uppercase tracking-widest font-semibold">Module {activeModuleNumber}</span>
                {activeTotalCount > 0 && (
                  <span className="text-white/80 text-xs font-medium tabular-nums">
                    {isActiveModuleCompleted ? 'Done' : `${activeSection.completedCount} / ${activeTotalCount}`}
                  </span>
                )}
              </div>

              <h2 className="text-[19px] font-bold tracking-tight">{activeSection.module.title}</h2>
            </div>
          </div>
        </div>
      )}

      {moduleSections.map(({ module, lessonsWithStates }, index) => (
        <div
          key={module.id}
          ref={(el) => {
            sectionRefs.current[index] = el;
          }}
        >
          <ModuleCard module={module} lessons={lessonsWithStates} moduleNumber={index + 1} />
        </div>
      ))}
    </div>
  );
};

export default ModuleList;
