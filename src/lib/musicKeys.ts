export const keyToSemitones: Record<string, number> = {
  "C Major": 0,
  "C# Major": 1,
  "D Major": 2,
  "Eb Major": 3,
  "E Major": 4,
  "F Major": 5,
  "F# Major": 6,
  "G Major": 7,
  "Ab Major": 8,
  "A Major": 9,
  "Bb Major": 10,
  "B Major": 11,
};

export function getTransposeSemitones(fromKey: string, toKey: string): number {
  const from = keyToSemitones[fromKey] ?? 0;
  const to = keyToSemitones[toKey] ?? 0;
  return to - from;
}
