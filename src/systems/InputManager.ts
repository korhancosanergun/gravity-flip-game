import type { GravityDirection } from '../utils/Types';
import { SensorInput } from './SensorInput';

type FlipCallback = (dir: GravityDirection) => void;
export type ControlMode = 'touch' | 'sensor';

export class InputManager {
  private onFlip: FlipCallback;
  private mode: ControlMode;
  private sensor: SensorInput | null = null;

  private touchStartX = 0;
  private touchStartY = 0;
  private readonly SWIPE_MIN = 35;

  private keyHandler!:        (e: KeyboardEvent) => void;
  private touchStartHandler!: (e: TouchEvent)    => void;
  private touchEndHandler!:   (e: TouchEvent)    => void;

  constructor(onFlip: FlipCallback, mode: ControlMode = 'touch') {
    this.onFlip = onFlip;
    this.mode   = mode;
    this.bindKeyboard();
    this.bindTouch();
    this.bindButtons();
    this.applyMode(mode);

    if (mode === 'sensor') {
      this.sensor = new SensorInput(onFlip);
      this.sensor.start();
      this.bindSensorBadge();
    }
  }

  // ── Mode switching ─────────────────────────────────────────────────────

  setMode(mode: ControlMode): void {
    if (mode === this.mode) return;

    if (mode === 'sensor') {
      this.sensor = new SensorInput(this.onFlip);
      this.sensor.start();
      this.bindSensorBadge();
    } else {
      this.sensor?.stop();
      this.sensor = null;
    }

    this.mode = mode;
    this.applyMode(mode);
    localStorage.setItem('gf_control', mode);
  }

  private applyMode(mode: ControlMode): void {
    const dpad  = document.getElementById('touch-controls');
    const badge = document.getElementById('sensor-badge');

    if (dpad)  dpad.classList.toggle('hidden', mode === 'sensor');
    if (badge) badge.classList.toggle('hidden', mode !== 'sensor');
  }

  /** Wire up the sensor badge: tap = recalibrate, switch btn = back to touch. */
  private bindSensorBadge(): void {
    const calBtn    = document.getElementById('sb-calibrate');
    const switchBtn = document.getElementById('sb-switch');
    const badge     = document.getElementById('sensor-badge');

    if (calBtn) {
      calBtn.onclick = () => {
        this.sensor?.calibrate();
        badge?.classList.add('recal-flash');
        setTimeout(() => badge?.classList.remove('recal-flash'), 700);
      };
    }

    if (switchBtn) {
      switchBtn.onclick = () => this.setMode('touch');
    }
  }

  // ── Keyboard ───────────────────────────────────────────────────────────

  private bindKeyboard(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':  case 's': case 'S': this.onFlip('down');  break;
        case 'ArrowUp':    case 'w': case 'W': this.onFlip('up');    break;
        case 'ArrowLeft':  case 'a': case 'A': this.onFlip('left');  break;
        case 'ArrowRight': case 'd': case 'D': this.onFlip('right'); break;
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  // ── Touch / swipe (disabled in sensor mode) ────────────────────────────

  private bindTouch(): void {
    this.touchStartHandler = (e: TouchEvent) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    };

    this.touchEndHandler = (e: TouchEvent) => {
      if (this.mode === 'sensor') return; // no swipe in sensor mode
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      if (Math.abs(dx) < this.SWIPE_MIN && Math.abs(dy) < this.SWIPE_MIN) return;
      this.onFlip(Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down'  : 'up'));
    };

    window.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    window.addEventListener('touchend',   this.touchEndHandler,   { passive: true });
  }

  // ── D-pad buttons (always bound; hidden in sensor mode via CSS) ─────────

  private bindButtons(): void {
    document.querySelectorAll<HTMLButtonElement>('.tc-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const dir = btn.dataset.dir as GravityDirection | undefined;
        if (dir) this.onFlip(dir);
      });
    });
  }

  // ── Cleanup ────────────────────────────────────────────────────────────

  destroy(): void {
    window.removeEventListener('keydown',     this.keyHandler);
    window.removeEventListener('touchstart',  this.touchStartHandler);
    window.removeEventListener('touchend',    this.touchEndHandler);
    this.sensor?.stop();
  }
}

