import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { marked } from 'marked';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { MedicalAnswerFeedbackComponent } from '../medical-answer-feedback/medical-answer-feedback.component';
import { MedicalAnswerData, MedicalAnswerReference } from './medical-answer.model';

@Component({
  selector: 'app-medical-answer-view',
  templateUrl: './medical-answer-view.component.html',
  styleUrls: ['./medical-answer-view.component.scss'],
  standalone: false
})
export class MedicalAnswerViewComponent implements OnChanges {
  @Input({ required: true }) answer!: MedicalAnswerData;

  htmlContent = '';
  references: MedicalAnswerReference[] = [];
  referencesExpanded = false;

  private processingVersion = 0;

  constructor(
    private readonly modalService: NgbModal,
    private readonly insightsService: InsightsService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['answer'] && this.answer) {
      void this.processAnswer();
    }
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
      centered: true
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
  }

  onContentClick(event: Event): void {
    const target = (event.target as HTMLElement).closest<HTMLAnchorElement>('.reference-link');
    if (!target) {
      return;
    }

    event.preventDefault();
    const referenceNumber = Number(target.getAttribute('data-ref'));
    this.referencesExpanded = true;
    setTimeout(() => this.highlightReference(referenceNumber), 100);
  }

  private async processAnswer(): Promise<void> {
    const version = ++this.processingVersion;
    this.referencesExpanded = false;
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

  private buildReferences(markdown: string, sonarData: any): string {
    const searchResults = Array.isArray(sonarData?.searchResults)
      ? sonarData.searchResults
      : [];
    const citations = Array.isArray(sonarData?.citations)
      ? sonarData.citations
      : [];
    const usedNumbers = this.extractUniqueCitationNumbers(markdown);

    if (usedNumbers.length === 0) {
      const availableReferences = searchResults.length > 0
        ? searchResults.filter((result: any) => result?.url)
        : citations.map((url: string) => ({ title: url, url }));
      this.references = this.formatReferences(availableReferences);
      return markdown;
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
    return markdown.replace(/\[(\d+)\]/g, (_match, number) => {
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
    return references.map((reference, index) => ({
      number: index + 1,
      title: reference.title || reference.url,
      url: reference.url,
      date: reference.date || '',
      snippet: reference.snippet || '',
      source: reference.source || ''
    }));
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
        + `class="reference-link" data-ref="${referenceNumber}" title="${safeTitle}">`
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
