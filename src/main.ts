import './style.css';
import { Game }                          from './Game';
import { ApiClient }                     from './api/client';
import { initAuthScreen, spawnEquations, showControlPicker, getSavedControlMode, clearSavedControlMode } from './ui';
import { SensorInput }                   from './systems/SensorInput';
import type { ControlMode }              from './systems/InputManager';
import { startUpdateChecker }            from './updater';
import { applyI18n, setLocale, locale }  from './i18n';

const app = document.getElementById('app')!;
const api = new ApiClient();

// Apply locale before anything renders
applyI18n();

// Language toggle handler
function toggleLang(): void {
  setLocale(locale() === 'en' ? 'tr' : 'en');
}
document.getElementById('lang-btn')?.addEventListener('click', toggleLang);
document.getElementById('lang-btn-auth')?.addEventListener('click', toggleLang);

// Splash screen — minimum 800 ms so logo always registers
const _splashMin = new Promise<void>(r => setTimeout(r, 800));

function hideSplash(): void {
  _splashMin.then(() => {
    const el = document.getElementById('splash-screen');
    if (!el) return;
    el.classList.add('splash-hidden');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  });
}

// Spawn floating physics equations in background
spawnEquations();

// Check for app updates in background
startUpdateChecker();

/** True only on real Android / iOS devices (not touch-capable desktops). */
function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function pickControlMode(): Promise<ControlMode> {
  const saved = getSavedControlMode();
  if (saved) return saved;
  // Show picker only when the device actually has a gyroscope
  if (!isMobileDevice() || !SensorInput.isAvailable()) return 'touch';
  return showControlPicker();
}

async function startGame(): Promise<void> {
  // Always hide auth overlay — it has no hidden class by default, so
  // when the user returns with a saved token (isAuthenticated=true)
  // startGame() is called directly without initAuthScreen, leaving
  // the overlay visible and covering the game.
  document.getElementById('auth-overlay')?.classList.add('hidden');
  const mode = await pickControlMode();
  new Game(app, api, mode);
}

// ── Controls reset button ────────────────────────────────────────────────────
const ctrlBtn = document.getElementById('ctrl-btn');
if (ctrlBtn) {
  ctrlBtn.addEventListener('click', () => {
    clearSavedControlMode();
    location.reload();
  });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    api.logout();
    location.reload();
  });
}

if (api.isAuthenticated) {
  hideSplash();
  startGame();
} else {
  hideSplash();
  initAuthScreen(api, startGame);
}


