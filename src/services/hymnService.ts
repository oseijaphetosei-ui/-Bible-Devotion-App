import { HYMNS, type Hymn, type HymnCategory } from '../data/hymns';

// ── Search & filter ───────────────────────────────────────────────────────────

export function searchHymns(query: string): Hymn[] {
  if (!query.trim()) return HYMNS;
  const q = query.toLowerCase();
  return HYMNS.filter(h =>
    h.title.toLowerCase().includes(q) ||
    h.author.toLowerCase().includes(q) ||
    h.tags.some(t => t.toLowerCase().includes(q)) ||
    h.verses.some(v => v.lines.some(l => l.toLowerCase().includes(q))) ||
    (h.chorus?.lines.some(l => l.toLowerCase().includes(q)) ?? false),
  );
}

export function filterByCategory(category: HymnCategory | 'All'): Hymn[] {
  if (category === 'All') return HYMNS;
  return HYMNS.filter(h => h.category === category);
}

export function getFeaturedHymns(): Hymn[] {
  return HYMNS.filter(h => h.featured);
}

export function getHymnById(id: string): Hymn | undefined {
  return HYMNS.find(h => h.id === id);
}
