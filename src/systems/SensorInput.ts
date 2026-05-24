import type { GravityDirection } from '../utils/Types';

export type SensorStatus = 'unavailable' | 'granted' | 'denied';

/**
 * Reads DeviceOrientationEvent and fires a gravity-flip callback when the
 * device is tilted past a threshold.  Uses hysteresis so the user must return
 * to neutral before a second flip in the same direction is possible.
 *
 * Portrait-mode orientation axes:
 *   beta  (−180 … +180): forward/back tilt.   +beta = top toward user (→ "down")
 *   gamma (−90  … +90):  left/right lean.      +gamma = right lean     (→ "right")
 */
export class SensorInput {
  private readonly onFlip:  (dir: GravityDirection) => void;

  private neutralBeta  = 0;
  private neutralGamma = 0;
  private calibrated   = false;

  /** After a flip we require returning to neutral before the next trigger. */
  private resetRequired = false;
  private lastDir: GravityDirection | null = null;

  /** Degrees of tilt needed to trigger a flip. */
  readonly FLIP_THRESHOLD   = 22;
  /** Degrees at which we consider the device "back to neutral". */
  readonly RETURN_THRESHOLD = 10;

  private _handler: ((e: DeviceOrientationEvent) => void) | null = null;
  private _active = false;

  // Optional callback for visual feedback (badge flash, etc.)
  onFlipFired?: (dir: GravityDirection) => void;

  constructor(onFlip: (dir: GravityDirection) => void) {
    this.onFlip = onFlip;
  }

  // ── Static helpers ─────────────────────────────────────────────────────

  static isAvailable(): boolean {
    return typeof DeviceOrientationEvent !== 'undefined';
  }

  /**
   * Must be called inside a user-gesture handler (button click) on iOS 13+.
   * On Android / desktop Chrome no explicit permission is required.
   */
  static async requestPermission(): Promise<SensorStatus> {
    if (!SensorInput.isAvailable()) return 'unavailable';

    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DOE.requestPermission === 'function') {
      try {
        const res = await DOE.requestPermission();
        return res === 'granted' ? 'granted' : 'denied';
      } catch {
        return 'denied';
      }
    }

    return 'granted'; // Android / desktop: always available
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  start(): void {
    if (this._active) return;
    this._active = true;
    this._handler = (e) => this.handleOrientation(e);
    window.addEventListener('deviceorientation', this._handler, { capture: true, passive: true });
  }

  stop(): void {
    if (!this._active || !this._handler) return;
    this._active = false;
    window.removeEventListener('deviceorientation', this._handler, true);
    this._handler = null;
  }

  get isActive(): boolean { return this._active; }

  // ── Calibration ────────────────────────────────────────────────────────

  /** Snapshot current orientation as the "neutral" reference. */
  calibrate(beta?: number, gamma?: number): void {
    if (beta !== undefined) this.neutralBeta  = beta;
    if (gamma !== undefined) this.neutralGamma = gamma;
    this.calibrated   = true;
    this.resetRequired = false;
    this.lastDir       = null;
  }

  // ── Private ────────────────────────────────────────────────────────────

  private handleOrientation(e: DeviceOrientationEvent): void {
    const beta  = e.beta  ?? 0;
    const gamma = e.gamma ?? 0;

    // Auto-calibrate on first event
    if (!this.calibrated) {
      this.calibrate(beta, gamma);
      return;
    }

    const dBeta  = beta  - this.neutralBeta;
    const dGamma = gamma - this.neutralGamma;

    // Wait for device to return near neutral before re-arming
    if (this.resetRequired) {
      if (Math.abs(dBeta) < this.RETURN_THRESHOLD && Math.abs(dGamma) < this.RETURN_THRESHOLD) {
        this.resetRequired = false;
        this.lastDir       = null;
      }
      return;
    }

    // Dominant axis decides direction
    let dir: GravityDirection | null = null;

    if (Math.abs(dGamma) >= Math.abs(dBeta)) {
      if      (dGamma >  this.FLIP_THRESHOLD) dir = 'right';
      else if (dGamma < -this.FLIP_THRESHOLD) dir = 'left';
    } else {
      if      (dBeta >  this.FLIP_THRESHOLD) dir = 'down';
      else if (dBeta < -this.FLIP_THRESHOLD) dir = 'up';
    }

    if (dir && dir !== this.lastDir) {
      this.lastDir       = dir;
      this.resetRequired = true;
      this.onFlip(dir);
      this.onFlipFired?.(dir);
    }
  }
}
