/**
 * Script para generar los 4 planes de lectura anual balanceados
 * basados en cantidad real de versículos.
 *
 * Uso: node scripts/generateYearlyPlans.js
 */

const fs = require('fs');
const path = require('path');

// Leer el contenido de la Biblia
const biblePath = path.join(__dirname, '../src/textContent/rv1909.json');
const bible = JSON.parse(fs.readFileSync(biblePath, 'utf8'));

// ============================================================================
// PASO 1: Analizar la Biblia y crear estructura de capítulos
// ============================================================================

const chapters = [];
const bookInfo = {};
let totalVerses = 0;

// Mapeo de IDs
const BOOK_IDS = {
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
  'Cantar de los Cantares': 21,
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

bible.testament.forEach((testament, testamentIndex) => {
  testament.books.forEach((book, bookIndex) => {
    const globalBookIndex = testamentIndex === 0 ? bookIndex : bookIndex + 39;

    if (!bookInfo[book.name]) {
      bookInfo[book.name] = {
        testament: testamentIndex === 0 ? 'AT' : 'NT',
        bookId:
          BOOK_IDS[book.name] !== undefined
            ? BOOK_IDS[book.name]
            : globalBookIndex,
        chapters: [],
        totalVerses: 0,
      };
    }

    book.chapters.forEach((chapter, chapterIndex) => {
      if (!chapter.verses || chapter.verses.length === 0) return;

      const verseCount = chapter.verses.length;
      const chapterData = {
        testament: testamentIndex === 0 ? 'AT' : 'NT',
        book: book.name,
        bookId: bookInfo[book.name].bookId,
        chapter: chapterIndex + 1,
        verses: verseCount,
        totalChars: chapter.verses.reduce((sum, v) => sum + v.text.length, 0),
      };

      chapters.push(chapterData);
      bookInfo[book.name].chapters.push(chapterData);
      bookInfo[book.name].totalVerses += verseCount;
      totalVerses += verseCount;
    });
  });
});

const targetVersesPerDay = totalVerses / 365;
console.log(`Total versículos: ${totalVerses}`);
console.log(`Objetivo por día: ~${targetVersesPerDay.toFixed(0)} versículos\n`);

// ============================================================================
// PASO 2: Función para balancear lecturas en 365 días
// ============================================================================

function balanceInto365Days(chapterList, options = {}) {
  const {
    minPerDay = 50,
    maxPerDay = 120,
    splitLargeChapters = true,
  } = options;

  // Crear unidades de lectura (pueden ser capítulos completos o partes)
  let units = [];

  chapterList.forEach(ch => {
    if (splitLargeChapters && ch.verses > maxPerDay) {
      // Dividir capítulos muy largos en partes
      const parts = Math.ceil(ch.verses / (targetVersesPerDay * 0.8));
      const versesPerPart = Math.ceil(ch.verses / parts);

      for (let i = 0; i < parts; i++) {
        const startVerse = i * versesPerPart + 1;
        const endVerse = Math.min((i + 1) * versesPerPart, ch.verses);
        units.push({
          ...ch,
          partOf: ch.chapter,
          part: i + 1,
          totalParts: parts,
          startVerse,
          endVerse,
          verses: endVerse - startVerse + 1,
          isPartial: true,
        });
      }
    } else {
      units.push({ ...ch, isPartial: false });
    }
  });

  // Agrupar en días
  const days = [];
  let currentDay = { readings: [], verses: 0 };

  units.forEach((unit, index) => {
    const wouldExceed = currentDay.verses + unit.verses > maxPerDay;
    const hasEnough = currentDay.verses >= minPerDay;

    if (wouldExceed && hasEnough) {
      days.push(currentDay);
      currentDay = { readings: [], verses: 0 };
    }

    currentDay.readings.push(unit);
    currentDay.verses += unit.verses;
  });

  if (currentDay.readings.length > 0) {
    days.push(currentDay);
  }

  // Ajustar a exactamente 365 días
  while (days.length > 365) {
    // Combinar los dos días más cortos consecutivos
    let minSum = Infinity;
    let minIndex = 0;
    for (let i = 0; i < days.length - 1; i++) {
      const sum = days[i].verses + days[i + 1].verses;
      if (sum < minSum && sum <= maxPerDay * 1.5) {
        minSum = sum;
        minIndex = i;
      }
    }
    days[minIndex].readings = [
      ...days[minIndex].readings,
      ...days[minIndex + 1].readings,
    ];
    days[minIndex].verses += days[minIndex + 1].verses;
    days.splice(minIndex + 1, 1);
  }

  while (days.length < 365) {
    // Dividir el día más largo que tenga más de 1 lectura
    let maxVersesDay = 0;
    let maxIndex = 0;
    for (let i = 0; i < days.length; i++) {
      if (days[i].verses > maxVersesDay && days[i].readings.length > 1) {
        maxVersesDay = days[i].verses;
        maxIndex = i;
      }
    }

    if (days[maxIndex].readings.length <= 1) {
      // No podemos dividir más, agregar día de repaso
      days.push({
        readings: [
          {
            book: 'Salmos',
            bookId: 18,
            chapter: (days.length % 150) + 1,
            verses: 10,
            isPartial: false,
          },
        ],
        verses: 10,
      });
      continue;
    }

    const midpoint = Math.ceil(days[maxIndex].readings.length / 2);
    const firstHalf = days[maxIndex].readings.slice(0, midpoint);
    const secondHalf = days[maxIndex].readings.slice(midpoint);

    days[maxIndex] = {
      readings: firstHalf,
      verses: firstHalf.reduce((sum, r) => sum + r.verses, 0),
    };
    days.splice(maxIndex + 1, 0, {
      readings: secondHalf,
      verses: secondHalf.reduce((sum, r) => sum + r.verses, 0),
    });
  }

  return days.slice(0, 365);
}

// ============================================================================
// PASO 3: Generar los 4 planes
// ============================================================================

// --- PLAN CANÓNICO ---
console.log('Generando Plan Canónico...');
const canonicalDays = balanceInto365Days(chapters);

// --- PLAN MIXTO AT/NT ---
console.log('Generando Plan Mixto AT/NT...');
const atChapters = chapters.filter(ch => ch.testament === 'AT');
const ntChapters = chapters.filter(ch => ch.testament === 'NT');

const atVersesTotal = atChapters.reduce((sum, ch) => sum + ch.verses, 0);
const ntVersesTotal = ntChapters.reduce((sum, ch) => sum + ch.verses, 0);

function generateMixedPlan() {
  // Expandir capítulos largos (como Salmo 119)
  function expandChapters(chapterList) {
    const units = [];
    chapterList.forEach(ch => {
      if (ch.verses > 50) {
        // Dividir capítulos largos para mejor balance
        const parts = Math.ceil(ch.verses / 40);
        const versesPerPart = Math.ceil(ch.verses / parts);
        for (let i = 0; i < parts; i++) {
          const startVerse = i * versesPerPart + 1;
          const endVerse = Math.min((i + 1) * versesPerPart, ch.verses);
          units.push({
            ...ch,
            startVerse,
            endVerse,
            verses: endVerse - startVerse + 1,
            isPartial: true,
          });
        }
      } else {
        units.push({ ...ch, isPartial: false });
      }
    });
    return units;
  }

  const atUnits = expandChapters(atChapters);
  const ntUnits = expandChapters(ntChapters);

  // Calcular cuántas unidades asignar por día
  const atUnitsPerDay = atUnits.length / 365;
  const ntUnitsPerDay = ntUnits.length / 365;

  // Intercalar AT y NT en una sola lista ordenada
  const allUnits = [];
  let atIdx = 0;
  let ntIdx = 0;

  // Proporción AT/NT basada en cantidad de unidades
  const atRatio = atUnits.length / (atUnits.length + ntUnits.length);

  while (atIdx < atUnits.length || ntIdx < ntUnits.length) {
    const currentRatio = atIdx / (atIdx + ntIdx + 1);

    if (
      atIdx < atUnits.length &&
      (ntIdx >= ntUnits.length || currentRatio < atRatio)
    ) {
      allUnits.push({ ...atUnits[atIdx], source: 'AT' });
      atIdx++;
    } else if (ntIdx < ntUnits.length) {
      allUnits.push({ ...ntUnits[ntIdx], source: 'NT' });
      ntIdx++;
    }
  }

  // Usar la misma función de balance que el plan canónico
  const totalVerses = allUnits.reduce((sum, u) => sum + u.verses, 0);
  const targetPerDay = totalVerses / 365;

  const days = [];
  let currentDay = { readings: [], verses: 0 };

  allUnits.forEach((unit, index) => {
    const wouldExceed = currentDay.verses + unit.verses > 120;
    const hasEnough = currentDay.verses >= 50;

    if (wouldExceed && hasEnough && days.length < 364) {
      days.push(currentDay);
      currentDay = { readings: [], verses: 0 };
    }

    currentDay.readings.push(unit);
    currentDay.verses += unit.verses;
  });

  if (currentDay.readings.length > 0) {
    days.push(currentDay);
  }

  // Ajustar a exactamente 365 días
  while (days.length > 365) {
    // Combinar los dos días más cortos consecutivos
    let minSum = Infinity;
    let minIndex = 0;
    for (let i = 0; i < days.length - 1; i++) {
      const sum = days[i].verses + days[i + 1].verses;
      if (sum < minSum && sum <= 150) {
        minSum = sum;
        minIndex = i;
      }
    }
    if (minIndex < days.length - 1) {
      days[minIndex].readings = [
        ...days[minIndex].readings,
        ...days[minIndex + 1].readings,
      ];
      days[minIndex].verses += days[minIndex + 1].verses;
      days.splice(minIndex + 1, 1);
    } else {
      break;
    }
  }

  while (days.length < 365) {
    // Dividir el día más largo que tenga más de 1 lectura
    let maxVersesDay = 0;
    let maxIndex = 0;
    for (let i = 0; i < days.length; i++) {
      if (days[i].verses > maxVersesDay && days[i].readings.length > 1) {
        maxVersesDay = days[i].verses;
        maxIndex = i;
      }
    }

    if (days[maxIndex].readings.length <= 1) {
      // Agregar día vacío de repaso con un Salmo
      days.push({
        readings: [
          {
            book: 'Salmos',
            bookId: 18,
            chapter: (days.length % 150) + 1,
            verses: 10,
            isPartial: false,
            testament: 'AT',
          },
        ],
        verses: 10,
      });
      continue;
    }

    const midpoint = Math.ceil(days[maxIndex].readings.length / 2);
    const firstHalf = days[maxIndex].readings.slice(0, midpoint);
    const secondHalf = days[maxIndex].readings.slice(midpoint);

    days[maxIndex] = {
      readings: firstHalf,
      verses: firstHalf.reduce((sum, r) => sum + r.verses, 0),
    };
    days.splice(maxIndex + 1, 0, {
      readings: secondHalf,
      verses: secondHalf.reduce((sum, r) => sum + r.verses, 0),
    });
  }

  return days.slice(0, 365);
}

const mixedDays = generateMixedPlan();

// --- PLAN NT + SALMOS ---
console.log('Generando Plan NT + Salmos...');
const psalms = chapters.filter(ch => ch.book === 'Salmos');
const proverbs = chapters.filter(ch => ch.book === 'Proverbios');

function generateNtPsalmsPlan() {
  // Expandir salmos largos (especialmente Salmo 119)
  const psalmsExpanded = [];
  psalms.forEach(ps => {
    if (ps.verses > 80) {
      // Dividir salmos muy largos (Salmo 119 tiene 176 versos)
      const parts = Math.ceil(ps.verses / 60);
      const versesPerPart = Math.ceil(ps.verses / parts);
      for (let i = 0; i < parts; i++) {
        const startVerse = i * versesPerPart + 1;
        const endVerse = Math.min((i + 1) * versesPerPart, ps.verses);
        psalmsExpanded.push({
          ...ps,
          startVerse,
          endVerse,
          verses: endVerse - startVerse + 1,
          isPartial: true,
        });
      }
    } else {
      psalmsExpanded.push({ ...ps, isPartial: false });
    }
  });

  // Expandir capítulos NT largos también
  const ntExpanded = [];
  ntChapters.forEach(ch => {
    if (ch.verses > 60) {
      const parts = 2;
      const versesPerPart = Math.ceil(ch.verses / parts);
      for (let i = 0; i < parts; i++) {
        const startVerse = i * versesPerPart + 1;
        const endVerse = Math.min((i + 1) * versesPerPart, ch.verses);
        ntExpanded.push({
          ...ch,
          startVerse,
          endVerse,
          verses: endVerse - startVerse + 1,
          isPartial: true,
        });
      }
    } else {
      ntExpanded.push({ ...ch, isPartial: false });
    }
  });

  const days = [];

  // Calcular distribución
  // NT: 260 capítulos originales -> expandidos
  // Salmos: 150 -> expandidos (152 con Salmo 119 dividido)
  // Proverbios: 31 capítulos, distribuir equitativamente

  const ntUnitsPerDay = ntExpanded.length / 365; // ~0.75
  const psalmUnitsPerDay = psalmsExpanded.length / 365; // ~0.42

  let ntIdx = 0;
  let psalmIdx = 0;
  let provIdx = 0;
  let ntAccum = 0;
  let psalmAccum = 0;

  for (let day = 1; day <= 365; day++) {
    const dayReadings = [];
    let dayVerses = 0;

    // NT - asegurar al menos 1 unidad por día en promedio
    ntAccum += ntUnitsPerDay;
    while (ntAccum >= 0.5 && ntIdx < ntExpanded.length && dayVerses < 80) {
      const unit = ntExpanded[ntIdx % ntExpanded.length];
      dayReadings.push({ ...unit });
      dayVerses += unit.verses;
      ntAccum -= 1;
      ntIdx++;
    }

    // Si no agregamos NT, agregar uno ciclando
    if (dayReadings.length === 0) {
      const unit = ntExpanded[(day - 1) % ntExpanded.length];
      dayReadings.push({ ...unit });
      dayVerses += unit.verses;
    }

    // Salmos - distribuir de forma que se lean todos en el año
    psalmAccum += psalmUnitsPerDay;
    while (
      psalmAccum >= 0.3 &&
      psalmIdx < psalmsExpanded.length &&
      dayVerses < 120
    ) {
      const unit = psalmsExpanded[psalmIdx];
      dayReadings.push({ ...unit });
      dayVerses += unit.verses;
      psalmAccum -= 1;
      psalmIdx++;
    }

    // Proverbios - 31 capítulos distribuidos en 365 días (~1 cada 12 días)
    if (day % 12 === 1 && provIdx < proverbs.length) {
      const prov = proverbs[provIdx];
      dayReadings.push({ ...prov, isPartial: false });
      dayVerses += prov.verses;
      provIdx++;
    }

    days.push({ readings: dayReadings, verses: dayVerses });
  }

  // Distribuir salmos restantes
  let dayIdx = 0;
  while (psalmIdx < psalmsExpanded.length) {
    // Buscar el día más corto
    let minDay = 0;
    let minVerses = days[0].verses;
    for (let i = 1; i < days.length; i++) {
      if (days[i].verses < minVerses) {
        minVerses = days[i].verses;
        minDay = i;
      }
    }
    days[minDay].readings.push({ ...psalmsExpanded[psalmIdx] });
    days[minDay].verses += psalmsExpanded[psalmIdx].verses;
    psalmIdx++;
    dayIdx++;
  }

  // Distribuir proverbios restantes
  while (provIdx < proverbs.length) {
    let minDay = 0;
    let minVerses = days[0].verses;
    for (let i = 1; i < days.length; i++) {
      if (days[i].verses < minVerses) {
        minVerses = days[i].verses;
        minDay = i;
      }
    }
    days[minDay].readings.push({ ...proverbs[provIdx], isPartial: false });
    days[minDay].verses += proverbs[provIdx].verses;
    provIdx++;
  }

  return days;
}

const ntPsalmsDays = generateNtPsalmsPlan();

// --- PLAN CRONOLÓGICO ---
console.log('Generando Plan Cronológico...');

// Orden cronológico simplificado (agrupado por períodos históricos)
const chronologicalOrder = [
  // Creación y Patriarcas
  { book: 'Génesis', start: 1, end: 11 },
  { book: 'Job', start: 1, end: 42 },
  { book: 'Génesis', start: 12, end: 50 },
  // Éxodo y Ley
  { book: 'Éxodo', start: 1, end: 40 },
  { book: 'Levítico', start: 1, end: 27 },
  { book: 'Números', start: 1, end: 36 },
  { book: 'Deuteronomio', start: 1, end: 34 },
  // Conquista y Jueces
  { book: 'Josué', start: 1, end: 24 },
  { book: 'Jueces', start: 1, end: 21 },
  { book: 'Rut', start: 1, end: 4 },
  // Reino Unido
  { book: '1 Samuel', start: 1, end: 31 },
  { book: '2 Samuel', start: 1, end: 24 },
  { book: 'Salmos', start: 1, end: 41 }, // Salmos de David
  { book: '1 Crónicas', start: 1, end: 29 },
  { book: '1 Reyes', start: 1, end: 11 },
  { book: 'Proverbios', start: 1, end: 31 },
  { book: 'Eclesiastés', start: 1, end: 12 },
  { book: 'Cantar de los Cantares', start: 1, end: 8 },
  { book: '2 Crónicas', start: 1, end: 9 },
  // Reino Dividido
  { book: '1 Reyes', start: 12, end: 22 },
  { book: '2 Reyes', start: 1, end: 17 },
  { book: '2 Crónicas', start: 10, end: 28 },
  { book: 'Jonás', start: 1, end: 4 },
  { book: 'Amós', start: 1, end: 9 },
  { book: 'Oseas', start: 1, end: 14 },
  { book: 'Miqueas', start: 1, end: 7 },
  { book: 'Isaías', start: 1, end: 39 },
  { book: 'Nahum', start: 1, end: 3 },
  { book: 'Sofonías', start: 1, end: 3 },
  { book: 'Habacuc', start: 1, end: 3 },
  // Últimos reyes de Judá
  { book: '2 Reyes', start: 18, end: 25 },
  { book: '2 Crónicas', start: 29, end: 36 },
  { book: 'Jeremías', start: 1, end: 52 },
  { book: 'Lamentaciones', start: 1, end: 5 },
  { book: 'Salmos', start: 42, end: 72 },
  // Exilio
  { book: 'Ezequiel', start: 1, end: 48 },
  { book: 'Daniel', start: 1, end: 12 },
  { book: 'Salmos', start: 73, end: 89 },
  // Post-exilio
  { book: 'Esdras', start: 1, end: 6 },
  { book: 'Hageo', start: 1, end: 2 },
  { book: 'Zacarías', start: 1, end: 14 },
  { book: 'Ester', start: 1, end: 10 },
  { book: 'Esdras', start: 7, end: 10 },
  { book: 'Nehemías', start: 1, end: 13 },
  { book: 'Malaquías', start: 1, end: 4 },
  { book: 'Salmos', start: 90, end: 150 },
  { book: 'Isaías', start: 40, end: 66 },
  { book: 'Abdías', start: 1, end: 1 },
  { book: 'Joel', start: 1, end: 3 },
  // Nuevo Testamento
  { book: 'Lucas', start: 1, end: 2 },
  { book: 'Mateo', start: 1, end: 2 },
  { book: 'Mateo', start: 3, end: 4 },
  { book: 'Marcos', start: 1, end: 1 },
  { book: 'Lucas', start: 3, end: 4 },
  { book: 'Juan', start: 1, end: 4 },
  { book: 'Mateo', start: 5, end: 7 },
  { book: 'Mateo', start: 8, end: 15 },
  { book: 'Marcos', start: 2, end: 8 },
  { book: 'Lucas', start: 5, end: 9 },
  { book: 'Juan', start: 5, end: 6 },
  { book: 'Mateo', start: 16, end: 20 },
  { book: 'Marcos', start: 9, end: 10 },
  { book: 'Lucas', start: 10, end: 18 },
  { book: 'Juan', start: 7, end: 11 },
  { book: 'Mateo', start: 21, end: 25 },
  { book: 'Marcos', start: 11, end: 13 },
  { book: 'Lucas', start: 19, end: 21 },
  { book: 'Juan', start: 12, end: 17 },
  { book: 'Mateo', start: 26, end: 28 },
  { book: 'Marcos', start: 14, end: 16 },
  { book: 'Lucas', start: 22, end: 24 },
  { book: 'Juan', start: 18, end: 21 },
  { book: 'Hechos', start: 1, end: 12 },
  { book: 'Santiago', start: 1, end: 5 },
  { book: 'Hechos', start: 13, end: 14 },
  { book: 'Gálatas', start: 1, end: 6 },
  { book: 'Hechos', start: 15, end: 18 },
  { book: '1 Tesalonicenses', start: 1, end: 5 },
  { book: '2 Tesalonicenses', start: 1, end: 3 },
  { book: 'Hechos', start: 19, end: 20 },
  { book: '1 Corintios', start: 1, end: 16 },
  { book: '2 Corintios', start: 1, end: 13 },
  { book: 'Romanos', start: 1, end: 16 },
  { book: 'Hechos', start: 21, end: 28 },
  { book: 'Efesios', start: 1, end: 6 },
  { book: 'Filipenses', start: 1, end: 4 },
  { book: 'Colosenses', start: 1, end: 4 },
  { book: 'Filemón', start: 1, end: 1 },
  { book: '1 Timoteo', start: 1, end: 6 },
  { book: 'Tito', start: 1, end: 3 },
  { book: '2 Timoteo', start: 1, end: 4 },
  { book: '1 Pedro', start: 1, end: 5 },
  { book: '2 Pedro', start: 1, end: 3 },
  { book: 'Hebreos', start: 1, end: 13 },
  { book: '1 Juan', start: 1, end: 5 },
  { book: '2 Juan', start: 1, end: 1 },
  { book: '3 Juan', start: 1, end: 1 },
  { book: 'Judas', start: 1, end: 1 },
  { book: 'Apocalipsis', start: 1, end: 22 },
];

// Expandir a capítulos individuales
const chronologicalChapters = [];
chronologicalOrder.forEach(range => {
  for (let ch = range.start; ch <= range.end; ch++) {
    const found = chapters.find(c => c.book === range.book && c.chapter === ch);
    if (found) {
      chronologicalChapters.push(found);
    }
  }
});

console.log(`Capítulos en orden cronológico: ${chronologicalChapters.length}`);
const chronologicalDays = balanceInto365Days(chronologicalChapters);

// ============================================================================
// PASO 4: Generar código TypeScript
// ============================================================================

function formatReadings(readings) {
  // Agrupar por libro
  const grouped = {};
  readings.forEach(r => {
    const key = r.book;
    if (!grouped[key])
      grouped[key] = { bookId: r.bookId, chapters: [], hasPartial: false };

    if (r.isPartial) {
      grouped[key].chapters.push({
        chapter: r.chapter,
        startVerse: r.startVerse,
        endVerse: r.endVerse,
      });
      grouped[key].hasPartial = true;
    } else {
      grouped[key].chapters.push(r.chapter);
    }
  });

  return Object.entries(grouped).map(([book, data]) => {
    if (data.hasPartial) {
      const ranges = data.chapters.map(ch => {
        if (typeof ch === 'number') {
          return `{ chapter: ${ch} }`;
        } else {
          return `{ chapter: ${ch.chapter}, startVerse: ${ch.startVerse}, endVerse: ${ch.endVerse} }`;
        }
      });
      return `{ book: '${book}', bookId: BOOK_IDS['${book}'], verseRanges: [${ranges.join(
        ', ',
      )}] }`;
    } else {
      return `{ book: '${book}', bookId: BOOK_IDS['${book}'], chapters: [${data.chapters.join(
        ', ',
      )}] }`;
    }
  });
}

function generatePlanCode(days, varName) {
  let code = `const ${varName}Readings: DailyReading[] = [\n`;

  days.forEach((day, index) => {
    const readingsStr = formatReadings(day.readings).join(',\n      ');
    code += `  { day: ${
      index + 1
    }, readings: [\n      ${readingsStr}\n    ] },\n`;
  });

  code += `];\n`;
  return code;
}

// Generar estadísticas
function getStats(days) {
  const verses = days.map(d => d.verses);
  return {
    min: Math.min(...verses),
    max: Math.max(...verses),
    avg: Math.round(verses.reduce((a, b) => a + b, 0) / verses.length),
  };
}

console.log('\n=== ESTADÍSTICAS ===');
console.log('Canónico:', getStats(canonicalDays));
console.log('Cronológico:', getStats(chronologicalDays));
console.log('Mixto:', getStats(mixedDays));
console.log('NT+Salmos:', getStats(ntPsalmsDays));

// Guardar archivo
const output = `// Planes de lectura anual - Generado automáticamente
// Fecha: ${new Date().toISOString().split('T')[0]}

import { DailyReading } from '../types/yearlyPlan';
import { BOOK_IDS } from './bookIds';

${generatePlanCode(canonicalDays, 'canonical')}

${generatePlanCode(chronologicalDays, 'chronological')}

${generatePlanCode(mixedDays, 'mixed')}

${generatePlanCode(ntPsalmsDays, 'ntPsalms')}

export { canonicalReadings, chronologicalReadings, mixedReadings, ntPsalmsReadings };
`;

const outputPath = path.join(
  __dirname,
  '../src/data/generatedYearlyReadings.ts',
);
fs.writeFileSync(outputPath, output);
console.log(`\nArchivo generado: ${outputPath}`);
