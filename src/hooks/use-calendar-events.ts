import { useEffect, useState } from 'react';

import { type CalendarEvent, requestCalendar } from '@/lib/ai';

type Result = {
  /** どの日付の、何回目の読み込みの結果か */
  key: string;
  reloadCount: number;
  events: CalendarEvent[] | null;
  error: string | null;
};

/**
 * 指定した日の予定を読み込む。予定はGoogleカレンダーが正なので保存せず、表示するたびに取ってくる。
 * 今日の画面とカレンダーの画面の両方で使う
 */
export function useCalendarEvents(dates: string[]) {
  // 配列は描画のたびに別物になるので、中身を文字列にして「変わったか」を比べる
  const key = dates.join(',');
  // 「更新」を押すたびに1増やす。この数字か日付が変わったら読み込み直す
  const [reloadCount, setReloadCount] = useState(0);
  // 最後に読み込み終わった結果
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    // 読み込み中に日付が変わったり更新を押されたりしたら、古い結果は捨てる
    let stale = false;
    requestCalendar(key.split(','))
      .then((events) => !stale && setResult({ key, reloadCount, events, error: null }))
      .catch((e) => {
        if (stale) return;
        const error = e instanceof Error ? e.message : '予定を読み込めなかった';
        // 失敗しても、前に読めた予定は表示したままにする
        setResult((prev) => ({ key, reloadCount, events: prev?.key === key ? prev.events : null, error }));
      });
    return () => {
      stale = true;
    };
  }, [key, reloadCount]);

  // 今の日付・更新回数の結果がまだ来ていなければ読み込み中
  const loading = result?.key !== key || result.reloadCount !== reloadCount;
  return {
    // 別の日付の結果は見せない（月を切り替えた直後に前の月の予定が出ないように）
    events: result?.key === key ? result.events : null,
    error: loading ? null : result.error,
    loading,
    reload: () => setReloadCount((n) => n + 1),
  };
}
