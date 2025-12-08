export interface VerseRange {
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

export interface Reading {
  book: string;
  bookId: number;
  chapters?: number[];
  verseRanges?: VerseRange[];
  description?: string;
}

export interface StudyPlanSection {
  id: string;
  title: string;
  description?: string;
  readings: Reading[];
  isUnlocked?: boolean;
  isCompleted?: boolean;
}

export interface StudyPlan {
  id: string;
  title: string;
  description: string;
  sections: StudyPlanSection[];
  progress?: number;
}

export interface StudyPlanProgress {
  planId: string;
  completedSections: string[];
  currentSectionId: string | null;
  lastReadDate: string;
}
