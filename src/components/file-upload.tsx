'use client';

import { useState, useCallback } from 'react';
import { Upload, FileCode, X, Archive, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onCodePaste: (code: string) => void;
  onBulkUpload?: (files: File[]) => void;
}

const styles = {
  container: {
    width: '100%',
  },
  tabContainer: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    padding: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '6px',
  },
  tabButton: (isActive: boolean) => ({
    flex: 1,
    padding: '10px 20px',
    borderRadius: '4px',
    fontWeight: 500,
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
  }),
  fileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  fileIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '6px',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSize: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: '2px',
  },
  clearButton: {
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZone: (isDragging: boolean) => ({
    position: 'relative' as const,
    borderRadius: '8px',
    border: `1px dashed ${isDragging ? 'rgba(255,255,255,0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
    backgroundColor: isDragging ? 'rgba(255,255,255,0.03)' : 'transparent',
    transition: 'all 0.2s ease',
  }),
  fileInput: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 10,
  },
  dropContent: {
    padding: '40px',
    textAlign: 'center' as const,
  },
  uploadIconBox: {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropTitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#ffffff',
    marginBottom: '6px',
  },
  dropSubtitle: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: '12px',
  },
  maxSizeBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  textarea: {
    width: '100%',
    height: '240px',
    padding: '16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: '13px',
    resize: 'none' as const,
    outline: 'none',
    lineHeight: 1.5,
  },
  textareaWrapper: {
    position: 'relative' as const,
  },
  charCount: {
    position: 'absolute' as const,
    bottom: '12px',
    right: '12px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  analyzeButton: {
    width: '100%',
    padding: '12px 20px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontWeight: 500,
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '8px',
  },
  bulkList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '16px',
  },
  bulkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  bulkAnalyzeButton: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '15px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '16px',
  },
};

export function FileUpload({ onFileSelect, onCodePaste, onBulkUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'bulk'>('upload');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const luaFiles = files.filter(f => f.name.endsWith('.lua') || f.name.endsWith('.txt'));
    
    if (luaFiles.length === 1) {
      setSelectedFile(luaFiles[0]);
      onFileSelect(luaFiles[0]);
    } else if (luaFiles.length > 1 && onBulkUpload) {
      setBulkFiles(luaFiles);
    }
  }, [onFileSelect, onBulkUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const luaFiles = files.filter(f => f.name.endsWith('.lua') || f.name.endsWith('.txt'));
    
    if (luaFiles.length === 1) {
      setSelectedFile(luaFiles[0]);
      onFileSelect(luaFiles[0]);
    } else if (luaFiles.length > 1 && onBulkUpload) {
      setBulkFiles(luaFiles);
      setActiveTab('bulk');
    }
  }, [onFileSelect, onBulkUpload]);

  const handleBulkFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const luaFiles = files.filter(f => f.name.endsWith('.lua') || f.name.endsWith('.txt'));
    setBulkFiles(prev => [...prev, ...luaFiles]);
  }, []);

  const removeBulkFile = useCallback((index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleBulkAnalyze = useCallback(() => {
    if (bulkFiles.length > 0 && onBulkUpload) {
      onBulkUpload(bulkFiles);
    }
  }, [bulkFiles, onBulkUpload]);

  const handleCodeSubmit = useCallback(() => {
    if (codeInput.trim()) {
      onCodePaste(codeInput);
    }
  }, [codeInput, onCodePaste]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return (
    <div style={styles.container}>
      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('upload')}
          style={styles.tabButton(activeTab === 'upload')}
        >
          Upload File
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          style={styles.tabButton(activeTab === 'paste')}
        >
          Paste Code
        </button>
        {onBulkUpload && (
          <button
            onClick={() => setActiveTab('bulk')}
            style={styles.tabButton(activeTab === 'bulk')}
          >
            Bulk Upload
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {selectedFile ? (
              <div style={styles.fileCard}>
                <div style={styles.fileInfo}>
                  <div style={styles.fileIconBox}>
                    <FileCode style={{ width: '24px', height: '24px', color: '#4ade80' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={styles.fileName}>{selectedFile.name}</h3>
                    <p style={styles.fileSize}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={clearFile}
                    style={styles.clearButton}
                  >
                    <X style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={styles.dropZone(isDragging)}
              >
                <input
                  type="file"
                  accept=".lua,.txt"
                  onChange={handleFileInput}
                  style={styles.fileInput}
                />
                <div style={styles.dropContent}>
                  <div style={styles.uploadIconBox}>
                    <Upload style={{ width: '28px', height: '28px', color: 'rgba(255,255,255,0.5)' }} />
                  </div>
                  <h3 style={styles.dropTitle}>Drop your Lua file here</h3>
                  <p style={styles.dropSubtitle}>or click to browse</p>
                  <span style={styles.maxSizeBadge}>.lua or .txt up to 5MB</span>
                </div>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'paste' ? (
          <motion.div
            key="paste"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div style={styles.textareaWrapper}>
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Paste your Lua code here..."
                style={styles.textarea}
                spellCheck={false}
              />
              <div style={styles.charCount}>
                {codeInput.length} chars
              </div>
            </div>
            {codeInput.trim() && (
              <button
                onClick={handleCodeSubmit}
                style={styles.analyzeButton}
              >
                Analyze Code
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="bulk"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={styles.dropZone(isDragging)}
            >
              <input
                type="file"
                accept=".lua,.txt"
                multiple
                onChange={handleBulkFileInput}
                style={styles.fileInput}
              />
              <div style={styles.dropContent}>
                <div style={styles.uploadIconBox}>
                  <Archive style={{ width: '28px', height: '28px', color: 'rgba(255,255,255,0.5)' }} />
                </div>
                <h3 style={styles.dropTitle}>Drop multiple Lua files here</h3>
                <p style={styles.dropSubtitle}>or click to select files</p>
                <span style={styles.maxSizeBadge}>Select multiple .lua or .txt files</span>
              </div>
            </div>
            
            {bulkFiles.length > 0 && (
              <div style={styles.bulkList}>
                {bulkFiles.map((file, index) => (
                  <div key={index} style={styles.bulkItem}>
                    <FileJson style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.5)' }} />
                    <span style={{ flex: 1, fontSize: '14px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      onClick={() => removeBulkFile(index)}
                      style={{ ...styles.clearButton, padding: '6px' }}
                    >
                      <X style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleBulkAnalyze}
                  style={styles.bulkAnalyzeButton}
                >
                  Analyze {bulkFiles.length} File{bulkFiles.length !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
