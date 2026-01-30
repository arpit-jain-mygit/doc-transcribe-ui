import { Injectable, signal } from '@angular/core';

declare global {
  interface Window {
    google: any;
  }
}

const TOKEN_KEY = 'google_jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<any>(null);

  constructor() {
    // Restore login on refresh
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      this.user.set({ credential: token });
    }
  }

  init() {
    if (this.isLoggedIn()) {
      // Already logged in → DO NOT render button again
      return;
    }

    this.waitForGoogle().then(() => {
      window.google.accounts.id.initialize({
        client_id: '320763587900-18ptqosdb8b5esc8845oc82ul4qf8m9k.apps.googleusercontent.com',
        callback: (response: any) => {
          localStorage.setItem(TOKEN_KEY, response.credential);
          this.user.set(response);
          console.log('[AUTH] Logged in', response);
        },
      });

      const btn = document.getElementById('google-btn');
      if (btn) {
        btn.innerHTML = ''; // prevent duplicate renders
        window.google.accounts.id.renderButton(btn, {
          theme: 'outline',
          size: 'large',
        });
      }

      console.log('[AUTH] Google button rendered');
    });
  }

  logout() {
    localStorage.removeItem('google_jwt');
    this.user.set(null);

    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    // Re-render Google Sign-In button after logout
    setTimeout(() => {
      const btn = document.getElementById('google-btn');
      if (btn) {
        btn.innerHTML = '';
        window.google.accounts.id.renderButton(btn, {
          theme: 'outline',
          size: 'large',
        });
        console.log('[AUTH] Google button re-rendered after logout');
      }
    }, 0);

    console.log('[AUTH] Logged out');
  }


  isLoggedIn(): boolean {
    return !!this.user();
  }

  getToken(): string | null {
    return this.user()?.credential ?? null;
  }

  private waitForGoogle(timeoutMs = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (window.google?.accounts?.id) resolve();
        else if (Date.now() - start > timeoutMs)
          reject('Google SDK timeout');
        else setTimeout(check, 50);
      };
      check();
    });
  }
}
