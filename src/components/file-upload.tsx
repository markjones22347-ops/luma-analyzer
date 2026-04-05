'use client';

import { useState, useCallback } from 'react';
import { Upload, FileCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onCodePaste: (code: string) => void;
}

const styles = {
  container: {
    width: '100%',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    padding: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  tabButton: (isActive: boolean) => ({
    flex: 1,
    padding: '14px 28px',
    borderRadius: '14px',
    fontWeight: 600,
    fontSize: '15px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
    boxShadow: isActive ? '0 8px 25px -5px rgba(59, 130, 246, 0.4)' : 'none',
  }),
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(20px)',
    borderRadius: '28px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  fileIconBox: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(34, 197, 94, 0.2)',
  },
  fileName: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSize: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '4px',
  },
  clearButton: {
    padding: '14px',
    borderRadius: '14px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZone: (isDragging: boolean) => ({
    position: 'relative' as const,
    borderRadius: '28px',
    border: `2px dashed ${isDragging ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)'}`,
    backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
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
    padding: '60px 48px',
    textAlign: 'center' as const,
  },
  uploadIconBox: {
    width: '100px',
    height: '100px',
    margin: '0 auto 28px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  },
  dropTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '10px',
  },
  dropSubtitle: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '20px',
  },
  maxSizeBadge: {
    display: 'inline-block',
    padding: '10px 20px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  textarea: {
    width: '100%',
    height: '320px',
    padding: '28px',
    borderRadius: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: '14px',
    resize: 'none' as const,
    outline: 'none',
    lineHeight: 1.6,
  },
  textareaWrapper: {
    position: 'relative' as const,
  },
  charCount: {
    position: 'absolute' as const,
    bottom: '20px',
    right: '20px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  analyzeButton: {
    width: '100%',
    padding: '18px 32px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '16px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 10px 30px -5px rgba(59, 130, 246, 0.4)',
    marginTop: '8px',
  },
};

export function FileUpload({ onFileSelect, onCodePaste }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');

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

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.lua') || file.name.endsWith('.txt')) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

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
      {/* Custom Rounded Tab Buttons */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('upload')}
          style={styles.tabButton(activeTab === 'upload')}
          onMouseEnter={(e) => {
            if (activeTab !== 'upload') {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'upload') {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          Upload File
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          style={styles.tabButton(activeTab === 'paste')}
          onMouseEnter={(e) => {
            if (activeTab !== 'paste') {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'paste') {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          Paste Code
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {selectedFile ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={styles.glassCard}
              >
                <div style={styles.fileInfo}>
                  <div style={styles.fileIconBox}>
                    <FileCode style={{ width: '36px', height: '36px', color: '#22c55e' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={styles.fileName}>
                      {selectedFile.name}
                    </h3>
                    <p style={styles.fileSize}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready to analyze
                    </p>
                  </div>
                  <button
                    onClick={clearFile}
                    style={styles.clearButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <X style={{ width: '22px', height: '22px' }} />
                  </button>
                </div>
              </motion.div>
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
                  <motion.div
                    animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    style={styles.uploadIconBox}
                  >
                    <Upload style={{ width: '44px', height: '44px', color: '#3b82f6' }} />
                  </motion.div>
                  <h3 style={styles.dropTitle}>
                    Drop your Lua file here
                  </h3>
                  <p style={styles.dropSubtitle}>
                    or click anywhere to browse files
                  </p>
                  <span style={styles.maxSizeBadge}>
                    Supports .lua and .txt up to 5MB
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="paste"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={styles.textareaWrapper}>
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Paste your Lua code here for instant analysis..."
                style={styles.textarea}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                spellCheck={false}
              />
              <div style={styles.charCount}>
                {codeInput.length.toLocaleString()} chars
              </div>
            </div>
            {codeInput.trim() && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleCodeSubmit}
                style={styles.analyzeButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(59, 130, 246, 0.4)';
                }}
              >
                Start Analysis
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
