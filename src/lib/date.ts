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
