import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BALL_RADIUS, BALL_LINEAR_DAMPING, BALL_ANGULAR_DAMPING, COLORS } from '../utils/Constants';

export class Ball {
  mesh: THREE.Mesh;
  body: CANNON.Body;

  private dead = false;
  private won  = false;

  constructor(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    spawnX: number,
    spawnY: number,
    onDie: () => void,
    onWin: () => void,
  ) {
    // Visual
    const geo = new THREE.SphereGeometry(BALL_RADIUS, 20, 14);
    const mat = new THREE.MeshPhongMaterial({
      color:    COLORS.BALL,
      emissive: COLORS.BALL_EMISSIVE,
      shininess: 80,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    // Point light attached to ball for glow effect
    const ballLight = new THREE.PointLight(0xff8800, 0.6, 8);
    this.mesh.add(ballLight);

    // Physics body
    this.body = new CANNON.Body({
      mass: 1,
      linearDamping:  BALL_LINEAR_DAMPING,
      angularDamping: BALL_ANGULAR_DAMPING,
    });
    this.body.addShape(new CANNON.Sphere(BALL_RADIUS));
    this.body.position.set(spawnX, spawnY, 0);
    physicsWorld.addBody(this.body);

    // Collision detection
    this.body.addEventListener('collide', (event: any) => {
      const hitType = (event.body as any)?.userData?.type as string | undefined;
      if (hitType === 'spike' && !this.dead && !this.won) {
        this.dead = true;
        onDie();
      } else if (hitType === 'goal' && !this.dead && !this.won) {
        this.won = true;
        onWin();
      }
    });
  }

  update(): void {
    // Sync Three.js mesh → cannon-es body
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z,
    );
    this.mesh.quaternion.set(
      this.body.quaternion.x,
      this.body.quaternion.y,
      this.body.quaternion.z,
      this.body.quaternion.w,
    );

    // Constrain ball to the XY plane (prevent Z drift)
    this.body.position.z      = 0;
    this.body.velocity.z      = 0;
    this.body.angularVelocity.x = 0;
    this.body.angularVelocity.y = 0;
  }

  removeFrom(scene: THREE.Scene, physicsWorld: CANNON.World): void {
    if (this.mesh.parent) scene.remove(this.mesh);
    physicsWorld.removeBody(this.body);
  }
}
