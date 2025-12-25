export enum GradingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface StudentSubmission {
  id: string;
  fileName: string;
  fileData: string; // Base64
  mimeType: string;
  status: GradingStatus;
  result?: GradingResult;
  error?: string;
}

export interface GradingResult {
  studentName: string;
  transcription: string;
  score: number;
  maxScore: number;
  feedback: string;
  areasForImprovement: string[];
}

export interface RubricConfig {
  description: string;
  // Campos opcionales para archivo de rúbrica
  rubricFileData?: string;
  rubricFileMimeType?: string;
  rubricFileName?: string;
  
  maxScore: number;
  strictness: 'lenient' | 'moderate' | 'strict';
  language: 'english' | 'spanish' | 'auto';
}