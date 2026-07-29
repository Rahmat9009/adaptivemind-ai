export type ProductiveHintLevel = 0 | 1 | 2 | 3 | 4;

export function isMeaningfulAttempt(value: string): boolean {
  const normalized = value.normalize("NFKC").trim();
  return normalized.length > 0 && /[\p{L}\p{N}]/u.test(normalized);
}

export function nextHintLevel(
  currentLevel: ProductiveHintLevel,
): ProductiveHintLevel {
  return Math.min(currentLevel + 1, 4) as ProductiveHintLevel;
}

export function canRevealFullSolution({
  attemptMade,
  highestHintLevel,
}: {
  attemptMade: boolean;
  highestHintLevel: ProductiveHintLevel;
}): boolean {
  return attemptMade && highestHintLevel >= 1;
}
