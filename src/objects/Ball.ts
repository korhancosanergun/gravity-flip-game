import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BALL_RADIUS, BALL_LINEAR_DAMPING, BALL_ANGULAR_DAMPING, COLORS } from '../utils/Constants';

export class Ball {
  mesh: THREE.Mesh;
  body: CANNON.Body;

  private dead = false;
  private won  = false;

  private readonly TRAIL_N = 16;
  private trail: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }[] = [];
  private trailPos: THREE.Vector3[] = [];

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

    // Trail particles
    const trailGeo = new THREE.SphereGeometry(BALL_RADIUS * 0.55, 6, 4);
    for (let i = 0; i < this.TRAIL_N; i++) {
      const tMat = new THREE.MeshBasicMaterial({
        color:       i < this.TRAIL_N / 2 ? 0xff8800 : 0xff4400,
        transparent: true,
        opacity:     0,
      });
      const tMesh = new THREE.Mesh(trailGeo, tMat);
      tMesh.visible = false;
      scene.add(tMesh);
      this.trail.push({ mesh: tMesh, mat: tMat });
    }

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
    this.body.position.z        = 0;
    this.body.velocity.z        = 0;
    this.body.angularVelocity.x = 0;
    this.body.angularVelocity.y = 0;

    // Update trail
    const pos = new THREE.Vector3(
      this.body.position.x,
      this.body.position.y,
      0,
    );
    this.trailPos.unshift(pos);
    if (this.trailPos.length > this.TRAIL_N) this.trailPos.pop();

    for (let i = 0; i < this.TRAIL_N; i++) {
      const t = this.trail[i];
      if (i < this.trailPos.length) {
        t.mesh.position.copy(this.trailPos[i]);
        const frac    = 1 - i / this.TRAIL_N;
        t.mat.opacity = frac * 0.70;
        t.mesh.scale.setScalar(frac * 0.85 + 0.15);
        t.mesh.visible = true;
      } else {
        t.mesh.visible = false;
      }
    }
  }

  removeFrom(scene: THREE.Scene, physicsWorld: CANNON.World): void {
    if (this.mesh.parent) scene.remove(this.mesh);
    for (const t of this.trail) {
      if (t.mesh.parent) scene.remove(t.mesh);
      t.mat.dispose();
    }
    this.trail    = [];
    this.trailPos = [];
    physicsWorld.removeBody(this.body);
  }
}
