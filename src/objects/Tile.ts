import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { TILE_SIZE, TILE_DEPTH, COLORS } from '../utils/Constants';
import type { TileType } from '../utils/Types';

const H  = TILE_SIZE  / 2;
const HD = TILE_DEPTH / 2;

// Shared geometry/material for performance
const solidGeo = new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_DEPTH);
const solidMat = new THREE.MeshStandardMaterial({
  color:              COLORS.TILE_SOLID,
  emissive:           COLORS.TILE_SOLID_EMISSIVE,
  emissiveIntensity:  0.5,
  metalness:          0.75,
  roughness:          0.25,
});

// Edge lines — highlight the slab perimeter
const solidEdges    = new THREE.EdgesGeometry(solidGeo);
const solidLineMat  = new THREE.LineBasicMaterial({
  color:   0x4488cc,
  transparent: true,
  opacity: 0.45,
});

const spikeGeo = new THREE.ConeGeometry(H * 0.45, TILE_SIZE * 0.85, 4);
const spikeMat = new THREE.MeshStandardMaterial({
  color:             COLORS.TILE_SPIKE,
  emissive:          COLORS.TILE_SPIKE_EMISSIVE,
  emissiveIntensity: 0.65,
  metalness:         0.55,
  roughness:         0.35,
});

const goalGeo = new THREE.OctahedronGeometry(H * 0.7);
const goalMat = new THREE.MeshStandardMaterial({
  color:             COLORS.TILE_GOAL,
  emissive:          COLORS.TILE_GOAL_EMISSIVE,
  emissiveIntensity: 0.8,
  metalness:         0.3,
  roughness:         0.2,
  transparent:       true,
  opacity:           0.9,
});

export class Tile {
  mesh: THREE.Mesh;
  body: CANNON.Body | null = null;
  type: TileType;

  constructor(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    col: number,
    row: number,
    type: TileType,
  ) {
    this.type = type;
    const x = col * TILE_SIZE;
    const y = -row * TILE_SIZE;

    switch (type) {
      case 1: {
        this.mesh = new THREE.Mesh(solidGeo, solidMat);
        this.mesh.position.set(x, y, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);

        // Thin edge lines around each slab for a grid-panel look
        const lines = new THREE.LineSegments(solidEdges, solidLineMat);
        this.mesh.add(lines);

        this.body = new CANNON.Body({ mass: 0 });
        this.body.addShape(new CANNON.Box(new CANNON.Vec3(H, H, HD)));
        this.body.position.set(x, y, 0);
        (this.body as any).userData = { type: 'solid' };
        physicsWorld.addBody(this.body);
        break;
      }

      case 4: {
        this.mesh = new THREE.Mesh(spikeGeo, spikeMat);
        this.mesh.position.set(x, y, 0);
        scene.add(this.mesh);

        // Smaller trigger body — forgives minor grazes
        this.body = new CANNON.Body({ mass: 0, collisionResponse: false });
        this.body.addShape(new CANNON.Box(new CANNON.Vec3(H * 0.38, H * 0.38, HD * 0.5)));
        this.body.position.set(x, y, 0);
        (this.body as any).userData = { type: 'spike' };
        physicsWorld.addBody(this.body);
        break;
      }

      case 3: {
        this.mesh = new THREE.Mesh(goalGeo, goalMat);
        this.mesh.position.set(x, y, 0);
        scene.add(this.mesh);

        this.body = new CANNON.Body({ mass: 0, collisionResponse: false });
        this.body.addShape(new CANNON.Box(new CANNON.Vec3(H * 0.6, H * 0.6, HD * 0.6)));
        this.body.position.set(x, y, 0);
        (this.body as any).userData = { type: 'goal' };
        physicsWorld.addBody(this.body);
        break;
      }

      default:
        this.mesh = new THREE.Mesh(); // invisible placeholder
        break;
    }
  }

  update(elapsed: number): void {
    if (this.type === 3) {
      this.mesh.rotation.x = elapsed * 1.2;
      this.mesh.rotation.y = elapsed * 0.8;
      const pulse = 0.5 + Math.sin(elapsed * 3) * 0.3;
      (this.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
    if (this.type === 4) {
      this.mesh.rotation.y = elapsed * 2;
    }
  }

  removeFrom(scene: THREE.Scene, physicsWorld: CANNON.World): void {
    if (this.mesh.parent) scene.remove(this.mesh);
    if (this.body)        physicsWorld.removeBody(this.body);
  }
}
