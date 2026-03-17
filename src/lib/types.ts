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

// Sub-document identified after splitting a merged PDF
export interface SubDocument {
  type: string;        // e.g. '费用报销单', '公务接待审批单', '电子发票'
  found: boolean;      // whether this document was found in the PDF
  page?: number;       // starting page number in the merged PDF
  pageCount?: number;  // how many pages this sub-document spans
  derived?: boolean;   // true when inferred from issues (not from Dify API)
}

// Standard sub-document types for SRBG reimbursement packages
export const SUB_DOC_TYPES = [
  '费用报销单',
  '公务接待审批单',
  '公务接待清单',
  '情况说明',
  '电子发票',
  '菜品清单',
] as const;

export interface AuditResult {
  receptionType: string;
  suggestion: AuditSuggestion;
  issues: AuditIssue[];
  totalDuration: number;       // seconds
  subDocuments?: SubDocument[]; // documents identified in the merged PDF
  amount?: number;             // total reimbursement amount (元)
  pageCount?: number;          // total pages in the PDF
  aiSummary?: string;          // AI-generated per-file summary (from Dify or client-side)
  rawOutput?: string;          // raw text output from Dify workflow (full audit report)
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
  // Sub-document level counts (primary display)
  totalSubDocs: number;
  subDocPassed: number;
  subDocNeedsReview: number;
  subDocRejected: number; // includes missing
  // File level counts (secondary, for table rows)
  passed: number;
  needsReview: number;
  rejected: number;
  totalDuration: number; // seconds
}

export type AppPhase = 'upload' | 'running' | 'completed' | 'detail';
