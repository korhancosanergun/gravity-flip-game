import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PhysicsWorld }  from '../systems/PhysicsWorld';
import { GravitySystem } from '../systems/GravitySystem';
import { InputManager } from '../systems/InputManager';
import type { ControlMode } from '../systems/InputManager';
import { LevelManager } from '../systems/LevelManager';
import type { LevelBounds } from '../systems/LevelManager';
import { Ball }          from '../objects/Ball';
import type { GravityDirection, GameStatus } from '../utils/Types';
import { OUT_OF_BOUNDS_MARGIN, CAMERA_FOV, TILE_VISUAL_DEPTH } from '../utils/Constants';

export type StatusCallback = (status: GameStatus, flips: number, levelNum: number) => void;

export class GameScene {
  scene:  THREE.Scene;
  camera: THREE.PerspectiveCamera;

  private physics:       PhysicsWorld;
  private gravity:       GravitySystem;
  private levelManager:  LevelManager;
  private ball:          Ball | null = null;
  private bounds:        LevelBounds | null = null;
  private controls:      OrbitControls;

  private timer           = new THREE.Timer();
  private elapsed         = 0;
  private levelIndex      = 0;
  private flipCount       = 0;
  private totalFlipCount  = 0;
  private status: GameStatus = 'playing';
  private onStatus: StatusCallback;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private controlMode: ControlMode;
  private aspect: number;

  constructor(aspect: number, onStatus: StatusCallback, controlMode: ControlMode = 'touch', canvas?: HTMLElement) {
    this.onStatus    = onStatus;
    this.controlMode = controlMode;
    this.aspect      = aspect;

    // ── Scene ────────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.018);

    // ── Camera ───────────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 300);

    // ── Lighting (isometric 3-point setup) ─────────────────────
    this.scene.add(new THREE.AmbientLight(0x2a3a5a, 1.8));

    const keyLight = new THREE.DirectionalLight(0xaaccff, 2.2);
    keyLight.position.set(10, 12, 16);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x3355aa, 0.7);
    fillLight.position.set(-8, 2, 6);
    this.scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0x112244, 0.35);
    backLight.position.set(0, -10, -6);
    this.scene.add(backLight);

    // ── Stars (background particles) ─────────────────────────
    this.buildStarField();

    // ── Systems ──────────────────────────────────────────────
    this.physics      = new PhysicsWorld();
    this.gravity       = new GravitySystem(this.physics);
    this.levelManager  = new LevelManager(this.scene, this.physics.world);
    new InputManager((dir: GravityDirection) => this.onFlip(dir), this.controlMode);

    // ── Orbital camera controls ───────────────────────────────
    this.controls = new OrbitControls(this.camera, canvas ?? document.body);
    this.controls.enableDamping    = true;
    this.controls.dampingFactor    = 0.08;
    this.controls.enablePan        = false;
    this.controls.minDistance      = 4;
    this.controls.maxDistance      = 60;
    this.controls.rotateSpeed      = 0.55;
    this.controls.zoomSpeed        = 0.80;

    this.loadLevel(0);
  }

  // ── Level loading ─────────────────────────────────────────
  private loadLevel(index: number): void {
    if (this.restartTimer) { clearTimeout(this.restartTimer); this.restartTimer = null; }

    this.levelIndex = index;
    this.flipCount  = 0;
    this.status     = 'playing';

    this.gravity.reset();

    this.bounds = this.levelManager.load(index, this.aspect);

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
    let targetY = b.centerY;

    if (this.controlMode === 'touch') {
      // Center level in the visible game area (between HUD bottom and D-pad top)
      const screenH  = window.innerHeight;
      const hudEl    = document.getElementById('hud');
      const ctrlEl   = document.getElementById('touch-controls');
      const hudBot   = hudEl  ? hudEl.getBoundingClientRect().bottom : 56;
      const ctrlRect = ctrlEl ? ctrlEl.getBoundingClientRect() : null;
      const ctrlTop  = (ctrlRect && ctrlRect.height > 0) ? ctrlRect.top : screenH - 190;
      const effectiveCenterPx = (hudBot + ctrlTop) / 2;
      const pixelShift = (screenH / 2) - effectiveCenterPx;
      const tanHalf  = Math.tan((CAMERA_FOV * Math.PI / 180) / 2);
      const worldH   = 2 * b.cameraZ * tanHalf;
      targetY = b.centerY - (pixelShift / screenH) * worldH;
    }

    // Fixed isometric camera — reset on each level load
    const d = b.cameraZ;
    this.camera.position.set(
      b.centerX + d * 0.45,
      targetY   + d * 0.30,
      d * 0.80,
    );
    this.camera.up.set(0, 1, 0);
    // OrbitControls target = level center
    this.controls.target.set(b.centerX, targetY, -TILE_VISUAL_DEPTH / 2);
    this.controls.update();
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
    this.totalFlipCount += this.flipCount; // accumulate across levels
    this.onStatus('won', this.totalFlipCount, this.levelIndex + 1);

    const next = this.levelIndex + 1;
    if (next < LevelManager.totalLevels) {
      this.restartTimer = setTimeout(() => this.loadLevel(next), 2200);
    } else {
      this.restartTimer = setTimeout(() => {
        this.onStatus('allComplete', this.totalFlipCount, this.levelIndex + 1);
      }, 2200);
    }
  }

  // ── Main update ───────────────────────────────────────────
  update(timestamp: number = 0): void {
    this.timer.update(timestamp);
    const dt       = this.timer.getDelta();
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

    // Orbital camera damping
    this.controls.update();
  }

  resize(aspect: number): void {
    this.aspect = aspect;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    // Recompute camera distance for new aspect ratio
    if (this.bounds) {
      this.bounds = this.levelManager.recomputeBoundsForAspect(aspect);
      this.positionCamera(this.bounds);
    }
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
