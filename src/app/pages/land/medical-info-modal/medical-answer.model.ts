export interface MedicalAnswerData {
  question: string;
  content: string;
  sonarData: unknown;
  model: string;
  detectedLang: string;
  selectedFiles: Array<{ name?: string }>;
}

export interface MedicalAnswerReference {
  number: number;
  title: string;
  url: string;
  date: string;
  snippet: string;
  snippetHtml: string;
  source: string;
}
