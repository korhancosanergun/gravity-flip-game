import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Tile } from '../objects/Tile';
import type { LevelData, TileType } from '../utils/Types';
import { TILE_SIZE, CAMERA_FOV } from '../utils/Constants';
import { LEVELS } from '../levels/levels';

export interface LevelBounds {
  minX: number; maxX: number;
  minY: number; maxY: number;
  centerX: number; centerY: number;
  cameraZ: number;
}

export class LevelManager {
  private tiles: Tile[] = [];
  private scene: THREE.Scene;
  private physicsWorld: CANNON.World;

  currentLevel: LevelData | null = null;
  spawnX = 0;
  spawnY = 0;

  static get totalLevels(): number {
    return LEVELS.length;
  }

  constructor(scene: THREE.Scene, physicsWorld: CANNON.World) {
    this.scene       = scene;
    this.physicsWorld = physicsWorld;
  }

  load(index: number): LevelBounds {
    this.clear();
    const data = LEVELS[index];
    if (!data) throw new Error(`Level ${index} not found`);
    this.currentLevel = data;

    const rows = data.grid.length;
    const cols = data.grid[0].length;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const type = data.grid[row][col] as TileType;

        if (type === 2) {
          // Record spawn — tile itself is empty air
          this.spawnX = col * TILE_SIZE;
          this.spawnY = -row * TILE_SIZE;
          continue;
        }
        if (type === 0) continue;

        const tile = new Tile(this.scene, this.physicsWorld, col, row, type);
        this.tiles.push(tile);
      }
    }

    return this.computeBounds(rows, cols);
  }

  private computeBounds(rows: number, cols: number): LevelBounds {
    const minX = -TILE_SIZE / 2;
    const maxX = (cols - 1) * TILE_SIZE + TILE_SIZE / 2;
    const minY = -(rows - 1) * TILE_SIZE - TILE_SIZE / 2;
    const maxY =  TILE_SIZE / 2;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const spanX = maxX - minX + 2;
    const spanY = maxY - minY + 2;
    const fovRad = (CAMERA_FOV * Math.PI) / 180;
    const cameraZ = (Math.max(spanX, Math.abs(spanY)) / 2) / Math.tan(fovRad / 2) * 1.25;

    return { minX, maxX, minY, maxY, centerX, centerY, cameraZ };
  }

  update(elapsed: number): void {
    for (const tile of this.tiles) tile.update(elapsed);
  }

  clear(): void {
    for (const tile of this.tiles) tile.removeFrom(this.scene, this.physicsWorld);
    this.tiles = [];
    this.currentLevel = null;
  }
}
