// PDF de resultados dibujado por el navegador, para alfabetos que Roboto (pdfmake) no tiene.
//
// Se monta el mismo informe que el de pdfmake (mismo contenido, orden y marca) como HTML en un
// iframe oculto, se reparte en páginas A4 sin partir nunca una tarjeta de diagnóstico, cada página
// se convierte en imagen con html2canvas y pdfmake las junta en el PDF, con los enlaces clicables.
// El navegador da forma a cualquier alfabeto (conjuntos devanagari, árabe de derecha a izquierda,
// CJK, tailandés) como ya lo hace en pantalla; a cambio, el texto del PDF no se puede seleccionar.
import { textDirection } from './pdf-script';

export interface ReportTexts {
  regDate: string;
  title: string;
  subtitles: string[];
  patientText: string;
  candidates: string;
  orderNote: string; // solo en modo EU
  matching: string;
  nonMatching: string;
  aboutTitle: string;
  about: string[];
  contact: string;
  page: string;
}

export interface ReportDisease {
  name: string;
  nameEn: string; // vacío si no se muestra
  description: string;
  matchingSymptoms: string;
  nonMatchingSymptoms: string;
}

export interface ImageReport {
  lang: string; // idioma del contenido
  uiLang: string; // idioma de las etiquetas
  date: string;
  entryText: string;
  diseases: ReportDisease[];
  texts: ReportTexts;
  images: { logo: string; qr: string; check: string; cross: string; logoFooter: string };
}

// A4 a 96 ppp: 595,28 × 841,89 pt. Los márgenes son los del PDF de pdfmake
const PT = 96 / 72;
const PAGE_W_PT = 595.28;
const PAGE_H_PT = 841.89;
const PAGE_W = Math.round(PAGE_W_PT * PT); // 794 px
const PAGE_H = Math.round(PAGE_H_PT * PT); // 1123 px
const MARGIN = { top: 60, side: 36, bottom: 80 }; // pt
const CONTENT_W = PAGE_W - 2 * MARGIN.side * PT;
const CONTENT_H = PAGE_H - (MARGIN.top + MARGIN.bottom) * PT;
const SCALE = 2; // resolución de las imágenes: 2 px por px CSS (~190 ppp)
const JPEG_QUALITY = 0.9;
const SITE_URL = 'https://dxgpt.app';
const SUPPORT_EMAIL = 'support@foundation29.org';

// html2canvas dibuja el texto en un lienzo sin idioma, y para los ideogramas el navegador elegiría
// otra fuente que en la maqueta (kanji con fuente china en un texto japonés): se fijan las fuentes
// CJK de cada idioma para que maqueta y dibujo usen la misma
const BASE_FONTS = 'Roboto, "Segoe UI", "Helvetica Neue", Arial';
const CJK_FONTS = {
  ja: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, "Yu Gothic", "Noto Sans JP", "Noto Sans CJK JP"',
  ko: '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Noto Sans CJK KR"',
  tc: '"PingFang TC", "Microsoft JhengHei", "Noto Sans TC", "Noto Sans CJK TC"',
  sc: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC"'
};

const STYLE = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; }
body { font-family: ${BASE_FONTS}, "Noto Sans", sans-serif; color: #444; line-height: 1.4; }
img { display: block; }
.page { position: relative; width: ${PAGE_W}px; height: ${PAGE_H}px; background: #fff; overflow: hidden; }
.content { position: absolute; left: ${MARGIN.side}pt; top: ${MARGIN.top}pt; width: ${CONTENT_W}px; }
.blk { display: flow-root; }
.frag { overflow: hidden; }
.head { position: relative; height: 70pt; }
.head .logo { position: absolute; left: 0; top: 0; width: 120pt; }
.head .date { position: absolute; left: 90pt; right: 70pt; top: 0; text-align: center; font-size: 10pt; }
.head .date-label { color: #888; }
.head .date-value { color: #2a3b4d; font-weight: 700; margin-top: 2pt; }
.head .qr { position: absolute; right: 0; top: -10pt; width: 60pt; height: 60pt; }
.title { font-size: 20pt; font-weight: 700; color: #2a3b4d; padding-bottom: 12pt; }
.intro { font-size: 10pt; color: #555; padding-bottom: 18pt; }
.sub { font-size: 15pt; font-weight: 700; color: #1a2533; }
.sub.entry { padding: 10pt 0 4pt; }
.sub.cands { padding: 18pt 0 8pt; }
.entry-line { font-size: 10pt; color: #555; padding-bottom: 10pt; white-space: pre-wrap; overflow-wrap: anywhere; }
.order-note { font-size: 9pt; color: #666; font-style: italic; padding-bottom: 12pt; }
.card-wrap { padding: 10pt 0; }
.card { background: #f7fafd; padding: 12pt 16pt; overflow-wrap: anywhere; }
.d-name { font-size: 13pt; font-weight: 700; color: #1a2533; margin-bottom: 4pt; }
.d-name-en { font-size: 10pt; color: #555; margin: -2pt 0 4pt; }
.d-desc { font-size: 10pt; color: #555; margin-bottom: 8pt; }
.sym { display: flex; gap: 10pt; font-size: 10pt; }
.sym img { flex: none; width: 12pt; height: 12pt; margin-top: 3pt; }
.sym .label { font-weight: 700; }
.sym.match { color: #388e3c; margin-top: 5pt; }
.sym.nomatch { color: #d32f2f; }
.about-title { font-size: 12pt; font-weight: 700; color: #2a3b4d; padding: 30pt 0 5pt; }
.about { font-size: 9pt; color: #777; padding-top: 2pt; }
.contact { font-size: 9pt; color: #777; padding: 20pt 0 10pt; }
.link { color: #3366CC; }
.foot { position: absolute; left: 0; top: ${PAGE_H_PT - MARGIN.bottom}pt; width: 100%; height: ${MARGIN.bottom}pt; font-size: 9pt; }
.foot .logo-foot { position: absolute; left: 20pt; top: 0; width: 100pt; }
.foot .pages { position: absolute; left: 227.64pt; width: 120pt; top: 10pt; text-align: center; color: #777; }
.foot .site { position: absolute; right: 20pt; top: 10pt; }
`;

type BlockKind = 'atomic' | 'split';

interface Block {
  el: HTMLElement;
  kind: BlockKind;
  keepWithNext?: boolean; // títulos: no dejarlos solos al pie de una página
  height?: number;
  cuts?: number[]; // alturas (px) entre líneas donde se puede partir el bloque
}

interface Fragment {
  block: Block;
  start: number;
  end: number;
}

interface LinkArea {
  x: number;
  y: number;
  w: number;
  h: number;
  href: string;
}

export async function downloadResultsImagePdf(report: ImageReport, pdfMake: any, fileName: string): Promise<void> {
  // webpack carga la versión CommonJS de html2canvas: la función puede venir en default o ser el módulo
  const html2canvasModule: any = await import('html2canvas');
  const html2canvas = html2canvasModule.default || html2canvasModule;
  const frame = createFrame();
  try {
    const doc = frame.contentDocument as Document;
    doc.body.style.fontFamily = fontFamily(report);
    const blocks = buildBlocks(doc, report);
    await measure(doc, blocks, report.lang);
    const pages = paginate(blocks);

    const images: { data: string; links: LinkArea[] }[] = [];
    for (let i = 0; i < pages.length; i++) {
      const page = buildPage(doc, report, pages[i], i + 1, pages.length);
      doc.body.appendChild(page);
      await waitForImages(page);
      const links = collectLinks(page);
      const canvas = await html2canvas(page, {
        scale: SCALE,
        backgroundColor: '#ffffff',
        logging: false,
        width: PAGE_W,
        height: PAGE_H,
        windowWidth: PAGE_W,
        windowHeight: PAGE_H,
        scrollX: 0,
        scrollY: 0
      });
      images.push({ data: canvas.toDataURL('image/jpeg', JPEG_QUALITY), links });
      canvas.width = 0; // libera la memoria del lienzo (móviles)
      canvas.height = 0;
      page.remove();
    }

    const transparent = transparentPixel();
    const content: any[] = [];
    images.forEach((image, i) => {
      content.push({ image: image.data, width: PAGE_W_PT, height: PAGE_H_PT, ...(i > 0 ? { pageBreak: 'before' } : {}) });
      for (const link of image.links) {
        content.push({ image: transparent, width: link.w, height: link.h, absolutePosition: { x: link.x, y: link.y }, link: link.href });
      }
    });
    pdfMake.createPdf({ pageSize: 'A4', pageMargins: [0, 0, 0, 0], content }).download(fileName);
  } finally {
    frame.remove();
  }
}

// Iframe fuera de la pantalla: aísla el informe de los estilos de la aplicación y html2canvas
// clona solo este documento pequeño, no toda la página
function createFrame(): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.cssText = `position:fixed;left:-${PAGE_W * 3}px;top:0;width:${PAGE_W}px;height:${PAGE_H}px;border:0;pointer-events:none;`;
  document.body.appendChild(frame);
  const doc = frame.contentDocument as Document;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>${STYLE}</style></head><body></body></html>`);
  doc.close();
  return frame;
}

function fontFamily(report: ImageReport): string {
  const lang = (report.lang || '').toLowerCase();
  const sample = [report.entryText, ...report.diseases.map(d => `${d.name || ''} ${d.description || ''}`)].join(' ');
  let cjk = '';
  if (lang.startsWith('ja') || /[\p{sc=Hiragana}\p{sc=Katakana}]/u.test(sample)) {
    cjk = CJK_FONTS.ja;
  } else if (lang.startsWith('ko') || /\p{sc=Hangul}/u.test(sample)) {
    cjk = CJK_FONTS.ko;
  } else if (lang.startsWith('zh') || /\p{sc=Han}/u.test(sample)) {
    cjk = /^zh-(tw|hk|mo|hant)/.test(lang) ? CJK_FONTS.tc : CJK_FONTS.sc;
  }
  return [BASE_FONTS, cjk, '"Noto Sans"', 'sans-serif'].filter(Boolean).join(', ');
}

function el(doc: Document, tag: string, className: string, text?: string, lang?: string): HTMLElement {
  const node = doc.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
    // Árabe, urdu, persa y hebreo se escriben de derecha a izquierda
    node.dir = textDirection(text);
  }
  if (lang) {
    node.lang = lang;
  }
  return node;
}

function img(doc: Document, className: string, src: string): HTMLImageElement {
  const image = doc.createElement('img');
  image.className = className;
  image.src = src;
  image.alt = '';
  return image;
}

// Bloques del informe en el mismo orden que el PDF de pdfmake
function buildBlocks(doc: Document, report: ImageReport): Block[] {
  const { texts, lang, uiLang } = report;
  const blocks: Block[] = [];
  const add = (node: HTMLElement, kind: BlockKind, keepWithNext = false) => {
    node.classList.add('blk');
    blocks.push({ el: node, kind, keepWithNext });
  };

  const head = el(doc, 'div', 'head');
  head.appendChild(img(doc, 'logo', report.images.logo));
  const date = el(doc, 'div', 'date');
  date.appendChild(el(doc, 'div', 'date-label', texts.regDate, uiLang));
  date.appendChild(el(doc, 'div', 'date-value', report.date, uiLang));
  head.appendChild(date);
  head.appendChild(img(doc, 'qr', report.images.qr));
  add(head, 'atomic');

  add(el(doc, 'div', 'title', texts.title, uiLang), 'atomic', true);
  // La introducción y el bloque de la fundación vienen en las traducciones partidos en líneas a la
  // medida de Roboto; con otra fuente quedaría una palabra suelta por línea, así que fluyen juntos
  add(el(doc, 'div', 'intro', joinLines(texts.subtitles), uiLang), 'split');

  if (report.entryText) {
    add(el(doc, 'div', 'sub entry', texts.patientText, uiLang), 'atomic', true);
    for (const line of report.entryText.split('\n')) {
      add(el(doc, 'div', 'entry-line', line.trim(), lang), 'split');
    }
  }

  add(el(doc, 'div', 'sub cands', texts.candidates, uiLang), 'atomic', true);
  if (texts.orderNote) {
    add(el(doc, 'div', 'order-note', texts.orderNote, uiLang), 'atomic', true);
  }

  for (const disease of report.diseases) {
    const wrap = el(doc, 'div', 'card-wrap');
    const card = el(doc, 'div', 'card');
    card.dir = textDirection(`${disease.name || ''} ${disease.description || ''}`);
    card.appendChild(el(doc, 'div', 'd-name', disease.name || '', lang));
    if (disease.nameEn) {
      // En una tarjeta en árabe o urdu, el nombre en inglés va también a la derecha
      const nameEn = el(doc, 'div', 'd-name-en', disease.nameEn, 'en');
      nameEn.style.textAlign = card.dir === 'rtl' ? 'right' : 'left';
      card.appendChild(nameEn);
    }
    card.appendChild(el(doc, 'div', 'd-desc', disease.description || '', lang));
    card.appendChild(symptomRow(doc, 'match', report.images.check, texts.matching, disease.matchingSymptoms, uiLang, lang));
    card.appendChild(symptomRow(doc, 'nomatch', report.images.cross, texts.nonMatching, disease.nonMatchingSymptoms, uiLang, lang));
    wrap.appendChild(card);
    add(wrap, 'atomic'); // una tarjeta nunca se parte entre dos páginas
  }

  // Bloque de la fundación entero en una página, para que el contacto no quede suelto en la siguiente
  const foundation = el(doc, 'div', '');
  foundation.appendChild(el(doc, 'div', 'about-title', texts.aboutTitle, uiLang));
  foundation.appendChild(el(doc, 'div', 'about', joinLines(texts.about), uiLang));
  const contact = el(doc, 'div', 'contact', undefined, uiLang);
  contact.dir = textDirection(texts.contact);
  contact.appendChild(doc.createTextNode(texts.contact + ' '));
  const email = el(doc, 'span', 'link', SUPPORT_EMAIL);
  email.dataset['href'] = 'mailto:' + SUPPORT_EMAIL;
  contact.appendChild(email);
  foundation.appendChild(contact);
  add(foundation, 'atomic');
  return blocks;
}

function joinLines(lines: string[]): string {
  return lines.map(line => (line || '').trim()).filter(Boolean).join(' ');
}

function symptomRow(doc: Document, kind: string, icon: string, label: string, symptoms: string, uiLang: string, lang: string): HTMLElement {
  const row = el(doc, 'div', `sym ${kind}`);
  // La dirección la marcan los síntomas, no la etiqueta (en inglés si la interfaz no tiene el idioma)
  row.dir = textDirection(symptoms || label);
  row.appendChild(img(doc, '', icon));
  const body = el(doc, 'div', '');
  body.appendChild(el(doc, 'span', 'label', label + ':', uiLang));
  body.appendChild(doc.createTextNode(' '));
  body.appendChild(el(doc, 'span', '', symptoms || '', lang));
  row.appendChild(body);
  return row;
}

async function measure(doc: Document, blocks: Block[], lang: string): Promise<void> {
  const flow = doc.createElement('div');
  flow.style.width = `${CONTENT_W}px`;
  flow.lang = lang; // el mismo idioma heredado que en la página, para que la maqueta no cambie
  blocks.forEach(block => flow.appendChild(block.el));
  doc.body.appendChild(flow);
  await waitForImages(flow);
  if ((doc as any).fonts?.ready) {
    await (doc as any).fonts.ready;
  }
  for (const block of blocks) {
    const top = block.el.getBoundingClientRect().top;
    block.height = block.el.getBoundingClientRect().height;
    block.cuts = lineCuts(doc, block.el, top);
  }
  flow.remove();
}

// Puntos entre dos líneas de texto consecutivas, relativos a la parte de arriba del bloque
function lineCuts(doc: Document, node: HTMLElement, top: number): number[] {
  const rects: { top: number; bottom: number }[] = [];
  const walker = doc.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    if (!text.textContent?.trim()) {
      continue;
    }
    range.selectNodeContents(text);
    for (const rect of Array.from(range.getClientRects())) {
      if (rect.height > 0) {
        rects.push({ top: rect.top - top, bottom: rect.bottom - top });
      }
    }
  }
  rects.sort((a, b) => a.top - b.top);
  const lines: { top: number; bottom: number }[] = [];
  for (const rect of rects) {
    const last = lines[lines.length - 1];
    // Mismo renglón si se solapan más de la mitad del más bajo
    if (last && Math.min(last.bottom, rect.bottom) - Math.max(last.top, rect.top) > Math.min(last.bottom - last.top, rect.bottom - rect.top) / 2) {
      last.top = Math.min(last.top, rect.top);
      last.bottom = Math.max(last.bottom, rect.bottom);
    } else {
      lines.push({ ...rect });
    }
  }
  const cuts: number[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    cuts.push((lines[i].bottom + lines[i + 1].top) / 2);
  }
  return cuts;
}

// Reparte los bloques en páginas: un bloque que no cabe pasa entero a la página siguiente; los
// párrafos largos se parten entre dos líneas y una tarjeta solo se partiría si no cupiera ni en una
// página entera
function paginate(blocks: Block[]): Fragment[][] {
  const pages: Fragment[][] = [[]];
  let used = 0;
  const newPage = () => {
    pages.push([]);
    used = 0;
  };
  const fits = (height: number) => height <= CONTENT_H - used + 0.5;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const height = block.height || 0;
    let start = 0;
    while (start < height - 0.5) {
      const rest = height - start;
      if (fits(rest)) {
        const next = blocks[i + 1];
        if (block.keepWithNext && next && used > 0 && !fits(rest + firstPieceHeight(next))) {
          newPage();
          continue;
        }
        pages[pages.length - 1].push({ block, start, end: height });
        used += rest;
        break;
      }
      if (block.kind === 'split' || height > CONTENT_H) {
        const room = CONTENT_H - used;
        const cut = [...(block.cuts || [])].reverse().find(c => c > start + 0.5 && c - start <= room);
        if (cut !== undefined) {
          pages[pages.length - 1].push({ block, start, end: cut });
          start = cut;
          newPage();
          continue;
        }
        if (used === 0) {
          // Ni una línea cabe en una página vacía: se corta a la altura de la página
          pages[pages.length - 1].push({ block, start, end: Math.min(height, start + CONTENT_H) });
          start += CONTENT_H;
          newPage();
          continue;
        }
      }
      newPage();
    }
  }
  if (pages.length > 1 && pages[pages.length - 1].length === 0) {
    pages.pop();
  }
  return pages;
}

function firstPieceHeight(block: Block): number {
  if (block.kind === 'split' && block.cuts?.length) {
    return block.cuts[0];
  }
  return Math.min(block.height || 0, CONTENT_H);
}

function buildPage(doc: Document, report: ImageReport, fragments: Fragment[], pageNumber: number, pageCount: number): HTMLElement {
  const page = el(doc, 'div', 'page');
  page.lang = report.lang;
  const content = el(doc, 'div', 'content');
  for (const fragment of fragments) {
    const clip = el(doc, 'div', 'frag');
    clip.style.height = `${fragment.end - fragment.start}px`;
    const inner = el(doc, 'div', '');
    inner.style.marginTop = `${-fragment.start}px`;
    inner.appendChild(fragment.block.el.cloneNode(true));
    clip.appendChild(inner);
    content.appendChild(clip);
  }
  page.appendChild(content);

  const foot = el(doc, 'div', 'foot');
  foot.appendChild(img(doc, 'logo-foot', report.images.logoFooter));
  foot.appendChild(el(doc, 'div', 'pages', `${report.texts.page} ${pageNumber} / ${pageCount}`, report.uiLang));
  const site = el(doc, 'div', 'site link', SITE_URL.replace('https://', ''));
  site.dataset['href'] = SITE_URL;
  foot.appendChild(site);
  page.appendChild(foot);
  return page;
}

// Zonas clicables (correo y web) en puntos del PDF
function collectLinks(page: HTMLElement): LinkArea[] {
  const origin = page.getBoundingClientRect();
  const links: LinkArea[] = [];
  page.querySelectorAll<HTMLElement>('[data-href]').forEach(node => {
    const rect = node.getBoundingClientRect();
    // Un enlace que el corte de página deja fuera (o a medias) no se añade en esta página
    const clip = node.closest('.frag')?.getBoundingClientRect();
    if (!rect.width || (clip && (rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1))) {
      return;
    }
    links.push({
      x: (rect.left - origin.left) / PT,
      y: (rect.top - origin.top) / PT,
      w: rect.width / PT,
      h: rect.height / PT,
      href: node.dataset['href'] as string
    });
  });
  return links;
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map(image => image.complete && image.naturalWidth
    ? Promise.resolve()
    : image.decode().catch(() => undefined)));
}

function transparentPixel(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/png');
}
