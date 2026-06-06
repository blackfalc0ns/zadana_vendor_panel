export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastSource = 'action' | 'realtime';

export interface ToastShowPayload {
  title: string;
  message: string;
  type?: ToastType;
  durationMs?: number;
  titleIsTranslationKey?: boolean;
  source?: ToastSource;
  dedupeKey?: string;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  durationMs: number;
  createdAt: number;
  pausedAt?: number | null;
  remainingMs?: number;
}
