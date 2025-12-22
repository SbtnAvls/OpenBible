import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { getDataFromStorage, saveDataOnStorage } from '../helpers/storageData';
import {
  YearlyPlan,
  YearlyPlanProgress,
  DailyReading,
  YearlyPlanStats,
  UserYearlyPlanState,
} from '../types/yearlyPlan';
import { yearlyPlans } from '../data/yearlyPlans';

interface YearlyPlanContextType {
  // Estado
  plans: YearlyPlan[];
  activePlan: YearlyPlan | null;
  progress: YearlyPlanProgress | null;
  isLoading: boolean;

  // Acciones de plan
  startPlan: (planId: string, startDate?: Date) => Promise<void>;
  abandonPlan: () => Promise<void>;
  switchPlan: (planId: string) => Promise<void>;

  // Acciones de progreso
  markDayComplete: (day: number) => Promise<void>;
  markDayIncomplete: (day: number) => Promise<void>;
  toggleDayComplete: (day: number) => Promise<void>;

  // Consultas de lecturas
  getCurrentDayReading: () => DailyReading | null;
  getDayReading: (day: number) => DailyReading | null;
  getTodaysDayNumber: () => number;

  // Consultas de progreso
  isDayCompleted: (day: number) => boolean;
  isOnTrack: () => boolean;
  getDaysAhead: () => number;
  getDaysBehind: () => number;
  getCompletionPercentage: () => number;

  // Estadísticas
  getStats: () => YearlyPlanStats;

  // Utilidades
  getPlanById: (planId: string) => YearlyPlan | undefined;
  getAllProgress: () => Record<string, YearlyPlanProgress>;
}

const YearlyPlanContext = createContext<YearlyPlanContextType | undefined>(
  undefined,
);

const STORAGE_FILE = 'yearly_plan_state.json';

export const YearlyPlanProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<UserYearlyPlanState>({
    activePlanId: null,
    progress: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  // Cargar estado desde storage
  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const stored = await getDataFromStorage(STORAGE_FILE);
      if (stored) {
        setState(stored);
      }
    } catch (error) {
      console.error('Error loading yearly plan state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveState = async (newState: UserYearlyPlanState) => {
    try {
      await saveDataOnStorage(STORAGE_FILE, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Error saving yearly plan state:', error);
    }
  };

  // Plan activo (memoizado para evitar búsquedas innecesarias)
  const activePlan = useMemo(
    () =>
      state.activePlanId
        ? yearlyPlans.find(p => p.id === state.activePlanId) || null
        : null,
    [state.activePlanId],
  );

  // Progreso del plan activo (memoizado)
  const progress = useMemo(
    () =>
      state.activePlanId ? state.progress[state.activePlanId] || null : null,
    [state.activePlanId, state.progress],
  );

  // Calcular el día actual basado en la fecha de inicio (usando días calendario)
  const getTodaysDayNumber = useCallback((): number => {
    if (!progress) return 1;

    // Usar solo la parte de fecha (sin hora) para evitar problemas de timezone
    const startDate = new Date(progress.startDate);
    const today = new Date();

    // Normalizar a medianoche local para comparar días calendario
    const startDay = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const todayDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const diffTime = todayDay.getTime() - startDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return Math.min(Math.max(1, diffDays), 365);
  }, [progress]);

  // Iniciar un plan
  const startPlan = useCallback(
    async (planId: string, startDate?: Date) => {
      const plan = yearlyPlans.find(p => p.id === planId);
      if (!plan) return;

      const newProgress: YearlyPlanProgress = {
        planId,
        startDate: (startDate || new Date()).toISOString(),
        completedDays: [],
        lastReadDate: new Date().toISOString(),
      };

      const newState: UserYearlyPlanState = {
        activePlanId: planId,
        progress: {
          ...state.progress,
          [planId]: newProgress,
        },
      };

      await saveState(newState);
    },
    [state.progress],
  );

  // Abandonar plan activo
  const abandonPlan = useCallback(async () => {
    if (!state.activePlanId) return;

    const newState: UserYearlyPlanState = {
      ...state,
      activePlanId: null,
    };

    await saveState(newState);
  }, [state]);

  // Cambiar a otro plan (mantiene el progreso del anterior)
  const switchPlan = useCallback(
    async (planId: string) => {
      const existingProgress = state.progress[planId];

      if (existingProgress) {
        // Reactivar plan existente
        const newState: UserYearlyPlanState = {
          ...state,
          activePlanId: planId,
        };
        await saveState(newState);
      } else {
        // Iniciar nuevo plan
        await startPlan(planId);
      }
    },
    [state, startPlan],
  );

  // Marcar día como completado
  const markDayComplete = useCallback(
    async (day: number) => {
      // Validar rango
      if (day < 1 || day > 365) return;
      if (!state.activePlanId || !progress) return;
      if (progress.completedDays.includes(day)) return;

      const newProgress: YearlyPlanProgress = {
        ...progress,
        completedDays: [...progress.completedDays, day].sort((a, b) => a - b),
        lastReadDate: new Date().toISOString(),
      };

      const newState: UserYearlyPlanState = {
        ...state,
        progress: {
          ...state.progress,
          [state.activePlanId]: newProgress,
        },
      };

      await saveState(newState);
    },
    [state, progress],
  );

  // Marcar día como incompleto
  const markDayIncomplete = useCallback(
    async (day: number) => {
      // Validar rango
      if (day < 1 || day > 365) return;
      if (!state.activePlanId || !progress) return;

      const newProgress: YearlyPlanProgress = {
        ...progress,
        completedDays: progress.completedDays.filter(d => d !== day),
      };

      const newState: UserYearlyPlanState = {
        ...state,
        progress: {
          ...state.progress,
          [state.activePlanId]: newProgress,
        },
      };

      await saveState(newState);
    },
    [state, progress],
  );

  // Toggle día completado
  const toggleDayComplete = useCallback(
    async (day: number) => {
      // Validar rango
      if (day < 1 || day > 365) return;
      if (!state.activePlanId || !progress) return;

      // Verificar directamente en lugar de usar isDayCompleted para evitar stale closure
      const isCompleted = progress.completedDays.includes(day);

      const newProgress: YearlyPlanProgress = {
        ...progress,
        completedDays: isCompleted
          ? progress.completedDays.filter(d => d !== day)
          : [...progress.completedDays, day].sort((a, b) => a - b),
        lastReadDate: new Date().toISOString(),
      };

      const newState: UserYearlyPlanState = {
        ...state,
        progress: {
          ...state.progress,
          [state.activePlanId]: newProgress,
        },
      };

      await saveState(newState);
    },
    [state, progress],
  );

  // Obtener lectura del día actual
  const getCurrentDayReading = useCallback((): DailyReading | null => {
    if (!activePlan) return null;
    const todayDay = getTodaysDayNumber();
    return activePlan.readings.find(r => r.day === todayDay) || null;
  }, [activePlan, getTodaysDayNumber]);

  // Obtener lectura de un día específico
  const getDayReading = useCallback(
    (day: number): DailyReading | null => {
      if (!activePlan) return null;
      return activePlan.readings.find(r => r.day === day) || null;
    },
    [activePlan],
  );

  // Verificar si un día está completado
  const isDayCompleted = useCallback(
    (day: number): boolean => {
      return progress?.completedDays.includes(day) || false;
    },
    [progress],
  );

  // Verificar si el usuario está al día
  // Hoy está "abierto" - solo contamos hasta ayer como deuda
  const isOnTrack = useCallback((): boolean => {
    if (!progress) return true;
    const todayDay = getTodaysDayNumber();
    // Días completados hasta ayer (no incluye hoy)
    const completedUpToYesterday = progress.completedDays.filter(
      d => d < todayDay,
    ).length;
    // Debe haber completado todos los días anteriores a hoy
    return completedUpToYesterday >= todayDay - 1;
  }, [progress, getTodaysDayNumber]);

  // Días adelantados
  const getDaysAhead = useCallback((): number => {
    if (!progress) return 0;
    const todayDay = getTodaysDayNumber();
    const completedCount = progress.completedDays.length;
    const ahead = completedCount - todayDay;
    return Math.max(0, ahead);
  }, [progress, getTodaysDayNumber]);

  // Días atrasados
  // Hoy está "abierto" - solo contamos hasta ayer como deuda
  const getDaysBehind = useCallback((): number => {
    if (!progress) return 0;
    const todayDay = getTodaysDayNumber();
    // Días completados hasta ayer (no incluye hoy)
    const completedUpToYesterday = progress.completedDays.filter(
      d => d < todayDay,
    ).length;
    // Cuántos días anteriores a hoy faltan por completar
    const behind = todayDay - 1 - completedUpToYesterday;
    return Math.max(0, behind);
  }, [progress, getTodaysDayNumber]);

  // Porcentaje de completado
  const getCompletionPercentage = useCallback((): number => {
    if (!progress || !activePlan) return 0;
    return (progress.completedDays.length / activePlan.totalDays) * 100;
  }, [progress, activePlan]);

  // Estadísticas completas
  const getStats = useCallback((): YearlyPlanStats => {
    const defaultStats: YearlyPlanStats = {
      totalDays: 365,
      completedDays: 0,
      currentDay: 1,
      percentage: 0,
      booksInProgress: [],
      chaptersRead: 0,
      estimatedFinishDate: null,
      daysAhead: 0,
      daysBehind: 0,
    };

    if (!progress || !activePlan) return defaultStats;

    // Calcular libros en progreso y capítulos leídos
    const booksInProgress = new Set<string>();
    const chaptersReadSet = new Set<string>(); // "libro:capítulo" para evitar duplicados

    progress.completedDays.forEach(day => {
      const reading = activePlan.readings.find(r => r.day === day);
      if (reading) {
        reading.readings.forEach(r => {
          booksInProgress.add(r.book);
          if (r.chapters) {
            r.chapters.forEach(ch => chaptersReadSet.add(`${r.book}:${ch}`));
          } else if (r.verseRanges) {
            // Contar capítulos únicos de los verseRanges
            r.verseRanges.forEach(vr =>
              chaptersReadSet.add(`${r.book}:${vr.chapter}`),
            );
          }
        });
      }
    });

    const chaptersRead = chaptersReadSet.size;

    // Estimar fecha de finalización basada en ritmo actual
    const completedCount = progress.completedDays.length;
    const remainingDays = 365 - completedCount;
    const daysSinceStart = getTodaysDayNumber();
    const avgDaysPerReading =
      completedCount > 0 ? daysSinceStart / completedCount : 1;
    const estimatedDaysToFinish = remainingDays * avgDaysPerReading;
    const estimatedFinishDate = new Date();
    estimatedFinishDate.setDate(
      estimatedFinishDate.getDate() + estimatedDaysToFinish,
    );

    return {
      totalDays: activePlan.totalDays,
      completedDays: completedCount,
      currentDay: getTodaysDayNumber(),
      percentage: getCompletionPercentage(),
      booksInProgress: Array.from(booksInProgress),
      chaptersRead,
      estimatedFinishDate: remainingDays > 0 ? estimatedFinishDate : null,
      daysAhead: getDaysAhead(),
      daysBehind: getDaysBehind(),
    };
  }, [
    progress,
    activePlan,
    getTodaysDayNumber,
    getCompletionPercentage,
    getDaysAhead,
    getDaysBehind,
  ]);

  // Obtener plan por ID
  const getPlanById = useCallback((planId: string): YearlyPlan | undefined => {
    return yearlyPlans.find(p => p.id === planId);
  }, []);

  // Obtener todo el progreso
  const getAllProgress = useCallback((): Record<string, YearlyPlanProgress> => {
    return state.progress;
  }, [state.progress]);

  return (
    <YearlyPlanContext.Provider
      value={{
        // Estado
        plans: yearlyPlans,
        activePlan,
        progress,
        isLoading,

        // Acciones de plan
        startPlan,
        abandonPlan,
        switchPlan,

        // Acciones de progreso
        markDayComplete,
        markDayIncomplete,
        toggleDayComplete,

        // Consultas de lecturas
        getCurrentDayReading,
        getDayReading,
        getTodaysDayNumber,

        // Consultas de progreso
        isDayCompleted,
        isOnTrack,
        getDaysAhead,
        getDaysBehind,
        getCompletionPercentage,

        // Estadísticas
        getStats,

        // Utilidades
        getPlanById,
        getAllProgress,
      }}
    >
      {children}
    </YearlyPlanContext.Provider>
  );
};

export const useYearlyPlan = (): YearlyPlanContextType => {
  const context = useContext(YearlyPlanContext);
  if (!context) {
    throw new Error('useYearlyPlan must be used within a YearlyPlanProvider');
  }
  return context;
};
