/**
 * Verificación simplificada de planes anuales
 */

const fs = require('fs');
const path = require('path');

// Leer la Biblia
const bible = JSON.parse(
  fs.readFileSync('./src/textContent/rv1909.json', 'utf8'),
);

// Construir estructura esperada
const expectedChapters = new Map();
bible.testament.forEach(testament => {
  testament.books.forEach(book => {
    book.chapters.forEach((chapter, idx) => {
      if (chapter.verses && chapter.verses.length > 0) {
        expectedChapters.set(`${book.name}:${idx + 1}`, chapter.verses.length);
      }
    });
  });
});

console.log(`Biblia: ${expectedChapters.size} capítulos\n`);

// Leer archivo generado y extraer datos manualmente
const content = fs.readFileSync(
  './src/data/generatedYearlyReadings.ts',
  'utf8',
);

// Función para analizar un plan
function analyzePlan(planName, startLine, endLine) {
  const lines = content.split('\n').slice(startLine - 1, endLine);
  const planContent = lines.join('\n');

  // Contar días
  const dayMatches = planContent.match(/\{ day: \d+/g) || [];
  const numDays = dayMatches.length;

  // Extraer capítulos cubiertos
  const covered = new Set();
  const versesPerDay = [];

  // Buscar patrones de chapters: [...]
  const chapterPattern = /book: '([^']+)'[^}]*?chapters: \[([^\]]+)\]/g;
  let match;
  while ((match = chapterPattern.exec(planContent)) !== null) {
    const book = match[1];
    const chapters = match[2]
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
    chapters.forEach(ch => covered.add(`${book}:${ch}`));
  }

  // Buscar patrones de verseRanges
  const rangePattern = /book: '([^']+)'[^}]*?verseRanges: \[([\s\S]*?)\]\s*\}/g;
  while ((match = rangePattern.exec(planContent)) !== null) {
    const book = match[1];
    const rangesStr = match[2];
    const chapterNums = rangesStr.match(/chapter: (\d+)/g) || [];
    chapterNums.forEach(m => {
      const ch = parseInt(m.replace('chapter: ', ''));
      covered.add(`${book}:${ch}`);
    });
  }

  // Calcular faltantes
  const missing = [];
  expectedChapters.forEach((verses, key) => {
    if (!covered.has(key)) {
      missing.push(key);
    }
  });

  // Calcular versículos por día (aproximado)
  let totalVerses = 0;
  covered.forEach(key => {
    totalVerses += expectedChapters.get(key) || 0;
  });

  console.log(`=== ${planName} ===`);
  console.log(`Días: ${numDays} ${numDays === 365 ? '✅' : '❌'}`);
  console.log(`Capítulos cubiertos: ${covered.size}/${expectedChapters.size}`);
  console.log(`Total versículos: ${totalVerses}`);

  if (missing.length === 0) {
    console.log('✅ Todos los capítulos incluidos');
  } else {
    console.log(`❌ Faltan ${missing.length} capítulos:`);
    // Agrupar por libro
    const byBook = {};
    missing.forEach(m => {
      const [book, ch] = m.split(':');
      if (!byBook[book]) byBook[book] = [];
      byBook[book].push(parseInt(ch));
    });
    Object.entries(byBook).forEach(([book, chs]) => {
      chs.sort((a, b) => a - b);
      console.log(`   ${book}: caps ${chs.join(', ')}`);
    });
  }

  // Verificar extras (capítulos que no existen)
  const extras = [];
  covered.forEach(key => {
    if (!expectedChapters.has(key)) {
      extras.push(key);
    }
  });
  if (extras.length > 0) {
    console.log(`⚠️ Capítulos inexistentes: ${extras.join(', ')}`);
  }

  console.log();
  return { days: numDays, covered: covered.size, missing: missing.length };
}

// Encontrar líneas de cada plan
const lines = content.split('\n');
let canonicalStart = 0,
  canonicalEnd = 0;
let chronoStart = 0,
  chronoEnd = 0;

lines.forEach((line, i) => {
  if (line.includes('const canonicalReadings')) canonicalStart = i + 1;
  if (line.includes('const chronologicalReadings')) {
    canonicalEnd = i;
    chronoStart = i + 1;
  }
  if (line.includes('const mixedReadings')) chronoEnd = i;
});

console.log(`Canónico: líneas ${canonicalStart}-${canonicalEnd}`);
console.log(`Cronológico: líneas ${chronoStart}-${chronoEnd}\n`);

const canonicalResult = analyzePlan('CANÓNICO', canonicalStart, canonicalEnd);
const chronoResult = analyzePlan('CRONOLÓGICO', chronoStart, chronoEnd);

// Verificar qué libros están en la Biblia vs en BOOK_IDS
console.log('=== VERIFICACIÓN DE LIBROS ===');
const bibleBooks = new Set();
bible.testament.forEach(t => t.books.forEach(b => bibleBooks.add(b.name)));
console.log('Libros en la Biblia:', [...bibleBooks].join(', '));
