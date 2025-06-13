/**
 * Shared Components Barrel Export
 * Provides clean public API for shared components with lazy loading
 */

import { lazy } from 'react';

// Lazy load shared components for better code splitting
export const Modal = lazy(() => import('./Modal').then(m => ({ default: m.Modal })));
export const ConfirmModal = lazy(() => import('./ConfirmModal').then(m => ({ default: m.ConfirmModal })));

// Shared UI components
export { ProgressIndicator } from './ProgressIndicator';

// Export types for TypeScript
export type { ConfirmModalProps } from './ConfirmModal';