import { StudyPlan } from '../types/studyPlan';

// Helper para crear rangos de capítulos
const createChapters = (start: number, end: number): number[] => {
  const chapters = [];
  for (let i = start; i <= end; i++) {
    chapters.push(i);
  }
  return chapters;
};

// Mapeo de nombres de libros a IDs (basado en el orden bíblico estándar)
const BOOK_IDS: Record<string, number> = {
  // Antiguo Testamento
  Génesis: 0,
  Éxodo: 1,
  Levítico: 2,
  Números: 3,
  Deuteronomio: 4,
  Josué: 5,
  Jueces: 6,
  Rut: 7,
  '1 Samuel': 8,
  '2 Samuel': 9,
  '1 Reyes': 10,
  '2 Reyes': 11,
  '1 Crónicas': 12,
  '2 Crónicas': 13,
  Esdras: 14,
  Nehemías: 15,
  Ester: 16,
  Job: 17,
  Salmos: 18,
  Proverbios: 19,
  Eclesiastés: 20,
  Cantares: 21,
  Isaías: 22,
  Jeremías: 23,
  Lamentaciones: 24,
  Ezequiel: 25,
  Daniel: 26,
  Oseas: 27,
  Joel: 28,
  Amós: 29,
  Abdías: 30,
  Jonás: 31,
  Miqueas: 32,
  Nahum: 33,
  Habacuc: 34,
  Sofonías: 35,
  Hageo: 36,
  Zacarías: 37,
  Malaquías: 38,
  // Nuevo Testamento
  Mateo: 39,
  Marcos: 40,
  Lucas: 41,
  Juan: 42,
  Hechos: 43,
  Romanos: 44,
  '1 Corintios': 45,
  '2 Corintios': 46,
  Gálatas: 47,
  Efesios: 48,
  Filipenses: 49,
  Colosenses: 50,
  '1 Tesalonicenses': 51,
  '2 Tesalonicenses': 52,
  '1 Timoteo': 53,
  '2 Timoteo': 54,
  Tito: 55,
  Filemón: 56,
  Hebreos: 57,
  Santiago: 58,
  '1 Pedro': 59,
  '2 Pedro': 60,
  '1 Juan': 61,
  '2 Juan': 62,
  '3 Juan': 63,
  Judas: 64,
  Apocalipsis: 65,
};

export const studyPlans: StudyPlan[] = [
  {
    id: 'vida-de-jesus',
    title: 'La vida de Jesús',
    description:
      'Recorrido desde el anuncio de su nacimiento hasta la resurrección y ascensión.',
    progress: 0,
    sections: [
      {
        id: 'nacimiento-infancia',
        title: 'Nacimiento, infancia y preparación',
        description:
          'El inicio de la vida terrenal de Jesús, desde su nacimiento hasta el comienzo de su ministerio.',
        isUnlocked: true,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [1, 2],
            description: 'Genealogía, nacimiento y visita de los magos',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            chapters: [1, 2],
            description: 'Anunciación, nacimiento de Juan y Jesús',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 1, startVerse: 1, endVerse: 18 }],
            description: 'Prólogo teológico sobre el Verbo',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 3, startVerse: 21, endVerse: 38 }],
            description: 'Bautismo y genealogía de Jesús',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 3, startVerse: 1, endVerse: 17 }],
            description: 'Ministerio de Juan el Bautista y bautismo de Jesús',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 1, startVerse: 1, endVerse: 11 }],
            description: 'Inicio del Evangelio, Juan y bautismo',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 3, startVerse: 1, endVerse: 20 }],
            description: 'Ministerio de Juan',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 4, startVerse: 1, endVerse: 11 }],
            description: 'La tentación de Jesús',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 1, startVerse: 12, endVerse: 13 }],
            description: 'La tentación de Jesús',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 4, startVerse: 1, endVerse: 13 }],
            description: 'La tentación de Jesús',
          },
        ],
      },
      {
        id: 'ministerio-galilea',
        title: 'Ministerio en Galilea y alrededores',
        description:
          'Enseñanza, milagros y llamado de discípulos durante el ministerio en Galilea.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 4, startVerse: 12, endVerse: 25 }],
            description: 'Inicio del ministerio en Galilea',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [8, 9],
            description: 'Milagros y sanidades',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: createChapters(11, 17),
            description: 'Enseñanzas y parábolas',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 1, startVerse: 14, endVerse: 45 }],
            description: 'Inicio del ministerio',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            chapters: createChapters(2, 8),
            description: 'Ministerio en Galilea',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 4, startVerse: 14, endVerse: 44 }],
            description: 'Inicio del ministerio',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            chapters: createChapters(5, 9),
            description: 'Ministerio en Galilea',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: createChapters(2, 7),
            description:
              'Bodas de Caná, Nicodemo, samaritana, sanidades, alimentación de los 5,000',
          },
        ],
      },
      {
        id: 'camino-jerusalen',
        title: 'Camino hacia Jerusalén',
        description:
          'Enseñanza intensiva a los discípulos en el viaje hacia Jerusalén.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: createChapters(18, 20),
            description: 'Enseñanzas sobre humildad, perdón y el reino',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            chapters: createChapters(9, 10),
            description: 'Enseñanzas en el camino',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [
              { chapter: 9, startVerse: 51 },
              { chapter: 10 },
              { chapter: 11 },
              { chapter: 12 },
              { chapter: 13 },
              { chapter: 14 },
              { chapter: 15 },
              { chapter: 16 },
              { chapter: 17 },
              { chapter: 18 },
              { chapter: 19, startVerse: 1, endVerse: 27 },
            ],
            description: "Sección del 'viaje' a Jerusalén",
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: createChapters(7, 11),
            description: 'Enseñanzas y señales en Jerusalén',
          },
        ],
      },
      {
        id: 'ultima-semana',
        title: 'Última semana, pasión, resurrección y ascensión',
        description:
          'Los últimos días de Jesús, su muerte y resurrección gloriosa.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: createChapters(21, 28),
            description: 'Entrada triunfal, pasión y resurrección',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            chapters: createChapters(11, 16),
            description: 'Última semana y resurrección',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [
              { chapter: 19, startVerse: 28 },
              { chapter: 20 },
              { chapter: 21 },
              { chapter: 22 },
              { chapter: 23 },
              { chapter: 24 },
            ],
            description: 'Pasión, muerte y resurrección',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: createChapters(12, 21),
            description: 'Últimas enseñanzas, pasión y apariciones',
          },
        ],
      },
    ],
  },
  {
    id: 'milagros-de-jesus',
    title: 'Los milagros de Jesús',
    description:
      'Pasajes clave para estudiar sus milagros y comprender su poder divino.',
    progress: 0,
    sections: [
      {
        id: 'resumen-general',
        title: 'Resumen general de ministerio milagroso',
        description:
          'Una visión amplia del ministerio de milagros de Jesús en los cuatro evangelios.',
        isUnlocked: true,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 4, startVerse: 23, endVerse: 25 }],
            description: 'Resumen del ministerio de Jesús',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [8, 9],
            description: 'Múltiples milagros en Mateo',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 11, startVerse: 2, endVerse: 6 }],
            description: 'Juan pregunta y Jesús responde con sus milagros',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 12, startVerse: 9, endVerse: 14 }],
            description: 'Sanidad en sábado',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 14, startVerse: 13, endVerse: 36 }],
            description: 'Alimentación de los 5,000 y caminar sobre el agua',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 15, startVerse: 29, endVerse: 39 }],
            description: 'Múltiples sanidades y alimentación de los 4,000',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 1, startVerse: 21, endVerse: 45 }],
            description: 'Primeros milagros de Jesús',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            chapters: createChapters(2, 6),
            description: 'Múltiples milagros en Marcos',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            chapters: [8],
            description: 'Alimentación y sanidad del ciego',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 9, startVerse: 14, endVerse: 29 }],
            description: 'El muchacho endemoniado',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 4, startVerse: 31, endVerse: 41 }],
            description: 'Primeros milagros de Jesús',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            chapters: createChapters(5, 9),
            description: 'Múltiples milagros en Lucas',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 13, startVerse: 10, endVerse: 17 }],
            description: 'Sanidad de la mujer encorvada',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 17, startVerse: 11, endVerse: 19 }],
            description: 'Los diez leprosos',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: createChapters(2, 6),
            description: 'Señales de Jesús en Juan',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: createChapters(9, 11),
            description: 'El ciego de nacimiento y Lázaro',
          },
        ],
      },
      {
        id: 'sanidad-enfermos',
        title: 'Sanidad de enfermos',
        description: 'Los milagros de sanidad física que Jesús realizó.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 8, startVerse: 1, endVerse: 17 }],
            description: 'El leproso, el centurión y la suegra de Pedro',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 9, startVerse: 1, endVerse: 8 }],
            description: 'El paralítico',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 9, startVerse: 18, endVerse: 34 }],
            description: 'La mujer con flujo de sangre y otros milagros',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 12, startVerse: 9, endVerse: 14 }],
            description: 'El hombre de la mano seca',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 20, startVerse: 29, endVerse: 34 }],
            description: 'Dos ciegos cerca de Jericó',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 1, startVerse: 29, endVerse: 34 }],
            description: 'Suegra de Pedro y otros',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 1, startVerse: 40, endVerse: 45 }],
            description: 'El leproso',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 2, startVerse: 1, endVerse: 12 }],
            description: 'El paralítico',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 3, startVerse: 1, endVerse: 6 }],
            description: 'El hombre de la mano seca',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 5, startVerse: 21, endVerse: 43 }],
            description: 'La mujer con flujo de sangre y la hija de Jairo',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 7, startVerse: 31, endVerse: 37 }],
            description: 'El sordomudo',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 8, startVerse: 22, endVerse: 26 }],
            description: 'El ciego de Betsaida',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 5, startVerse: 12, endVerse: 26 }],
            description: 'El leproso y el paralítico',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 7, startVerse: 1, endVerse: 10 }],
            description: 'El siervo del centurión',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 8, startVerse: 40, endVerse: 56 }],
            description: 'La mujer con flujo de sangre y la hija de Jairo',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 13, startVerse: 10, endVerse: 17 }],
            description: 'La mujer encorvada',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 17, startVerse: 11, endVerse: 19 }],
            description: 'Los diez leprosos',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 4, startVerse: 46, endVerse: 54 }],
            description: 'El hijo del oficial del rey',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 5, startVerse: 1, endVerse: 15 }],
            description: 'El paralítico de Betesda',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 9, startVerse: 1, endVerse: 41 }],
            description: 'El ciego de nacimiento',
          },
        ],
      },
      {
        id: 'expulsion-demonios',
        title: 'Expulsión de demonios',
        description:
          'El poder de Jesús sobre las fuerzas espirituales malignas.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 8, startVerse: 28, endVerse: 34 }],
            description: 'Los endemoniados gadarenos',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 9, startVerse: 32, endVerse: 34 }],
            description: 'El mudo endemoniado',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 12, startVerse: 22, endVerse: 29 }],
            description: 'El endemoniado ciego y mudo',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 1, startVerse: 21, endVerse: 28 }],
            description: 'El hombre con espíritu inmundo',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 5, startVerse: 1, endVerse: 20 }],
            description: 'El endemoniado gadareno (Legión)',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 9, startVerse: 14, endVerse: 29 }],
            description: 'El muchacho endemoniado',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 4, startVerse: 31, endVerse: 37 }],
            description: 'El hombre con espíritu inmundo',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 8, startVerse: 26, endVerse: 39 }],
            description: 'El endemoniado gadareno',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 11, startVerse: 14, endVerse: 22 }],
            description: 'El mudo endemoniado',
          },
        ],
      },
      {
        id: 'milagros-naturaleza',
        title: 'Milagros sobre la naturaleza',
        description: 'El control de Jesús sobre las fuerzas de la naturaleza.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 8, startVerse: 23, endVerse: 27 }],
            description: 'Jesús calma la tempestad',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 14, startVerse: 13, endVerse: 33 }],
            description: 'Alimentación de 5,000 y caminar sobre el mar',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 17, startVerse: 24, endVerse: 27 }],
            description: 'La moneda en la boca del pez',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 4, startVerse: 35, endVerse: 41 }],
            description: 'Jesús calma la tempestad',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 6, startVerse: 45, endVerse: 52 }],
            description: 'Jesús camina sobre el mar',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [
              { chapter: 11, startVerse: 12, endVerse: 14 },
              { chapter: 11, startVerse: 20, endVerse: 21 },
            ],
            description: 'La higuera maldecida',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 8, startVerse: 22, endVerse: 25 }],
            description: 'Jesús calma la tempestad',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 2, startVerse: 1, endVerse: 11 }],
            description: 'El agua convertida en vino',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 6, startVerse: 1, endVerse: 21 }],
            description: 'Alimentación de 5,000 y caminar sobre el mar',
          },
        ],
      },
      {
        id: 'resurrecciones',
        title: 'Resurrecciones',
        description: 'El poder de Jesús sobre la muerte misma.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [
              { chapter: 5, startVerse: 21, endVerse: 24 },
              { chapter: 5, startVerse: 35, endVerse: 43 },
            ],
            description: 'La hija de Jairo',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 9, startVerse: 18, endVerse: 26 }],
            description: 'La hija de Jairo (relato en Mateo)',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 8, startVerse: 40, endVerse: 56 }],
            description: 'La hija de Jairo (relato en Lucas)',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 7, startVerse: 11, endVerse: 17 }],
            description: 'El hijo de la viuda de Naín',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 11, startVerse: 1, endVerse: 44 }],
            description: 'La resurrección de Lázaro',
          },
        ],
      },
    ],
  },
  {
    id: 'parabolas-de-jesus',
    title: 'Las parábolas de Jesús',
    description:
      'Capítulos donde se concentran sus parábolas más importantes y sus enseñanzas.',
    progress: 0,
    sections: [
      {
        id: 'parabolas-del-reino',
        title: 'Parábolas del Reino',
        description: 'Las grandes enseñanzas de Jesús sobre el Reino de Dios.',
        isUnlocked: true,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [13],
            description:
              'El sembrador, la cizaña, la mostaza, la levadura, el tesoro, la perla, la red',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            chapters: [4],
            description:
              'El sembrador, la semilla que crece, el grano de mostaza',
          },
        ],
      },
      {
        id: 'parabolas-perdon-misericordia',
        title: 'Parábolas de perdón y misericordia',
        description: 'Enseñanzas sobre el perdón, la gracia y el amor de Dios.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [18],
            description: 'El siervo sin misericordia',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 7, startVerse: 36, endVerse: 50 }],
            description:
              'Los dos deudores (dentro del relato de la mujer pecadora)',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            chapters: [15],
            description: 'La oveja perdida, la moneda perdida, el hijo pródigo',
          },
        ],
      },
      {
        id: 'parabolas-justicia-mayordoma',
        title: 'Parábolas de justicia y mayordomía',
        description:
          'Enseñanzas sobre la responsabilidad, el juicio y la fidelidad.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 20, startVerse: 1, endVerse: 16 }],
            description: 'Los obreros de la viña',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 21, startVerse: 28, endVerse: 46 }],
            description: 'Los dos hijos, los labradores malvados',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 22, startVerse: 1, endVerse: 14 }],
            description: 'El gran banquete (las bodas del hijo del rey)',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 12, startVerse: 1, endVerse: 12 }],
            description: 'Los labradores malvados',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 12, startVerse: 13, endVerse: 21 }],
            description: 'El rico insensato',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 14, startVerse: 7, endVerse: 24 }],
            description: 'Los primeros lugares, el gran banquete',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 16, startVerse: 1, endVerse: 31 }],
            description: 'El mayordomo infiel, el rico y Lázaro',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 19, startVerse: 11, endVerse: 27 }],
            description: 'Las diez minas',
          },
        ],
      },
      {
        id: 'parabolas-oracion-humildad',
        title: 'Parábolas de oración y humildad',
        description:
          'Enseñanzas sobre cómo orar y la actitud correcta ante Dios.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 18, startVerse: 1, endVerse: 14 }],
            description: 'La viuda insistente, el fariseo y el publicano',
          },
        ],
      },
    ],
  },
  {
    id: 'sermon-del-monte',
    title: 'El Sermón del Monte',
    description:
      'Enseñanzas núcleo sobre el carácter del discípulo y la justicia del Reino.',
    progress: 0,
    sections: [
      {
        id: 'sermon-del-monte-principal',
        title: 'El Sermón del Monte',
        description:
          'El discurso más largo de Jesús: las Bienaventuranzas, la sal y la luz, la verdadera justicia.',
        isUnlocked: true,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: createChapters(5, 7),
            description:
              'Las Bienaventuranzas, la ley y el amor, el Padre Nuestro, no juzgar',
          },
        ],
      },
      {
        id: 'sermon-del-llano',
        title: 'El Sermón del llano',
        description: 'El discurso paralelo de Lucas con enseñanzas similares.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 6, startVerse: 17, endVerse: 49 }],
            description:
              'Bienaventuranzas y ayes, amar a los enemigos, no juzgar',
          },
        ],
      },
      {
        id: 'ensenanzas-complementarias',
        title: 'Enseñanzas complementarias',
        description:
          'Pasajes que profundizan en la vida del discípulo y la ética cristiana.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [10],
            description: 'Envío de los doce y enseñanzas sobre el discipulado',
          },
          {
            book: 'Romanos',
            bookId: BOOK_IDS.Romanos,
            chapters: [12],
            description:
              'Ética cristiana en continuidad con el Sermón del Monte',
          },
        ],
      },
    ],
  },
  {
    id: 'ultima-semana-de-jesus',
    title: 'La última semana de Jesús',
    description:
      'Desde la entrada triunfal hasta la resurrección y apariciones.',
    progress: 0,
    sections: [
      {
        id: 'entrada-triunfal-confrontacion',
        title: 'Entrada triunfal y confrontación en Jerusalén',
        description:
          'La llegada de Jesús a Jerusalén y sus últimas enseñanzas públicas.',
        isUnlocked: true,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: createChapters(21, 23),
            description:
              'Entrada triunfal, purificación del templo, ayes a los fariseos',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            chapters: createChapters(11, 12),
            description:
              'Entrada triunfal, higuera seca, autoridad cuestionada',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 19, startVerse: 28, endVerse: 48 }],
            description: 'Entrada triunfal y purificación del templo',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            chapters: createChapters(20, 21),
            description: 'Controversias y enseñanzas finales',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: [12],
            description:
              'La unción en Betania, entrada triunfal, griegos buscan a Jesús',
          },
        ],
      },
      {
        id: 'discurso-escatologico',
        title: 'Discurso escatológico y preparación de los discípulos',
        description:
          'Las profecías sobre el fin y las últimas enseñanzas privadas.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: createChapters(24, 25),
            description:
              'Señales del fin, parábolas de vigilancia, juicio de las naciones',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            chapters: [13],
            description: 'Señales del fin y exhortación a velar',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 21, startVerse: 5, endVerse: 36 }],
            description: 'Señales del fin de los tiempos',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: createChapters(13, 17),
            description:
              'Última cena, mandamiento nuevo, promesa del Espíritu, oración sacerdotal',
          },
        ],
      },
      {
        id: 'pasion-muerte-resurreccion',
        title: 'Pasión, muerte y resurrección',
        description:
          'Los eventos finales: arresto, crucifixión y resurrección gloriosa.',
        isUnlocked: false,
        isCompleted: false,
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: createChapters(26, 28),
            description:
              'Última cena, Getsemaní, juicio, crucifixión, resurrección',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            chapters: createChapters(14, 16),
            description: 'Última cena, arresto, muerte, resurrección',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            chapters: createChapters(22, 24),
            description:
              'Última cena, juicio, crucifixión, resurrección, ascensión',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: createChapters(18, 21),
            description:
              'Arresto, juicio, crucifixión, resurrección, apariciones',
          },
        ],
      },
    ],
  },
  {
    id: 'jesus-marginados',
    title: 'Jesús y los marginados',
    description:
      'Descubre cómo Jesús mostró amor y compasión a aquellos rechazados por la sociedad',
    sections: [
      {
        id: 'leprosos-excluidos',
        title: 'Leprosos, enfermos y excluidos',
        description: 'Jesús sana y restaura a los rechazados por la enfermedad',
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 8, startVerse: 1, endVerse: 4 }],
            description: 'Jesús sana a un leproso',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 1, startVerse: 40, endVerse: 45 }],
            description: 'El leproso que buscó a Jesús',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 17, startVerse: 11, endVerse: 19 }],
            description: 'Los diez leprosos sanados',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: [9],
            description: 'El ciego de nacimiento',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 5, startVerse: 1, endVerse: 20 }],
            description: 'El endemoniado gadareno',
          },
        ],
      },
      {
        id: 'pecadores-recaudadores',
        title: 'Pecadores públicos y recaudadores de impuestos',
        description: 'Jesús come con los rechazados y ofrece salvación a todos',
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 9, startVerse: 9, endVerse: 13 }],
            description: 'El llamamiento de Mateo',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 19, startVerse: 1, endVerse: 10 }],
            description: 'Jesús y Zaqueo',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 7, startVerse: 36, endVerse: 50 }],
            description: 'La mujer pecadora unge a Jesús',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            chapters: [15],
            description: 'Parábolas del perdido: oveja, moneda, hijo pródigo',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 8, startVerse: 1, endVerse: 11 }],
            description: 'La mujer adúltera',
          },
        ],
      },
      {
        id: 'mujeres',
        title: 'Mujeres',
        description:
          'Jesús valora y dignifica a las mujeres en una cultura patriarcal',
        readings: [
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 8, startVerse: 1, endVerse: 3 }],
            description: 'Las mujeres que seguían a Jesús',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 4, startVerse: 1, endVerse: 42 }],
            description: 'La mujer samaritana',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 10, startVerse: 38, endVerse: 42 }],
            description: 'Marta y María',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 5, startVerse: 25, endVerse: 34 }],
            description: 'La mujer con flujo de sangre',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 15, startVerse: 21, endVerse: 28 }],
            description: 'La fe de la mujer cananea',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 20, startVerse: 11, endVerse: 18 }],
            description: 'María Magdalena, primera testigo de la resurrección',
          },
        ],
      },
      {
        id: 'ninos',
        title: 'Niños',
        description: 'Jesús acoge y bendice a los más pequeños',
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 19, startVerse: 13, endVerse: 15 }],
            description: 'Jesús bendice a los niños',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 10, startVerse: 13, endVerse: 16 }],
            description: 'Dejad a los niños venir a mí',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 18, startVerse: 1, endVerse: 6 }],
            description: 'El mayor en el reino de los cielos',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 18, startVerse: 15, endVerse: 17 }],
            description: 'El reino de Dios pertenece a los niños',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 9, startVerse: 33, endVerse: 37 }],
            description: 'Quien recibe a un niño, me recibe a mí',
          },
        ],
      },
    ],
  },
  {
    id: 'yo-soy-juan',
    title: '"Yo Soy": los nombres de Jesús en Juan',
    description:
      'Descubre las declaraciones "Yo soy" de Jesús que revelan su identidad divina',
    sections: [
      {
        id: 'pan-de-vida',
        title: 'Yo soy el pan de vida',
        description:
          'Jesús se presenta como el alimento espiritual que da vida eterna',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 6, startVerse: 22, endVerse: 59 }],
            description: 'La declaración completa y su contexto',
          },
        ],
      },
      {
        id: 'luz-del-mundo',
        title: 'Yo soy la luz del mundo',
        description: 'Jesús como la luz que disipa las tinieblas del pecado',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 8, startVerse: 12, endVerse: 20 }],
            description: 'Primera declaración: Yo soy la luz del mundo',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [
              { chapter: 9, startVerse: 1, endVerse: 7 },
              { chapter: 9, startVerse: 35, endVerse: 41 },
            ],
            description: 'El ciego de nacimiento recibe la luz',
          },
        ],
      },
      {
        id: 'puerta-ovejas',
        title: 'Yo soy la puerta de las ovejas',
        description: 'Jesús como el único acceso a la salvación y protección',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 10, startVerse: 1, endVerse: 10 }],
            description: 'La puerta del redil',
          },
        ],
      },
      {
        id: 'buen-pastor',
        title: 'Yo soy el buen pastor',
        description: 'Jesús cuida, protege y da su vida por sus ovejas',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 10, startVerse: 11, endVerse: 30 }],
            description: 'El buen pastor da su vida por las ovejas',
          },
        ],
      },
      {
        id: 'resurreccion-vida',
        title: 'Yo soy la resurrección y la vida',
        description: 'Jesús tiene poder sobre la muerte y da vida eterna',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 11, startVerse: 1, endVerse: 44 }],
            description: 'Jesús resucita a Lázaro',
          },
        ],
      },
      {
        id: 'camino-verdad-vida',
        title: 'Yo soy el camino, la verdad y la vida',
        description: 'Jesús es el único camino al Padre',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 14, startVerse: 1, endVerse: 14 }],
            description: 'El camino al Padre',
          },
        ],
      },
      {
        id: 'vid-verdadera',
        title: 'Yo soy la vid verdadera',
        description: 'Permanecer en Cristo para dar fruto',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 15, startVerse: 1, endVerse: 17 }],
            description: 'La vid y los pámpanos',
          },
        ],
      },
      {
        id: 'yo-soy-absolutos',
        title: '"Yo Soy" absolutos: El nombre divino',
        description: 'Jesús usa el nombre sagrado de Dios revelado a Moisés',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 8, startVerse: 21, endVerse: 30 }],
            description:
              '"Cuando levantéis al Hijo del Hombre, entonces conoceréis que Yo Soy"',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 8, startVerse: 48, endVerse: 59 }],
            description: '"Antes que Abraham fuese, Yo Soy"',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 13, startVerse: 18, endVerse: 20 }],
            description: 'Predicción de la traición: "Yo Soy"',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 18, startVerse: 1, endVerse: 11 }],
            description: 'Arresto de Jesús: al decir "Yo Soy", caen a tierra',
          },
        ],
      },
    ],
  },
  {
    id: 'conversaciones-jesus',
    title: 'Las conversaciones de Jesús',
    description:
      'Descubre los diálogos clave de Jesús con diferentes personas y grupos',
    sections: [
      {
        id: 'encuentros-sorprendentes',
        title: 'Encuentros nocturnos y sorprendentes',
        description:
          'Conversaciones transformadoras con Nicodemo y la samaritana',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 3, startVerse: 1, endVerse: 21 }],
            description: 'Nicodemo: nacer de nuevo',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 4, startVerse: 1, endVerse: 42 }],
            description: 'Mujer samaritana: agua viva',
          },
        ],
      },
      {
        id: 'dialogos-sanidad',
        title: 'Diálogos de sanidad y restauración',
        description: 'Jesús sana y restaura a través de sus palabras',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 5, startVerse: 1, endVerse: 15 }],
            description: 'El paralítico de Betesda',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 8, startVerse: 1, endVerse: 11 }],
            description: 'La mujer adúltera: sin condenación',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: [9],
            description: 'El ciego de nacimiento y los fariseos',
          },
        ],
      },
      {
        id: 'pan-vida-autoridad',
        title: 'Conversaciones sobre pan, vida y autoridad',
        description: 'Diálogos sobre el verdadero alimento espiritual',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 6, startVerse: 25, endVerse: 71 }],
            description: 'Multitudes y discípulos tras el pan de vida',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            chapters: [7],
            description: 'Hermanos de Jesús y líderes judíos',
          },
        ],
      },
      {
        id: 'muerte-resurreccion',
        title: 'Diálogos sobre muerte y resurrección',
        description: 'Jesús consuela a Marta y María ante la muerte de Lázaro',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 11, startVerse: 17, endVerse: 44 }],
            description: 'Marta, María y la resurrección de Lázaro',
          },
        ],
      },
      {
        id: 'juicio-restauracion',
        title: 'Conversaciones de juicio y restauración',
        description: 'El juicio ante Pilato y la restauración de Pedro',
        readings: [
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [
              { chapter: 18, startVerse: 28, endVerse: 40 },
              { chapter: 19, startVerse: 1, endVerse: 16 },
            ],
            description: 'Jesús ante Pilato: mi reino no es de este mundo',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 21, startVerse: 15, endVerse: 19 }],
            description: 'Pedro restaurado: apacienta mis ovejas',
          },
        ],
      },
      {
        id: 'costo-discipulado',
        title: 'El costo del discipulado',
        description: 'Llamados al seguimiento y las demandas del Reino',
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 19, startVerse: 16, endVerse: 30 }],
            description: 'El joven rico (Mateo)',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 10, startVerse: 17, endVerse: 31 }],
            description: 'El joven rico (Marcos)',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 18, startVerse: 18, endVerse: 30 }],
            description: 'El joven rico (Lucas)',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [
              { chapter: 4, startVerse: 18, endVerse: 22 },
              { chapter: 8, startVerse: 18, endVerse: 22 },
              { chapter: 9, startVerse: 9, endVerse: 13 },
            ],
            description: 'Llamado de los primeros discípulos (Mateo)',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [
              { chapter: 5, startVerse: 1, endVerse: 11 },
              { chapter: 5, startVerse: 27, endVerse: 32 },
              { chapter: 9, startVerse: 57, endVerse: 62 },
            ],
            description: 'Llamado y seguimiento (Lucas)',
          },
        ],
      },
      {
        id: 'debates-autoridades',
        title: 'Debates con las autoridades religiosas',
        description:
          'Jesús confronta a escribas y fariseos sobre la verdadera religión',
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [12],
            description: 'Controversias sobre el sábado y la autoridad',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 15, startVerse: 1, endVerse: 20 }],
            description: 'Tradiciones humanas vs. mandamientos de Dios',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 22, startVerse: 15, endVerse: 46 }],
            description:
              'Preguntas capciosas: tributo, resurrección, mandamiento',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [23],
            description: 'Ayes contra escribas y fariseos',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [
              { chapter: 10, startVerse: 25, endVerse: 37 },
              { chapter: 11, startVerse: 37, endVerse: 54 },
            ],
            description: 'El buen samaritano y ayes contra fariseos',
          },
        ],
      },
    ],
  },
  {
    id: 'jesus-antiguo-testamento',
    title: 'Jesús en el Antiguo Testamento',
    description: 'Profecías y figuras del AT que apuntan al Mesías prometido',
    sections: [
      {
        id: 'promesas-pacto',
        title: 'Promesas iniciales y pacto',
        description:
          'Las primeras promesas mesiánicas desde Génesis hasta el pacto davídico',
        readings: [
          {
            book: 'Génesis',
            bookId: BOOK_IDS['Génesis'],
            verseRanges: [{ chapter: 3, startVerse: 15, endVerse: 15 }],
            description: 'La simiente de la mujer',
          },
          {
            book: 'Génesis',
            bookId: BOOK_IDS['Génesis'],
            verseRanges: [
              { chapter: 12, startVerse: 1, endVerse: 3 },
              { chapter: 22, startVerse: 15, endVerse: 18 },
            ],
            description: 'Promesa a Abraham: bendición para todas las naciones',
          },
          {
            book: 'Génesis',
            bookId: BOOK_IDS['Génesis'],
            verseRanges: [{ chapter: 49, startVerse: 8, endVerse: 12 }],
            description: 'El cetro de Judá',
          },
          {
            book: 'Deuteronomio',
            bookId: BOOK_IDS.Deuteronomio,
            verseRanges: [{ chapter: 18, startVerse: 15, endVerse: 19 }],
            description: 'Un profeta como Moisés',
          },
          {
            book: '2 Samuel',
            bookId: BOOK_IDS['2 Samuel'],
            verseRanges: [{ chapter: 7, startVerse: 12, endVerse: 16 }],
            description: 'El pacto davídico: un reino eterno',
          },
        ],
      },
      {
        id: 'salmos-mesianicos',
        title: 'Salmos mesiánicos',
        description: 'Salmos que profetizan sobre el Mesías Rey y Sufriente',
        readings: [
          {
            book: 'Salmos',
            bookId: BOOK_IDS.Salmos,
            chapters: [2],
            description:
              'El Hijo y Rey ungido (cf. Hechos 4:25-27; Hebreos 1:5)',
          },
          {
            book: 'Salmos',
            bookId: BOOK_IDS.Salmos,
            chapters: [22],
            description:
              'El sufrimiento del justo (cf. Mateo 27:35-46; Juan 19:23-24)',
          },
          {
            book: 'Salmos',
            bookId: BOOK_IDS.Salmos,
            chapters: [110],
            description:
              'Señor a la diestra de Dios (cf. Mateo 22:41-46; Hebreos 7)',
          },
          {
            book: 'Salmos',
            bookId: BOOK_IDS.Salmos,
            verseRanges: [{ chapter: 118, startVerse: 22, endVerse: 26 }],
            description: 'La piedra desechada (cf. Mateo 21:42; Hechos 4:11)',
          },
        ],
      },
      {
        id: 'isaias-emanuel-hijo',
        title: 'Isaías: Emanuel y el Hijo prometido',
        description: 'Profecías sobre el nacimiento y la identidad del Mesías',
        readings: [
          {
            book: 'Isaías',
            bookId: BOOK_IDS['Isaías'],
            verseRanges: [{ chapter: 7, startVerse: 14, endVerse: 14 }],
            description: 'Emanuel: Dios con nosotros (cf. Mateo 1:22-23)',
          },
          {
            book: 'Isaías',
            bookId: BOOK_IDS['Isaías'],
            verseRanges: [{ chapter: 9, startVerse: 1, endVerse: 7 }],
            description: 'Un hijo nos es dado (cf. Mateo 4:12-16)',
          },
          {
            book: 'Isaías',
            bookId: BOOK_IDS['Isaías'],
            verseRanges: [{ chapter: 11, startVerse: 1, endVerse: 10 }],
            description: 'El retoño de Isaí',
          },
        ],
      },
      {
        id: 'isaias-siervo-sufriente',
        title: 'Isaías: El Siervo Sufriente',
        description:
          'Las profecías del Siervo de Jehová que sufre por su pueblo',
        readings: [
          {
            book: 'Isaías',
            bookId: BOOK_IDS['Isaías'],
            verseRanges: [{ chapter: 40, startVerse: 3, endVerse: 5 }],
            description:
              'Voz que clama en el desierto: Juan el Bautista (cf. Mateo 3:3)',
          },
          {
            book: 'Isaías',
            bookId: BOOK_IDS['Isaías'],
            verseRanges: [{ chapter: 42, startVerse: 1, endVerse: 9 }],
            description: 'El siervo escogido (cf. Mateo 12:17-21)',
          },
          {
            book: 'Isaías',
            bookId: BOOK_IDS['Isaías'],
            verseRanges: [
              { chapter: 52, startVerse: 13, endVerse: 15 },
              { chapter: 53, startVerse: 1, endVerse: 12 },
            ],
            description:
              'El Siervo Sufriente: herido por nuestras transgresiones',
          },
        ],
      },
    ],
  },
  {
    id: 'mandamientos-discipulo',
    title: 'Mandamientos de Jesús al discípulo',
    description: 'Instrucciones de Jesús sobre cómo vivir como sus discípulos',
    sections: [
      {
        id: 'seguir-negarse',
        title: 'Llamado a seguirle y negarse a sí mismo',
        description: 'El costo de seguir a Jesús y tomar la cruz',
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [
              { chapter: 4, startVerse: 18, endVerse: 22 },
              { chapter: 9, startVerse: 9, endVerse: 13 },
            ],
            description: 'Llamado de los primeros discípulos',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [10],
            description: 'Instrucciones a los doce apóstoles',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 16, startVerse: 24, endVerse: 27 }],
            description: 'Tomar la cruz y seguir a Jesús (Mateo)',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 8, startVerse: 34, endVerse: 38 }],
            description: 'Tomar la cruz y seguir a Jesús (Marcos)',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [
              { chapter: 9, startVerse: 23, endVerse: 26 },
              { chapter: 14, startVerse: 25, endVerse: 33 },
            ],
            description: 'El costo del discipulado (Lucas)',
          },
        ],
      },
      {
        id: 'mandamiento-amor',
        title: 'Mandamiento de amor',
        description: 'Amar a Dios y al prójimo como Jesús nos amó',
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 22, startVerse: 34, endVerse: 40 }],
            description:
              'El gran mandamiento: amar a Dios y al prójimo (Mateo)',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [{ chapter: 12, startVerse: 28, endVerse: 34 }],
            description: 'El gran mandamiento (Marcos)',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [{ chapter: 10, startVerse: 25, endVerse: 37 }],
            description: 'El buen samaritano: definición práctica de prójimo',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 13, startVerse: 34, endVerse: 35 }],
            description: 'Un mandamiento nuevo: amaos unos a otros',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 15, startVerse: 9, endVerse: 17 }],
            description: 'Permanecer en su amor',
          },
        ],
      },
      {
        id: 'perdon-humildad-servicio',
        title: 'Perdón, humildad y servicio',
        description: 'Vivir con humildad, perdonar y servir a los demás',
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [5, 6, 7],
            description:
              'Sermón del Monte: ira, reconciliación, amor a los enemigos',
          },
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            chapters: [18],
            description:
              'Humildad como niño, corrección fraterna, perdón sin límite',
          },
          {
            book: 'Marcos',
            bookId: BOOK_IDS.Marcos,
            verseRanges: [
              { chapter: 9, startVerse: 33, endVerse: 37 },
              { chapter: 10, startVerse: 35, endVerse: 45 },
            ],
            description: 'El mayor es el servidor',
          },
          {
            book: 'Juan',
            bookId: BOOK_IDS.Juan,
            verseRanges: [{ chapter: 13, startVerse: 1, endVerse: 17 }],
            description: 'Lavamiento de pies: ejemplo de servicio',
          },
        ],
      },
      {
        id: 'oracion-dependencia',
        title: 'Vida de oración y dependencia',
        description: 'Cómo orar y depender de Dios',
        readings: [
          {
            book: 'Mateo',
            bookId: BOOK_IDS.Mateo,
            verseRanges: [{ chapter: 6, startVerse: 5, endVerse: 15 }],
            description: 'El Padre Nuestro y enseñanza sobre la oración',
          },
          {
            book: 'Lucas',
            bookId: BOOK_IDS.Lucas,
            verseRanges: [
              { chapter: 11, startVerse: 1, endVerse: 13 },
              { chapter: 18, startVerse: 1, endVerse: 8 },
            ],
            description: 'Enseñanza sobre la oración y persistencia',
          },
        ],
      },
    ],
  },
];
