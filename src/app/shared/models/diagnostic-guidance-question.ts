export interface DiagnosticGuidanceQuestion {
  id: number;
  questionType: number;
  question: string;
  icon: string;
  primary?: boolean;
  /**
   * The Server answers these from the case itself (the text or the uploaded images), so it
   * rejects them with a 400 when there is neither. Mirrors questionType 3-6 in callInfoDiseaseService.
   */
  needsCase?: boolean;
}

export const DIAGNOSTIC_GUIDANCE_QUESTIONS: DiagnosticGuidanceQuestion[] = [
  { id: 5, questionType: 4, question: 'land.q5', icon: 'fa-search', primary: true, needsCase: true },
  { id: 4, questionType: 3, question: 'land.q4', icon: 'fa-list-ul', needsCase: true },
  { id: 7, questionType: 6, question: 'land.q7', icon: 'fa-balance-scale', needsCase: true },
  { id: 3, questionType: 2, question: 'land.q3', icon: 'fa-check-circle' },
  { id: 6, questionType: 5, question: 'land.q6', icon: 'fa-flask', needsCase: true },
  { id: 1, questionType: 0, question: 'land.q1', icon: 'fa-heartbeat' },
  { id: 2, questionType: 1, question: 'land.q2', icon: 'fa-book' }
];
