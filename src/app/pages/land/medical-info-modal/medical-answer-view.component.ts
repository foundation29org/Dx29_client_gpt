import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { marked } from 'marked';
import { Subscription } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { UuidService } from 'app/shared/services/uuid.service';
import { MedicalAnswerFeedbackComponent } from '../medical-answer-feedback/medical-answer-feedback.component';
import { MedicalAnswerData, MedicalAnswerReference } from './medical-answer.model';
import { buildReferenceTitle, referenceSourceLabel } from './medical-reference-title';

/** Búsqueda, en el extracto de una fuente, del texto que respalda la frase citada. */
interface CitationLookup {
  referenceNumber: number;
  state: 'loading' | 'found' | 'not_found';
}

// Límites del endpoint /internal/citation-support (citationSupportService.js)
const CITATION_MAX_SENTENCE_CHARS = 1200;
const CITATION_MAX_BLOCKS = 150;
const CITATION_MAX_BLOCK_CHARS = 2000;
const CITATION_MAX_TOTAL_CHARS = 30000;
// La respuesta suele tardar 1–3 s; si se alarga, se deja el extracto sin marcar
const CITATION_TIMEOUT_MS = 10000;

@Component({
  selector: 'app-medical-answer-view',
  templateUrl: './medical-answer-view.component.html',
  styleUrls: ['./medical-answer-view.component.scss'],
  standalone: false
})
export class MedicalAnswerViewComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) answer!: MedicalAnswerData;

  htmlContent = '';
  references: MedicalAnswerReference[] = [];
  referencesExpanded = false;
  /** Solo un extracto abierto a la vez; null = todos cerrados. */
  expandedSnippetNumber: number | null = null;
  /** Estado de la búsqueda del fragmento citado; solo existe tras pulsar una cita. */
  citationLookup: CitationLookup | null = null;

  private processingVersion = 0;
  /** A partir de aquí el extracto ocupa más que la pantalla y se repite "Ocultar" al final. */
  private readonly longSnippetChars = 1000;
  private citationLookupVersion = 0;
  private citationSubscription: Subscription | null = null;
  /** Resultado por referencia y frase: volver a pulsar la misma cita no repite la llamada. */
  private citationCache = new Map<string, number[]>();

  constructor(
    private readonly modalService: NgbModal,
    private readonly insightsService: InsightsService,
    private readonly apiDx29ServerService: ApiDx29ServerService,
    private readonly uuidService: UuidService,
    private readonly translate: TranslateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['answer'] && this.answer) {
      void this.processAnswer();
    }
  }

  ngOnDestroy(): void {
    this.cancelCitationLookup();
  }

  openMedicalFeedback(vote: 'up' | 'down'): void {
    try {
      this.insightsService.trackEvent('medical_answer_thumb_click', {
        vote,
        model: this.answer.model || 'unknown',
        detectedLang: this.answer.detectedLang || 'unknown',
        hasSelectedFiles: this.answer.selectedFiles.length > 0,
        fileCount: this.answer.selectedFiles.length
      });
    } catch {}

    const modalRef = this.modalService.open(MedicalAnswerFeedbackComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      ariaLabelledBy: 'medical-answer-feedback-title'
    });
    modalRef.componentInstance.question = this.answer.question;
    modalRef.componentInstance.initialVote = vote;
    modalRef.componentInstance.model = this.answer.model;
    modalRef.componentInstance.detectedLang = this.answer.detectedLang;
    modalRef.componentInstance.fileNames = this.answer.selectedFiles
      .map(file => file?.name)
      .filter(Boolean)
      .join(',');
    modalRef.componentInstance.answerHtml = this.htmlContent;
    modalRef.componentInstance.references = this.references;
  }

  hasReferences(): boolean {
    return this.references.length > 0;
  }

  trackByReference(index: number, reference: MedicalAnswerReference): number {
    return reference.number || index;
  }

  toggleReferences(): void {
    this.referencesExpanded = !this.referencesExpanded;
    if (!this.referencesExpanded) {
      this.expandedSnippetNumber = null;
      this.cancelCitationLookup();
    }
  }

  isSnippetExpanded(referenceNumber: number): boolean {
    return this.expandedSnippetNumber === referenceNumber;
  }

  isLongSnippet(reference: MedicalAnswerReference): boolean {
    return (reference.snippet || '').length >= this.longSnippetChars;
  }

  toggleSnippet(referenceNumber: number): void {
    // Abrir o cerrar a mano un extracto deja de lado la búsqueda de la última cita
    this.cancelCitationLookup();
    this.expandedSnippetNumber =
      this.expandedSnippetNumber === referenceNumber ? null : referenceNumber;
  }

  /**
   * Cierre desde el final de un extracto largo: al encogerse, la referencia
   * quedaría por encima de la vista, así que se vuelve a ella y se pasa el foco
   * al botón de arriba (el de abajo desaparece).
   */
  closeSnippetFromBottom(referenceNumber: number): void {
    this.cancelCitationLookup();
    this.expandedSnippetNumber = null;
    setTimeout(() => {
      const referenceElement = document.getElementById(`medical-reference-${referenceNumber}`);
      if (!referenceElement) {
        return;
      }
      referenceElement
        .querySelector<HTMLButtonElement>('.reference-snippet-toggle')
        ?.focus({ preventScroll: true });
      referenceElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  onContentClick(event: Event): void {
    const target = (event.target as HTMLElement).closest<HTMLAnchorElement>('.reference-link');
    if (!target) {
      return;
    }

    event.preventDefault();
    const referenceTarget = target.getAttribute('href') || '';
    const referenceMatch = referenceTarget.match(/^#medical-reference-(\d+)$/);
    if (!referenceMatch) {
      return;
    }

    const referenceNumber = Number(referenceMatch[1]);
    // La frase se lee ahora, antes de que el DOM cambie al abrir las referencias
    const citingSentence = this.getCitingSentence(target);
    this.cancelCitationLookup();
    this.referencesExpanded = true;
    this.expandedSnippetNumber = referenceNumber;
    const lookupVersion = this.citationLookupVersion;
    setTimeout(() => {
      this.highlightReference(referenceNumber);
      if (lookupVersion === this.citationLookupVersion) {
        this.lookupCitationSupport(referenceNumber, citingSentence);
      }
    }, 100);
  }

  /** Frase de la respuesta que termina en la cita pulsada. */
  private getCitingSentence(citationLink: HTMLElement): string {
    try {
      const content = citationLink.closest('.medical-content');
      const closestBlock = citationLink.closest('p, li, td, th, blockquote, h3');
      const block = closestBlock && content?.contains(closestBlock) ? closestBlock : content;
      if (!block) {
        return '';
      }
      const range = document.createRange();
      range.selectNodeContents(block);
      range.setEndBefore(citationLink);
      return this.lastSentence(range.toString());
    } catch {
      return '';
    }
  }

  /**
   * Última frase del texto previo a la cita. Corta en ". ", "! ", "? " (con espacio,
   * para no partir "0.5 mg") y en los finales sin espacio de hindi y chino/japonés.
   * Si queda muy corta ("Sí."), añade la anterior para dar contexto.
   */
  private lastSentence(textBeforeCitation: string): string {
    const text = textBeforeCitation
      .replace(/\[\d+\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) {
      return '';
    }
    const sentences = text
      .replace(/([.!?])\s+/g, '$1\u0000')
      .replace(/([।。！？])/g, '$1\u0000')
      .split('\u0000')
      .map(sentence => sentence.trim())
      .filter(Boolean);
    let sentence = sentences[sentences.length - 1] || '';
    if (sentence.length < 30 && sentences.length > 1) {
      sentence = `${sentences[sentences.length - 2]} ${sentence}`;
    }
    return sentence.slice(-CITATION_MAX_SENTENCE_CHARS);
  }

  /**
   * Pide al servidor qué bloques del extracto (párrafos, viñetas o filas, tal como
   * se muestran) respaldan la frase, y los resalta. Si no hay ninguno, lo indica; si
   * falla o tarda demasiado, el extracto se queda abierto sin marcar, como antes.
   */
  private lookupCitationSupport(referenceNumber: number, sentence: string): void {
    const snippetElement = document.getElementById(`medical-reference-snippet-${referenceNumber}`);
    if (!snippetElement || sentence.length < 3) {
      return;
    }
    const blockElements = this.collectSnippetBlocks(snippetElement);
    // Con un solo bloque no hay nada que señalar: es todo el extracto
    if (blockElements.length < 2) {
      return;
    }

    const cacheKey = `${referenceNumber}\u0000${sentence}`;
    const cached = this.citationCache.get(cacheKey);
    if (cached) {
      this.applyCitationSupport(referenceNumber, snippetElement, blockElements, cached);
      return;
    }

    const lookupVersion = ++this.citationLookupVersion;
    this.citationLookup = { referenceNumber, state: 'loading' };
    this.citationSubscription = this.apiDx29ServerService
      .findCitationSupport({
        myuuid: this.uuidService.getUuid(),
        timezone: this.currentTimezone(),
        lang: this.translate.currentLang || 'en',
        sentence,
        blocks: blockElements.map(element => this.blockText(element))
      })
      .pipe(timeout(CITATION_TIMEOUT_MS))
      .subscribe({
        next: response => {
          if (lookupVersion !== this.citationLookupVersion) {
            return;
          }
          this.citationSubscription = null;
          const indexes = (Array.isArray(response?.data?.blocks) ? response.data!.blocks! : [])
            .filter(index => Number.isInteger(index) && index >= 0 && index < blockElements.length);
          this.citationCache.set(cacheKey, indexes);
          this.applyCitationSupport(referenceNumber, snippetElement, blockElements, indexes);
        },
        error: error => {
          if (lookupVersion !== this.citationLookupVersion) {
            return;
          }
          this.citationSubscription = null;
          this.citationLookup = null;
          this.insightsService.trackEvent('medical_citation_support_failed', {
            reason: error?.name === 'TimeoutError' ? 'timeout' : String(error?.status ?? 'unknown')
          });
        }
      });
  }

  /** Bloques del extracto, recortados a lo que admite el servidor. */
  private collectSnippetBlocks(snippetElement: HTMLElement): HTMLElement[] {
    const blocks: HTMLElement[] = [];
    let totalChars = 0;
    for (const element of Array.from(snippetElement.querySelectorAll<HTMLElement>('p, li, tr'))) {
      const length = this.blockText(element).length;
      if (blocks.length >= CITATION_MAX_BLOCKS || totalChars + length > CITATION_MAX_TOTAL_CHARS) {
        break;
      }
      blocks.push(element);
      totalChars += length;
    }
    return blocks;
  }

  private blockText(element: HTMLElement): string {
    return (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, CITATION_MAX_BLOCK_CHARS);
  }

  private applyCitationSupport(
    referenceNumber: number,
    snippetElement: HTMLElement,
    blockElements: HTMLElement[],
    indexes: number[]
  ): void {
    // El usuario ya cerró o cambió de extracto: no se marca nada
    if (!snippetElement.isConnected || this.expandedSnippetNumber !== referenceNumber) {
      this.citationLookup = null;
      return;
    }
    this.clearCitedBlocks();
    if (indexes.length === 0) {
      this.citationLookup = { referenceNumber, state: 'not_found' };
      return;
    }
    indexes.forEach(index => blockElements[index].classList.add('snippet-cited'));
    // Con varios bloques (una lista, por ejemplo) se va al primero en orden de lectura
    blockElements[Math.min(...indexes)].scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.citationLookup = { referenceNumber, state: 'found' };
  }

  private cancelCitationLookup(): void {
    this.citationLookupVersion += 1;
    this.citationSubscription?.unsubscribe();
    this.citationSubscription = null;
    this.citationLookup = null;
    this.clearCitedBlocks();
  }

  private clearCitedBlocks(): void {
    document
      .querySelectorAll('#medical-references-list .snippet-cited')
      .forEach(element => element.classList.remove('snippet-cited'));
  }

  private currentTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }

  private async processAnswer(): Promise<void> {
    const version = ++this.processingVersion;
    this.referencesExpanded = false;
    this.expandedSnippetNumber = null;
    this.cancelCitationLookup();
    this.citationCache.clear();
    const sonarData = this.parseSonarData(this.answer.sonarData);
    const answerContent = this.removeGeneratedReferenceSection(this.answer.content || '');
    const normalizedContent = this.buildReferences(answerContent, sonarData);

    try {
      marked.setOptions({ breaks: true, gfm: true });
      let parsedContent = await marked.parse(normalizedContent);
      parsedContent = this.normalizeListItemHeadings(parsedContent);
      parsedContent = this.normalizeHeadingHierarchy(parsedContent);
      parsedContent = this.processReferenceLinks(parsedContent);
      parsedContent = this.addSafeLinkAttributes(parsedContent);

      if (version === this.processingVersion) {
        this.htmlContent = parsedContent;
      }
    } catch (error) {
      this.insightsService.trackException(error);
      if (version === this.processingVersion) {
        this.htmlContent = this.answer.content || '';
      }
    }
  }

  private removeGeneratedReferenceSection(markdown: string): string {
    const referenceSectionLabels = [
      'references?',
      'sources?',
      'bibliography',
      'referencias?',
      'fuentes',
      'referències',
      'références',
      'referências',
      'quellen',
      'literatur',
      'źródła',
      'bibliografia',
      'источники',
      'джерела',
      'संदर्भ'
    ].join('|');
    const referenceHeading = new RegExp(
      `^#{1,6}\\s*(?:${referenceSectionLabels})(?:\\s*\\([^)]*\\))?\\s*$`,
      'im'
    );
    const match = referenceHeading.exec(markdown);
    return match ? markdown.slice(0, match.index).trimEnd() : markdown;
  }

  private parseSonarData(rawData: unknown): any {
    if (!rawData) {
      return null;
    }
    if (typeof rawData !== 'string') {
      return rawData;
    }

    try {
      return JSON.parse(rawData);
    } catch (error) {
      this.insightsService.trackException(error);
      return null;
    }
  }

  private expandCitationGroups(markdown: string, maxIndex: number): string {
    if (!markdown || maxIndex <= 0) {
      return markdown;
    }
    // Solo listas con coma o punto y coma ([1, 3]). Los rangos con guion no se
    // expanden: un rango entre corchetes también podría ser un dato clínico.
    return markdown.replace(
      /\[(\d+(?:\s*[,;]\s*\d+)+)\]/g,
      (fullMatch, inner: string) => {
        const numbers = inner.split(/\s*[,;]\s*/).map(part => Number(part));
        if (numbers.some(num => !(num >= 1 && num <= maxIndex))) {
          return fullMatch;
        }
        return numbers.map(num => `[${num}]`).join('');
      }
    );
  }

  private buildReferences(markdown: string, sonarData: any): string {
    const searchResults = Array.isArray(sonarData?.searchResults)
      ? sonarData.searchResults
      : [];
    const citations = Array.isArray(sonarData?.citations)
      ? sonarData.citations
      : [];
    const maxIndex = Math.max(searchResults.length, citations.length);
    const expandedMarkdown = this.expandCitationGroups(markdown, maxIndex);
    const usedNumbers = this.extractUniqueCitationNumbers(expandedMarkdown);

    if (usedNumbers.length === 0) {
      const availableReferences = searchResults.length > 0
        ? searchResults.filter((result: any) => result?.url)
        : citations.map((url: string) => ({ title: url, url }));
      this.references = this.formatReferences(availableReferences);
      return expandedMarkdown;
    }

    const oldToNew = new Map<number, number>();
    const pickedReferences: any[] = [];

    usedNumbers.forEach(originalNumber => {
      const searchResult = searchResults[originalNumber - 1];
      const citationUrl = citations[originalNumber - 1];
      const reference = searchResult?.url
        ? searchResult
        : searchResults.find((result: any) => result?.url === citationUrl)
          || (citationUrl ? { title: citationUrl, url: citationUrl } : null);

      if (!reference?.url) {
        return;
      }
      let newNumber = pickedReferences.findIndex(item => item.url === reference.url) + 1;
      if (newNumber === 0) {
        pickedReferences.push(reference);
        newNumber = pickedReferences.length;
      }
      oldToNew.set(originalNumber, newNumber);
    });

    this.references = this.formatReferences(pickedReferences);
    return expandedMarkdown.replace(/\[(\d+)\]/g, (_match, number) => {
      const replacement = oldToNew.get(Number(number));
      return replacement ? `[${replacement}]` : '';
    });
  }

  private extractUniqueCitationNumbers(markdown: string): number[] {
    const citationPattern = /\[(\d+)\]/g;
    const numbers: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = citationPattern.exec(markdown))) {
      const number = Number(match[1]);
      if (!numbers.includes(number)) {
        numbers.push(number);
      }
    }
    return numbers;
  }

  private formatReferences(references: any[]): MedicalAnswerReference[] {
    return references.map((reference, index) => {
      const snippet = reference.snippet || '';
      const url = reference.url || '';
      return {
        number: index + 1,
        // Título legible aunque la fuente traiga migas de la URL, "[PDF]", "1 de 10"...
        title: buildReferenceTitle(reference.title || '', url, snippet) || url,
        url,
        date: reference.date || '',
        snippet,
        snippetHtml: this.renderReferenceSnippet(snippet),
        source: reference.source || referenceSourceLabel(url)
      };
    });
  }

  private renderReferenceSnippet(snippet: string): string {
    if (!snippet) {
      return '';
    }

    // Los buscadores devuelven varios pasajes separados por líneas "..." y cada
    // pasaje trae su propia estructura (listas, títulos, líneas cortadas por el PDF).
    // Se muestra cada pasaje en su bloque, conservando párrafos y viñetas.
    const excerpts: string[][] = [[]];
    const normalizedSnippet = this.renderSuperscripts(snippet.replace(/\r\n?/g, '\n'));
    for (const rawLine of normalizedSnippet.split('\n')) {
      if (/^\s*(?:\.{3,}|…)\s*$/.test(rawLine)) {
        if (excerpts[excerpts.length - 1].length > 0) {
          excerpts.push([]);
        }
        continue;
      }
      excerpts[excerpts.length - 1].push(rawLine);
    }

    const renderedExcerpts = excerpts
      .map(lines => this.renderSnippetExcerpt(lines))
      .filter(html => html.length > 0);

    // Los enlaces de los extractos se abren en otra pestaña, como los de la respuesta
    return this.addSafeLinkAttributes(
      renderedExcerpts
        .map(html => `<div class="snippet-excerpt">${html}</div>`)
        .join('')
    );
  }

  /**
   * Los extractos marcan los superíndices como ^x^: notas al pie (^100^, ^a^),
   * exponentes (10^9^/L, 10^−3^), ordinales (1^st^) o símbolos (^®^). Quitar los
   * ^ pegaba el número al texto ("10^9^/L" → "109/L"), así que se muestran como <sup>.
   * Se hace sobre el extracto entero porque a veces el ^ de cierre cae en la línea
   * siguiente. Los ^^ vacíos se eliminan y un ^ suelto se deja como está.
   */
  private renderSuperscripts(snippet: string): string {
    // Como mucho un salto de línea dentro: no se cruzan separadores "..." ni filas de tabla
    return snippet.replace(/\^([^\^|\n]{0,25}(?:\n[^\^|\n]{0,25})?)\^/g, (_match, content: string) => {
      const text = content.replace(/\s+/g, ' ').trim();
      if (!text) {
        return '';
      }
      const safeText = this.escapeHtmlAttribute(text)
        .replace(/\*/g, '&#42;')
        .replace(/_/g, '&#95;');
      return `<sup>${safeText}</sup>`;
    });
  }

  private renderSnippetExcerpt(lines: string[]): string {
    type TextBlock = { kind: 'heading' | 'paragraph' | 'item'; text: string };
    type TableBlock = { kind: 'table'; rows: string[][]; headerRows: number };
    type SnippetBlock = TextBlock | TableBlock;
    const blocks: SnippetBlock[] = [];
    let current: TextBlock | null = null;
    let currentTable: TableBlock | null = null;
    let pendingBullet = false;
    // Número de lista solo en su línea ("1."): el texto va en la siguiente
    let pendingNumber: string | null = null;

    const flush = () => {
      current = null;
    };
    const push = (kind: TextBlock['kind'], text: string) => {
      current = { kind, text };
      blocks.push(current);
    };
    // Si el número no llega a tener texto detrás, se muestra solo, como antes
    const emitPendingNumber = () => {
      if (pendingNumber) {
        push('paragraph', pendingNumber);
        flush();
        pendingNumber = null;
      }
    };
    // Una nota al final ("sesión.<sup>a</sup>") no impide ver que la frase terminó
    const endsSentence = (text: string) =>
      /[.:;!?)\]]\s*$/.test(text.replace(/(?:\s*<sup>[^<]*<\/sup>)+\s*$/, ''));
    const startsNewSentence = (text: string) => /^[\p{Lu}\d¿¡"“(\[]/u.test(text);

    for (const rawLine of lines) {
      // Fila de tabla markdown: se conserva como tabla para no mezclar las filas
      if (/^\s*\|/.test(rawLine)) {
        emitPendingNumber();
        flush();
        pendingBullet = false;
        if (this.isTableSeparator(rawLine)) {
          if (currentTable && currentTable.rows.length === 1) {
            currentTable.headerRows = 1;
          }
          continue;
        }
        const cells = this.splitTableRow(rawLine);
        if (cells.every(cell => !cell)) {
          continue;
        }
        if (!currentTable) {
          currentTable = { kind: 'table', rows: [], headerRows: 0 };
          blocks.push(currentTable);
        }
        currentTable.rows.push(cells);
        continue;
      }
      currentTable = null;

      const isHeading = /^\s*#{1,6}\s+\S/.test(rawLine);
      let cleaned = this.cleanSnippetLine(rawLine);

      if (!cleaned) {
        emitPendingNumber();
        flush();
        pendingBullet = false;
        continue;
      }
      // "1.", y también subapartados de ficha técnica ("4.1.", "6.1.2."); siempre con
      // punto final para no confundirlo con un valor decimal suelto ("4.1")
      if (/^\d{1,2}(?:\.\d{1,2}){0,2}\.$/.test(cleaned)) {
        emitPendingNumber();
        flush();
        pendingNumber = cleaned;
        continue;
      }
      // Viñeta sola en su línea: el texto va en la siguiente
      if (/^[-•*–]$/.test(cleaned)) {
        emitPendingNumber();
        flush();
        pendingBullet = true;
        continue;
      }
      if (isHeading) {
        emitPendingNumber();
        pendingBullet = false;
        push('heading', cleaned);
        flush();
        continue;
      }
      if (pendingNumber) {
        cleaned = `${pendingNumber} ${cleaned}`;
        pendingNumber = null;
        flush();
      }
      const bulletMatch = cleaned.match(/^[-•*–]\s+(.*)$/);
      if (bulletMatch || pendingBullet) {
        pendingBullet = false;
        push('item', bulletMatch ? bulletMatch[1] : cleaned);
        continue;
      }
      const active = current as TextBlock | null;
      // La etiqueta de revisión de NICE ("**[2015, amended 2026]**") va aparte
      const isStandaloneTag = /^\*\*\[[^\]]+\]\*\*$/.test(cleaned);
      if (active && !isStandaloneTag && !(endsSentence(active.text) && startsNewSentence(cleaned))) {
        // Línea cortada por el ancho del PDF: continúa el mismo párrafo o viñeta
        active.text = `${active.text} ${cleaned}`;
      } else {
        push('paragraph', cleaned);
      }
    }
    emitPendingNumber();

    let html = '';
    let openList = false;
    for (const block of blocks) {
      if (block.kind === 'item') {
        if (!openList) {
          html += '<ul>';
          openList = true;
        }
        html += `<li>${this.renderSnippetInline(block.text)}</li>`;
        continue;
      }
      if (openList) {
        html += '</ul>';
        openList = false;
      }
      if (block.kind === 'table') {
        html += this.renderSnippetTable(block.rows, block.headerRows);
        continue;
      }
      const content = this.renderSnippetInline(block.text);
      html += block.kind === 'heading'
        ? `<p class="snippet-heading"><strong>${content}</strong></p>`
        : `<p>${content}</p>`;
    }
    if (openList) {
      html += '</ul>';
    }
    return html;
  }

  private renderSnippetInline(text: string): string {
    const inline = marked.parseInline(text);
    return typeof inline === 'string' ? inline : this.escapeHtmlAttribute(text);
  }

  /** Fila separadora de cabecera markdown: |--|:--:|---| */
  private isTableSeparator(line: string): boolean {
    const cells = this.splitTableRowRaw(line);
    return cells.length > 0 && cells.every(cell => /^\s*:?-{2,}:?\s*$/.test(cell));
  }

  private splitTableRowRaw(line: string): string[] {
    let row = line.trim();
    if (row.startsWith('|')) {
      row = row.slice(1);
    }
    if (row.endsWith('|')) {
      row = row.slice(0, -1);
    }
    return row.split('|');
  }

  private splitTableRow(line: string): string[] {
    return this.splitTableRowRaw(line).map(cell => this.cleanSnippetInline(cell).replace(/[ \t]+/g, ' ').trim());
  }

  private renderSnippetTable(rows: string[][], headerRows: number): string {
    const columnCount = Math.max(...rows.map(row => row.length));
    const renderRow = (row: string[], tag: 'th' | 'td') => {
      // Las filas cortadas por el final del extracto se completan con celdas vacías
      const cells = row.concat(Array(columnCount - row.length).fill(''));
      return `<tr>${cells.map(cell => `<${tag}>${this.renderSnippetInline(cell)}</${tag}>`).join('')}</tr>`;
    };
    const head = rows.slice(0, headerRows).map(row => renderRow(row, 'th')).join('');
    const body = rows.slice(headerRows).map(row => renderRow(row, 'td')).join('');
    return '<div class="snippet-table-wrap"><table class="snippet-table">'
      + (head ? `<thead>${head}</thead>` : '')
      + (body ? `<tbody>${body}</tbody>` : '')
      + '</table></div>';
  }

  /** Limpieza de marcas markdown rotas común a líneas y celdas de tabla. */
  private cleanSnippetInline(text: string): string {
    return text
      .replace(/\^([^^]+)\^/g, '$1')
      .replace(/\[(\*\*[^*]+\*\*)\]/g, '$1')
      .replace(/\*{3,}/g, '**')
      .replace(/\*{1,2}\s*\+\s*\*{1,2}/g, ' ')
      .replace(/\*{2}\s+\*{2}/g, ' ');
  }

  private cleanSnippetLine(line: string): string {
    return this.cleanSnippetInline(line.replace(/^\s*#{1,6}\s*/, ''))
      .replace(/\|+/g, ' · ')
      .replace(/(?:\s*·\s*){2,}/g, ' · ')
      .replace(/\s*·\s*/g, ' · ')
      .replace(/[ \t]+/g, ' ')
      .replace(/^(?:\s*·\s*)+|(?:\s*·\s*)+$/g, '')
      .trim();
  }

  private normalizeListItemHeadings(htmlContent: string): string {
    return htmlContent.replace(
      /<li(\s[^>]*)?>([\s\S]*?)<\/li>/gi,
      (_listItem, attributes = '', itemContent = '') => {
        const normalizedContent = itemContent.replace(
          /<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
          '<span class="list-heading">$2</span>'
        );
        return `<li${attributes}>${normalizedContent}</li>`;
      }
    );
  }

  private normalizeHeadingHierarchy(htmlContent: string): string {
    return htmlContent
      .replace(
        /<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
        '<h3>$2</h3>'
      )
      .replace(/<hr(?:\s[^>]*)?>/gi, '');
  }

  private processReferenceLinks(htmlContent: string): string {
    return htmlContent.replace(/\[\^?(\d+)\]/g, (match, number) => {
      const referenceNumber = Number(number);
      const reference = this.references.find(item => item.number === referenceNumber);
      if (!reference?.url) {
        return match;
      }

      const safeTitle = this.escapeHtmlAttribute(reference.title);
      return `<a href="#medical-reference-${referenceNumber}" `
        + `class="reference-link" title="${safeTitle}">`
        + `[${referenceNumber}]</a>`;
    });
  }

  private addSafeLinkAttributes(htmlContent: string): string {
    return htmlContent.replace(
      /<a\s+([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
      (match, beforeHref, href, afterHref) => {
        if (href.startsWith('#') || /target\s*=\s*["']_blank["']/i.test(match)) {
          return match;
        }
        return `<a ${beforeHref}href="${href}"${afterHref} `
          + 'target="_blank" rel="noopener noreferrer">';
      }
    );
  }

  private escapeHtmlAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private highlightReference(referenceNumber: number): void {
    const referenceElement = document.getElementById(`medical-reference-${referenceNumber}`);
    if (!referenceElement) {
      return;
    }
    referenceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    referenceElement.classList.add('highlighted');
    setTimeout(() => referenceElement.classList.remove('highlighted'), 2000);
  }
}
