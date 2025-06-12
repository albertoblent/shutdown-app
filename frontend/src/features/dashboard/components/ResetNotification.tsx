import { useEffect } from 'react';
import styles from './ResetNotification.module.css';

interface ResetNotificationProps {
  show: boolean;
  onClose: () => void;
  previousDate: string;
  newDate: string;
}

export function ResetNotification({
  show,
  onClose,
  previousDate,
  newDate
}: ResetNotificationProps) {
  // Auto-hide after 5 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className={styles.container}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.content}>
        <div className={styles.icon}>🌅</div>
        <div className={styles.message}>
          <h3 className={styles.title}>New Day Started</h3>
          <p className={styles.description}>
            Your shutdown routine has been reset for a fresh start.
          </p>
        </div>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}