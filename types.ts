export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  NOTES = 'NOTES',
  FOCUS = 'FOCUS',
  ANALYZER = 'ANALYZER',
  TRANSLATOR = 'TRANSLATOR',
  QUIZ = 'QUIZ',
  CHAT = 'CHAT'
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  tags?: string[];
}

export interface SubjectTopic {
  name: string;
  frequencyScore: number; // 0-100
  lastAppeared: string;
}

export interface SubjectData {
  id: string;
  name: string;
  topics: SubjectTopic[];
}

export interface AnalysisResult {
  summary: string;
  questions: string[];
  topics: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  explanation: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ImageInput {
  base64: string;
  mimeType: string;
}