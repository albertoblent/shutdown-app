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
          <h4 className={styles.title}>New Day Started</h4>
          <p>Your habits have been reset for {newDate}.</p>
          <p className={styles.detail}>Previous day's data ({previousDate}) has been saved.</p>
        </div>
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}