export type StepStatus = 'idle' | 'active' | 'completed' | 'error';

export interface WorkflowStepDef {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  estimatedDuration: number; // ms, used to simulate step duration
}

export interface StepState {
  stepId: number;
  status: StepStatus;
  message?: string;
  startedAt?: number;
  completedAt?: number;
}

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface AuditIssue {
  severity: IssueSeverity;
  message: string;
  detail?: string;
}

export type AuditSuggestion = '通过' | '人工复核' | '不通过';

export interface AuditResult {
  receptionType: string;
  suggestion: AuditSuggestion;
  issues: AuditIssue[];
  totalDuration: number; // seconds
}

// -- v2.0 Batch types --

export type BatchFileStatus = 'queued' | 'processing' | 'completed' | 'error';

export interface BatchFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pages: number;
  handwritingRatio: number; // 0-1, ratio of handwritten content
  status: BatchFileStatus;
  currentStep: number; // 0 = not started, 1-10 = active step
  stepStates: StepState[];
  result: AuditResult | null;
  error: string | null;
}

export interface BatchSummary {
  totalFiles: number;
  completed: number;
  passed: number;
  needsReview: number;
  rejected: number;
  totalDuration: number; // seconds
}

export type AppPhase = 'upload' | 'running' | 'completed' | 'detail';
