import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { jsPDF } from "jspdf";


@Injectable({
    providedIn: "root"
  })
export class jsPDFService {
    constructor(public translate: TranslateService) {
    }
    lang: string = '';


    private newSectionDoc(doc,sectionNumber,sectionTitle,sectionSubtitle,line){
        line = this.checkIfNewPage(doc, line);
        var title = sectionTitle;
        if(sectionNumber!=null){
            title=sectionNumber+sectionTitle;
        }
        var marginX = 10;
        //doc.setTextColor(117, 120, 125)
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text(marginX, line, title);
        
        //doc.setTextColor(0, 0, 0)
        if(sectionSubtitle!=null){
            var subtitle = sectionSubtitle;
            doc.setFont(undefined, 'italic');
            doc.setFontSize(12);
            doc.text(marginX, line, subtitle);
        }
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
    }

    private newHeatherAndFooter(doc){
        // Footer
        var logoHealth = new Image();
        logoHealth.src = "assets/img/logo-foundation-twentynine-footer.png"
        doc.addImage(logoHealth, 'png', 20, 284, 25, 10);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(51, 101, 138)
        doc.textWithLink("https://dxgpt.app", 148, 290, { url: 'https://dxgpt.app' });
        doc.setTextColor(0, 0, 0);
    }

    private getFormatDate(date) {
        var localeLang = 'en-US';
        if (this.lang == 'es') {
            localeLang = 'es-ES'
        }
        return date.toLocaleString(localeLang, { month: 'long' , day: 'numeric', year: 'numeric'});
    }

    private pad(number) {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    }
    private checkIfNewPage(doc, lineText) {
        if (lineText < 270) {
            return lineText
        }
        else {
            doc.addPage()
            this.newHeatherAndFooter(doc)
            lineText = 20;
            return lineText;
        }
    }
    
    private writeText(doc, pos, lineText, text) {
        lineText = this.checkIfNewPage(doc, lineText);
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(text, pos, lineText);
        return lineText;
    }

    private writeHeader(doc, pos, lineText, text) {
        doc.setTextColor(117, 120, 125)
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text(text, pos, lineText += 20);
    }

    private writeDataHeader(doc, pos, lineText, text) {
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.text(text, pos, lineText += 20);
    }

    private getDate() {
        var date = new Date()
        return date.getUTCFullYear() + this.pad(date.getUTCMonth() + 1) + this.pad(date.getUTCDate()) + this.pad(date.getUTCHours()) + this.pad(date.getUTCMinutes()) + this.pad(date.getUTCSeconds());
    };

    private writeAboutUs(doc,lineText){
        lineText = this.checkIfNewPage(doc, lineText);
        doc.setFont(undefined, 'bold');
        doc.text(this.translate.instant("generics.Foundation 29"), 10, lineText);
        this.writelinePreFooter(doc, this.translate.instant("land.diagnosed.timeline.footer1"), lineText += 5);
        lineText = this.checkIfNewPage(doc, lineText);
        this.writelinePreFooter(doc, this.translate.instant("land.diagnosed.timeline.footer2"), lineText += 5);
        lineText = this.checkIfNewPage(doc, lineText);
        this.writelinePreFooter(doc, this.translate.instant("land.diagnosed.timeline.footer3"), lineText += 5);
        if(this.lang =='es'){
            lineText = this.checkIfNewPage(doc, lineText);
            this.writelinePreFooter(doc, this.translate.instant("land.diagnosed.timeline.footer4"), lineText += 5);
        }
        lineText = this.checkIfNewPage(doc, lineText);

        doc.setTextColor(0, 0, 0)
        lineText += 5;
        doc.setFontSize(9);
        doc.setTextColor(117, 120, 125)
        doc.text(this.translate.instant("land.diagnosed.timeline.footer6"), 10, lineText += 5);
        doc.setTextColor(51, 101, 138)
        var url = "mailto:info@foundation29.org";
        doc.textWithLink("info@foundation29.org", (((this.translate.instant("land.diagnosed.timeline.footer6")).length*2)-18), lineText, { url: url });
        //lineText = this.checkIfNewPage(doc, lineText);
        doc.setTextColor(0, 0, 0);
    }

    writelinePreFooter(doc, text, lineText){
        doc.setFontSize(9);
        doc.setTextColor(117, 120, 125)
        doc.setFont(undefined, 'normal');
        doc.text(text, 10, lineText);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
    }

    generateResultsPDF(infoSymptoms, infoDiseases, lang){
        this.lang = lang;
        const doc = new jsPDF();
        var lineText = 0;

        // Cabecera inicial
        var img_logo = new Image();
        img_logo.src = "assets/img/logo-Dx29.png"
        doc.addImage(img_logo, 'png', 10, 13, 54, 16);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        var actualDate = new Date();
        var dateHeader = this.getFormatDate(actualDate);
        if(lang=='es'){
            this.writeHeader(doc, 89, 0, this.translate.instant("land.diagnosed.timeline.RegDate"));
            this.writeDataHeader(doc, 82, 5, dateHeader);
        }else{
            this.writeHeader(doc, 93, 0, this.translate.instant("land.diagnosed.timeline.RegDate"));
            this.writeDataHeader(doc, 88, 5, dateHeader);
        }

       //Add QR
        var img_qr = new Image();
        img_qr.src = "assets/img/elements/qr.png"
        doc.addImage(img_qr, 'png', 160, 5, 32, 30);

        this.newHeatherAndFooter(doc);

        lineText += 25;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(15);
        doc.text(this.translate.instant("land.diagnosed.timeline.Report"), 10, lineText += 15);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(117, 120, 125)
        doc.text(this.translate.instant("land.diagnosed.timeline.subtitlea"), 10, lineText += 5)
        doc.text(this.translate.instant("land.diagnosed.timeline.subtitleb"), 10, lineText += 5)
        doc.text(this.translate.instant("land.diagnosed.timeline.subtitlec"), 10, lineText += 5)
        lineText += 5
        doc.text(this.translate.instant("land.diagnosed.timeline.subtitle1"), 10, lineText += 5)
        doc.text(this.translate.instant("land.diagnosed.timeline.subtitle2"), 10, lineText += 5)
        doc.text(this.translate.instant("land.diagnosed.timeline.subtitle3"), 10, lineText += 5)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10);
        
        //Diseases
        if(infoDiseases.length>0){
            this.newSectionDoc(doc,this.translate.instant("diagnosis.Candidate diagnosis"),'',null,lineText += 10)
            //this.writeHeaderText(doc, 10, lineText += 7, this.translate.instant("generics.Name"));
            //this.writeHeaderText(doc, 175, lineText, "Id");
            lineText += 7;
            for (var i = 0; i < infoDiseases.length; i++) {
                if(infoDiseases[i].name.length>99){
                    lineText = this.writeText(doc, 10, lineText, infoDiseases[i].name.substr(0,99));
                    //lineText = this.writeLinkOrpha(doc, 175, lineText, (infoDiseases[i].id).toUpperCase());
                    lineText = lineText+5;
                    lineText = this.writeText(doc, 10, lineText, infoDiseases[i].name.substr(100));
                }else{
                    lineText = this.writeText(doc, 10, lineText, infoDiseases[i].name);
                    //lineText = this.writeLinkOrpha(doc, 175, lineText, (infoDiseases[i].id).toUpperCase());
                }
                lineText += 7;
            }
        }

        lineText += 10;
        this.writeAboutUs(doc, lineText);
        
        var pageCount = doc.internal.pages.length; //Total Page Number
        pageCount = pageCount-1;
        for (i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            //footer page
            doc.text(this.translate.instant("land.page")+ ' ' + i + '/' + pageCount, 97, 286);
        }

        // Save file
        var date = this.getDate();
        doc.save('DxGPT_Report_' + date + '.pdf');

    }


}
