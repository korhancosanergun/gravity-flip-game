export const TILE_SIZE   = 2;
export const TILE_DEPTH  = 2;
export const BALL_RADIUS = 0.45;

export const GRAVITY_STRENGTH   = 25;
export const FLIP_LERP_SPEED    = 5;   // camera-up lerp speed (rad/s feel)
export const BALL_LINEAR_DAMPING  = 0.35;
export const BALL_ANGULAR_DAMPING = 0.35;
export const CAMERA_FOV          = 55;
export const OUT_OF_BOUNDS_MARGIN = 6;

export const COLORS = {
  BACKGROUND:      0x0a0a1a,
  FOG:             0x0a0a1a,
  TILE_SOLID:      0x1a3a7a,
  TILE_SOLID_EMISSIVE: 0x0a1a3a,
  TILE_SPIKE:      0xcc1111,
  TILE_SPIKE_EMISSIVE: 0x550000,
  TILE_GOAL:       0x11cc66,
  TILE_GOAL_EMISSIVE: 0x005522,
  BALL:            0xff8800,
  BALL_EMISSIVE:   0x551100,
  AMBIENT:         0x304060,
  DIR_LIGHT:       0xffffff,
  POINT_LIGHT:     0x4488ff,
};
