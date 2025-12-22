/**
 * Verificación rápida de planes anuales
 */

const fs = require('fs');

// Leer la Biblia
const bible = JSON.parse(
  fs.readFileSync('./src/textContent/rv1909.json', 'utf8'),
);

// Construir lista de capítulos esperados
const expectedChapters = new Set();
const verseCount = {};
bible.testament.forEach(testament => {
  testament.books.forEach(book => {
    book.chapters.forEach((chapter, idx) => {
      if (chapter.verses && chapter.verses.length > 0) {
        const key = `${book.name}:${idx + 1}`;
        expectedChapters.add(key);
        verseCount[key] = chapter.verses.length;
      }
    });
  });
});

console.log(`Biblia: ${expectedChapters.size} capítulos\n`);

// Leer el archivo generado
const content = fs.readFileSync(
  './src/data/generatedYearlyReadings.ts',
  'utf8',
);

// Función para verificar un plan
function verifyPlan(planName, varName) {
  // Encontrar el bloque del plan usando indexOf
  const startMarker = `const ${varName}Readings`;
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    console.log(`❌ No se encontró ${planName}`);
    return;
  }

  // Encontrar el final del array (próximo 'const' o 'export')
  let endIdx = content.indexOf('\nconst ', startIdx + 1);
  if (endIdx === -1) endIdx = content.indexOf('\nexport', startIdx);
  if (endIdx === -1) endIdx = content.length;

  const planContent = content.substring(startIdx, endIdx);
  const covered = new Set();

  // Contar días
  const dayMatches = planContent.match(/\{ day: \d+/g) || [];

  // Extraer capítulos con patrón simple
  const bookChapterPattern = /book: '([^']+)'.*?chapters: \[([^\]]+)\]/g;
  let match;
  while ((match = bookChapterPattern.exec(planContent)) !== null) {
    const book = match[1];
    const chapters = match[2]
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
    chapters.forEach(ch => covered.add(`${book}:${ch}`));
  }

  // Extraer verseRanges
  const rangePattern = /book: '([^']+)'.*?verseRanges: \[([\s\S]*?)\]/g;
  while ((match = rangePattern.exec(planContent)) !== null) {
    const book = match[1];
    const rangesStr = match[2];
    const chapterMatches = rangesStr.match(/chapter: (\d+)/g) || [];
    chapterMatches.forEach(m => {
      const ch = parseInt(m.replace('chapter: ', ''));
      covered.add(`${book}:${ch}`);
    });
  }

  // Calcular faltantes
  const missing = [];
  expectedChapters.forEach(key => {
    if (!covered.has(key)) missing.push(key);
  });

  console.log(`=== ${planName} ===`);
  console.log(
    `Días: ${dayMatches.length} ${dayMatches.length === 365 ? '✅' : '❌'}`,
  );
  console.log(
    `Capítulos: ${covered.size}/${expectedChapters.size} ${
      missing.length === 0 ? '✅' : '❌'
    }`,
  );

  if (missing.length > 0 && missing.length <= 20) {
    console.log(`Faltantes: ${missing.join(', ')}`);
  } else if (missing.length > 20) {
    console.log(`Faltantes: ${missing.length} capítulos`);
    // Agrupar por libro
    const byBook = {};
    missing.forEach(m => {
      const [book] = m.split(':');
      byBook[book] = (byBook[book] || 0) + 1;
    });
    Object.entries(byBook)
      .slice(0, 5)
      .forEach(([book, count]) => {
        console.log(`  ${book}: ${count} caps`);
      });
  }

  console.log();
}

verifyPlan('CANÓNICO', 'canonical');
verifyPlan('CRONOLÓGICO', 'chronological');
verifyPlan('MIXTO AT/NT', 'mixed');
verifyPlan('NT+SALMOS', 'ntPsalms');
