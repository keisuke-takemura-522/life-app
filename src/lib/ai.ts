import { addDays, formatJapaneseDate } from '@/lib/date';
import type { AppData, ChatMessage, DailySuggestion } from '@/lib/store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const APP_TOKEN = process.env.EXPO_PUBLIC_APP_TOKEN;

const MOOD_LABELS = ['とても低い', '低い', 'ふつう', 'よい', 'とてもよい'];

/** today から遡って days 日分の日付キー（今日を含む） */
function recentDateKeys(today: string, days: number) {
  return Array.from({ length: days }, (_, i) => addDays(today, -i));
}

export type CalendarEvent = {
  date: string;
  title: string;
  /** "HH:MM"。終日の予定は null */
  start: string | null;
  end: string | null;
  allDay: boolean;
};

/**
 * サーバーに「どの日の予定がほしいか」を伝える形。
 * サーバーは UTC で動いていて日本の日付が分からないので、日付と時差はアプリ側で決めて送る
 */
function calendarQuery(dates: string[]) {
  return {
    dates,
    // getTimezoneOffset は「UTC - ローカル」の分なので、符号を反転すると日本は +540
    offsetMinutes: -new Date().getTimezoneOffset(),
  };
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
        rating: e.rating ? `${e.rating}/5` : null,
        done: e.done ?? '',
        note: e.note,
      })),
  };
}

/** サーバーにPOSTして、返ってきたJSONを返す。失敗したらサーバーのエラーメッセージで例外を投げる */
async function post(path: string, payload: unknown) {
  if (!API_URL || !APP_TOKEN) {
    throw new Error('.env にサーバーのURLと合言葉が設定されていない');
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${APP_TOKEN}` },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `サーバーのエラー（${res.status}）`);
  }
  return body;
}

export async function requestSuggestion(
  data: AppData,
  today: string,
): Promise<Omit<DailySuggestion, 'createdAt'>> {
  return post('/suggest', { context: buildContext(data, today), calendar: calendarQuery([today, addDays(today, 1)]) });
}

/** その日の会話を送って、AIの返事を受け取る。保存は文字だけなので、送るのも role と content だけ */
export async function requestChatReply(
  data: AppData,
  today: string,
  messages: Omit<ChatMessage, 'createdAt'>[],
): Promise<string> {
  const body = await post('/chat', {
    context: buildContext(data, today),
    calendar: calendarQuery([today, addDays(today, 1)]),
    messages: messages.map(({ role, content }) => ({ role, content })),
  });
  return body.reply;
}

/** 指定した日（最大31日分）の予定。カレンダーはサーバーが読みに行く（URLは秘密なのでアプリには置かない） */
export async function requestCalendar(dates: string[]): Promise<CalendarEvent[]> {
  const body = await post('/calendar', calendarQuery(dates));
  return body.events;
}
