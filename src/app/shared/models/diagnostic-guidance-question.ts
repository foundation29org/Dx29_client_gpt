export interface DiagnosticGuidanceQuestion {
  id: number;
  questionType: number;
  question: string;
  icon: string;
  primary?: boolean;
}

export const DIAGNOSTIC_GUIDANCE_QUESTIONS: DiagnosticGuidanceQuestion[] = [
  { id: 5, questionType: 4, question: 'land.q5', icon: 'fa-search', primary: true },
  { id: 4, questionType: 3, question: 'land.q4', icon: 'fa-list-ul' },
  { id: 7, questionType: 6, question: 'land.q7', icon: 'fa-balance-scale' },
  { id: 3, questionType: 2, question: 'land.q3', icon: 'fa-check-circle' },
  { id: 6, questionType: 5, question: 'land.q6', icon: 'fa-flask' },
  { id: 1, questionType: 0, question: 'land.q1', icon: 'fa-heartbeat' },
  { id: 2, questionType: 1, question: 'land.q2', icon: 'fa-book' }
];
