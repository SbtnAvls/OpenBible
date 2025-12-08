export type Devotional = {
  id: string;
  title: string;
  date: Date;
  bibleVerse: {
    reference: string;
    text: string;
  };
  reading: string;
  reflectionQuestions: string[];
  prayer: string;
  dailyAction: string;
};
