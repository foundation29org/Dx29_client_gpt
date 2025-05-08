import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class PdfMakeService {
  constructor(private translate: TranslateService) {}

  async generateResultsPDF(entryText: string, infoDiseases: any[], lang: string, pdfMakeInstance: any) {
    const logoBase64 = await this.getBase64ImageFromURL('assets/img/logo-Dx29.png');
    const qrBase64 = await this.getBase64ImageFromURL('assets/img/elements/qr.png');
    const checkBase64 = await this.getBase64ImageFromURL('assets/img/icons/check.png');
    const crossBase64 = await this.getBase64ImageFromURL('assets/img/icons/cross.png');
    const logoFooterBase64 = await this.getBase64ImageFromURL('assets/img/logo-foundation-twentynine-footer.png');

    const currentDate = new Date().toLocaleDateString(
      lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : lang === 'ru' ? 'ru-RU' : lang === 'uk' ? 'uk-UA' : lang === 'de' ? 'de-DE' : lang === 'pl' ? 'pl-PL' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );

    const diseaseSections = infoDiseases.map(disease => [
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: disease.name, style: 'diseaseTitle' },
                  { text: disease.description, style: 'description' },
                  {
                    columns: [
                      { image: 'checkIcon', width: 12, margin: [0, 2, 0, 0] },
                      {
                        width: '*',
                        text: [
                          { text: this.translate.instant('diagnosis.Matching symptoms') + ': ', bold: true },
                          { text: disease.matchingSymptoms }
                        ],
                        style: 'symptomMatch',
                        margin: [5, 0, 0, 0]
                      }
                    ],
                    columnGap: 5,
                    margin: [0, 5, 0, 0]
                  },
                  {
                    columns: [
                      { image: 'crossIcon', width: 12, margin: [0, 2, 0, 0] },
                      {
                        width: '*',
                        text: [
                          { text: this.translate.instant('diagnosis.Non-matching symptoms') + ': ', bold: true },
                          { text: disease.nonMatchingSymptoms }
                        ],
                        style: 'symptomNoMatch',
                        margin: [5, 0, 0, 0]
                      }
                    ],
                    columnGap: 5,
                    margin: [0, 0, 0, 0]
                  }
                ],
                margin: [0, 0, 0, 0]
              }
            ]
          ]
        },
        layout: {
          fillColor: (rowIndex, node, columnIndex) => rowIndex === 0 ? '#f7fafd' : null,
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 16,
          paddingRight: () => 16,
          paddingTop: () => 12,
          paddingBottom: () => 12,
        },
        margin: [0, 10, 0, 10]
      }
    ]).reduce((acc, val) => acc.concat(val), []);

    const docDefinition: any = {
      pageMargins: [36, 60, 36, 80],
      content: [
        {
          columns: [
            { image: 'logoDxGPT', width: 120, margin: [0, 0, 0, 0] },
            {
              stack: [
                { text: this.translate.instant('land.diagnosed.timeline.RegDate'), style: 'dateLabel' },
                { text: currentDate, style: 'dateValue' }
              ],
              alignment: 'center',
              margin: [-40, 0, 0, 0]
            },
            { image: 'qrCode', width: 60, height: 60, alignment: 'right', margin: [0, -10, 0, 0] }
          ],
          widths: [120, '*', 60],
          columnGap: 10,
          margin: [0, 0, 0, 20],
          verticalAlign: 'middle'
        },
        { text: this.translate.instant('land.diagnosed.timeline.Report'), style: 'header', margin: [0, 0, 0, 12] },
        {
          style: 'subHeaderIntro',
          stack: [
            { text: this.translate.instant('land.diagnosed.timeline.subtitle1') },
            { text: this.translate.instant('land.diagnosed.timeline.subtitle2') },
            { text: this.translate.instant('land.diagnosed.timeline.subtitle3') }
          ],
          margin: [0, 0, 0, 18]
        },
        { text: this.translate.instant('diagnosis.Patient text entered'), style: 'subheader', margin: [0, 10, 0, 4] },
        ...this.formatMultilineText(entryText, {
          fontSize: 10,
          color: '#555',
          bold: false,
          margin: [0, 0, 0, 10]
        }),
        { text: this.translate.instant('diagnosis.Candidate diagnosis'), style: 'subheader', margin: [0, 18, 0, 8] },
        ...diseaseSections,
        // Bloque completo del "About us"
        { text: this.translate.instant('generics.Foundation 29'), style: 'footerTitle', margin: [0, 30, 0, 5] },
        { text: this.translate.instant('land.diagnosed.timeline.footer1'), style: 'footerText' },
        { text: this.translate.instant('land.diagnosed.timeline.footer2'), style: 'footerText' },
        { text: this.translate.instant('land.diagnosed.timeline.footer3'), style: 'footerText' },
        ...(lang === 'es' || lang === 'fr'
          ? [{ text: this.translate.instant('land.diagnosed.timeline.footer4'), style: 'footerText' }]
          : []),
        {
          text: [
            {
              text: this.translate.instant('land.diagnosed.timeline.footer6') + ' ',
              style: 'footer6Text'
            },
            {
              text: 'support@foundation29.org',
              link: 'mailto:support@foundation29.org',
              style: 'email'
            }
          ],
          margin: [0, 20, 0, 10]
        }
      ],
      styles: {
        header: { fontSize: 20, bold: true, color: '#2a3b4d', margin: [0, 0, 0, 8], alignment: 'left' },
        dateLabel: { fontSize: 10, color: '#888888', alignment: 'center' },
        dateValue: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 2, 0, 0], color: '#2a3b4d' },
        subHeaderIntro: { fontSize: 10, color: '#555', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 15, bold: true, color: '#1a2533', margin: [0, 18, 0, 8] },
        body: { fontSize: 10, color: '#444', margin: [0, 0, 0, 6], bold: false },
        diseaseTitle: { fontSize: 13, bold: true, color: '#1a2533', margin: [0, 0, 0, 4] },
        description: { fontSize: 10, color: '#555', bold: false, margin: [0, 0, 0, 8] },
        symptomMatch: { fontSize: 10, color: '#388e3c', bold: false },
        symptomNoMatch: { fontSize: 10, color: '#d32f2f', bold: false },
        footerTitle: { fontSize: 12, bold: true, color: '#2a3b4d' },
        footerText: { fontSize: 9, color: '#777777', margin: [0, 2, 0, 0] },
        footer6Text: { fontSize: 9, color: '#777777' },
        email: { fontSize: 9, color: '#3366CC' }
      },
      images: {
        logoDxGPT: logoBase64,
        qrCode: qrBase64,
        checkIcon: checkBase64,
        crossIcon: crossBase64,
        logoFooter: logoFooterBase64
      },
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          { image: 'logoFooter', width: 100, margin: [20, 0, 0, 10] },
          {},
          {
            text: `${this.translate.instant('land.page')} ${currentPage} / ${pageCount}`,
            alignment: 'center',
            fontSize: 9,
            color: '#777777',
            margin: [0, 10, 0, 0]
          },
          {},
          {
            text: 'dxgpt.app',
            link: 'https://dxgpt.app',
            alignment: 'right',
            fontSize: 9,
            color: '#3366CC',
            margin: [0, 10, 20, 0]
          }
        ],
        widths: [100, '*', 120, '*', 120],
        columnGap: 10
      })
    };

    pdfMakeInstance.createPdf(docDefinition).download(`DxGPT_Report_${new Date().getTime()}.pdf`);
  }

  private async getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject('No context');
        }
      };
      img.onerror = error => reject(error);
      img.src = url;
    });
  }

  private formatMultilineText(text: string, style: any) {
    return text.split('\n').map(line => ({
      text: line.trim(),
      ...style
    }));
  }
}
