import type { Verse } from './apiBibleService';

// Bible JSON files are large (KJV 4.5 MB, Twi-A 3.5 MB, Twi-K 3.4 MB = 11.5 MB total).
// Loading them via top-level import parses all 11.5 MB at app startup.
// Lazy require() defers that work to the first Bible chapter access instead.
// Metro's module cache means require() runs JSON.parse only once per session.
const dataCache = new Map<string, any[]>();

function getData(translationId: string): any[] {
  if (dataCache.has(translationId)) return dataCache.get(translationId)!;
  let data: any[];
  switch (translationId) {
    case 'asante_twi':  data = require('../data/asante_twi.json');  break;
    case 'akuapem_twi': data = require('../data/akuapem_twi.json'); break;
    default:            data = require('../data/kjv.json');          break;
  }
  dataCache.set(translationId, data);
  return data;
}

export function fetchChapterOffline(translationId: string, bookIndex: number, chapter: number): Verse[] {
  const data = getData(translationId);
  const book = data[bookIndex];
  if (!book) return [];
  const verses: string[] = book.chapters[chapter - 1] ?? [];
  return verses
    .map((text: string, i: number) => ({ verse: i + 1, text: text.trim() }))
    .filter((v) => v.text.length > 0);
}
