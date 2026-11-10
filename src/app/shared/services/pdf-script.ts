// Detección del alfabeto del informe PDF de resultados.
//
// pdfmake solo trae Roboto (vfs_fonts), que cubre latino, cirílico y griego. Cualquier otra
// letra (devanagari, bengalí, árabe, hebreo, CJK, tailandés...) sale como un cuadro vacío,
// así que esos informes se dibujan con el navegador (pdf-results-image.ts).

// Letra, marca o cifra de un alfabeto que no es latino, cirílico ni griego. Los signos comunes
// (cifras, puntuación) y las marcas heredadas (tildes combinables) no cuentan.
const OTHER_SCRIPT_CHAR = /(?![\p{sc=Latin}\p{sc=Cyrillic}\p{sc=Greek}\p{sc=Common}\p{sc=Inherited}])[\p{L}\p{M}\p{N}]/u;

// Alfabetos que se escriben de derecha a izquierda (árabe, urdu, persa, hebreo...)
const RTL_LETTER = /[\p{sc=Arabic}\p{sc=Hebrew}\p{sc=Syriac}\p{sc=Thaana}\p{sc=Nko}\p{sc=Adlam}]/u;
const LETTER = /\p{L}/gu;

/** true si algún texto lleva letras que Roboto no tiene. */
export function needsBrowserRendering(texts: unknown[]): boolean {
  return texts.some(text => typeof text === 'string' && OTHER_SCRIPT_CHAR.test(text));
}

/** Dirección de un texto según la mayoría de sus letras ("COVID-19 هو مرض..." es rtl). */
export function textDirection(text: string): 'rtl' | 'ltr' {
  let rtl = 0;
  let ltr = 0;
  for (const letter of (text || '').match(LETTER) || []) {
    if (RTL_LETTER.test(letter)) {
      rtl++;
    } else {
      ltr++;
    }
  }
  return rtl > ltr ? 'rtl' : 'ltr';
}
