import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface GoogleCredentialProfile {
  idToken: string;
  email: string;
  fullName: string;
  givenName: string;
  familyName: string;
  pictureUrl?: string | null;
}

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

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly platformId = inject(PLATFORM_ID);
  private scriptPromise: Promise<void> | null = null;

  get isConfigured(): boolean {
    return !!environment.googleClientId?.trim();
  }

  /**
   * Opens Google Identity flow and returns a verified ID token profile.
   * Uses One Tap first, then falls back to an explicit popup button.
   */
  async requestCredential(context: 'signin' | 'signup' = 'signup'): Promise<GoogleCredentialProfile> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('GOOGLE_UNAVAILABLE');
    }

    if (!this.isConfigured) {
      throw new Error('GOOGLE_NOT_CONFIGURED');
    }

    await this.loadScript();

    try {
      return await this.requestViaPrompt(context);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'GOOGLE_PROMPT_DISMISSED' || code === 'GOOGLE_TIMEOUT') {
        return this.requestViaPopupButton(context);
      }
      throw error;
    }
  }

  private requestViaPrompt(context: 'signin' | 'signup'): Promise<GoogleCredentialProfile> {
    return new Promise<GoogleCredentialProfile>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error, profile?: GoogleCredentialProfile) => {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timeoutId);
        try {
          window.google?.accounts.id.cancel();
        } catch {
          // ignore
        }
        if (error) {
          reject(error);
          return;
        }
        resolve(profile!);
      };

      const timeoutId = window.setTimeout(() => {
        finish(new Error('GOOGLE_TIMEOUT'));
      }, 15000);

      window.google!.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: { credential?: string }) => {
          try {
            if (!response?.credential) {
              finish(new Error('GOOGLE_CANCELLED'));
              return;
            }
            finish(undefined, this.decodeCredential(response.credential));
          } catch (error) {
            finish(error instanceof Error ? error : new Error('GOOGLE_DECODE_FAILED'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context,
        use_fedcm_for_prompt: true
      });

      window.google!.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          finish(new Error('GOOGLE_PROMPT_DISMISSED'));
        }
      });
    });
  }

  private requestViaPopupButton(context: 'signin' | 'signup'): Promise<GoogleCredentialProfile> {
    return new Promise<GoogleCredentialProfile>((resolve, reject) => {
      let settled = false;
      const overlay = document.createElement('div');
      const panel = document.createElement('div');
      const title = document.createElement('p');
      const buttonHost = document.createElement('div');
      const cancelBtn = document.createElement('button');

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        overlay.remove();
      };

      const finish = (error?: Error, profile?: GoogleCredentialProfile) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        if (error) {
          reject(error);
          return;
        }
        resolve(profile!);
      };

      const timeoutId = window.setTimeout(() => {
        finish(new Error('GOOGLE_TIMEOUT'));
      }, 120000);

      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '100000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
        padding: '16px'
      });

      Object.assign(panel.style, {
        width: 'min(100%, 380px)',
        borderRadius: '18px',
        background: '#fff',
        padding: '24px',
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        fontFamily: 'inherit'
      });

      title.textContent = context === 'signup'
        ? 'Continue with Google'
        : 'Sign in with Google';
      Object.assign(title.style, {
        margin: '0',
        fontSize: '15px',
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center'
      });

      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      Object.assign(cancelBtn.style, {
        border: 'none',
        background: 'transparent',
        color: '#64748b',
        fontWeight: '700',
        cursor: 'pointer',
        fontSize: '12px'
      });
      cancelBtn.addEventListener('click', () => finish(new Error('GOOGLE_CANCELLED')));

      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          finish(new Error('GOOGLE_CANCELLED'));
        }
      });

      panel.appendChild(title);
      panel.appendChild(buttonHost);
      panel.appendChild(cancelBtn);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      window.google!.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: { credential?: string }) => {
          try {
            if (!response?.credential) {
              finish(new Error('GOOGLE_CANCELLED'));
              return;
            }
            finish(undefined, this.decodeCredential(response.credential));
          } catch (error) {
            finish(error instanceof Error ? error : new Error('GOOGLE_DECODE_FAILED'));
          }
        },
        auto_select: false,
        ux_mode: 'popup',
        context
      });

      window.google!.accounts.id.renderButton(buttonHost, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: context === 'signup' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 320
      });
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
