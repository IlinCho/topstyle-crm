// Merchandising helper for category pages: lets the admin pin a product to an
// EXACT 1-based slot on the page (e.g. "4" really means 4th on the grid),
// rather than just sorting pinned items relative to each other.
//
// Why this needs its own pass instead of a plain Prisma `orderBy`: SQL
// ORDER BY can only sort rows, it can't "make room" for a pinned item by
// shifting everything after it down by one. If two products are ranked 1
// and 4 with nothing at 2/3, a plain ascending sort on categoryRank collapses
// them next to each other (positions 1 and 2) - the admin's "4" silently
// becomes "2". Splicing pinned items into the natural (newest-first) order,
// processed lowest-rank-first, is what makes "4" land on the actual 4th tile.

export type RankedProduct = { categoryRank: number | null };

export function applyCategoryRankPins<T extends RankedProduct>(naturalOrder: T[]): T[] {
  const pinned = naturalOrder
    .filter((p) => p.categoryRank != null)
    .sort((a, b) => (a.categoryRank as number) - (b.categoryRank as number));
  const rest = naturalOrder.filter((p) => p.categoryRank == null);

  const result = [...rest];
  for (const p of pinned) {
    const targetIndex = Math.min(Math.max((p.categoryRank as number) - 1, 0), result.length);
    result.splice(targetIndex, 0, p);
  }
  return result;
}
