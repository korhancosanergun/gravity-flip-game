import * as THREE from 'three';
import { GameScene } from './scenes/GameScene';
import type { StatusCallback } from './scenes/GameScene';
import type { GameStatus } from './utils/Types';
import { LEVELS } from './levels/levels';
import type { ApiClient } from './api/client';
import { showLeaderboard } from './ui';
import type { ControlMode } from './systems/InputManager';
import { t, tf } from './i18n';

export class Game {
  private renderer:  THREE.WebGLRenderer;
  private gameScene: GameScene;

  // HUD element refs
  private elLevelNum:   HTMLElement;
  private elLevelName:  HTMLElement;
  private elFlipsCount: HTMLElement;
  private elFlipsPill:  HTMLElement;
  private elPar:        HTMLElement;
  private elMessage:    HTMLElement;
  private elMsgIcon:    HTMLElement;
  private elMsgTitle:   HTMLElement;
  private elMsgSub:     HTMLElement;

  private lastFlips = -1;
  private api: ApiClient;

  constructor(container: HTMLElement, api: ApiClient, controlMode: ControlMode = 'touch') {
    this.api = api;
    // ── Renderer ──────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    // ── HUD refs ──────────────────────────────────────────
    this.elLevelNum   = document.getElementById('hud-level')!;
    this.elLevelName  = document.getElementById('hud-level-name')!;
    this.elFlipsCount = document.getElementById('hud-flips')!;
    this.elFlipsPill  = document.getElementById('hud-flips-pill')!;
    this.elPar        = document.getElementById('hud-par')!;
    this.elMessage    = document.getElementById('hud-message')!;
    this.elMsgIcon    = document.getElementById('msg-icon')!;
    this.elMsgTitle   = document.getElementById('msg-title')!;
    this.elMsgSub     = document.getElementById('msg-sub')!;

    // ── HUD — username chip ───────────────────────────────
    const userChip = document.getElementById('hud-user');
    const logoutBtn  = document.getElementById('logout-btn');
    if (userChip) {
    const u = api.user;
      userChip.textContent = u ? u.username : t('guest');
      if (!u) {
        window.addEventListener('localechange', () => { userChip.textContent = t('guest'); });
      }
      if (u && logoutBtn) logoutBtn.classList.remove('hidden');
    }

    // ── Leaderboard button ────────────────────────────────
    const lbBtn = document.getElementById('lb-btn');
    if (lbBtn) {
      lbBtn.addEventListener('click', () => showLeaderboard(this.api));
      lbBtn.classList.remove('hidden');
    }

    // ── Game scene ────────────────────────────────────────
    const aspect = window.innerWidth / window.innerHeight;
    const onStatus: StatusCallback = (status, flips, level) =>
      this.updateHUD(status, flips, level);

    this.gameScene = new GameScene(aspect, onStatus, controlMode, this.renderer.domElement);

    // ── Events ────────────────────────────────────────────
    window.addEventListener('resize', () => this.onResize());

    this.loop();
  }

  private loop(timestamp: number = 0): void {
    requestAnimationFrame((ts) => this.loop(ts));
    this.gameScene.update(timestamp);
    this.renderer.render(this.gameScene.scene, this.gameScene.camera);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.gameScene.resize(w / h);
  }

  private updateHUD(status: GameStatus, flips: number, level: number): void {
    const levelData = LEVELS[level - 1];
    const par       = levelData?.par ?? 1;

    // Level pill
    this.elLevelNum.textContent  = String(level).padStart(2, '0');
    this.elLevelName.textContent = levelData?.name ?? '';

    // Flips pill — animate counter on change
    if (flips !== this.lastFlips) {
      this.lastFlips = flips;
      this.elFlipsCount.textContent = String(flips);

      if (flips > 0) {
        this.elFlipsCount.classList.remove('bump');
        void this.elFlipsCount.offsetWidth; // force reflow for re-trigger
        this.elFlipsCount.classList.add('bump');
      }

      // Over-par coloring
      this.elFlipsPill.classList.toggle('over-par', flips > par);
    }

    this.elPar.textContent = String(par);

    // Status messages
    switch (status) {
      case 'dead':
        this.showMsg('💀', t('msgDeadTitle'), t('msgDeadSub'), 'var(--c-red)');
        break;
      case 'won':
        this.showMsg(
          '⭐',
          t('msgWonTitle'),
          flips <= par ? tf('msgWonPerfect', flips) : tf('msgWonFlips', flips),
          'var(--c-mint)',
        );
        this.api.submitScore(level, flips);
        break;
      case 'allComplete':
        this.showMsg('🏆', t('msgAllCompleteTitle'), t('msgAllCompleteSub'), 'var(--c-amber)');
        // Submit score then show leaderboard after a short delay
        this.api.submitScore(LEVELS.length, flips).then(() => {
          setTimeout(() => showLeaderboard(this.api), 3000);
        });
        break;
      default:
        this.hideMsg();
    }
  }

  private showMsg(icon: string, title: string, sub: string, color: string): void {
    this.elMsgIcon.textContent  = icon;
    this.elMsgTitle.textContent = title;
    this.elMsgSub.textContent   = sub;
    this.elMessage.style.setProperty('--msg-color', color);
    this.elMessage.classList.add('visible');
  }

  private hideMsg(): void {
    this.elMessage.classList.remove('visible');
  }
}
