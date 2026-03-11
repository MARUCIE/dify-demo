'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, Calendar, Play, FolderOpen, FileText, AlertTriangle,
} from 'lucide-react';
import type { BatchFile } from '@/lib/types';
import { DURATION, EASE_DEFAULT } from '@/lib/animations';

// -- Constants --

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file
const MAX_FILES = 100;

// C8: Validate PDF magic bytes (%PDF- header)
async function isPdfMagicBytes(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 5).arrayBuffer();
    const header = new TextDecoder().decode(buffer);
    return header.startsWith('%PDF-');
  } catch {
    return false;
  }
}

// -- Props --

interface UploadZoneProps {
  files: BatchFile[];
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onStartAudit: (auditDate: string) => void;
  disabled?: boolean;
}

// -- Helpers --

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getHandwritingColor(ratio: number): { bar: string; bg: string } {
  if (ratio < 0.3) return { bar: '#059669', bg: 'rgba(34,197,94,0.15)' };
  if (ratio < 0.6) return { bar: '#D97706', bg: 'rgba(245,158,11,0.15)' };
  return { bar: '#DC2626', bg: 'rgba(239,68,68,0.15)' };
}

/**
 * Recursively read a dropped directory entry via the webkit File System API,
 * collecting all .pdf files found within.
 */
function readEntryRecursive(entry: FileSystemEntry): Promise<File[]> {
  return new Promise((resolve) => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file((file) => {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          resolve([file]);
        } else {
          resolve([]);
        }
      }, () => resolve([]));
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const allFiles: File[] = [];

      // readEntries may return results in batches, so we loop until empty
      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve(allFiles);
            return;
          }
          const nested = await Promise.all(entries.map(readEntryRecursive));
          for (const batch of nested) {
            allFiles.push(...batch);
          }
          readBatch();
        }, () => resolve(allFiles));
      };
      readBatch();
    } else {
      resolve([]);
    }
  });
}

/**
 * Extract PDF files from a drop event. Supports both flat file drops
 * and folder drops via webkitGetAsEntry().
 */
async function extractPdfFiles(dataTransfer: DataTransfer): Promise<File[]> {
  const items = dataTransfer.items;
  const files: File[] = [];

  // Try webkitGetAsEntry for folder support
  if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) entries.push(entry);
    }
    const nested = await Promise.all(entries.map(readEntryRecursive));
    for (const batch of nested) {
      files.push(...batch);
    }
    return files;
  }

  // Fallback: read from dataTransfer.files
  for (let i = 0; i < dataTransfer.files.length; i++) {
    const f = dataTransfer.files[i];
    if (f.name.toLowerCase().endsWith('.pdf')) {
      files.push(f);
    }
  }
  return files;
}

// -- Component --

export default function UploadZone({
  files,
  onFilesAdd,
  onFileRemove,
  onStartAudit,
  disabled,
}: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [auditDate, setAuditDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFiles = files.length > 0;
  const canAddMore = files.length < MAX_FILES;

  // -- Validation --

  const validateAndAdd = useCallback(async (incoming: File[]) => {
    const errors: string[] = [];
    const valid: File[] = [];
    const remaining = MAX_FILES - files.length;

    for (const f of incoming) {
      if (f.type && f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        errors.push(`${f.name}: 不支持的格式，仅支持 PDF`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        errors.push(`${f.name}: 文件过大（${formatFileSize(f.size)}），最大 20MB`);
        continue;
      }
      // C8: Magic byte validation
      const isRealPdf = await isPdfMagicBytes(f);
      if (!isRealPdf) {
        errors.push(`${f.name}: 文件内容非有效 PDF 格式`);
        continue;
      }
      if (valid.length >= remaining) {
        errors.push(`已达到最大文件数量限制（${MAX_FILES} 个）`);
        break;
      }
      valid.push(f);
    }

    setValidationErrors(errors);
    if (errors.length > 0) {
      setTimeout(() => setValidationErrors([]), 5000);
    }

    if (valid.length > 0) {
      onFilesAdd(valid);
    }
  }, [files.length, onFilesAdd]);

  // -- Drag handlers --

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const pdfs = await extractPdfFiles(e.dataTransfer);
    if (pdfs.length > 0) {
      validateAndAdd(pdfs);
    }
  }, [validateAndAdd]);

  // -- Click to browse --

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    const arr: File[] = [];
    for (let i = 0; i < selected.length; i++) {
      arr.push(selected[i]);
    }
    validateAndAdd(arr);
    // Reset input so user can re-select same files
    e.target.value = '';
  }, [validateAndAdd]);

  // -- Render --

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slower, delay: 0.3, ease: EASE_DEFAULT }}
      className="flex-1 flex flex-col min-h-0"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <div
          className="flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #0D9488, #0F766E)',
          }}
        >
          <Upload size={16} color="white" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>批量上传报销材料</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            支持拖拽文件或文件夹，PDF 格式，单文件最大 20MB，最多 {MAX_FILES} 个
          </p>
        </div>
        {hasFiles && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="badge badge-blue"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            <FileText size={14} strokeWidth={2.5} />
            {files.length} 个文件 / {formatFileSize(totalSize)}
          </motion.span>
        )}
      </div>

      <div className="glass-bright rounded-2xl glow-blue flex-1 flex flex-col min-h-0" style={{ padding: hasFiles ? 24 : 0 }}>
        {/* Validation errors */}
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginBottom: 16,
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              {validationErrors.map((err, i) => (
                <div key={i} className="flex items-center gap-2" style={{ fontSize: 13, color: '#DC2626', lineHeight: 1.8 }}>
                  <AlertTriangle size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {err}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dropzone -- full-screen when empty, compact when files exist */}
        <div
          className={`dropzone rounded-xl cursor-pointer ${dragOver ? 'dragover' : ''} ${hasFiles ? 'has-file' : ''} ${hasFiles ? '' : 'flex-1'}`}
          style={{
            minHeight: hasFiles ? 64 : 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: hasFiles ? '14px 24px' : '48px 24px',
            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}
          role="button"
          tabIndex={0}
          aria-label={hasFiles ? '拖拽更多文件或文件夹至此，或点击选择' : '拖拽文件或文件夹至此，或点击选择文件'}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />

          <AnimatePresence mode="wait">
            {hasFiles ? (
              <motion.div
                key="compact-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <FolderOpen size={18} color="#0D9488" strokeWidth={1.5} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  拖拽更多文件或文件夹至此，或点击选择
                </span>
                {!canAddMore && (
                  <span className="badge badge-amber" style={{ fontSize: 11 }}>
                    已达上限
                  </span>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="full-prompt"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <div style={{ position: 'relative', marginBottom: 24 }}>
                  {/* Outer pulsing ring */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: -12,
                      borderRadius: 28,
                      border: '1.5px solid rgba(13,148,136,0.15)',
                    }}
                    animate={{
                      scale: [1, 1.08, 1],
                      opacity: [0.4, 0.8, 0.4],
                      borderColor: [
                        'rgba(13,148,136,0.15)',
                        'rgba(8,145,178,0.3)',
                        'rgba(13,148,136,0.15)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="flex items-center justify-center"
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 22,
                      background: 'linear-gradient(135deg, rgba(13,148,136,0.1), rgba(8,145,178,0.06))',
                      border: '1px solid rgba(13,148,136,0.2)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(13,148,136,0.1), inset 0 0 20px rgba(13,148,136,0.05)',
                        '0 0 40px rgba(13,148,136,0.2), inset 0 0 30px rgba(13,148,136,0.1)',
                        '0 0 20px rgba(13,148,136,0.1), inset 0 0 20px rgba(13,148,136,0.05)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Upload size={38} color="#0D9488" strokeWidth={1.5} />
                  </motion.div>
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  拖拽文件或文件夹至此
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  或点击选择文件 -- 支持批量添加 PDF
                </p>
                <div className="flex gap-3 mt-5">
                  <span className="badge badge-blue" style={{ fontSize: 11 }}>PDF 格式</span>
                  <span className="badge badge-blue" style={{ fontSize: 11 }}>最大 20MB/个</span>
                  <span className="badge badge-blue" style={{ fontSize: 11 }}>最多 {MAX_FILES} 个</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* File list table */}
        <AnimatePresence>
          {hasFiles && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              style={{ marginTop: 20 }}
            >
              {/* Table header */}
              <div
                className="grid items-center"
                style={{
                  gridTemplateColumns: '1fr 90px 60px 160px 44px',
                  gap: 12,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase' as const,
                  letterSpacing: 0.8,
                }}
              >
                <span>文件名</span>
                <span style={{ textAlign: 'right' }}>大小</span>
                <span style={{ textAlign: 'center' }}>页数</span>
                <span>手写比例</span>
                <span />
              </div>

              {/* Scrollable file rows */}
              <div
                style={{
                  maxHeight: 400,
                  overflowY: 'auto',
                  borderRadius: 10,
                  border: '1px solid rgba(13,148,136,0.15)',
                }}
              >
                <AnimatePresence initial={false}>
                  {files.map((bf, index) => {
                    const hw = getHandwritingColor(bf.handwritingRatio);
                    return (
                      <motion.div
                        key={bf.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                        className="grid items-center"
                        style={{
                          gridTemplateColumns: '1fr 90px 60px 160px 44px',
                          gap: 12,
                          padding: '10px 16px',
                          borderTop: index > 0 ? '1px solid rgba(13,148,136,0.1)' : 'none',
                          background: index % 2 === 0 ? 'rgba(13,148,136,0.03)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(13,148,136,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = index % 2 === 0 ? 'rgba(13,148,136,0.03)' : 'transparent'; }}
                      >
                        {/* File name */}
                        <div className="flex items-center gap-2.5" style={{ minWidth: 0 }}>
                          <FileText size={15} color="#0D9488" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={bf.name}
                          >
                            {bf.name}
                          </span>
                        </div>

                        {/* Size */}
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {formatFileSize(bf.size)}
                        </span>

                        {/* Pages */}
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                          {bf.pages > 0 ? bf.pages : '--'}
                        </span>

                        {/* Handwriting ratio bar */}
                        <div className="flex items-center gap-2.5">
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              background: 'rgba(209,224,222,0.4)',
                              overflow: 'hidden',
                            }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.round(bf.handwritingRatio * 100)}%` }}
                              transition={{ duration: DURATION.slow, delay: index * 0.05, ease: 'easeOut' }}
                              style={{
                                height: '100%',
                                borderRadius: 3,
                                background: hw.bar,
                                boxShadow: `0 0 8px ${hw.bar}40`,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: hw.bar,
                              width: 32,
                              textAlign: 'right',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {Math.round(bf.handwritingRatio * 100)}%
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={e => { e.stopPropagation(); onFileRemove(bf.id); }}
                          disabled={disabled}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: 'none',
                            background: 'rgba(239,68,68,0.08)',
                            color: '#DC2626',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            opacity: disabled ? 0.3 : 1,
                          }}
                          onMouseEnter={e => {
                            if (!disabled) {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)';
                            }
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
                          }}
                          aria-label={`移除文件 ${bf.name}`}
                          title="移除文件"
                        >
                          <X size={15} strokeWidth={2} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Bottom bar: date picker + CTA */}
              <div
                className="flex items-end gap-5"
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: '1px solid rgba(13,148,136,0.2)',
                }}
              >
                {/* Date picker */}
                <div style={{ flex: '0 0 220px' }}>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    审核基准日期
                  </label>
                  <div
                    className="flex items-center gap-2.5"
                    style={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 10,
                      padding: '10px 14px',
                    }}
                  >
                    <Calendar size={16} color="var(--text-muted)" strokeWidth={2} />
                    <input
                      type="date"
                      value={auditDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => setAuditDate(e.target.value)}
                      disabled={disabled}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        width: '100%',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        colorScheme: 'inherit',
                      }}
                    />
                  </div>
                </div>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* CTA button */}
                <motion.button
                  className="btn-primary flex items-center justify-center gap-2.5"
                  style={{ minWidth: 220, height: 48 }}
                  onClick={() => onStartAudit(auditDate)}
                  disabled={!hasFiles || disabled}
                  whileHover={hasFiles && !disabled ? { scale: 1.02 } : {}}
                  whileTap={hasFiles && !disabled ? { scale: 0.98 } : {}}
                >
                  <Play size={18} strokeWidth={2.5} />
                  启动批量审核
                  {hasFiles && (
                    <span
                      style={{
                        marginLeft: 4,
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {files.length}
                    </span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
