import type { ApiClient, LeaderboardEntry } from './api/client';
import { SensorInput } from './systems/SensorInput';
import type { ControlMode } from './systems/InputManager';
import { t } from './i18n';

// ── Auth Screen ────────────────────────────────────────────────────────────

export function initAuthScreen(api: ApiClient, onReady: () => void): void {
  const overlay   = document.getElementById('auth-overlay')!;
  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const regForm   = document.getElementById('register-form') as HTMLFormElement;
  const loginErr  = document.getElementById('login-error')!;
  const regErr    = document.getElementById('reg-error')!;
  const guestBtn  = document.getElementById('guest-btn')!;
  const tabs      = overlay.querySelectorAll<HTMLButtonElement>('.auth-tab');

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset['tab'];
      loginForm.classList.toggle('hidden', which !== 'login');
      regForm.classList.toggle('hidden', which !== 'register');
      loginErr.textContent = '';
      regErr.textContent   = '';
    });
  });

  // Login submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErr.textContent = '';
    const username = (document.getElementById('login-username') as HTMLInputElement).value.trim();
    const password = (document.getElementById('login-password') as HTMLInputElement).value;
    const btn      = loginForm.querySelector<HTMLButtonElement>('.auth-submit')!;
    btn.disabled   = true;
    btn.textContent = t('btnLoggingIn');
    try {
      await api.login(username, password);
      overlay.classList.add('hidden');
      onReady();
    } catch (err: unknown) {
      loginErr.textContent = err instanceof Error ? err.message : t('errLoginFailed');
      btn.disabled    = false;
      btn.textContent = t('btnLogin');
    }
  });

  // Register submit
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    regErr.textContent = '';
    const username = (document.getElementById('reg-username') as HTMLInputElement).value.trim();
    const password = (document.getElementById('reg-password') as HTMLInputElement).value;
    const btn      = regForm.querySelector<HTMLButtonElement>('.auth-submit')!;
    btn.disabled   = true;
    btn.textContent = t('btnCreating');
    try {
      await api.register(username, password);
      overlay.classList.add('hidden');
      onReady();
    } catch (err: unknown) {
      regErr.textContent = err instanceof Error ? err.message : t('errRegFailed');
      btn.disabled    = false;
      btn.textContent = t('btnCreateAccount');
    }
  });

  // Guest play
  guestBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    onReady();
  });
}

// ── Leaderboard overlay ────────────────────────────────────────────────────

export async function showLeaderboard(api: ApiClient): Promise<void> {
  const overlay = document.getElementById('leaderboard-overlay')!;
  const listEl  = document.getElementById('lb-list')!;
  const closeBtn = document.getElementById('lb-close')!;

  overlay.classList.remove('hidden');
  listEl.innerHTML = `<div class="lb-loading">${t('lbLoading')}</div>`;

  const entries = await api.getLeaderboard();

  if (entries.length === 0) {
    listEl.innerHTML = `<div class="lb-empty">${t('lbEmpty')}</div>`;
  } else {
    const medals = ['🥇', '🥈', '🥉'];
    listEl.innerHTML = entries
      .map((e: LeaderboardEntry) => `
        <div class="lb-row${e.rank <= 3 ? ' lb-top' : ''}">
          <span class="lb-rank">${e.rank <= 3 ? medals[e.rank - 1] : `#${e.rank}`}</span>
          <span class="lb-name">${esc(e.username)}</span>
          <span class="lb-levels">${e.levelsCompleted}<span class="lb-dim">/100</span></span>
          <span class="lb-flips">${e.totalFlips}<span class="lb-dim"> ${t('lbFlips')}</span></span>
        </div>
      `)
      .join('');
  }

  const close = () => overlay.classList.add('hidden');
  closeBtn.addEventListener('click', close, { once: true });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  }, { once: true });
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Control Mode Picker ────────────────────────────────────────────────────

const CONTROL_KEY = 'gf_control';

export function getSavedControlMode(): ControlMode | null {
  return localStorage.getItem(CONTROL_KEY) as ControlMode | null;
}

export function clearSavedControlMode(): void {
  localStorage.removeItem(CONTROL_KEY);
}

/**
 * Shows the full-screen control picker.
 * Must be called from within (or triggered by) a user gesture so that
 * iOS DeviceOrientationEvent.requestPermission() works correctly.
 * Returns the chosen mode.
 */
export function showControlPicker(): Promise<ControlMode> {
  return new Promise((resolve) => {
    const overlay  = document.getElementById('control-picker')!;
    const gyroBtn  = document.getElementById('cp-gyro-btn')!;
    const gyroErr  = document.getElementById('cp-gyro-error')!;
    const remember = document.getElementById('cp-remember') as HTMLInputElement;

    // Grey-out gyro if not available on this device
    if (!SensorInput.isAvailable()) {
      gyroBtn.setAttribute('disabled', 'true');
      gyroBtn.setAttribute('aria-disabled', 'true');
      gyroErr.textContent = t('cpSensorUnavail');
      gyroErr.style.display = 'block';
    }

    overlay.classList.remove('hidden');

    const pick = (mode: ControlMode): void => {
      if (remember.checked) localStorage.setItem(CONTROL_KEY, mode);
      overlay.classList.add('hidden');
      resolve(mode);
    };

    document.getElementById('cp-touch-btn')!.addEventListener('click', () => pick('touch'), { once: true });

    gyroBtn.addEventListener('click', async () => {
      gyroErr.style.display = 'none';
      gyroBtn.setAttribute('aria-busy', 'true');
      const status = await SensorInput.requestPermission();
      gyroBtn.removeAttribute('aria-busy');

      if (status === 'denied') {
        gyroErr.textContent = t('cpSensorDenied');
        gyroErr.style.display = 'block';
        return;
      }
      if (status === 'unavailable') {
        gyroErr.textContent = t('cpSensorUnavail');
        gyroErr.style.display = 'block';
        return;
      }
      pick('sensor');
    }, { once: true });
  });
}

// ── Physics equations background ──────────────────────────────────────────

const EQUATIONS = [
  'F = ma',
  'v² = v₀² + 2aΔx',
  '∫ F·dt = Δp',
  'τ = r × F',
  'g ≈ 9.81 m/s²',
  'KE = ½mv²',
  'PE = mgh',
  'p = mv',
  'F = −kx',
  'ω = dθ/dt',
  'L = Iω',
  'F_g = GMm/r²',
  'Δx = v₀t + ½at²',
  'E = mc²',
  '∇·g = −4πGρ',
  'v = v₀ + at',
  'W = F·d·cosθ',
  'a = Δv/Δt',
  'Σ F = 0',
  'p₁ + p₂ = const',
];

export function spawnEquations(): void {
  const container = document.getElementById('physics-equations');
  if (!container) return;

  EQUATIONS.forEach((eq, i) => {
    const span           = document.createElement('span');
    span.className       = 'eq-item';
    span.textContent     = eq;
    span.style.left      = `${((i * 41 + 3) % 88) + 1}%`;
    span.style.top       = `${((i * 27 + 11) % 88) + 1}%`;
    span.style.setProperty('--rot', `${(i * 13 - 30) % 30}deg`);
    span.style.fontSize  = `${11 + (i % 5) * 2}px`;
    span.style.animationDelay = `${(i * 1.3) % 8}s`;
    container.appendChild(span);
  });
}
