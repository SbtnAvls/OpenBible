/**
 * Script para arreglar el archivo rv1909.json
 * Problema: Malaquías está anidado dentro de Zacarías como "capítulo 15"
 */

const fs = require('fs');
const path = require('path');

const biblePath = path.join(__dirname, '../src/textContent/rv1909.json');
const bible = JSON.parse(fs.readFileSync(biblePath, 'utf8'));

const at = bible.testament[0];

// Encontrar Zacarías
const zacariasIndex = at.books.findIndex(b => b.name === 'Zacarías');
const zacarias = at.books[zacariasIndex];

console.log('Antes de arreglar:');
console.log(`- Zacarías tiene ${zacarias.chapters.length} capítulos`);
console.log(`- AT tiene ${at.books.length} libros`);

// El "capítulo 15" es en realidad Malaquías
const malaquiasData = zacarias.chapters[14]; // índice 14

if (malaquiasData.name === 'Malaquías' && malaquiasData.chapters) {
  console.log('\n✓ Encontrado Malaquías anidado en Zacarías');
  console.log(`  Malaquías tiene ${malaquiasData.chapters.length} capítulos`);

  // 1. Eliminar el "capítulo 15" de Zacarías
  zacarias.chapters = zacarias.chapters.slice(0, 14);

  // 2. Crear el libro de Malaquías correctamente
  const malaquias = {
    name: 'Malaquías',
    chapters: malaquiasData.chapters,
  };

  // 3. Agregar Malaquías después de Zacarías
  at.books.splice(zacariasIndex + 1, 0, malaquias);

  console.log('\nDespués de arreglar:');
  console.log(`- Zacarías tiene ${zacarias.chapters.length} capítulos`);
  console.log(`- AT tiene ${at.books.length} libros`);
  console.log(`- Malaquías tiene ${malaquias.chapters.length} capítulos`);

  // Verificar
  const lastBooks = at.books.slice(-3);
  console.log('\nÚltimos 3 libros del AT:');
  lastBooks.forEach(b =>
    console.log(`  - ${b.name}: ${b.chapters.length} caps`),
  );

  // Guardar
  const backupPath = biblePath.replace('.json', '_backup.json');
  fs.copyFileSync(biblePath, backupPath);
  console.log(`\n✓ Backup creado: ${backupPath}`);

  fs.writeFileSync(biblePath, JSON.stringify(bible, null, 2));
  console.log(`✓ Archivo arreglado: ${biblePath}`);
} else {
  console.log('El archivo ya está arreglado o tiene una estructura diferente');
  console.log('Capítulo 15:', malaquiasData);
}
