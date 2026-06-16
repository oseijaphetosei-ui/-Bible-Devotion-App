import { API_BIBLE_KEY, API_BIBLE_BASE } from '../config/bibleConfig';

export type Verse = { verse: number; text: string };
export type BibleVersion = { id: string; name: string; abbreviation: string };

export async function fetchAvailableBibles(): Promise<BibleVersion[]> {
  const res = await fetch(`${API_BIBLE_BASE}/bibles`, {
    headers: { 'api-key': API_BIBLE_KEY },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return (data.data as any[])
    .filter((b) => b.language?.id === 'eng')
    .map((b) => ({ id: b.id, name: b.name, abbreviation: b.abbreviationLocal ?? b.abbreviation }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchChapterOnline(
  bibleId: string,
  usfmId: string,
  chapter: number
): Promise<Verse[]> {
  const chapterId = `${usfmId}.${chapter}`;
  const params = new URLSearchParams({
    'content-type': 'html',
    'include-verse-numbers': 'true',
    'include-titles': 'false',
    'include-chapter-numbers': 'false',
  });
  const res = await fetch(
    `${API_BIBLE_BASE}/bibles/${bibleId}/chapters/${chapterId}?${params}`,
    { headers: { 'api-key': API_BIBLE_KEY } }
  );
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return parseHtmlVerses(data.data.content ?? '');
}

function parseHtmlVerses(html: string): Verse[] {
  // Strip footnotes before parsing
  const noFootnotes = html.replace(/<note[^>]*>[\s\S]*?<\/note>/g, '');
  const flat = noFootnotes.replace(/\n/g, ' ');

  const numbers: number[] = [];
  const numRegex = /<span[^>]*data-number="(\d+)"[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = numRegex.exec(flat)) !== null) {
    numbers.push(parseInt(m[1], 10));
  }

  // Split on the full verse-number span (including its visible text content)
  const parts = flat.split(/<span[^>]*data-number="\d+"[^>]*>[\s\S]*?<\/span>/);

  return numbers
    .map((num, i) => ({
      verse: num,
      text: stripHtml(parts[i + 1] ?? '').trim(),
    }))
    .filter((v) => v.text.length > 0);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
