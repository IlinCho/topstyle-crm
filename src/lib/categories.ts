// Builds a two-level category tree (category -> subcategories) from the
// flat list Prisma returns, and helpers to flatten it back out in the
// right display order. Only one level of nesting is supported, matching
// the real site's structure (e.g. "Мъжки тениски" -> "Тениски с яка").

export type CategoryLike = {
  id: string;
  slug: string;
  name: string;
  position: number;
  parentId: string | null;
};

export type CategoryNode<T extends CategoryLike = CategoryLike> = T & { children: CategoryNode<T>[] };

export function buildCategoryTree<T extends CategoryLike>(categories: T[]): CategoryNode<T>[] {
  const map = new Map<string, CategoryNode<T>>();
  categories.forEach((c) => map.set(c.id, { ...c, children: [] }));

  const roots: CategoryNode<T>[] = [];
  for (const c of categories) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const byPosition = (a: CategoryLike, b: CategoryLike) => a.position - b.position;
  roots.sort(byPosition);
  roots.forEach((r) => r.children.sort(byPosition));
  return roots;
}

// Flattens the tree into display order with a depth for indentation -
// handy for a plain <select> where a real nested menu isn't practical.
export function flattenCategoryTree<T extends CategoryLike>(
  tree: CategoryNode<T>[]
): (T & { depth: number })[] {
  const out: (T & { depth: number })[] = [];
  function walk(nodes: CategoryNode<T>[], depth: number) {
    for (const n of nodes) {
      const { children, ...rest } = n;
      out.push({ ...(rest as T), depth });
      walk(children, depth + 1);
    }
  }
  walk(tree, 0);
  return out;
}

// Collects a category's own id plus all of its (one level of) children ids -
// used so a parent category page can show subcategory products too.
export function categoryAndDescendantIds(category: CategoryLike, all: CategoryLike[]): string[] {
  const childIds = all.filter((c) => c.parentId === category.id).map((c) => c.id);
  return [category.id, ...childIds];
}
