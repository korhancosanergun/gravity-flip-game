import * as THREE from 'three';
import { GameScene } from './scenes/GameScene';
import type { StatusCallback } from './scenes/GameScene';
import type { GameStatus } from './utils/Types';

export class Game {
  private renderer:  THREE.WebGLRenderer;
  private gameScene: GameScene;
  // HUD refs
  private elLevel:   HTMLElement;
  private elFlips:   HTMLElement;
  private elMessage: HTMLElement;

  constructor(container: HTMLElement) {
    // ── Renderer ──────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // ── HUD ───────────────────────────────────────────────
    this.elLevel   = document.getElementById('hud-level')!;
    this.elFlips   = document.getElementById('hud-flips')!;
    this.elMessage = document.getElementById('hud-message')!;

    // ── Game scene ────────────────────────────────────────
    const aspect = window.innerWidth / window.innerHeight;
    const onStatus: StatusCallback = (status, flips, level) =>
      this.updateHUD(status, flips, level);

    this.gameScene = new GameScene(aspect, onStatus);

    // ── Events ────────────────────────────────────────────
    window.addEventListener('resize', () => this.onResize());

    this.loop();
  }

  private loop(): void {
    requestAnimationFrame(() => this.loop());
    this.gameScene.update();
    this.renderer.render(this.gameScene.scene, this.gameScene.camera);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.gameScene.resize(w / h);
  }

  private updateHUD(status: GameStatus, flips: number, level: number): void {
    this.elLevel.textContent = `Level ${level}`;
    this.elFlips.textContent = `Flips: ${flips}`;

    switch (status) {
      case 'dead':
        this.showMsg('💀 Try Again!', '#ff4444');
        break;
      case 'won':
        this.showMsg('⭐ Level Clear!', '#44ff88');
        break;
      case 'allComplete':
        this.showMsg('🏆 You Win!', '#ffdd00');
        break;
      default:
        this.hideMsg();
    }
  }

  private showMsg(text: string, color: string): void {
    this.elMessage.textContent  = text;
    this.elMessage.style.color  = color;
    this.elMessage.classList.add('visible');
  }

  private hideMsg(): void {
    this.elMessage.classList.remove('visible');
  }
}
