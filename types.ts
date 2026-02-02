export enum GradingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface Course {
  id: string;
  name: string; // Ej: "9no EGB - Paralelo A"
  description?: string;
}

export interface Subject {
  id: string;
  name: string; // Ej: "Matemáticas", "Lengua"
  courseId: string;
}

export interface Student {
  id: string;
  name: string;
  courseId: string;
}

export interface StudentSubmission {
  id: string;
  fileName: string;
  fileData: string; // Base64
  mimeType: string;
  status: GradingStatus;
  result?: GradingResult;
  error?: string;
  courseId: string;
  subjectId: string; // Nueva relación
  matchedStudentId?: string;
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