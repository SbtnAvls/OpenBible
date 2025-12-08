import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getDataFromStorage, saveDataOnStorage } from "../helpers/storageData";
import { StudyPlan, StudyPlanProgress } from "../types/studyPlan";
import { studyPlans } from "../data/studyPlans";

interface StudyPlanContextType {
  plans: StudyPlan[];
  getPlanProgress: (planId: string) => StudyPlanProgress | null;
  completeSection: (planId: string, sectionId: string) => Promise<void>;
  resetPlan: (planId: string) => Promise<void>;
  isSectionUnlocked: (planId: string, sectionId: string) => boolean;
  getPlanById: (planId: string) => StudyPlan | undefined;
}

const StudyPlanContext = createContext<StudyPlanContextType | undefined>(undefined);

const STORAGE_FILE = "study_plans_progress.json";

export const StudyPlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progressMap, setProgressMap] = useState<Record<string, StudyPlanProgress>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar progreso desde storage
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = await getDataFromStorage(STORAGE_FILE);
      if (stored) {
        setProgressMap(stored);
      }
    } catch (error) {
      console.error("Error loading study plan progress:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveProgress = async (newProgressMap: Record<string, StudyPlanProgress>) => {
    try {
      await saveDataOnStorage(STORAGE_FILE, JSON.stringify(newProgressMap));
      setProgressMap(newProgressMap);
    } catch (error) {
      console.error("Error saving study plan progress:", error);
    }
  };

  const getPlanProgress = (planId: string): StudyPlanProgress | null => {
    return progressMap[planId] || null;
  };

  const isSectionUnlocked = (planId: string, sectionId: string): boolean => {
    const plan = studyPlans.find(p => p.id === planId);
    if (!plan) return false;

    const sectionIndex = plan.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return false;

    // La primera sección siempre está desbloqueada
    if (sectionIndex === 0) return true;

    // Verificar si la sección anterior está completada
    const progress = progressMap[planId];
    if (!progress) return false;

    const previousSection = plan.sections[sectionIndex - 1];
    return progress.completedSections.includes(previousSection.id);
  };

  const completeSection = async (planId: string, sectionId: string) => {
    const progress = progressMap[planId] || {
      planId,
      completedSections: [],
      currentSectionId: null,
      lastReadDate: new Date().toISOString(),
    };

    if (!progress.completedSections.includes(sectionId)) {
      const newProgress = {
        ...progress,
        completedSections: [...progress.completedSections, sectionId],
        lastReadDate: new Date().toISOString(),
      };

      const newProgressMap = {
        ...progressMap,
        [planId]: newProgress,
      };

      await saveProgress(newProgressMap);
    }
  };

  const resetPlan = async (planId: string) => {
    const newProgressMap = { ...progressMap };
    delete newProgressMap[planId];
    await saveProgress(newProgressMap);
  };

  const getPlanById = (planId: string): StudyPlan | undefined => {
    return studyPlans.find(p => p.id === planId);
  };

  // Calcular planes con progreso actualizado
  const plansWithProgress = studyPlans.map(plan => {
    const progress = progressMap[plan.id];
    const totalSections = plan.sections.length;
    const completedCount = progress?.completedSections.length || 0;
    const progressPercentage = totalSections > 0 ? (completedCount / totalSections) * 100 : 0;

    return {
      ...plan,
      progress: progressPercentage,
      sections: plan.sections.map((section, index) => ({
        ...section,
        isUnlocked: index === 0 || (progress?.completedSections.includes(plan.sections[index - 1].id) || false),
        isCompleted: progress?.completedSections.includes(section.id) || false,
      })),
    };
  });

  if (!isLoaded) {
    return null;
  }

  return (
    <StudyPlanContext.Provider
      value={{
        plans: plansWithProgress,
        getPlanProgress,
        completeSection,
        resetPlan,
        isSectionUnlocked,
        getPlanById,
      }}
    >
      {children}
    </StudyPlanContext.Provider>
  );
};

export const useStudyPlan = (): StudyPlanContextType => {
  const context = useContext(StudyPlanContext);
  if (!context) {
    throw new Error("useStudyPlan must be used within a StudyPlanProvider");
  }
  return context;
};
