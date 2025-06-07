/**
 * Confirm Modal Component
 * Specialized modal for confirmation dialogs with customizable actions and styling
 */

import React from 'react';
import { Modal } from './Modal';
import styles from './ConfirmModal.module.css';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isLoading) {
      handleConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className={styles.confirmModal}
      closeOnEscape={!isLoading}
      closeOnOverlayClick={!isLoading}
    >
      <div className={styles.content} onKeyDown={handleKeyDown}>
        <div className={`${styles.iconContainer} ${styles[variant]}`}>
          {variant === 'danger' && (
            <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.2 0 2.162-1.076 1.93-2.298L16.06 3.702A2 2 0 0014.13 2H9.87a2 2 0 00-1.93 1.702L2.938 16.702C2.706 17.924 3.658 19 4.858 19z" />
            </svg>
          )}

          {variant === 'warning' && (
            <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}

          {variant === 'info' && (
            <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div className={styles.messageContainer}>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>

          <button
            className={`${styles.confirmButton} ${styles[variant]}`}
            onClick={handleConfirm}
            disabled={isLoading}
            autoFocus
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Loading...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}