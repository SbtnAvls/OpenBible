/**
 * Script para verificar que los planes anuales:
 * 1. Tienen exactamente 365 días
 * 2. Incluyen todos los libros y capítulos de la Biblia
 * 3. Están bien balanceados
 */

const fs = require('fs');
const path = require('path');

// Leer la Biblia para obtener la estructura real
const biblePath = path.join(__dirname, '../src/textContent/rv1909.json');
const bible = JSON.parse(fs.readFileSync(biblePath, 'utf8'));

// Construir lista de todos los capítulos que deberían existir
const expectedChapters = new Map(); // "Libro:Capítulo" -> versículos
let totalExpectedVerses = 0;

bible.testament.forEach(testament => {
  testament.books.forEach(book => {
    book.chapters.forEach((chapter, idx) => {
      if (chapter.verses && chapter.verses.length > 0) {
        const key = `${book.name}:${idx + 1}`;
        expectedChapters.set(key, chapter.verses.length);
        totalExpectedVerses += chapter.verses.length;
      }
    });
  });
});

console.log('='.repeat(70));
console.log('VERIFICACIÓN DE PLANES ANUALES');
console.log('='.repeat(70));
console.log(
  `\nBiblia tiene: ${expectedChapters.size} capítulos, ${totalExpectedVerses} versículos\n`,
);

// Leer el archivo generado
const generatedPath = path.join(
  __dirname,
  '../src/data/generatedYearlyReadings.ts',
);
const content = fs.readFileSync(generatedPath, 'utf8');

// Función para extraer lecturas de un plan
function extractPlan(content, planName) {
  const regex = new RegExp(`const ${planName}Readings[\\s\\S]*?\\];`, 'g');
  const match = content.match(regex);
  if (!match) return null;

  const planContent = match[0];
  const days = [];

  // Extraer cada día
  const dayRegex = /\{ day: (\d+), readings: \[([\s\S]*?)\] \}/g;
  let dayMatch;

  while ((dayMatch = dayRegex.exec(planContent)) !== null) {
    const dayNum = parseInt(dayMatch[1]);
    const readingsStr = dayMatch[2];

    const readings = [];

    // Extraer lecturas con chapters
    const chapterRegex = /book: '([^']+)'[^}]*chapters: \[([^\]]+)\]/g;
    let chMatch;
    while ((chMatch = chapterRegex.exec(readingsStr)) !== null) {
      const book = chMatch[1];
      const chapters = chMatch[2].split(',').map(c => parseInt(c.trim()));
      chapters.forEach(ch => {
        if (!isNaN(ch)) {
          readings.push({ book, chapter: ch, isPartial: false });
        }
      });
    }

    // Extraer lecturas con verseRanges
    const rangeRegex = /book: '([^']+)'[^}]*verseRanges: \[([\s\S]*?)\]/g;
    let rangeMatch;
    while ((rangeMatch = rangeRegex.exec(readingsStr)) !== null) {
      const book = rangeMatch[1];
      const rangesStr = rangeMatch[2];

      // Extraer cada rango
      const singleRangeRegex =
        /chapter: (\d+)(?:, startVerse: (\d+), endVerse: (\d+))?/g;
      let singleMatch;
      while ((singleMatch = singleRangeRegex.exec(rangesStr)) !== null) {
        const chapter = parseInt(singleMatch[1]);
        const startVerse = singleMatch[2] ? parseInt(singleMatch[2]) : null;
        const endVerse = singleMatch[3] ? parseInt(singleMatch[3]) : null;

        readings.push({
          book,
          chapter,
          startVerse,
          endVerse,
          isPartial: startVerse !== null,
        });
      }
    }

    days.push({ day: dayNum, readings });
  }

  return days;
}

// Función para verificar un plan
function verifyPlan(planName, days) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`PLAN: ${planName.toUpperCase()}`);
  console.log('='.repeat(70));

  if (!days || days.length === 0) {
    console.log('❌ No se pudo extraer el plan');
    return;
  }

  // 1. Verificar cantidad de días
  console.log(
    `\n📅 Días: ${days.length} ${
      days.length === 365 ? '✅' : '❌ (debería ser 365)'
    }`,
  );

  // 2. Contar capítulos cubiertos
  const coveredChapters = new Map(); // "Libro:Capítulo" -> { count, verses covered }
  let totalVersesInPlan = 0;
  const versesPerDay = [];

  days.forEach(day => {
    let dayVerses = 0;

    day.readings.forEach(reading => {
      const key = `${reading.book}:${reading.chapter}`;
      const expectedVerses = expectedChapters.get(key) || 0;

      if (!coveredChapters.has(key)) {
        coveredChapters.set(key, { count: 0, versesCovered: 0 });
      }

      const entry = coveredChapters.get(key);
      entry.count++;

      if (reading.isPartial) {
        const covered = reading.endVerse - reading.startVerse + 1;
        entry.versesCovered += covered;
        dayVerses += covered;
      } else {
        entry.versesCovered += expectedVerses;
        dayVerses += expectedVerses;
      }
    });

    versesPerDay.push(dayVerses);
    totalVersesInPlan += dayVerses;
  });

  // 3. Verificar cobertura completa
  const missingChapters = [];
  const duplicateChapters = [];
  const incompleteChapters = [];

  expectedChapters.forEach((expectedVerses, key) => {
    if (!coveredChapters.has(key)) {
      missingChapters.push(key);
    } else {
      const entry = coveredChapters.get(key);
      if (entry.count > 1 && !key.includes('Salmos:119')) {
        // Salmo 119 puede estar dividido
        duplicateChapters.push(`${key} (${entry.count}x)`);
      }
      if (entry.versesCovered < expectedVerses * 0.95) {
        // Menos del 95% cubierto
        incompleteChapters.push(
          `${key}: ${entry.versesCovered}/${expectedVerses}`,
        );
      }
    }
  });

  // También verificar capítulos que no existen en la Biblia
  const extraChapters = [];
  coveredChapters.forEach((_, key) => {
    if (!expectedChapters.has(key)) {
      extraChapters.push(key);
    }
  });

  console.log(
    `\n📚 Capítulos cubiertos: ${coveredChapters.size}/${expectedChapters.size}`,
  );

  if (missingChapters.length === 0) {
    console.log('✅ Todos los capítulos de la Biblia están incluidos');
  } else {
    console.log(`❌ Capítulos FALTANTES (${missingChapters.length}):`);
    missingChapters.slice(0, 20).forEach(ch => console.log(`   - ${ch}`));
    if (missingChapters.length > 20)
      console.log(`   ... y ${missingChapters.length - 20} más`);
  }

  if (extraChapters.length > 0) {
    console.log(
      `\n⚠️ Capítulos que no existen en la Biblia (${extraChapters.length}):`,
    );
    extraChapters.forEach(ch => console.log(`   - ${ch}`));
  }

  if (duplicateChapters.length > 0) {
    console.log(`\n⚠️ Capítulos duplicados (${duplicateChapters.length}):`);
    duplicateChapters.slice(0, 10).forEach(ch => console.log(`   - ${ch}`));
  }

  // 4. Estadísticas de balance
  const minVerses = Math.min(...versesPerDay);
  const maxVerses = Math.max(...versesPerDay);
  const avgVerses =
    versesPerDay.reduce((a, b) => a + b, 0) / versesPerDay.length;
  const stdDev = Math.sqrt(
    versesPerDay.reduce((sum, v) => sum + Math.pow(v - avgVerses, 2), 0) /
      versesPerDay.length,
  );

  console.log(`\n📊 Balance de versículos por día:`);
  console.log(`   Mínimo:    ${minVerses} versículos`);
  console.log(`   Máximo:    ${maxVerses} versículos`);
  console.log(`   Promedio:  ${avgVerses.toFixed(1)} versículos`);
  console.log(`   Desv. Est: ${stdDev.toFixed(1)}`);
  console.log(
    `   Total:     ${totalVersesInPlan} versículos ${
      Math.abs(totalVersesInPlan - totalExpectedVerses) < 10 ? '✅' : '⚠️'
    }`,
  );

  // 5. Mostrar días extremos
  const daysWithVerses = days.map((d, i) => ({
    day: i + 1,
    verses: versesPerDay[i],
    readings: d.readings,
  }));
  daysWithVerses.sort((a, b) => b.verses - a.verses);

  console.log(`\n📈 Días más largos:`);
  daysWithVerses.slice(0, 5).forEach(d => {
    const readingsList = d.readings
      .map(
        r =>
          `${r.book} ${r.chapter}${
            r.isPartial ? `:${r.startVerse}-${r.endVerse}` : ''
          }`,
      )
      .join(', ');
    console.log(
      `   Día ${d.day}: ${d.verses} vers. - ${readingsList.substring(0, 60)}${
        readingsList.length > 60 ? '...' : ''
      }`,
    );
  });

  console.log(`\n📉 Días más cortos:`);
  daysWithVerses
    .slice(-5)
    .reverse()
    .forEach(d => {
      const readingsList = d.readings
        .map(
          r =>
            `${r.book} ${r.chapter}${
              r.isPartial ? `:${r.startVerse}-${r.endVerse}` : ''
            }`,
        )
        .join(', ');
      console.log(
        `   Día ${d.day}: ${d.verses} vers. - ${readingsList.substring(0, 60)}${
          readingsList.length > 60 ? '...' : ''
        }`,
      );
    });

  // Verificar libros cubiertos
  const booksInPlan = new Set();
  coveredChapters.forEach((_, key) => {
    booksInPlan.add(key.split(':')[0]);
  });

  const expectedBooks = new Set();
  expectedChapters.forEach((_, key) => {
    expectedBooks.add(key.split(':')[0]);
  });

  const missingBooks = [...expectedBooks].filter(b => !booksInPlan.has(b));
  console.log(
    `\n📖 Libros cubiertos: ${booksInPlan.size}/${expectedBooks.size}`,
  );
  if (missingBooks.length > 0) {
    console.log(`❌ Libros FALTANTES: ${missingBooks.join(', ')}`);
  } else {
    console.log('✅ Todos los libros de la Biblia están incluidos');
  }

  return {
    days: days.length,
    chaptersExpected: expectedChapters.size,
    chaptersCovered: coveredChapters.size,
    missing: missingChapters.length,
    balance: {
      min: minVerses,
      max: maxVerses,
      avg: avgVerses.toFixed(1),
      stdDev: stdDev.toFixed(1),
    },
  };
}

// Verificar planes
const canonicalDays = extractPlan(content, 'canonical');
const chronologicalDays = extractPlan(content, 'chronological');

const canonicalResult = verifyPlan('Canónico', canonicalDays);
const chronologicalResult = verifyPlan('Cronológico', chronologicalDays);

// Resumen final
console.log(`\n${'='.repeat(70)}`);
console.log('RESUMEN FINAL');
console.log('='.repeat(70));
console.log(`
Plan Canónico:
  - Días: ${canonicalResult?.days || 'N/A'}
  - Capítulos: ${canonicalResult?.chaptersCovered || 'N/A'}/${
  canonicalResult?.chaptersExpected || 'N/A'
}
  - Faltantes: ${canonicalResult?.missing || 'N/A'}
  - Balance: ${canonicalResult?.balance?.min || 'N/A'}-${
  canonicalResult?.balance?.max || 'N/A'
} (avg: ${canonicalResult?.balance?.avg || 'N/A'})

Plan Cronológico:
  - Días: ${chronologicalResult?.days || 'N/A'}
  - Capítulos: ${chronologicalResult?.chaptersCovered || 'N/A'}/${
  chronologicalResult?.chaptersExpected || 'N/A'
}
  - Faltantes: ${chronologicalResult?.missing || 'N/A'}
  - Balance: ${chronologicalResult?.balance?.min || 'N/A'}-${
  chronologicalResult?.balance?.max || 'N/A'
} (avg: ${chronologicalResult?.balance?.avg || 'N/A'})
`);
