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
   * Renders Google's official button into `host`.
   * Put an invisible host over your custom-looking button so one click
   * opens the Google account picker immediately (no intermediate modal).
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

    const width = Math.max(
      Math.floor(host.getBoundingClientRect().width || host.parentElement?.getBoundingClientRect().width || 0),
      280
    );

    host.replaceChildren();
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

    // Stretch the generated iframe/button to cover the facade.
    const googleBtn = host.querySelector('div[role="button"]') as HTMLElement | null;
    if (googleBtn) {
      googleBtn.style.width = '100%';
      googleBtn.style.height = '100%';
    }
  }

  /**
   * @deprecated Prefer mountButton for one-click popup UX.
   * Kept for rare programmatic use; opens Google popup via an offscreen button click.
   */
  async requestCredential(context: GoogleAuthContext = 'signup'): Promise<GoogleCredentialProfile> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('GOOGLE_UNAVAILABLE');
    }

    if (!this.isConfigured) {
      throw new Error('GOOGLE_NOT_CONFIGURED');
    }

    await this.loadScript();

    return new Promise<GoogleCredentialProfile>((resolve, reject) => {
      let settled = false;
      const host = document.createElement('div');
      Object.assign(host.style, {
        position: 'fixed',
        left: '50%',
        top: '50%',
        width: '320px',
        height: '44px',
        transform: 'translate(-50%, -50%)',
        opacity: '0.02',
        zIndex: '100000',
        overflow: 'hidden'
      });
      document.body.appendChild(host);

      const finish = (error?: Error, profile?: GoogleCredentialProfile) => {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timeoutId);
        host.remove();
        if (error) {
          reject(error);
          return;
        }
        resolve(profile!);
      };

      const timeoutId = window.setTimeout(() => {
        finish(new Error('GOOGLE_TIMEOUT'));
      }, 120000);

      void this.mountButton(host, {
        context,
        onCredential: (profile) => finish(undefined, profile),
        onError: (error) => finish(error)
      }).then(() => {
        // User still needs to click; expose the button briefly so the gesture works.
        host.style.opacity = '1';
        const btn = host.querySelector('div[role="button"]') as HTMLElement | null;
        btn?.focus();
        btn?.click();
      }).catch((error) => {
        finish(error instanceof Error ? error : new Error('GOOGLE_FAILED'));
      });
    });
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
      // Avoid One Tap prompt APIs; FedCM migration warnings + multi-init races.
      use_fedcm_for_prompt: false
    });

    this.initializedClientId = clientId;
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
