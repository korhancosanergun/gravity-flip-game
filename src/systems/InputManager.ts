import type { GravityDirection } from '../utils/Types';

type FlipCallback = (dir: GravityDirection) => void;

export class InputManager {
  private onFlip: FlipCallback;
  private touchStartX = 0;
  private touchStartY = 0;
  private readonly SWIPE_MIN = 35;

  private keyHandler!: (e: KeyboardEvent) => void;
  private touchStartHandler!: (e: TouchEvent) => void;
  private touchEndHandler!: (e: TouchEvent) => void;

  constructor(onFlip: FlipCallback) {
    this.onFlip = onFlip;
    this.bindKeyboard();
    this.bindTouch();
    this.bindButtons();
  }

  private bindKeyboard(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':  case 's': case 'S': this.onFlip('down');  break;
        case 'ArrowUp':    case 'w': case 'W': this.onFlip('up');    break;
        case 'ArrowLeft':  case 'a': case 'A': this.onFlip('left');  break;
        case 'ArrowRight': case 'd': case 'D': this.onFlip('right'); break;
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  private bindTouch(): void {
    this.touchStartHandler = (e: TouchEvent) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    };

    this.touchEndHandler = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;

      if (Math.abs(dx) < this.SWIPE_MIN && Math.abs(dy) < this.SWIPE_MIN) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.onFlip(dx > 0 ? 'right' : 'left');
      } else {
        this.onFlip(dy > 0 ? 'down' : 'up');
      }
    };

    window.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    window.addEventListener('touchend',   this.touchEndHandler,   { passive: true });
  }

  private bindButtons(): void {
    document.querySelectorAll<HTMLButtonElement>('.tc-btn').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const dir = btn.dataset.dir as GravityDirection | undefined;
        if (dir) this.onFlip(dir);
      });
    });
  }

  destroy(): void {
    window.removeEventListener('keydown',     this.keyHandler);
    window.removeEventListener('touchstart',  this.touchStartHandler);
    window.removeEventListener('touchend',    this.touchEndHandler);
  }
}
