import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { needsBrowserRendering } from './pdf-script';
import type { ReportDisease, ReportTexts } from './pdf-results-image';

@Injectable({
  providedIn: 'root'
})
export class PdfMakeService {
  constructor(private translate: TranslateService) {}

  async generateResultsPDF(entryText: string, infoDiseases: any[], lang: string, pdfMakeInstance: any, isEuMode: boolean = false) {
    const logoBase64 = await this.getBase64ImageFromURL('assets/img/logo-Dx29.png');
    const qrBase64 = await this.getBase64ImageFromURL('assets/img/elements/qr.png');
    const checkBase64 = await this.getBase64ImageFromURL('assets/img/icons/check.png');
    const crossBase64 = await this.getBase64ImageFromURL('assets/img/icons/cross.png');
    const logoFooterBase64 = await this.getBase64ImageFromURL('assets/img/logo-foundation-twentynine-footer.png');

    const currentDate = new Date().toLocaleDateString(
      lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : lang === 'ru' ? 'ru-RU' : lang === 'uk' ? 'uk-UA' : lang === 'de' ? 'de-DE' : lang === 'pl' ? 'pl-PL' : lang === 'pt' ? 'pt-PT' : lang === 'hi' ? 'hi-IN' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );

    const texts = this.getReportTexts(lang, isEuMode);
    const matchingLabel = texts.matching;
    const nonMatchingLabel = texts.nonMatching;
    const fileName = `DxGPT_Report_${new Date().getTime()}.pdf`;

    // Roboto, la única fuente de pdfmake, solo tiene latino, cirílico y griego. Con cualquier otro
    // alfabeto (hindi, bengalí, árabe, urdu, chino, japonés, tailandés...) el informe lo dibuja el
    // navegador, que ya muestra bien esos textos en pantalla, y el PDF lleva una imagen por página
    const diseases: ReportDisease[] = infoDiseases.map(disease => ({
      name: disease.name,
      // Nombre original en inglés (hindi, árabe...), como en la pantalla de resultados
      nameEn: disease.showNameEn && disease.nameEn && disease.nameEn !== disease.name ? disease.nameEn : '',
      description: disease.description,
      matchingSymptoms: disease.matchingSymptoms,
      nonMatchingSymptoms: disease.nonMatchingSymptoms
    }));
    const allTexts = [
      entryText, currentDate,
      ...Object.values(texts).flat(),
      ...diseases.flatMap(disease => Object.values(disease))
    ];
    if (needsBrowserRendering(allTexts)) {
      const { downloadResultsImagePdf } = await import('./pdf-results-image');
      await downloadResultsImagePdf({
        lang,
        uiLang: this.translate.currentLang || lang,
        date: currentDate,
        entryText: entryText?.trim() ? entryText : '',
        diseases,
        texts,
        images: { logo: logoBase64, qr: qrBase64, check: checkBase64, cross: crossBase64, logoFooter: logoFooterBase64 }
      }, pdfMakeInstance, fileName);
      return;
    }

    const diseaseSections = infoDiseases.map(disease => [
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: disease.name, style: 'diseaseTitle' },
                  // Nombre original en inglés (hindi, árabe...): la fuente del PDF no
                  // tiene todos los alfabetos y así queda al menos un nombre legible
                  ...(disease.showNameEn && disease.nameEn && disease.nameEn !== disease.name
                    ? [{ text: disease.nameEn, style: 'diseaseNameEn' }]
                    : []),
                  { text: disease.description, style: 'description' },
                  {
                    columns: [
                      { image: 'checkIcon', width: 12, margin: [0, 2, 0, 0] },
                      {
                        width: '*',
                        text: [
                          { text: matchingLabel + ': ', bold: true },
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
                          { text: nonMatchingLabel + ': ', bold: true },
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
          fillColor: (rowIndex: number, node: any, columnIndex: number) => rowIndex === 0 ? '#f7fafd' : null,
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
                { text: texts.regDate, style: 'dateLabel' },
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
        { text: texts.title, style: 'header', margin: [0, 0, 0, 12] },
        {
          style: 'subHeaderIntro',
          stack: texts.subtitles.map(subtitle => ({ text: subtitle })),
          margin: [0, 0, 0, 18]
        },
        ...(entryText?.trim() ? [
          { text: texts.patientText, style: 'subheader', margin: [0, 10, 0, 4] },
          ...this.formatMultilineText(entryText, {
            fontSize: 10,
            color: '#555',
            bold: false,
            margin: [0, 0, 0, 10]
          })
        ] : []),
        { text: texts.candidates, style: 'subheader', margin: [0, 18, 0, 8] },
        ...(texts.orderNote ? [
          {
            text: texts.orderNote,
            style: 'orderNote',
            margin: [0, 0, 0, 12]
          }
        ] : []),
        ...diseaseSections,
        // Bloque completo del "About us"
        { text: texts.aboutTitle, style: 'footerTitle', margin: [0, 30, 0, 5] },
        ...texts.about.map(line => ({ text: line, style: 'footerText' })),
        {
          text: [
            {
              text: texts.contact + ' ',
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
        diseaseNameEn: { fontSize: 10, color: '#555', bold: false, margin: [0, -2, 0, 4] },
        description: { fontSize: 10, color: '#555', bold: false, margin: [0, 0, 0, 8] },
        symptomMatch: { fontSize: 10, color: '#388e3c', bold: false },
        symptomNoMatch: { fontSize: 10, color: '#d32f2f', bold: false },
        footerTitle: { fontSize: 12, bold: true, color: '#2a3b4d' },
        footerText: { fontSize: 9, color: '#777777', margin: [0, 2, 0, 0] },
        footer6Text: { fontSize: 9, color: '#777777' },
        email: { fontSize: 9, color: '#3366CC' },
        orderNote: { fontSize: 9, color: '#666666', italics: true, margin: [0, 0, 0, 8] }
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
            text: `${texts.page} ${currentPage} / ${pageCount}`,
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

    pdfMakeInstance.createPdf(docDefinition).download(fileName);
  }

  // Textos fijos del informe, comunes al PDF de pdfmake y al dibujado por el navegador
  private getReportTexts(lang: string, isEuMode: boolean): ReportTexts {
    const t = (key: string): string => this.translate.instant(key);
    return {
      regDate: t('land.diagnosed.timeline.RegDate'),
      title: t('land.diagnosed.timeline.Report'),
      subtitles: [
        t('land.diagnosed.timeline.subtitle1'),
        t('land.diagnosed.timeline.subtitle2'),
        t('land.diagnosed.timeline.subtitle3')
      ],
      patientText: t('diagnosis.Patient text entered'),
      candidates: isEuMode ? t('diagnosis.Candidate diagnosisEu') : t('diagnosis.Candidate diagnosis'),
      orderNote: isEuMode ? t('diagnosis.Order does not imply probabilityEu') : '',
      matching: isEuMode ? t('diagnosis.Matching symptomsEu') : t('diagnosis.Matching symptoms'),
      nonMatching: isEuMode ? t('diagnosis.Non-matching symptomsEu') : t('diagnosis.Non-matching symptoms'),
      aboutTitle: t('generics.Foundation 29'),
      about: [
        t('land.diagnosed.timeline.footer1'),
        t('land.diagnosed.timeline.footer2'),
        t('land.diagnosed.timeline.footer3'),
        ...(lang === 'es' || lang === 'fr' || lang === 'pt' || lang === 'hi' ? [t('land.diagnosed.timeline.footer4')] : [])
      ],
      contact: t('land.diagnosed.timeline.footer6'),
      page: t('land.page')
    };
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
