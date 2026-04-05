'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface CustomModalProps {
  state: ModalState;
  onClose: () => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#0a0a0a',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  icon: {
    width: '24px',
    height: '24px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    padding: '4px',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
  },
  message: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    lineHeight: 1.6,
    marginBottom: '24px',
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  confirmButton: (type: string) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 
                     type === 'success' ? 'rgba(34, 197, 94, 0.2)' :
                     type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
    border: `1px solid ${type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 
                           type === 'success' ? 'rgba(34, 197, 94, 0.3)' :
                           type === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
    color: type === 'error' ? '#ef4444' : 
           type === 'success' ? '#22c55e' :
           type === 'warning' ? '#f59e0b' : '#3b82f6',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  }),
};

const iconColors = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#3b82f6',
  warning: '#f59e0b',
};

export function CustomModal({ state, onClose }: CustomModalProps) {
  if (!state.isOpen) return null;

  const IconComponent = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  }[state.type];

  const handleConfirm = () => {
    state.onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    state.onCancel?.();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.header}>
            <IconComponent style={{ ...styles.icon, color: iconColors[state.type] }} />
            <h3 style={styles.title}>{state.title}</h3>
            <button onClick={onClose} style={styles.closeButton}>
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
          
          <p style={styles.message}>{state.message}</p>
          
          <div style={styles.buttons}>
            {(state.onCancel || state.onConfirm) && (
              <button onClick={handleCancel} style={styles.cancelButton}>
                {state.cancelText || 'Cancel'}
              </button>
            )}
            <button onClick={handleConfirm} style={styles.confirmButton(state.type)}>
              {state.confirmText || 'OK'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for using the modal
export function useModal() {
  const [state, setState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showModal = useCallback(({
    title,
    message,
    type = 'info',
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
  }: Omit<ModalState, 'isOpen'>) => {
    setState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
    });
  }, []);

  const closeModal = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const success = useCallback((message: string, title = 'Success') => {
    showModal({ title, message, type: 'success' });
  }, [showModal]);

  const error = useCallback((message: string, title = 'Error') => {
    showModal({ title, message, type: 'error' });
  }, [showModal]);

  const info = useCallback((message: string, title = 'Info') => {
    showModal({ title, message, type: 'info' });
  }, [showModal]);

  const warning = useCallback((message: string, title = 'Warning') => {
    showModal({ title, message, type: 'warning' });
  }, [showModal]);

  const confirm = useCallback(({
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
  }: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }) => {
    showModal({
      title,
      message,
      type: 'warning',
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
    });
  }, [showModal]);

  return {
    state,
    showModal,
    closeModal,
    success,
    error,
    info,
    warning,
    confirm,
  };
}
