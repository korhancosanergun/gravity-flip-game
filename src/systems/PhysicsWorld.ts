import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  world: CANNON.World;

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -25, 0);

    this.world.defaultContactMaterial.friction    = 0.5;
    this.world.defaultContactMaterial.restitution = 0.05;
  }

  setGravity(x: number, y: number, z: number): void {
    this.world.gravity.set(x, y, z);
  }

  step(dt: number): void {
    const safeDt = Math.min(dt, 0.1);
    this.world.step(1 / 60, safeDt, 10);
  }

  addBody(body: CANNON.Body): void {
    this.world.addBody(body);
  }

  removeBody(body: CANNON.Body): void {
    this.world.removeBody(body);
  }
}
