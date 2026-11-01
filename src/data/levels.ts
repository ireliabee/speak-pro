export interface Level {
  xp: number;
  name: string;
}

export const LEVELS: readonly Level[] = [
  { xp: 0, name: "Novice" },
  { xp: 150, name: "Apprentice" },
  { xp: 400, name: "Speaker" },
  { xp: 800, name: "Rhetor" },
  { xp: 1300, name: "Orator" },
  { xp: 1900, name: "Elite" },
];
