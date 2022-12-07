export class FAQ {
    public faqId: number;
    public title: string;
    public content: string;
  
    constructor(faqId: number, title:string, content: string) {
      this.faqId = faqId;
      this.title = title;
      this.content = content;
    }
  }
  