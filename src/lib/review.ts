import { dateKey } from '@/lib/date';
import type { AppData, Task } from '@/lib/store';

/** タスクがその日に完了したか。doneAt は UTC の日時なので、ローカルの日付に直してから比べる */
export function isTaskDoneOn(task: Task, date: string) {
  return task.done && !!task.doneAt && dateKey(new Date(task.doneAt)) === date;
}

/**
 * その日に完了したタスクとチェックした習慣の名前。
 * 既存の記録から毎回計算するので保存はしない（削除したタスク・習慣は出てこない）
 */
export function doneOn(data: AppData, date: string) {
  const tasks = data.tasks.filter((t) => isTaskDoneOn(t, date)).map((t) => t.text);
  const habits = (data.habitLog[date] ?? [])
    .map((id) => data.habits.find((h) => h.id === id)?.name)
    .filter((name) => name !== undefined);
  return { tasks, habits };
}
