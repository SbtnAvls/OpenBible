import { YearlyPlan } from '../types/yearlyPlan';
import { BOOK_IDS, BIBLE_STRUCTURE } from './bookIds';
import {
  canonicalReadings,
  chronologicalReadings,
  mixedReadings,
  ntPsalmsReadings,
} from './generatedYearlyReadings';

// Re-exportar para mantener compatibilidad
export { BOOK_IDS, BIBLE_STRUCTURE };

// ============================================================================
// PLANES EXPORTADOS - Usando datos pre-computados y balanceados
// ============================================================================

const chronologicalPlan: YearlyPlan = {
  id: 'chronological',
  type: 'chronological',
  title: 'Cronológico',
  description:
    'Lee la Biblia en el orden en que sucedieron los eventos históricos',
  icon: 'Clock',
  color: '#8B5CF6',
  totalDays: 365,
  readings: chronologicalReadings,
};

const canonicalPlan: YearlyPlan = {
  id: 'canonical',
  type: 'canonical',
  title: 'Canónico',
  description:
    'Lee la Biblia en su orden tradicional, de Génesis a Apocalipsis',
  icon: 'BookOpen',
  color: '#3B82F6',
  totalDays: 365,
  readings: canonicalReadings,
};

const mixedPlan: YearlyPlan = {
  id: 'mixed',
  type: 'mixed',
  title: 'Mixto AT/NT',
  description: 'Lee del Antiguo y Nuevo Testamento cada día para variedad',
  icon: 'Shuffle',
  color: '#10B981',
  totalDays: 365,
  readings: mixedReadings,
};

const ntPsalmsPlan: YearlyPlan = {
  id: 'nt-psalms',
  type: 'nt-psalms',
  title: 'NT + Salmos',
  description: 'Enfoque devocional: Nuevo Testamento con Salmos y Proverbios',
  icon: 'Heart',
  color: '#F59E0B',
  totalDays: 365,
  readings: ntPsalmsReadings,
};

export const yearlyPlans: YearlyPlan[] = [
  chronologicalPlan,
  canonicalPlan,
  mixedPlan,
  ntPsalmsPlan,
];

export default yearlyPlans;
