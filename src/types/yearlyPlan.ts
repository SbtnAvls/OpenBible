import { VerseRange } from './studyPlan';

// Tipos de planes de lectura anual disponibles
export type YearlyPlanType =
  | 'chronological'
  | 'canonical'
  | 'mixed'
  | 'nt-psalms';

// Lectura individual dentro de un día
export interface YearlyReading {
  book: string;
  bookId: number;
  chapters?: number[];
  verseRanges?: VerseRange[];
}

// Lectura de un día específico (1-365)
export interface DailyReading {
  day: number;
  readings: YearlyReading[];
  description?: string;
}

// Definición completa de un plan anual
export interface YearlyPlan {
  id: string;
  type: YearlyPlanType;
  title: string;
  description: string;
  icon: string;
  color: string;
  totalDays: number;
  readings: DailyReading[];
}

// Progreso del usuario en un plan específico
export interface YearlyPlanProgress {
  planId: string;
  startDate: string; // ISO string de cuando inició el plan
  completedDays: number[]; // Array de días completados (1-365)
  lastReadDate: string; // ISO string de última lectura
}

// Estado global del usuario para planes anuales
export interface UserYearlyPlanState {
  activePlanId: string | null;
  progress: Record<string, YearlyPlanProgress>;
}

// Estadísticas calculadas del progreso
export interface YearlyPlanStats {
  totalDays: number; // Total de días del plan (365)
  completedDays: number; // Cantidad de días completados
  currentDay: number; // Día actual según fecha de inicio
  percentage: number; // Porcentaje de completado (0-100)
  booksInProgress: string[]; // Libros que ha empezado a leer
  chaptersRead: number; // Total de capítulos leídos
  estimatedFinishDate: Date | null; // Fecha estimada de finalización
  daysAhead: number; // Días adelantado (si completó más de currentDay)
  daysBehind: number; // Días atrasado (días sin completar hasta hoy)
}
