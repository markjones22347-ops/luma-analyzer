'use client';

import { useState, useCallback } from 'react';
import { Upload, FileCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onCodePaste: (code: string) => void;
}

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
    <div className="w-full max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-luma-card rounded-2xl border border-luma-border">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'upload'
              ? 'bg-luma-primary text-white shadow-lg shadow-luma-primary/25'
              : 'text-luma-muted hover:text-white'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'paste'
              ? 'bg-luma-primary text-white shadow-lg shadow-luma-primary/25'
              : 'text-luma-muted hover:text-white'
          }`}
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
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="glass rounded-3xl p-8 border border-luma-border glow-safe"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-luma-safe/10 flex items-center justify-center">
                    <FileCode className="w-8 h-8 text-luma-safe" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {selectedFile.name}
                    </h3>
                    <p className="text-luma-muted text-sm">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-3 rounded-xl bg-luma-danger/10 text-luma-danger hover:bg-luma-danger/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
                  isDragging
                    ? 'border-luma-primary bg-luma-primary/5'
                    : 'border-luma-border hover:border-luma-primary/50'
                }`}
              >
                <input
                  type="file"
                  accept=".lua,.txt"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="p-12 text-center">
                  <motion.div
                    animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-luma-primary/20 to-luma-accent/20 flex items-center justify-center"
                  >
                    <Upload className="w-12 h-12 text-luma-primary" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Drop your Lua file here
                  </h3>
                  <p className="text-luma-muted mb-4">
                    or click to browse (.lua or .txt)
                  </p>
                  <span className="inline-block px-4 py-2 rounded-full bg-luma-card text-sm text-luma-muted border border-luma-border">
                    Maximum file size: 5MB
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
            className="space-y-4"
          >
            <div className="relative">
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Paste your Lua code here..."
                className="w-full h-80 p-6 rounded-3xl bg-luma-card border border-luma-border text-white placeholder-luma-muted resize-none focus:outline-none focus:border-luma-primary focus:ring-2 focus:ring-luma-primary/20 transition-all font-mono text-sm"
                spellCheck={false}
              />
              <div className="absolute bottom-4 right-4 text-luma-muted text-sm">
                {codeInput.length} characters
              </div>
            </div>
            {codeInput.trim() && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleCodeSubmit}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-luma-primary to-luma-accent text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-luma-primary/25"
              >
                Analyze Code
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
