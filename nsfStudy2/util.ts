/**
 * Creates a shuffled copy of the input array using the Fisher-Yates algorithm
 * @param array The array to shuffle
 * @returns A new array with the same elements in random order
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}
