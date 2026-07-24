import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

export interface GoogleCredentialProfile {
  idToken: string;
  email: string;
  fullName: string;
  givenName: string;
  familyName: string;
  pictureUrl?: string | null;
}

export type GoogleAuthContext = 'signin' | 'signup';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            getNotDisplayedReason?: () => string;
          }) => void) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

type CredentialCallback = (profile: GoogleCredentialProfile) => void;
type ErrorCallback = (error: Error) => void;

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly platformId = inject(PLATFORM_ID);
  private scriptPromise: Promise<void> | null = null;
  private initializedClientId: string | null = null;
  private activeCredentialHandler: CredentialCallback | null = null;
  private activeErrorHandler: ErrorCallback | null = null;

  get isConfigured(): boolean {
    return !!environment.googleClientId?.trim();
  }

  /**
   * Renders Google's official Sign in / Sign up button into `host`.
   * The button must stay visible — GIS blocks clicks on near-invisible overlays.
   */
  async mountButton(
    host: HTMLElement,
    options: {
      context: GoogleAuthContext;
      onCredential: (profile: GoogleCredentialProfile) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      options.onError?.(new Error('GOOGLE_UNAVAILABLE'));
      return;
    }

    if (!this.isConfigured) {
      options.onError?.(new Error('GOOGLE_NOT_CONFIGURED'));
      return;
    }

    await this.loadScript();
    this.ensureInitialized(options.context);
    this.activeCredentialHandler = options.onCredential;
    this.activeErrorHandler = options.onError ?? null;

    const width = await this.waitForHostWidth(host);
    host.replaceChildren();
    host.style.position = 'relative';
    host.style.minHeight = '44px';
    host.style.width = '100%';
    host.style.overflow = 'hidden';

    window.google!.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: options.context === 'signup' ? 'signup_with' : 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width,
      locale: document.documentElement.lang || 'ar'
    });

    this.stretchRenderedButton(host);
  }

  private ensureInitialized(context: GoogleAuthContext): void {
    const clientId = environment.googleClientId.trim();
    if (this.initializedClientId === clientId) {
      return;
    }

    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential?: string }) => {
        try {
          if (!response?.credential) {
            this.activeErrorHandler?.(new Error('GOOGLE_CANCELLED'));
            return;
          }
          this.activeCredentialHandler?.(this.decodeCredential(response.credential));
        } catch (error) {
          this.activeErrorHandler?.(error instanceof Error ? error : new Error('GOOGLE_DECODE_FAILED'));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup',
      context,
      use_fedcm_for_prompt: false
    });

    this.initializedClientId = clientId;
  }

  private stretchRenderedButton(host: HTMLElement): void {
    const apply = () => {
      const wrapper = host.querySelector('div[role="button"]') as HTMLElement | null;
      const iframe = host.querySelector('iframe') as HTMLIFrameElement | null;
      if (wrapper) {
        wrapper.style.width = '100%';
        wrapper.style.height = '44px';
        wrapper.style.maxWidth = '100%';
      }
      if (iframe) {
        iframe.style.width = '100%';
        iframe.style.height = '44px';
        iframe.style.maxWidth = '100%';
      }
    };

    apply();
    // GIS injects the iframe asynchronously.
    window.requestAnimationFrame(apply);
    window.setTimeout(apply, 50);
    window.setTimeout(apply, 250);
  }

  private waitForHostWidth(host: HTMLElement): Promise<number> {
    const readWidth = () =>
      Math.floor(
        host.getBoundingClientRect().width ||
          host.parentElement?.getBoundingClientRect().width ||
          0
      );

    const immediate = readWidth();
    if (immediate >= 200) {
      return Promise.resolve(Math.min(immediate, 400));
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (width: number) => {
        if (settled) {
          return;
        }
        settled = true;
        observer.disconnect();
        window.clearTimeout(timeoutId);
        resolve(Math.min(Math.max(width, 280), 400));
      };

      const observer = new ResizeObserver(() => {
        const width = readWidth();
        if (width >= 200) {
          finish(width);
        }
      });
      observer.observe(host);
      if (host.parentElement) {
        observer.observe(host.parentElement);
      }

      const timeoutId = window.setTimeout(() => finish(readWidth() || 320), 1500);
    });
  }

  private decodeCredential(idToken: string): GoogleCredentialProfile {
    const payloadPart = idToken.split('.')[1];
    if (!payloadPart) {
      throw new Error('GOOGLE_DECODE_FAILED');
    }

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const json = JSON.parse(atob(padded)) as Record<string, unknown>;
    const email = String(json['email'] || '').trim();
    if (!email) {
      throw new Error('GOOGLE_EMAIL_REQUIRED');
    }

    const givenName = String(json['given_name'] || '').trim();
    const familyName = String(json['family_name'] || '').trim();
    const fullName = String(json['name'] || `${givenName} ${familyName}`.trim() || email.split('@')[0]).trim();

    return {
      idToken,
      email,
      fullName,
      givenName,
      familyName,
      pictureUrl: typeof json['picture'] === 'string' ? json['picture'] : null
    };
  }

  private loadScript(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(new Error('GOOGLE_UNAVAILABLE'));
    }

    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('google-identity-services') as HTMLScriptElement | null;
      if (existing) {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('GOOGLE_SCRIPT_FAILED')));
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('GOOGLE_SCRIPT_FAILED'));
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }
}
