import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { ToastItem, ToastShowPayload, ToastType } from '../models/toast.models';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly translate = inject(TranslateService);
  private readonly toastsSubject = new BehaviorSubject<ToastItem[]>([]);
  private readonly recentKeys = new Map<string, number>();
  private readonly dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly maxVisible = 4;
  private readonly dedupeWindowMs = 2800;

  readonly toasts$ = this.toastsSubject.asObservable();

  show(payload: ToastShowPayload): string | null {
    if (payload.source === 'realtime') {
      return null;
    }

    const type = payload.type ?? 'info';
    const title = payload.titleIsTranslationKey === false
      ? payload.title
      : this.translate.instant(payload.title);
    const message = payload.message?.trim() ?? '';
    const dedupeKey = payload.dedupeKey ?? `${type}:${title}:${message}`;

    if (this.isDuplicate(dedupeKey)) {
      return null;
    }

    this.rememberKey(dedupeKey);

    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const durationMs = payload.durationMs ?? this.defaultDuration(type);
    const toast: ToastItem = {
      id,
      title,
      message,
      type,
      durationMs,
      createdAt: Date.now(),
      pausedAt: null,
      remainingMs: durationMs
    };

    const nextToasts = [...this.toastsSubject.value, toast].slice(-this.maxVisible);
    this.toastsSubject.next(nextToasts);
    this.scheduleDismiss(id, durationMs);
    return id;
  }

  dismiss(id: string): void {
    this.clearTimer(id);
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }

  pause(id: string): void {
    const toast = this.toastsSubject.value.find((item) => item.id === id);
    if (!toast || toast.pausedAt) {
      return;
    }

    this.clearTimer(id);
    const elapsed = Date.now() - toast.createdAt;
    const remainingMs = Math.max((toast.remainingMs ?? toast.durationMs) - elapsed, 500);

    this.toastsSubject.next(
      this.toastsSubject.value.map((item) =>
        item.id === id ? { ...item, pausedAt: Date.now(), remainingMs } : item
      )
    );
  }

  resume(id: string): void {
    const toast = this.toastsSubject.value.find((item) => item.id === id);
    if (!toast?.pausedAt) {
      return;
    }

    const remainingMs = toast.remainingMs ?? this.defaultDuration(toast.type);
    this.toastsSubject.next(
      this.toastsSubject.value.map((item) =>
        item.id === id ? { ...item, pausedAt: null, createdAt: Date.now(), remainingMs } : item
      )
    );
    this.scheduleDismiss(id, remainingMs);
  }

  clearAll(): void {
    for (const id of this.dismissTimers.keys()) {
      this.clearTimer(id);
    }
    this.toastsSubject.next([]);
  }

  private scheduleDismiss(id: string, durationMs: number): void {
    this.clearTimer(id);
    this.dismissTimers.set(
      id,
      setTimeout(() => this.dismiss(id), durationMs)
    );
  }

  private clearTimer(id: string): void {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }
  }

  private defaultDuration(type: ToastType): number {
    switch (type) {
      case 'error':
        return 6500;
      case 'warning':
        return 5500;
      default:
        return 4200;
    }
  }

  private isDuplicate(key: string): boolean {
    const lastShownAt = this.recentKeys.get(key);
    return !!lastShownAt && Date.now() - lastShownAt < this.dedupeWindowMs;
  }

  private rememberKey(key: string): void {
    this.recentKeys.set(key, Date.now());

    if (this.recentKeys.size > 40) {
      const cutoff = Date.now() - this.dedupeWindowMs * 2;
      for (const [storedKey, timestamp] of this.recentKeys.entries()) {
        if (timestamp < cutoff) {
          this.recentKeys.delete(storedKey);
        }
      }
    }
  }
}
