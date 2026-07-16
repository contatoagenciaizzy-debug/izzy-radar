// Asset keys for the V2 (custom Izzy pixel art) visual style
// All paths relative to /assets/avatars-v2/ in public/

export const CHARACTER_KEYS_V2 = ['izzy1', 'izzy2', 'izzy3', 'izzy4'] as const;
export type CharacterKeyV2 = typeof CHARACTER_KEYS_V2[number];

export const CHARACTER_PATHS_V2: Record<CharacterKeyV2, string> = {
  izzy1: 'assets/avatars-v2/izzy1-bluehair.png',
  izzy2: 'assets/avatars-v2/izzy2-ponytail.png',
  izzy3: 'assets/avatars-v2/izzy3-purplehair.png',
  izzy4: 'assets/avatars-v2/izzy4-redhair.png',
};

export const PROP_KEYS_V2 = {
  desk: 'v2_desk',
  renan: 'v2_renan',
  logo: 'v2_logo',
  robot: 'v2_robot',
  neonPanelA: 'v2_neon_panel_a',
  neonPanelB: 'v2_neon_panel_b',
  plant: 'v2_plant',
  couch: 'v2_couch',
  rug: 'v2_rug',
  skyline: 'v2_skyline',
} as const;

export const PROP_PATHS_V2: Record<string, string> = {
  [PROP_KEYS_V2.desk]: 'assets/avatars-v2/desk-monitors.png',
  [PROP_KEYS_V2.renan]: 'assets/avatars-v2/renan-boss.png',
  [PROP_KEYS_V2.logo]: 'assets/avatars-v2/izzy-logo-neon.png',
  [PROP_KEYS_V2.robot]: 'assets/avatars-v2/robot-mascot.png',
  [PROP_KEYS_V2.neonPanelA]: 'assets/avatars-v2/neon-panel-a.png',
  [PROP_KEYS_V2.neonPanelB]: 'assets/avatars-v2/neon-panel-b.png',
  [PROP_KEYS_V2.plant]: 'assets/avatars-v2/plant.png',
  [PROP_KEYS_V2.couch]: 'assets/avatars-v2/couch.png',
  [PROP_KEYS_V2.rug]: 'assets/avatars-v2/rug.png',
  [PROP_KEYS_V2.skyline]: 'assets/avatars-v2/city-skyline.png',
};

export function characterKeyForIndex(index: number): CharacterKeyV2 {
  return CHARACTER_KEYS_V2[index % CHARACTER_KEYS_V2.length];
}
