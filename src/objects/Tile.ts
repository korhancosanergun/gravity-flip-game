import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { TILE_SIZE, TILE_DEPTH, TILE_VISUAL_DEPTH } from '../utils/Constants';
import type { TileType } from '../utils/Types';

const H   = TILE_SIZE         / 2;
const HD  = TILE_DEPTH        / 2;
const HV  = TILE_VISUAL_DEPTH / 2;

// ── Solid tile (shared) ──────────────────────────────────────────────────
const solidGeo     = new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_VISUAL_DEPTH);
const solidMat     = new THREE.MeshStandardMaterial({
  color:             0x1a3566,
  emissive:          0x0c1d3a,
  emissiveIntensity: 0.55,
  metalness:         0.80,
  roughness:         0.20,
});
const solidEdgesGeo = new THREE.EdgesGeometry(solidGeo);
const solidLineMat  = new THREE.LineBasicMaterial({
  color:       0x55aaff,
  transparent: true,
  opacity:     0.80,
});

// ── Spike tile (shared) ──────────────────────────────────────────────────────
const SPIKE_H  = TILE_SIZE * 0.85;
const spikeGeo = new THREE.ConeGeometry(H * 0.42, SPIKE_H, 4);
const spikeMat = new THREE.MeshStandardMaterial({
  color:             0xff1144,
  emissive:          0x880022,
  emissiveIntensity: 1.0,
  metalness:         0.55,
  roughness:         0.30,
});

// ── Goal / portal materials (shared) ────────────────────────────────────
const goalBaseMat  = new THREE.MeshStandardMaterial({
  color:             0x003a1a,
  emissive:          0x001e0e,
  emissiveIntensity: 0.40,
  metalness:         0.70,
  roughness:         0.25,
});
const goalEdgeMat  = new THREE.LineBasicMaterial({
  color:       0x00ff88,
  transparent: true,
  opacity:     0.90,
});
const goalFrameMat = new THREE.MeshStandardMaterial({
  color:             0x00cc66,
  emissive:          0x008844,
  emissiveIntensity: 1.40,
  metalness:         0.35,
  roughness:         0.12,
});
const gemMat = new THREE.MeshStandardMaterial({
  color:             0x00ff88,
  emissive:          0x00cc55,
  emissiveIntensity: 1.80,
  metalness:         0.15,
  roughness:         0.04,
  transparent:       true,
  opacity:           0.92,
});

export class Tile {
  mesh: THREE.Mesh;
  body: CANNON.Body | null = null;
  type: TileType;

  private portalGroup: THREE.Group | null = null;
  private gemMesh:     THREE.Mesh | null = null;
  private goalLight:   THREE.PointLight | null = null;

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

      // ── Deep solid cube ───────────────────────────────────────
      case 1: {
        this.mesh = new THREE.Mesh(solidGeo, solidMat);
        // Offset so +Z face (top) sits at z=0 (game plane)
        this.mesh.position.set(x, y, -HV);
        this.mesh.castShadow    = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);

        // Cyan glowing edge lines
        this.mesh.add(new THREE.LineSegments(solidEdgesGeo, solidLineMat));

        this.body = new CANNON.Body({ mass: 0 });
        this.body.addShape(new CANNON.Box(new CANNON.Vec3(H, H, HD)));
        this.body.position.set(x, y, 0);
        (this.body as any).userData = { type: 'solid' };
        physicsWorld.addBody(this.body);
        break;
      }

      // ── Spike (cone only, tip toward +Z) ─────────────────────
      case 4: {
        this.mesh = new THREE.Mesh(spikeGeo, spikeMat);
        this.mesh.rotation.x = -Math.PI / 2; // tip → +Z
        this.mesh.rotation.z = Math.PI / 4;  // 45° so edges face camera diagonally
        // Centre at z=0: base at z=-SPIKE_H/2 (inside tile), tip at z=+SPIKE_H/2 (toward camera)
        this.mesh.position.set(x, y, 0);
        scene.add(this.mesh);

        // Physics trigger centred at z=0 so ball (also at z=0) overlaps
        this.body = new CANNON.Body({ mass: 0, collisionResponse: false });
        this.body.addShape(new CANNON.Box(new CANNON.Vec3(H * 0.50, H * 0.50, HD)));
        this.body.position.set(x, y, 0);
        (this.body as any).userData = { type: 'spike' };
        physicsWorld.addBody(this.body);
        break;
      }

      // ── Portal / Goal ─────────────────────────────────────────
      case 3: {
        const group = new THREE.Group();
        group.position.set(x, y, 0);
        scene.add(group);
        this.portalGroup = group;

        // Green base cube (same depth as solid tiles)
        const baseMesh = new THREE.Mesh(solidGeo, goalBaseMat);
        baseMesh.position.set(0, 0, -HV);
        baseMesh.castShadow = true;
        group.add(baseMesh);
        this.mesh = baseMesh;

        // Green glowing edges on base
        const edgeLines = new THREE.LineSegments(solidEdgesGeo, goalEdgeMat);
        edgeLines.position.set(0, 0, -HV);
        group.add(edgeLines);

        // 3-bar portal doorframe (two posts + top lintel, extruded in Z)
        const ft = 0.14; // bar thickness
        const fd = 0.32; // bar depth (Z extrusion)
        const ph = TILE_SIZE * 1.25; // portal height
        const fz = 0;   // bars flush with tile front face

        const mkBar = (w: number, h: number, d: number, px: number, py: number) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), goalFrameMat);
          m.position.set(px, py, fz);
          group.add(m);
        };
        mkBar(ft, ph, fd, -H + ft * 0.5, 0);               // left post
        mkBar(ft, ph, fd,  H - ft * 0.5, 0);               // right post
        mkBar(TILE_SIZE, ft, fd, 0, ph * 0.5 - ft * 0.5);  // top lintel

        // Floating gem (stays close to portal face)
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), gemMat);
        gem.position.set(0, 0, 0.35);
        group.add(gem);
        this.gemMesh = gem;

        // Point light inside portal
        const gLight = new THREE.PointLight(0x00ff88, 3.5, 7);
        gLight.position.set(0, 0, 0.50);
        group.add(gLight);
        this.goalLight = gLight;

        // Physics trigger
        this.body = new CANNON.Body({ mass: 0, collisionResponse: false });
        this.body.addShape(new CANNON.Box(new CANNON.Vec3(H * 0.65, H * 0.65, HD * 0.65)));
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
      if (this.gemMesh) {
        this.gemMesh.rotation.y = elapsed * 2.0;
        this.gemMesh.rotation.x = elapsed * 1.1;
        this.gemMesh.position.z = 0.35 + Math.sin(elapsed * 2.8) * 0.12;
      }
      if (this.goalLight) {
        this.goalLight.intensity = 2.8 + Math.sin(elapsed * 3.5) * 1.2;
      }
      goalFrameMat.emissiveIntensity = 1.2 + Math.sin(elapsed * 2.0) * 0.4;
    }
    if (this.type === 4) {
      // Spin the 4-sided pyramid around its tip axis for a 3D look
      this.mesh.rotation.z = Math.PI / 4 + elapsed * 1.8;
    }
  }

  removeFrom(scene: THREE.Scene, physicsWorld: CANNON.World): void {
    if (this.portalGroup) {
      scene.remove(this.portalGroup);
    } else if (this.mesh.parent) {
      scene.remove(this.mesh);
    }
    if (this.body) physicsWorld.removeBody(this.body);
  }
}
