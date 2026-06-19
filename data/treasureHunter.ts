export const TREASURE_MULTIPLIERS = {
  '폴로/프리토': { rare: 3000,  epic: 6000,  unique: 12000,  legendary: 24000  },
  '에스페시아':   { rare: 30000, epic: 60000, unique: 120000, legendary: 240000 },
} as const;

export type TreasureDungeon = keyof typeof TREASURE_MULTIPLIERS;
