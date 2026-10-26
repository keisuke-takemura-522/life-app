import ICAL from 'ical.js';
import { z } from 'zod';

/** アプリが「どの日の予定がほしいか」を伝える形 */
export const CalendarQuerySchema = z.object({
  /** ほしい日付（YYYY-MM-DD）。アプリ側のローカルの日付。月のカレンダー表のため最大1か月分 */
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .min(1)
    .max(31),
  /** アプリ側の時差（分）。日本なら +540。サーバーは UTC で動いているので、これで日本の時刻に直す */
  offsetMinutes: z.number().int().min(-840).max(840),
});
export type CalendarQuery = z.infer<typeof CalendarQuerySchema>;

export type CalendarEvent = {
  date: string;
  title: string;
  /** "HH:MM"。終日の予定は null */
  start: string | null;
  end: string | null;
  allDay: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
// 古くから毎日繰り返している予定でも無限に回らないようにする上限
const MAX_OCCURRENCES = 10000;

const pad = (n: number) => String(n).padStart(2, '0');

/** 終日の予定の日付。終日の予定には時刻もタイムゾーンもないので、書いてある日付をそのまま使う */
function dateOf(time: ICAL.Time) {
  return `${time.year}-${pad(time.month)}-${pad(time.day)}`;
}

/** 時刻つきの予定を、アプリ側のローカルの日付と時刻に直す */
function toLocal(time: ICAL.Time, offsetMinutes: number) {
  // 時差の分だけずらしてから UTC として読むと、ローカルの日付・時刻になる
  const d = new Date(time.toUnixTime() * 1000 + offsetMinutes * 60 * 1000);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

/** iCal URL から予定を読み、指定された日付の分だけ返す */
export async function loadEvents(icsUrl: string, query: CalendarQuery): Promise<CalendarEvent[]> {
  const res = await fetch(icsUrl);
  if (!res.ok) throw new Error(`カレンダーの取得に失敗（${res.status}）`);
  const calendar = new ICAL.Component(ICAL.parse(await res.text()));

  // TZID 付きの時刻を正しく UTC に直せるよう、ファイルに入っているタイムゾーンを登録する
  for (const tz of calendar.getAllSubcomponents('vtimezone')) {
    ICAL.TimezoneService.register(tz);
  }

  const dates = [...query.dates].sort();
  // 範囲の始まり（最初の日の0時）と終わり（最後の日の翌日0時）を、ローカルの時刻として UTC のミリ秒で
  const midnight = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    return Date.UTC(y, m - 1, d) - query.offsetMinutes * 60 * 1000;
  };
  const rangeStart = midnight(dates[0]);
  const rangeEnd = midnight(dates[dates.length - 1]) + DAY_MS;

  const vevents = calendar.getAllSubcomponents('vevent');
  // 繰り返し予定の「この回だけ変更」は別の VEVENT になっている。UID ごとにまとめて元の予定に結びつける
  const exceptionsByUid = new Map<string, ICAL.Component[]>();
  for (const v of vevents) {
    if (!v.hasProperty('recurrence-id')) continue;
    const uid = String(v.getFirstPropertyValue('uid'));
    exceptionsByUid.set(uid, [...(exceptionsByUid.get(uid) ?? []), v]);
  }

  const result: CalendarEvent[] = [];
  const add = (start: ICAL.Time, end: ICAL.Time, item: ICAL.Event) => {
    if (item.component.getFirstPropertyValue('status') === 'CANCELLED') return;
    const title = item.summary || '（タイトルなし）';

    if (start.isDate) {
      // 終日の予定は DTEND が「終わった次の日」なので、start <= 日付 < end の日に出す
      const from = dateOf(start);
      const to = end ? dateOf(end) : from;
      for (const date of dates) {
        if (date === from || (from <= date && date < to)) {
          result.push({ date, title, start: null, end: null, allDay: true });
        }
      }
      return;
    }

    const s = toLocal(start, query.offsetMinutes);
    if (!dates.includes(s.date)) return;
    const e = end ? toLocal(end, query.offsetMinutes) : null;
    result.push({ date: s.date, title, start: s.time, end: e?.time ?? null, allDay: false });
  };

  for (const v of vevents) {
    if (v.hasProperty('recurrence-id')) continue;
    // ICAL.Event は何も渡さないと UID が違う変更まで結びつけてしまうので、同じ UID の分だけ渡す
    const uid = String(v.getFirstPropertyValue('uid'));
    const event = new ICAL.Event(v, { exceptions: exceptionsByUid.get(uid) ?? [], strictExceptions: true });

    if (!event.isRecurring()) {
      add(event.startDate, event.endDate, event);
      continue;
    }

    const it = event.iterator();
    for (let i = 0; i < MAX_OCCURRENCES; i++) {
      const next = it.next();
      if (!next) break;
      // 範囲よりずっと前の回は、詳細（変更された回かどうか）を調べずに飛ばす。詳細を調べるのが重いため
      // 終日の予定はタイムゾーンなしで比べるので、前後に余裕をもたせる
      const time = next.toUnixTime() * 1000;
      if (time < rangeStart - 7 * DAY_MS) continue;
      if (time >= rangeEnd + 7 * DAY_MS) break;
      const occurrence = event.getOccurrenceDetails(next);
      add(occurrence.startDate, occurrence.endDate, occurrence.item);
    }
  }

  return result.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      Number(b.allDay) - Number(a.allDay) ||
      (a.start ?? '').localeCompare(b.start ?? ''),
  );
}
