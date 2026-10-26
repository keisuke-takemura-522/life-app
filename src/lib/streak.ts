import { dateKey } from '@/lib/date';

/** 習慣の連続達成日数。今日まだチェックしていなくても、昨日まで続いていれば途切れていない扱いにする */
export function habitStreak(
  habitLog: Record<string, string[]>,
  habitId: string,
  today: string,
): number {
  let streak = 0;

  const [y, m, d] = today.split('-').map(Number);

  let i = 1;

  while (habitLog[dateKey(new Date(y, m - 1, d - i))]?.includes(habitId)){
    streak++;
    i++;
  }

  if (habitLog[today]?.includes(habitId)){
    streak++;
  }
  
  return streak;
}
