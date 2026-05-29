import type { GravityDirection } from '../utils/Types';
import { GRAVITY_STRENGTH } from '../utils/Constants';
import { PhysicsWorld } from './PhysicsWorld';

const GRAVITY_VECTORS: Record<GravityDirection, [number, number, number]> = {
  down:  [0, -GRAVITY_STRENGTH, 0],
  up:    [0,  GRAVITY_STRENGTH, 0],
  left:  [-GRAVITY_STRENGTH, 0, 0],
  right: [ GRAVITY_STRENGTH, 0, 0],
};

export class GravitySystem {
  private physics: PhysicsWorld;
  private _dir: GravityDirection = 'down';

  constructor(physics: PhysicsWorld) {
    this.physics = physics;
  }

  get direction(): GravityDirection {
    return this._dir;
  }

  flip(newDir: GravityDirection): boolean {
    if (newDir === this._dir) return false;
    this._dir = newDir;
    const [gx, gy, gz] = GRAVITY_VECTORS[newDir];
    this.physics.setGravity(gx, gy, gz);
    this.updateIndicator(newDir);
    return true;
  }

  reset(): void {
    this._dir = 'down';
    this.physics.setGravity(0, -GRAVITY_STRENGTH, 0);
    this.updateIndicator('down');
  }

  private updateIndicator(dir: GravityDirection): void {
    for (const d of ['up', 'down', 'left', 'right'] as const) {
      const el = document.getElementById(`gdir-${d}`);
      if (el) el.classList.toggle('active', d === dir);
    }
  }
}
