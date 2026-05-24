export const TILE_SIZE   = 2;
export const TILE_DEPTH  = 0.35;   // thin slab aesthetic
export const BALL_RADIUS = 0.45;

export const GRAVITY_STRENGTH   = 25;
export const FLIP_LERP_SPEED    = 5;   // camera-up lerp speed (rad/s feel)
export const BALL_LINEAR_DAMPING  = 0.35;
export const BALL_ANGULAR_DAMPING = 0.35;
export const CAMERA_FOV          = 55;
export const OUT_OF_BOUNDS_MARGIN = 6;

export const COLORS = {
  BACKGROUND:           0x06070e,
  FOG:                  0x06070e,
  TILE_SOLID:           0x1a3060,   // deep blue slab
  TILE_SOLID_EMISSIVE:  0x0d1e44,
  TILE_SPIKE:           0xee1155,   // vivid red-pink
  TILE_SPIKE_EMISSIVE:  0x660022,
  TILE_GOAL:            0x00ffa3,   // electric mint
  TILE_GOAL_EMISSIVE:   0x00664a,
  BALL:                 0xff6a00,   // vivid orange
  BALL_EMISSIVE:        0x5c2000,
  AMBIENT:              0x2a3858,
  DIR_LIGHT:            0xffffff,
  POINT_LIGHT:          0x5b8cff,
};
