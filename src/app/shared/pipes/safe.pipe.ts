import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
    name: 'safe',
    standalone: false
})
export class SafePipe implements PipeTransform {

  constructor(protected sanitizer: DomSanitizer) {}

  private sanitizeAnonymizedHtml(value: unknown): string {
    if (typeof value !== 'string' || !value) {
      return '';
    }

    const escapeHtml = (text: string): string =>
      text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Solo permitir los bloques de redacción generados por el anonimizador ([ANON-N] o <span> negro) y saltos de línea
    const tokenPattern =
      /<span\s+style="background-color:\s*black;\s*display:\s*inline-block;\s*width:\s*(\d+)em;"\s*>&nbsp;<\/span>|\[ANON-(\d+)\]|<br\s*\/?>|\r?\n/gi;

    let result = '';
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenPattern.exec(value)) !== null) {
      if (match.index > lastIndex) {
        result += escapeHtml(value.slice(lastIndex, match.index));
      }

      const spanWidth = match[1] || match[2];
      if (spanWidth !== undefined) {
        const clampedWidth = Math.min(Math.max(parseInt(spanWidth, 10) || 1, 1), 40);
        result += `<span style="background-color: black; display: inline-block; width:${clampedWidth}em;">&nbsp;</span>`;
      } else {
        result += '<br>';
      }

      lastIndex = tokenPattern.lastIndex;
    }

    if (lastIndex < value.length) {
      result += escapeHtml(value.slice(lastIndex));
    }

    return result;
  }

  public transform(value: any, type: string): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
    switch (type) {
      case 'html': return this.sanitizer.bypassSecurityTrustHtml(this.sanitizeAnonymizedHtml(value));
      case 'style': return this.sanitizer.bypassSecurityTrustStyle(value);
      case 'url': return this.sanitizer.bypassSecurityTrustUrl(value);
      case 'resourceUrl': return this.sanitizer.bypassSecurityTrustResourceUrl(value);
      default: throw new Error(`Invalid safe type specified: ${type}`);
    }
  }
}
