import { Injectable } from '@angular/core';

export type VendorNotificationSound = 'classic' | 'chime' | 'soft' | 'urgent' | 'off';

export const VENDOR_NOTIFICATION_SOUND_OPTIONS = [
  { value: 'classic', labelKey: 'SETTINGS_PROFILE.NOTIFICATIONS.SOUND_OPTIONS.CLASSIC' },
  { value: 'chime', labelKey: 'SETTINGS_PROFILE.NOTIFICATIONS.SOUND_OPTIONS.CHIME' },
  { value: 'soft', labelKey: 'SETTINGS_PROFILE.NOTIFICATIONS.SOUND_OPTIONS.SOFT' },
  { value: 'urgent', labelKey: 'SETTINGS_PROFILE.NOTIFICATIONS.SOUND_OPTIONS.URGENT' },
  { value: 'off', labelKey: 'SETTINGS_PROFILE.NOTIFICATIONS.SOUND_OPTIONS.OFF' }
] as const;

const STORAGE_KEY = 'vendor_notification_sound';

export function normalizeVendorNotificationSound(value?: string | null): VendorNotificationSound {
  switch ((value || '').trim().toLowerCase()) {
    case 'chime':
      return 'chime';
    case 'soft':
      return 'soft';
    case 'urgent':
      return 'urgent';
    case 'off':
      return 'off';
    default:
      return 'classic';
  }
}

@Injectable({
  providedIn: 'root'
})
export class VendorNotificationSoundService {
  private audioContext?: AudioContext;
  private currentSound: VendorNotificationSound = this.readStoredSound();

  getCurrentSound(): VendorNotificationSound {
    return this.currentSound;
  }

  setSound(sound?: string | null, options: { persist?: boolean } = {}): VendorNotificationSound {
    const normalized = normalizeVendorNotificationSound(sound);
    this.currentSound = normalized;

    if (options.persist !== false && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    }

    return normalized;
  }

  playCurrent(): void {
    this.play(this.currentSound);
  }

  preview(sound?: string | null): void {
    this.play(normalizeVendorNotificationSound(sound));
  }

  private readStoredSound(): VendorNotificationSound {
    if (typeof window === 'undefined') {
      return 'classic';
    }

    return normalizeVendorNotificationSound(window.localStorage.getItem(STORAGE_KEY));
  }

  private play(sound: VendorNotificationSound): void {
    if (sound === 'off' || typeof window === 'undefined') {
      return;
    }

    const audioContext = this.ensureAudioContext();
    if (!audioContext) {
      return;
    }

    const patterns: Record<Exclude<VendorNotificationSound, 'off'>, Array<{
      at: number;
      frequency: number;
      duration: number;
      gain: number;
      type?: OscillatorType;
    }>> = {
      classic: [
        { at: 0, frequency: 880, duration: 0.16, gain: 0.12, type: 'sine' },
        { at: 0.12, frequency: 660, duration: 0.18, gain: 0.08, type: 'sine' }
      ],
      chime: [
        { at: 0, frequency: 740, duration: 0.16, gain: 0.09, type: 'triangle' },
        { at: 0.14, frequency: 988, duration: 0.16, gain: 0.09, type: 'triangle' },
        { at: 0.28, frequency: 1318, duration: 0.24, gain: 0.08, type: 'triangle' }
      ],
      soft: [
        { at: 0, frequency: 640, duration: 0.28, gain: 0.05, type: 'sine' },
        { at: 0.16, frequency: 780, duration: 0.2, gain: 0.04, type: 'sine' }
      ],
      urgent: [
        { at: 0, frequency: 940, duration: 0.1, gain: 0.12, type: 'square' },
        { at: 0.14, frequency: 940, duration: 0.1, gain: 0.11, type: 'square' },
        { at: 0.28, frequency: 820, duration: 0.16, gain: 0.09, type: 'square' }
      ]
    };

    const startAt = audioContext.currentTime + 0.01;
    for (const note of patterns[sound]) {
      this.scheduleTone(audioContext, startAt + note.at, note.frequency, note.duration, note.gain, note.type ?? 'sine');
    }
  }

  private ensureAudioContext(): AudioContext | null {
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    this.audioContext ??= new AudioContextCtor();

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume().catch(() => undefined);
    }

    return this.audioContext;
  }

  private scheduleTone(
    audioContext: AudioContext,
    startAt: number,
    frequency: number,
    duration: number,
    peakGain: number,
    type: OscillatorType
  ): void {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(peakGain, 0.0002), startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }
}
