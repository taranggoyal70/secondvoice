/** Exact-token matching keeps unchanged words stable across a revision. */
export function changedWordIndexes(
  previous: string,
  next: string,
): Set<number> {
  const a = previous.trim().split(/\s+/).filter(Boolean);
  const b = next.trim().split(/\s+/).filter(Boolean);
  if (!a.length) return new Set<number>();
  const table = Array.from(
    { length: a.length + 1 },
    () => new Uint16Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  const unchanged = new Set<number>();
  let i = 0,
    j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      unchanged.add(j);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) i++;
    else j++;
  }
  return new Set(
    b.map((_, index) => index).filter((index) => !unchanged.has(index)),
  );
}

/** Late timing bursts must not release a paragraph of decorative particles. */
export function wordFlightIndexes(
  previous: number,
  current: number,
  total: number,
): number[] {
  const end = Math.min(total, Math.max(0, Math.floor(current)));
  const start = Math.max(0, Math.floor(previous), end - 5);
  if (end <= start) return [];
  return Array.from({ length: end - start }, (_, i) => start + i);
}
