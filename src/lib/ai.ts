import { dateKey, formatJapaneseDate } from '@/lib/date';
import type { AppData, DailySuggestion } from '@/lib/store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const APP_TOKEN = process.env.EXPO_PUBLIC_APP_TOKEN;

const MOOD_LABELS = ['とても低い', '低い', 'ふつう', 'よい', 'とてもよい'];

/** today から遡って days 日分の日付キー（今日を含む） */
function recentDateKeys(today: string, days: number) {
  const [y, m, d] = today.split('-').map(Number);
  return Array.from({ length: days }, (_, i) => dateKey(new Date(y, m - 1, d - i)));
}

/** AIに渡す記録をまとめる。直近1週間に絞って、送る量を抑える */
function buildContext(data: AppData, today: string) {
  const week = recentDateKeys(today, 7);
  const goalsOf = (horizon: string) =>
    data.goals.filter((g) => g.horizon === horizon).map((g) => g.text);

  return {
    today: formatJapaneseDate(today),
    goals: { life: goalsOf('life'), year: goalsOf('year'), month: goalsOf('month') },
    habits: data.habits.map((h) => ({
      name: h.name,
      last7days: `${week.filter((day) => data.habitLog[day]?.includes(h.id)).length}/7日`,
      doneToday: data.habitLog[today]?.includes(h.id) ?? false,
    })),
    openTasks: data.tasks.filter((t) => !t.done).map((t) => t.text),
    recentJournal: week
      .map((day) => data.journal[day])
      .filter((e) => e !== undefined)
      .map((e) => ({
        date: formatJapaneseDate(e.date),
        mood: e.mood ? MOOD_LABELS[e.mood - 1] : null,
        note: e.note,
      })),
  };
}

export async function requestSuggestion(
  data: AppData,
  today: string,
): Promise<Omit<DailySuggestion, 'createdAt'>> {
  if (!API_URL || !APP_TOKEN) {
    throw new Error('.env にサーバーのURLと合言葉が設定されていない');
  }

  const res = await fetch(`${API_URL}/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${APP_TOKEN}` },
    body: JSON.stringify(buildContext(data, today)),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `サーバーのエラー（${res.status}）`);
  }
  return body;
}
