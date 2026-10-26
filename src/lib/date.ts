const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** ローカル時刻で YYYY-MM-DD を返す（toISOString は UTC になるので使わない） */
export function dateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "2026-10-26" → "10月26日（月）" */
export function formatJapaneseDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}月${d}日（${WEEKDAYS[date.getDay()]}）`;
}

/** "2026-10-26" の days 日後（マイナスなら前）の日付キー。月末・年末の繰り上がりは Date に任せる */
export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + days));
}

/** その月の1日から月末までの日付キー（month は 1〜12） */
export function monthDates(year: number, month: number): string[] {
  // 次の月の0日目 = この月の最終日
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => dateKey(new Date(year, month - 1, i + 1)));
}
