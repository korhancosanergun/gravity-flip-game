import './style.css';
import { Game }                          from './Game';
import { ApiClient }                     from './api/client';
import { initAuthScreen, spawnEquations, showControlPicker, getSavedControlMode, clearSavedControlMode } from './ui';
import { SensorInput }                   from './systems/SensorInput';
import type { ControlMode }              from './systems/InputManager';

const app = document.getElementById('app')!;
const api = new ApiClient();

// Spawn floating physics equations in background
spawnEquations();

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

if (api.isAuthenticated) {
  startGame();
} else {
  initAuthScreen(api, startGame);
}


