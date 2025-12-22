// Tipos para el Sistema de Rachas

export interface StreakData {
  currentStreak: number; // Días consecutivos actuales
  longestStreak: number; // Mejor racha histórica
  lastCompletedDate: string | null; // Formato YYYY-MM-DD
  todayReadingTime: number; // Minutos leídos hoy
  todayCompleted: boolean; // Si hoy ya se completó la meta diaria de lectura
  streakHistory: StreakHistoryEntry[]; // Historial COMPLETO (todos los días)
  availableFreezes: number; // Protectores disponibles (comprados)
  totalGemsEarned: number; // Gemas totales ganadas históricamente
  currentGems: number; // Gemas disponibles para gastar
  // Sistema de metas
  currentGoalStartStreak: number; // Racha cuando se eligió la meta actual (para calcular progreso)
  lastGemRewardStreak: number; // Última racha en la que se dieron gemas por intervalo (cada 5 días)
}

export interface StreakHistoryEntry {
  date: string; // YYYY-MM-DD
  readingTime: number; // Minutos totales ese día
  completed: boolean; // Si alcanzó la meta
  frozen: boolean; // Si usó protector ese día (azul hielo)
}

export interface StreakSettings {
  dailyGoalMinutes: number; // 3, 5, 10, 15, 30, 40, 60
  streakGoalDays: number; // 10, 20, 30, 60
  hasCompletedOnboarding: boolean;
}

export interface StreakGoal {
  id: string;
  targetDays: number; // 10, 20, 30, 60, 100, 365
  gemsReward: number; // Gemas al completar
  title: string; // "Lector Constante", etc.
}

export interface ShopItem {
  id: string;
  type: 'freeze'; // Por ahora solo protectores
  name: string;
  description: string;
  price: number; // En gemas
  quantity: number; // Cantidad que se obtiene
}

export type StreakStatus = 'active' | 'at_risk' | 'lost' | 'new';

// Recompensa pendiente de mostrar al usuario (cuando completa meta diaria)
export interface PendingReward {
  newStreak: number; // Nueva racha alcanzada
  intervalGemsEarned: number; // Gemas ganadas por intervalo de 5 días (0 si no aplica)
  goalCompleted: boolean; // Si completó su meta de días
  goalTitle?: string; // Título de la meta completada
  goalGemsEarned: number; // Gemas ganadas por meta (0 si no completó)
  totalGemsEarned: number; // Total de gemas ganadas en esta ocasión
  daysToNextGoal: number; // Días que faltan para la siguiente meta (si no completó)
  daysToNextInterval: number; // Días que faltan para el próximo intervalo de gemas
}

// Constantes

// Sistema de gemas:
// - Cada 5 días de racha: +10 gemas
// - Al cumplir meta personal: bonus según la meta elegida
export const GEMS_PER_STREAK_INTERVAL = 10; // Gemas cada 5 días
export const STREAK_INTERVAL_DAYS = 5; // Cada cuántos días se ganan gemas

// Bonus por cumplir la meta elegida por el usuario
export const GOAL_BONUS: Record<number, number> = {
  10: 5, // Meta de 10 días → +5 bonus
  20: 15, // Meta de 20 días → +15 bonus
  30: 30, // Meta de 30 días → +30 bonus
  60: 75, // Meta de 60 días → +75 bonus
};

// Metas disponibles (el usuario elige una)
export const STREAK_GOALS: StreakGoal[] = [
  { id: 'goal_10', targetDays: 10, gemsReward: 5, title: 'Lector Iniciado' },
  { id: 'goal_20', targetDays: 20, gemsReward: 15, title: 'Lector Constante' },
  { id: 'goal_30', targetDays: 30, gemsReward: 30, title: 'Lector Dedicado' },
  { id: 'goal_60', targetDays: 60, gemsReward: 75, title: 'Lector Devoto' },
];

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'freeze_1',
    type: 'freeze',
    name: 'Protector',
    description: 'Protege tu racha por 1 día',
    price: 30,
    quantity: 1,
  },
];

// Límites
export const MAX_FREEZES = 4; // Máximo de protectores que puede acumular

// Bienvenida para nuevos usuarios
export const WELCOME_GEMS = 5;
export const WELCOME_FREEZES = 1;

export const DAILY_GOAL_OPTIONS = [3, 5, 10, 15, 30, 40, 60] as const;
export const STREAK_GOAL_OPTIONS = [10, 20, 30, 60] as const;

// Valores por defecto (incluye bienvenida para nuevos usuarios)
export const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  todayReadingTime: 0,
  todayCompleted: false,
  streakHistory: [],
  availableFreezes: WELCOME_FREEZES, // 1 protector de bienvenida
  totalGemsEarned: WELCOME_GEMS,
  currentGems: WELCOME_GEMS, // 5 gemas de bienvenida
  currentGoalStartStreak: 0,
  lastGemRewardStreak: 0,
};

export const DEFAULT_STREAK_SETTINGS: StreakSettings = {
  dailyGoalMinutes: 5,
  streakGoalDays: 10,
  hasCompletedOnboarding: false,
};

// Colores del sistema
export const STREAK_COLORS = {
  completed: '#E5A800', // Dorado oscuro - día completado (visible en tema claro)
  frozen: '#87CEEB', // Azul hielo - día protegido
  fire: '#FF6B35', // Naranja fuego - racha activa
  gems: '#D4920A', // Ámbar oscuro - gemas (visible en ambos temas)
  inactive: '#666666', // Gris - inactivo
  atRisk: '#FFA500', // Naranja advertencia
};

// Helpers de validación
export function isStreakData(value: unknown): value is StreakData {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.currentStreak === 'number' &&
    typeof obj.longestStreak === 'number' &&
    (obj.lastCompletedDate === null ||
      typeof obj.lastCompletedDate === 'string') &&
    typeof obj.todayReadingTime === 'number' &&
    typeof obj.todayCompleted === 'boolean' &&
    Array.isArray(obj.streakHistory) &&
    typeof obj.availableFreezes === 'number' &&
    typeof obj.totalGemsEarned === 'number' &&
    typeof obj.currentGems === 'number' &&
    typeof obj.currentGoalStartStreak === 'number' &&
    typeof obj.lastGemRewardStreak === 'number'
  );
}

export function isStreakSettings(value: unknown): value is StreakSettings {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.dailyGoalMinutes === 'number' &&
    typeof obj.streakGoalDays === 'number' &&
    typeof obj.hasCompletedOnboarding === 'boolean'
  );
}

// Utilidades de fecha (usan hora LOCAL, no UTC)
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatLocalDate(yesterday);
}

export function isAfterNoon(): boolean {
  return new Date().getHours() >= 12;
}
