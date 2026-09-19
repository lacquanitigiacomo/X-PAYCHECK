import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import type { PlanTier } from '@shared/contracts';
import { API_BASE_URL } from '../lib/api';

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleProfile = {
  email?: string;
  name?: string;
  given_name?: string;
  picture?: string;
};

export type GoogleAuthIntent = 'register' | 'login';

export type GoogleAuthError = {
  message: string;
  code?: string;
};

type GoogleAuthButtonProps = {
  label?: 'signin_with' | 'signup_with' | 'continue_with';
  tier: PlanTier;
  intent: GoogleAuthIntent;
  onProfile?: (profile: GoogleProfile) => void;
  onSuccess: (payload: { token: string; user: GoogleProfile & { id?: string } }) => void;
  onError: (error: GoogleAuthError) => void;
};

export function buildGoogleSocialPayload(idToken: string, tier: PlanTier, intent: GoogleAuthIntent) {
  return { provider: 'google' as const, idToken, tier, intent };
}

export function googleAuthError(error: unknown): GoogleAuthError {
  const responseData = (error as { response?: { data?: { error?: unknown; code?: unknown } } })
    ?.response?.data;
  const message = typeof responseData?.error === 'string'
    ? responseData.error
    : 'Accesso Google non riuscito.';
  const code = typeof responseData?.code === 'string' ? responseData.code : undefined;
  return code ? { message, code } : { message };
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_black' | 'filled_blue';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              width?: number;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

const scriptId = 'google-identity-services';

function decodeGoogleCredential(credential: string): GoogleProfile {
  const payload = credential.split('.')[1];
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(normalized), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as GoogleProfile;
}

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Impossibile caricare Google Identity Services')));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossibile caricare Google Identity Services'));
    document.head.appendChild(script);
  });
}

export default function GoogleAuthButton({ label = 'continue_with', tier, intent, onProfile, onSuccess, onError }: GoogleAuthButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    if (!clientId) {
      setConfigured(false);
      return;
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
        buttonRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: clientId,
          cancel_on_tap_outside: true,
          callback: async (response) => {
            if (!response.credential) {
              onError({ message: 'Google non ha restituito una credenziale valida.' });
              return;
            }

            try {
              const profile = decodeGoogleCredential(response.credential);
              onProfile?.(profile);
              const res = await axios.post(
                `${API_BASE_URL}/auth/social`,
                buildGoogleSocialPayload(response.credential, tier, intent),
              );
              onSuccess({ token: res.data.token, user: res.data.user });
            } catch (error: unknown) {
              onError(googleAuthError(error));
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: label,
          width: 360,
          locale: 'it',
        });
      })
      .catch((error: Error) => onError({ message: error.message }));

    return () => {
      cancelled = true;
    };
  }, [intent, label, onError, onProfile, onSuccess, tier]);

  if (!configured) {
    return (
      <div className="rounded-lg border border-xpay-amber/50 bg-xpay-amber/10 p-3 text-sm leading-5 text-xpay-amber">
        Google login pronto: aggiungi <span className="font-mono">VITE_GOOGLE_CLIENT_ID</span> nel frontend e{' '}
        <span className="font-mono">GOOGLE_CLIENT_ID</span> nel backend.
      </div>
    );
  }

  return <div ref={buttonRef} className="flex min-h-11 justify-center" />;
}
