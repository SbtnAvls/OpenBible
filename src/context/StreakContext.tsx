import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getDataFromStorage, saveDataOnStorage } from '../helpers/storageData';
import {
  DEFAULT_STREAK_DATA,
  DEFAULT_STREAK_SETTINGS,
  GEMS_PER_STREAK_INTERVAL,
  GOAL_BONUS,
  MAX_FREEZES,
  SHOP_ITEMS,
  STREAK_GOALS,
  STREAK_INTERVAL_DAYS,
  formatLocalDate,
  getTodayDateString,
  getYesterdayDateString,
  isAfterNoon,
  isStreakData,
  isStreakSettings,
  type PendingReward,
  type ShopItem,
  type StreakData,
  type StreakGoal,
  type StreakHistoryEntry,
  type StreakSettings,
  type StreakStatus,
} from '../types/streak';

// Archivos de persistencia
const STREAK_DATA_FILE = 'streak_data.json';
const STREAK_SETTINGS_FILE = 'streak_settings.json';

export interface StreakContextValue {
  // Estado
  streakData: StreakData;
  settings: StreakSettings;
  isLoading: boolean;

  // Acciones principales
  addReadingTime: (minutes: number) => void;
  setDailyGoal: (minutes: number) => void;
  setStreakGoal: (days: number) => void;
  completeOnboarding: (dailyGoal: number, streakGoal: number) => void;

  // Tienda
  purchaseItem: (itemId: string) => boolean;
  canPurchase: (itemId: string) => boolean;

  // Utilidades
  getTodayProgress: () => number;
  getStreakStatus: () => StreakStatus;
  getMonthHistory: (year: number, month: number) => StreakHistoryEntry[];
  getRemainingMinutes: () => number;
  getGoalProgress: () => {
    current: number;
    target: number;
    percentage: number;
  };
  getDaysToGoal: () => number;

  // Recompensa pendiente (para mostrar modal de celebración)
  pendingReward: PendingReward | null;
  clearPendingReward: () => void;

  // Protectores auto-usados (para notificar al usuario)
  autoFreezesUsed: number;
  clearAutoFreezesUsed: () => void;

  // Constantes exportadas
  goals: StreakGoal[];
  shopItems: ShopItem[];
}

const StreakContext = createContext<StreakContextValue | undefined>(undefined);

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const [streakData, setStreakData] = useState<StreakData>(DEFAULT_STREAK_DATA);
  const [settings, setSettings] = useState<StreakSettings>(
    DEFAULT_STREAK_SETTINGS,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pendingReward, setPendingReward] = useState<PendingReward | null>(
    null,
  );
  const [autoFreezesUsed, setAutoFreezesUsed] = useState<number>(0);

  const hydrationRef = useRef(false);
  const lastCheckedDateRef = useRef<string | null>(null);

  // Cargar datos al iniciar
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [storedData, storedSettings] = await Promise.all([
          getDataFromStorage(STREAK_DATA_FILE),
          getDataFromStorage(STREAK_SETTINGS_FILE),
        ]);

        if (!isMounted) return;

        if (storedData && isStreakData(storedData)) {
          setStreakData(storedData);
        }

        if (storedSettings && isStreakSettings(storedSettings)) {
          setSettings(storedSettings);
        }
      } catch (error) {
        console.error('Error loading streak data:', error);
      } finally {
        if (isMounted) {
          hydrationRef.current = true;
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    if (!hydrationRef.current) return;
    void saveDataOnStorage(STREAK_DATA_FILE, JSON.stringify(streakData));
  }, [streakData]);

  useEffect(() => {
    if (!hydrationRef.current) return;
    void saveDataOnStorage(STREAK_SETTINGS_FILE, JSON.stringify(settings));
  }, [settings]);

  // Verificar cambio de día y actualizar racha (maneja múltiples días perdidos)
  useEffect(() => {
    if (!hydrationRef.current) return;

    const today = getTodayDateString();
    if (lastCheckedDateRef.current === today) return;

    lastCheckedDateRef.current = today;

    setStreakData(prev => {
      // Si ya verificamos hoy, solo resetear progreso del día
      if (prev.lastCompletedDate === today) {
        return prev;
      }

      // Si no hay historial (usuario nuevo), mantener estado inicial
      if (prev.streakHistory.length === 0 || !prev.lastCompletedDate) {
        return {
          ...prev,
          todayReadingTime: 0,
          todayCompleted: false,
        };
      }

      // Calcular días perdidos desde la última vez que completó/protegió
      const lastActiveDate = new Date(prev.lastCompletedDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor(
        (todayDate.getTime() - lastActiveDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Si es el día siguiente (daysDiff === 1), la racha continúa normalmente
      if (daysDiff <= 1) {
        return {
          ...prev,
          todayReadingTime: 0,
          todayCompleted: false,
        };
      }

      // Hay días perdidos (daysDiff > 1)
      // Días que necesitan protección = daysDiff - 1 (hoy no cuenta, es el día actual)
      const missedDays = daysDiff - 1;
      let freezesRemaining = prev.availableFreezes;
      let freezesUsed = 0;
      let streakSurvived = true;
      let lastProtectedDate: string | null = null;

      // Clonar el historial correctamente (deep clone de los objetos)
      const newHistory = prev.streakHistory.map(entry => ({ ...entry }));

      // Procesar cada día perdido
      for (let i = 1; i <= missedDays; i++) {
        const missedDate = new Date(lastActiveDate);
        missedDate.setDate(missedDate.getDate() + i);
        const missedDateString = formatLocalDate(missedDate);

        // Verificar si ya existe entrada para este día
        const existingEntryIndex = newHistory.findIndex(
          h => h.date === missedDateString,
        );

        if (existingEntryIndex >= 0) {
          const existingEntry = newHistory[existingEntryIndex];
          // Ya fue procesado (quizás completó o protegió anteriormente)
          if (!existingEntry.completed && !existingEntry.frozen) {
            // Día perdido sin protección previa
            if (freezesRemaining > 0) {
              // Crear nuevo objeto en lugar de mutar
              newHistory[existingEntryIndex] = {
                ...existingEntry,
                frozen: true,
              };
              freezesRemaining--;
              freezesUsed++;
              lastProtectedDate = missedDateString;
            } else {
              streakSurvived = false;
              break;
            }
          } else if (existingEntry.frozen || existingEntry.completed) {
            // Ya estaba protegido o completado, actualizar lastProtectedDate
            lastProtectedDate = missedDateString;
          }
        } else {
          // No existe entrada, es un día perdido
          if (freezesRemaining > 0) {
            // Usar protector
            newHistory.push({
              date: missedDateString,
              readingTime: 0,
              completed: false,
              frozen: true,
            });
            freezesRemaining--;
            freezesUsed++;
            lastProtectedDate = missedDateString;
          } else {
            // Sin protectores, racha perdida
            streakSurvived = false;
            break;
          }
        }
      }

      if (streakSurvived) {
        // Racha sobrevivió con protectores
        // Actualizar lastCompletedDate al último día protegido para evitar reprocesar
        const newLastCompletedDate =
          lastProtectedDate || prev.lastCompletedDate;

        // Notificar si se usaron protectores (se procesará fuera del setState)
        if (freezesUsed > 0) {
          setTimeout(() => {
            setAutoFreezesUsed(freezesUsed);
          }, 0);
        }

        return {
          ...prev,
          availableFreezes: freezesRemaining,
          streakHistory: newHistory,
          lastCompletedDate: newLastCompletedDate,
          todayReadingTime: 0,
          todayCompleted: false,
        };
      } else {
        // Racha perdida, reiniciar todo
        return {
          ...prev,
          currentStreak: 0,
          availableFreezes: freezesRemaining,
          streakHistory: newHistory,
          todayReadingTime: 0,
          todayCompleted: false,
          currentGoalStartStreak: 0,
          lastGemRewardStreak: 0,
        };
      }
    });
  }, []);

  // Agregar tiempo de lectura
  const addReadingTime = useCallback(
    (minutes: number) => {
      const today = getTodayDateString();

      setStreakData(prev => {
        const newReadingTime = prev.todayReadingTime + minutes;
        const justCompleted =
          !prev.todayCompleted && newReadingTime >= settings.dailyGoalMinutes;

        let newStreak = prev.currentStreak;
        let newLongestStreak = prev.longestStreak;
        let newGems = prev.currentGems;
        let newTotalGems = prev.totalGemsEarned;
        let newLastGemRewardStreak = prev.lastGemRewardStreak;
        let newCurrentGoalStartStreak = prev.currentGoalStartStreak;

        // Variables para la recompensa pendiente
        let intervalGemsEarned = 0;
        let goalGemsEarned = 0;
        let goalCompleted = false;
        let goalTitle: string | undefined;

        if (justCompleted) {
          // Incrementar racha
          newStreak = prev.currentStreak + 1;
          newLongestStreak = Math.max(newLongestStreak, newStreak);

          // Sistema de gemas: cada 5 días de racha → +10 gemas
          const intervalsSinceLastReward =
            Math.floor(newStreak / STREAK_INTERVAL_DAYS) -
            Math.floor(prev.lastGemRewardStreak / STREAK_INTERVAL_DAYS);
          if (intervalsSinceLastReward > 0) {
            intervalGemsEarned =
              intervalsSinceLastReward * GEMS_PER_STREAK_INTERVAL;
            newGems += intervalGemsEarned;
            newTotalGems += intervalGemsEarned;
            newLastGemRewardStreak = newStreak;
          }

          // Verificar si cumplió la meta personal del usuario
          const daysSinceGoalStart = newStreak - prev.currentGoalStartStreak;
          if (daysSinceGoalStart >= settings.streakGoalDays) {
            // Bonus por cumplir la meta elegida
            goalGemsEarned = GOAL_BONUS[settings.streakGoalDays] || 0;
            newGems += goalGemsEarned;
            newTotalGems += goalGemsEarned;
            goalCompleted = true;
            // Buscar título de la meta
            const goal = STREAK_GOALS.find(
              g => g.targetDays === settings.streakGoalDays,
            );
            goalTitle = goal?.title;
            // Reiniciar para poder elegir nueva meta
            newCurrentGoalStartStreak = newStreak;
          }

          // Calcular días restantes para próximos hitos
          const daysToNextInterval =
            STREAK_INTERVAL_DAYS - (newStreak % STREAK_INTERVAL_DAYS);
          const newDaysSinceGoalStart = goalCompleted
            ? 0
            : daysSinceGoalStart + 1;
          const daysToNextGoal = goalCompleted
            ? settings.streakGoalDays
            : Math.max(0, settings.streakGoalDays - newDaysSinceGoalStart);

          // Crear recompensa pendiente (se procesará fuera del setState)
          const reward: PendingReward = {
            newStreak,
            intervalGemsEarned,
            goalCompleted,
            goalTitle,
            goalGemsEarned,
            totalGemsEarned: intervalGemsEarned + goalGemsEarned,
            daysToNextGoal,
            daysToNextInterval:
              daysToNextInterval === STREAK_INTERVAL_DAYS
                ? 0
                : daysToNextInterval,
          };

          // Usar setTimeout para evitar actualizar estado durante render
          // Usamos callback para evitar duplicados si React llama setState múltiples veces (Strict Mode)
          setTimeout(() => {
            setPendingReward(currentReward =>
              currentReward === null ? reward : currentReward,
            );
          }, 0);
        }

        // Actualizar o agregar entrada del día en el historial
        const existingEntryIndex = prev.streakHistory.findIndex(
          h => h.date === today,
        );
        const newHistory = [...prev.streakHistory];

        const todayEntry: StreakHistoryEntry = {
          date: today,
          readingTime: newReadingTime,
          completed: justCompleted || prev.todayCompleted,
          frozen: false,
        };

        if (existingEntryIndex >= 0) {
          newHistory[existingEntryIndex] = todayEntry;
        } else {
          newHistory.push(todayEntry);
        }

        return {
          ...prev,
          todayReadingTime: newReadingTime,
          todayCompleted: justCompleted || prev.todayCompleted,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastCompletedDate: justCompleted ? today : prev.lastCompletedDate,
          currentGems: newGems,
          totalGemsEarned: newTotalGems,
          lastGemRewardStreak: newLastGemRewardStreak,
          currentGoalStartStreak: newCurrentGoalStartStreak,
          streakHistory: newHistory,
        };
      });
    },
    [settings.dailyGoalMinutes, settings.streakGoalDays],
  );

  // Configurar meta diaria
  const setDailyGoal = useCallback((minutes: number) => {
    setSettings(prev => ({
      ...prev,
      dailyGoalMinutes: minutes,
    }));
  }, []);

  // Configurar meta de racha (mantiene el progreso actual hacia la nueva meta)
  const setStreakGoal = useCallback((days: number) => {
    // Prevenir exploit: si el progreso actual ya supera la nueva meta,
    // ajustar currentGoalStartStreak para que el progreso sea 0
    setStreakData(prev => {
      const currentProgress = prev.currentStreak - prev.currentGoalStartStreak;
      if (currentProgress >= days) {
        // El usuario ya tendría la meta completada instantáneamente - resetear progreso
        return {
          ...prev,
          currentGoalStartStreak: prev.currentStreak,
        };
      }
      // Si no hay exploit, mantener el progreso actual
      return prev;
    });

    setSettings(prev => ({
      ...prev,
      streakGoalDays: days,
    }));
  }, []);

  // Completar onboarding
  const completeOnboarding = useCallback(
    (dailyGoal: number, streakGoal: number) => {
      setSettings(prev => ({
        ...prev,
        dailyGoalMinutes: dailyGoal,
        streakGoalDays: streakGoal,
        hasCompletedOnboarding: true,
      }));
    },
    [],
  );

  // Comprar item de la tienda
  const purchaseItem = useCallback((itemId: string): boolean => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;

    setStreakData(prev => {
      // Verificar si tiene gemas suficientes
      if (prev.currentGems < item.price) return prev;

      // Verificar límite de protectores
      if (item.type === 'freeze' && prev.availableFreezes >= MAX_FREEZES) {
        return prev;
      }

      // Calcular cantidad final (no exceder MAX_FREEZES)
      const newFreezes =
        item.type === 'freeze'
          ? Math.min(prev.availableFreezes + item.quantity, MAX_FREEZES)
          : prev.availableFreezes;

      return {
        ...prev,
        currentGems: prev.currentGems - item.price,
        availableFreezes: newFreezes,
      };
    });

    return true;
  }, []);

  // Verificar si puede comprar
  const canPurchase = useCallback(
    (itemId: string): boolean => {
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) return false;

      // Verificar gemas suficientes
      if (streakData.currentGems < item.price) return false;

      // Verificar límite de protectores
      if (
        item.type === 'freeze' &&
        streakData.availableFreezes >= MAX_FREEZES
      ) {
        return false;
      }

      return true;
    },
    [streakData.currentGems, streakData.availableFreezes],
  );

  // Obtener progreso del día (0-100)
  const getTodayProgress = useCallback((): number => {
    if (settings.dailyGoalMinutes === 0) return 0;
    const progress =
      (streakData.todayReadingTime / settings.dailyGoalMinutes) * 100;
    return Math.min(100, progress);
  }, [streakData.todayReadingTime, settings.dailyGoalMinutes]);

  // Obtener minutos restantes
  const getRemainingMinutes = useCallback((): number => {
    const remaining = settings.dailyGoalMinutes - streakData.todayReadingTime;
    return Math.max(0, remaining);
  }, [settings.dailyGoalMinutes, streakData.todayReadingTime]);

  // Obtener estado de la racha
  const getStreakStatus = useCallback((): StreakStatus => {
    // Usuario nuevo o sin racha
    if (streakData.currentStreak === 0 && !streakData.lastCompletedDate) {
      return 'new';
    }

    // Ya completó hoy
    if (streakData.todayCompleted) {
      return 'active';
    }

    // Verificar si ayer completó
    const yesterday = getYesterdayDateString();
    const yesterdayEntry = streakData.streakHistory.find(
      h => h.date === yesterday,
    );

    if (
      !yesterdayEntry?.completed &&
      !yesterdayEntry?.frozen &&
      streakData.currentStreak > 0
    ) {
      return 'lost';
    }

    // Si es después de mediodía y no ha completado hoy
    if (
      isAfterNoon() &&
      !streakData.todayCompleted &&
      streakData.currentStreak > 0
    ) {
      return 'at_risk';
    }

    return 'active';
  }, [
    streakData.currentStreak,
    streakData.lastCompletedDate,
    streakData.todayCompleted,
    streakData.streakHistory,
  ]);

  // Obtener historial de un mes específico
  const getMonthHistory = useCallback(
    (year: number, month: number): StreakHistoryEntry[] => {
      return streakData.streakHistory.filter(entry => {
        // Parsear fecha manualmente para evitar problemas de zona horaria
        const [entryYear, entryMonth] = entry.date.split('-').map(Number);
        return entryYear === year && entryMonth - 1 === month;
      });
    },
    [streakData.streakHistory],
  );

  // Obtener progreso hacia la meta de racha actual (días completados / días objetivo)
  const getGoalProgress = useCallback((): {
    current: number;
    target: number;
    percentage: number;
  } => {
    const daysSinceGoalStart =
      streakData.currentStreak - streakData.currentGoalStartStreak;
    const target = settings.streakGoalDays;
    const current = Math.min(daysSinceGoalStart, target);
    const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    return { current, target, percentage };
  }, [
    streakData.currentStreak,
    streakData.currentGoalStartStreak,
    settings.streakGoalDays,
  ]);

  // Obtener días restantes para cumplir la meta actual
  const getDaysToGoal = useCallback((): number => {
    const daysSinceGoalStart =
      streakData.currentStreak - streakData.currentGoalStartStreak;
    return Math.max(0, settings.streakGoalDays - daysSinceGoalStart);
  }, [
    streakData.currentStreak,
    streakData.currentGoalStartStreak,
    settings.streakGoalDays,
  ]);

  // Limpiar recompensa pendiente (después de mostrar el modal)
  const clearPendingReward = useCallback(() => {
    setPendingReward(null);
  }, []);

  // Limpiar notificación de protectores auto-usados
  const clearAutoFreezesUsed = useCallback(() => {
    setAutoFreezesUsed(0);
  }, []);

  const value = useMemo<StreakContextValue>(
    () => ({
      streakData,
      settings,
      isLoading,
      addReadingTime,
      setDailyGoal,
      setStreakGoal,
      completeOnboarding,
      purchaseItem,
      canPurchase,
      getTodayProgress,
      getStreakStatus,
      getMonthHistory,
      getRemainingMinutes,
      getGoalProgress,
      getDaysToGoal,
      pendingReward,
      clearPendingReward,
      autoFreezesUsed,
      clearAutoFreezesUsed,
      goals: STREAK_GOALS,
      shopItems: SHOP_ITEMS,
    }),
    [
      streakData,
      settings,
      isLoading,
      addReadingTime,
      setDailyGoal,
      setStreakGoal,
      completeOnboarding,
      purchaseItem,
      canPurchase,
      getTodayProgress,
      getStreakStatus,
      getMonthHistory,
      getRemainingMinutes,
      getGoalProgress,
      getDaysToGoal,
      pendingReward,
      clearPendingReward,
      autoFreezesUsed,
      clearAutoFreezesUsed,
    ],
  );

  return (
    <StreakContext.Provider value={value}>{children}</StreakContext.Provider>
  );
}

export function useStreak() {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak debe usarse dentro de un StreakProvider');
  }
  return context;
}
