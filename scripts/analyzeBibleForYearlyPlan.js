/**
 * Script para analizar la Biblia y generar distribuciones inteligentes
 * para planes de lectura anual basados en cantidad de versículos.
 *
 * Uso: node scripts/analyzeBibleForYearlyPlan.js
 */

const fs = require('fs');
const path = require('path');

// Leer el contenido de la Biblia
const biblePath = path.join(__dirname, '../src/textContent/rv1909.json');
const bible = JSON.parse(fs.readFileSync(biblePath, 'utf8'));

// Estructura para almacenar info de cada capítulo
const chapters = [];
let totalVerses = 0;

// Analizar cada libro y capítulo
bible.testament.forEach((testament, testamentIndex) => {
  testament.books.forEach((book, bookIndex) => {
    book.chapters.forEach((chapter, chapterIndex) => {
      // Saltar capítulos vacíos o mal formados
      if (
        !chapter.verses ||
        !Array.isArray(chapter.verses) ||
        chapter.verses.length === 0
      ) {
        console.log(`⚠️ Capítulo vacío: ${book.name} ${chapterIndex + 1}`);
        return;
      }
      const verseCount = chapter.verses.length;
      // Calcular "peso" basado en longitud promedio de versículos
      const avgVerseLength =
        chapter.verses.reduce((sum, v) => sum + v.text.length, 0) / verseCount;
      const weight = verseCount * (avgVerseLength / 100); // Normalizado

      chapters.push({
        testament: testamentIndex === 0 ? 'AT' : 'NT',
        book: book.name,
        bookIndex: testamentIndex === 0 ? bookIndex : bookIndex + 39,
        chapter: chapterIndex + 1,
        verses: verseCount,
        avgLength: Math.round(avgVerseLength),
        weight: Math.round(weight * 10) / 10,
      });
      totalVerses += verseCount;
    });
  });
});

console.log('='.repeat(70));
console.log('ANÁLISIS DE LA BIBLIA PARA PLAN ANUAL');
console.log('='.repeat(70));
console.log(`\nTotal capítulos: ${chapters.length}`);
console.log(`Total versículos: ${totalVerses}`);
console.log(
  `Promedio versículos/día (365 días): ${(totalVerses / 365).toFixed(1)}`,
);

// Encontrar capítulos más largos y más cortos
const sortedByVerses = [...chapters].sort((a, b) => b.verses - a.verses);
console.log('\n--- CAPÍTULOS MÁS LARGOS ---');
sortedByVerses.slice(0, 15).forEach(ch => {
  console.log(
    `${ch.book} ${ch.chapter}: ${ch.verses} versículos (peso: ${ch.weight})`,
  );
});

console.log('\n--- CAPÍTULOS MÁS CORTOS ---');
sortedByVerses
  .slice(-15)
  .reverse()
  .forEach(ch => {
    console.log(`${ch.book} ${ch.chapter}: ${ch.verses} versículos`);
  });

// Estadísticas por libro
console.log('\n--- VERSÍCULOS POR LIBRO ---');
const bookStats = {};
chapters.forEach(ch => {
  if (!bookStats[ch.book]) {
    bookStats[ch.book] = { chapters: 0, verses: 0, testament: ch.testament };
  }
  bookStats[ch.book].chapters++;
  bookStats[ch.book].verses += ch.verses;
});

Object.entries(bookStats)
  .sort((a, b) => b[1].verses - a[1].verses)
  .slice(0, 20)
  .forEach(([book, stats]) => {
    console.log(
      `${book}: ${stats.chapters} caps, ${stats.verses} versículos (${stats.testament})`,
    );
  });

// ============================================================================
// GENERAR DISTRIBUCIÓN CANÓNICA BALANCEADA
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('GENERANDO DISTRIBUCIÓN CANÓNICA BALANCEADA');
console.log('='.repeat(70));

const targetVersesPerDay = totalVerses / 365;
console.log(`\nObjetivo: ~${targetVersesPerDay.toFixed(0)} versículos/día`);

function generateBalancedPlan(chapterList, planName) {
  const days = [];
  let currentDay = { readings: [], verses: 0 };

  // Umbral flexible: entre 80% y 150% del objetivo
  const minVerses = targetVersesPerDay * 0.6;
  const maxVerses = targetVersesPerDay * 1.5;

  chapterList.forEach((ch, index) => {
    // Si agregar este capítulo excede mucho el máximo Y ya tenemos suficiente, nuevo día
    if (
      currentDay.verses + ch.verses > maxVerses &&
      currentDay.verses >= minVerses
    ) {
      days.push(currentDay);
      currentDay = { readings: [], verses: 0 };
    }

    currentDay.readings.push(ch);
    currentDay.verses += ch.verses;

    // Si alcanzamos el objetivo y el siguiente capítulo es de otro libro, cerrar día
    const nextCh = chapterList[index + 1];
    if (
      currentDay.verses >= targetVersesPerDay &&
      nextCh &&
      nextCh.book !== ch.book
    ) {
      days.push(currentDay);
      currentDay = { readings: [], verses: 0 };
    }
  });

  // Agregar el último día si tiene contenido
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
      if (sum < minSum) {
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
    // Dividir el día más largo
    let maxVerses = 0;
    let maxIndex = 0;
    for (let i = 0; i < days.length; i++) {
      if (days[i].verses > maxVerses && days[i].readings.length > 1) {
        maxVerses = days[i].verses;
        maxIndex = i;
      }
    }

    if (days[maxIndex].readings.length <= 1) break;

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

  return days;
}

const canonicalPlan = generateBalancedPlan(chapters, 'Canónico');

console.log(`\nDías generados: ${canonicalPlan.length}`);

// Estadísticas de la distribución
const versesPerDay = canonicalPlan.map(d => d.verses);
const minDay = Math.min(...versesPerDay);
const maxDay = Math.max(...versesPerDay);
const avgDay = versesPerDay.reduce((a, b) => a + b, 0) / versesPerDay.length;

console.log(
  `Versículos/día - Mín: ${minDay}, Máx: ${maxDay}, Promedio: ${avgDay.toFixed(
    1,
  )}`,
);

// Mostrar días más largos
console.log('\n--- DÍAS MÁS LARGOS ---');
const sortedDays = canonicalPlan
  .map((d, i) => ({ ...d, dayNum: i + 1 }))
  .sort((a, b) => b.verses - a.verses);

sortedDays.slice(0, 10).forEach(day => {
  const readings = day.readings.map(r => `${r.book} ${r.chapter}`).join(', ');
  console.log(`Día ${day.dayNum}: ${day.verses} versículos - ${readings}`);
});

console.log('\n--- DÍAS MÁS CORTOS ---');
sortedDays
  .slice(-10)
  .reverse()
  .forEach(day => {
    const readings = day.readings.map(r => `${r.book} ${r.chapter}`).join(', ');
    console.log(`Día ${day.dayNum}: ${day.verses} versículos - ${readings}`);
  });

// ============================================================================
// GENERAR CÓDIGO TYPESCRIPT
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('GENERANDO CÓDIGO TYPESCRIPT');
console.log('='.repeat(70));

function generateTypeScriptPlan(days, planName) {
  let code = `// Plan ${planName} - Generado automáticamente\n`;
  code += `// Total: ${days.length} días\n\n`;
  code += `const ${planName.toLowerCase()}Readings: DailyReading[] = [\n`;

  days.forEach((day, index) => {
    // Agrupar lecturas por libro
    const grouped = {};
    day.readings.forEach(r => {
      if (!grouped[r.book]) grouped[r.book] = [];
      grouped[r.book].push(r.chapter);
    });

    const readingsStr = Object.entries(grouped)
      .map(([book, chs]) => {
        return `{ book: '${book}', bookId: BOOK_IDS['${book}'], chapters: [${chs.join(
          ', ',
        )}] }`;
      })
      .join(',\n      ');

    code += `  { day: ${
      index + 1
    }, readings: [\n      ${readingsStr}\n    ] },\n`;
  });

  code += `];\n`;
  return code;
}

// Guardar el plan canónico generado
const outputPath = path.join(
  __dirname,
  '../src/data/generatedCanonicalPlan.ts',
);
const tsCode = generateTypeScriptPlan(canonicalPlan, 'Canonical');

fs.writeFileSync(outputPath, tsCode);
console.log(`\nPlan canónico guardado en: ${outputPath}`);

// ============================================================================
// RESUMEN FINAL
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('RESUMEN');
console.log('='.repeat(70));
console.log(`
PARA CREAR LOS 4 PLANES NECESITAMOS:

1. CANÓNICO: Ya generado arriba (Génesis → Apocalipsis balanceado)

2. CRONOLÓGICO: Requiere orden histórico manual, pero podemos balancear
   los versículos automáticamente una vez definido el orden.

3. MIXTO AT/NT: Calcular proporción diaria de AT y NT

4. NT + SALMOS: Distribuir NT + Salmos equilibradamente

Próximo paso: Revisar el plan canónico generado y ajustar si es necesario.
`);
