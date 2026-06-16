import kjvData from '../data/kjv.json';
import asanteTwiData from '../data/asante_twi.json';
import akuapemTwiData from '../data/akuapem_twi.json';
import type { Verse } from './apiBibleService';

const DATA_MAP: Record<string, any[]> = {
  kjv: kjvData as any[],
  asante_twi: asanteTwiData as any[],
  akuapem_twi: akuapemTwiData as any[],
};

export function fetchChapterOffline(translationId: string, bookIndex: number, chapter: number): Verse[] {
  const data = DATA_MAP[translationId] ?? DATA_MAP['kjv'];
  const book = data[bookIndex];
  if (!book) return [];
  const verses: string[] = book.chapters[chapter - 1] ?? [];
  return verses
    .map((text: string, i: number) => ({ verse: i + 1, text: text.trim() }))
    .filter((v) => v.text.length > 0);
}
