import * as THREE from 'three';
import type { GravityDirection } from '../utils/Types';
import { GRAVITY_STRENGTH } from '../utils/Constants';
import { PhysicsWorld } from './PhysicsWorld';
import { t } from '../i18n';

const GRAVITY_VECTORS: Record<GravityDirection, [number, number, number]> = {
  down:  [0, -GRAVITY_STRENGTH, 0],
  up:    [0,  GRAVITY_STRENGTH, 0],
  left:  [-GRAVITY_STRENGTH, 0, 0],
  right: [ GRAVITY_STRENGTH, 0, 0],
};

// Camera "up" is opposite of gravity direction
const CAMERA_UP: Record<GravityDirection, THREE.Vector3> = {
  down:  new THREE.Vector3( 0,  1, 0),
  up:    new THREE.Vector3( 0, -1, 0),
  left:  new THREE.Vector3( 1,  0, 0),
  right: new THREE.Vector3(-1,  0, 0),
};

const ARROW_CHAR: Record<GravityDirection, string> = {
  down: '↓', up: '↑', left: '←', right: '→',
};

export class GravitySystem {
  private physics: PhysicsWorld;
  private _dir: GravityDirection = 'down';

  /** Smoothly animated camera-up vector */
  currentCameraUp = new THREE.Vector3(0, 1, 0);
  targetCameraUp  = new THREE.Vector3(0, 1, 0);

  constructor(physics: PhysicsWorld) {
    this.physics = physics;
    window.addEventListener('localechange', () => this.updateIndicator(this._dir));
  }

  get direction(): GravityDirection {
    return this._dir;
  }

  flip(newDir: GravityDirection): boolean {
    if (newDir === this._dir) return false;
    this._dir = newDir;
    const [gx, gy, gz] = GRAVITY_VECTORS[newDir];
    this.physics.setGravity(gx, gy, gz);
    this.targetCameraUp.copy(CAMERA_UP[newDir]);
    this.updateIndicator(newDir);
    return true;
  }

  reset(): void {
    this._dir = 'down';
    this.physics.setGravity(0, -GRAVITY_STRENGTH, 0);
    this.currentCameraUp.set(0, 1, 0);
    this.targetCameraUp.set(0, 1, 0);
    this.updateIndicator('down');
  }

  update(dt: number, lerpSpeed: number): void {
    this.currentCameraUp.lerp(this.targetCameraUp, Math.min(dt * lerpSpeed, 1));
    if (this.currentCameraUp.lengthSq() > 0) {
      this.currentCameraUp.normalize();
    }
  }

  private updateIndicator(dir: GravityDirection): void {
    const arrow = document.getElementById('gravity-arrow');
    const label = document.getElementById('gravity-label');
    if (arrow) arrow.textContent = ARROW_CHAR[dir];
    if (label) {
      const labelKey = ({ down: 'gravityDown', up: 'gravityUp', left: 'gravityLeft', right: 'gravityRight' } as const)[dir];
      label.textContent = t(labelKey);
    }
  }
}
