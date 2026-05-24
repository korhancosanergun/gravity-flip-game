import * as THREE from 'three';
import { PhysicsWorld }  from '../systems/PhysicsWorld';
import { GravitySystem } from '../systems/GravitySystem';
import { InputManager }  from '../systems/InputManager';
import { LevelManager } from '../systems/LevelManager';
import type { LevelBounds } from '../systems/LevelManager';
import { Ball }          from '../objects/Ball';
import type { GravityDirection, GameStatus } from '../utils/Types';
import { FLIP_LERP_SPEED, OUT_OF_BOUNDS_MARGIN } from '../utils/Constants';

export type StatusCallback = (status: GameStatus, flips: number, levelNum: number) => void;

export class GameScene {
  scene:  THREE.Scene;
  camera: THREE.PerspectiveCamera;

  private physics:       PhysicsWorld;
  private gravity:       GravitySystem;
  private levelManager:  LevelManager;
  private ball:          Ball | null = null;
  private bounds:        LevelBounds | null = null;

  private clock          = new THREE.Clock();
  private elapsed        = 0;
  private levelIndex     = 0;
  private flipCount      = 0;
  private status: GameStatus = 'playing';
  private onStatus: StatusCallback;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(aspect: number, onStatus: StatusCallback) {
    this.onStatus = onStatus;

    // ── Scene ────────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.018);

    // ── Camera ───────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 300);

    // ── Lighting ─────────────────────────────────────────────
    this.scene.add(new THREE.AmbientLight(0x304060, 1.0));

    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(6, 12, 18);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0x4466aa, 0.4);
    fill.position.set(-8, -4, 6);
    this.scene.add(fill);

    // ── Stars (background particles) ─────────────────────────
    this.buildStarField();

    // ── Systems ──────────────────────────────────────────────
    this.physics      = new PhysicsWorld();
    this.gravity      = new GravitySystem(this.physics);
    this.levelManager = new LevelManager(this.scene, this.physics.world);
    new InputManager((dir: GravityDirection) => this.onFlip(dir));

    this.loadLevel(0);
  }

  // ── Level loading ─────────────────────────────────────────
  private loadLevel(index: number): void {
    if (this.restartTimer) { clearTimeout(this.restartTimer); this.restartTimer = null; }

    this.levelIndex = index;
    this.flipCount  = 0;
    this.status     = 'playing';

    this.gravity.reset();

    this.bounds = this.levelManager.load(index);

    // Remove old ball
    if (this.ball) {
      this.ball.removeFrom(this.scene, this.physics.world);
      this.ball = null;
    }

    // Spawn ball slightly above start tile
    this.ball = new Ball(
      this.scene,
      this.physics.world,
      this.levelManager.spawnX,
      this.levelManager.spawnY - 0.1, // tiny offset so it falls onto tile
      () => this.handleDie(),
      () => this.handleWin(),
    );

    this.positionCamera(this.bounds);
    this.onStatus('playing', 0, index + 1);
  }

  private positionCamera(b: LevelBounds): void {
    this.camera.position.set(b.centerX, b.centerY, b.cameraZ);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(b.centerX, b.centerY, 0);
    this.gravity.currentCameraUp.set(0, 1, 0);
    this.gravity.targetCameraUp.set(0, 1, 0);
  }

  // ── Gravity flip ─────────────────────────────────────────
  private onFlip(dir: GravityDirection): void {
    if (this.status !== 'playing') return;
    const changed = this.gravity.flip(dir);
    if (changed) {
      this.flipCount++;
      this.onStatus('playing', this.flipCount, this.levelIndex + 1);
    }
  }

  // ── Die / Win ─────────────────────────────────────────────
  private handleDie(): void {
    if (this.status !== 'playing') return;
    this.status = 'dead';
    this.onStatus('dead', this.flipCount, this.levelIndex + 1);
    this.restartTimer = setTimeout(() => this.loadLevel(this.levelIndex), 2200);
  }

  private handleWin(): void {
    if (this.status !== 'playing') return;
    this.status = 'won';
    this.onStatus('won', this.flipCount, this.levelIndex + 1);

    const next = this.levelIndex + 1;
    if (next < LevelManager.totalLevels) {
      this.restartTimer = setTimeout(() => this.loadLevel(next), 2200);
    } else {
      this.restartTimer = setTimeout(() => {
        this.onStatus('allComplete', this.flipCount, this.levelIndex + 1);
      }, 2200);
    }
  }

  // ── Main update ───────────────────────────────────────────
  update(): void {
    const dt       = this.clock.getDelta();
    this.elapsed  += dt;

    // Physics
    this.physics.step(dt);

    // Ball sync + Z-lock
    this.ball?.update();

    // Out-of-bounds check
    if (this.ball && this.status === 'playing' && this.bounds) {
      const p = this.ball.body.position;
      const m = OUT_OF_BOUNDS_MARGIN;
      if (
        p.x < this.bounds.minX - m || p.x > this.bounds.maxX + m ||
        p.y < this.bounds.minY - m || p.y > this.bounds.maxY + m
      ) {
        this.handleDie();
      }
    }

    // Level tile animations
    this.levelManager.update(this.elapsed);

    // Smooth camera rotation (gravity flip effect)
    this.gravity.update(dt, FLIP_LERP_SPEED);
    this.camera.up.copy(this.gravity.currentCameraUp);
    if (this.bounds) {
      this.camera.lookAt(this.bounds.centerX, this.bounds.centerY, 0);
    }
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  // ── Star field ────────────────────────────────────────────
  private buildStarField(): void {
    const count = 600;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = -(Math.random() * 60 + 20);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, sizeAttenuation: true });
    this.scene.add(new THREE.Points(geo, mat));
  }
}
