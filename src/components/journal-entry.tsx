import { StyleSheet, View } from 'react-native';

import { EmptyText } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatJapaneseDate } from '@/lib/date';
import { doneOn } from '@/lib/review';
import type { AppData, JournalEntry } from '@/lib/store';

export const MOODS = ['😞', '😕', '😐', '🙂', '😄'];

function stars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/**
 * 1日分の記録（気分・総合評価・やったこと・メモ）。記録タブの「これまで」とカレンダーで使う。
 * entry がない日でも、完了したタスク・習慣は自動で出す
 */
export function JournalEntryView({
  date,
  entry,
  data,
  showDate = true,
}: {
  date: string;
  entry?: JournalEntry;
  data: AppData;
  /** カレンダーのように見出しで日付が分かる場所では false にする */
  showDate?: boolean;
}) {
  const theme = useTheme();
  const mood = entry?.mood ? MOODS[entry.mood - 1] : '';
  return (
    <View style={styles.entry}>
      {(showDate || !!mood) && (
        <ThemedText type="smallBold">
          {showDate ? `${formatJapaneseDate(date)} ` : '気分 '}
          {mood}
        </ThemedText>
      )}
      <ThemedText type="small" style={entry?.rating ? { color: theme.accent } : undefined} themeColor="textSecondary">
        {entry?.rating ? stars(entry.rating) : '総合評価：記録なし'}
      </ThemedText>
      <DoneList data={data} date={date} done={entry?.done} />
      {!!entry?.note && <ThemedText type="small">{entry.note}</ThemedText>}
    </View>
  );
}

/** その日に完了したタスク・習慣（自動）と、手書きのやったことを並べる */
export function DoneList({ data, date, done }: { data: AppData; date: string; done?: string }) {
  const { tasks, habits } = doneOn(data, date);
  const items = [...habits.map((h) => `🔁 ${h}`), ...tasks.map((t) => `✓ ${t}`)];

  if (items.length === 0 && !done) {
    return <EmptyText>やったこと：記録なし</EmptyText>;
  }
  return (
    <View style={styles.doneList}>
      {items.map((item, i) => (
        <ThemedText key={i} type="small">
          {item}
        </ThemedText>
      ))}
      {!!done && <ThemedText type="small">{done}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    gap: Spacing.one,
  },
  doneList: {
    gap: Spacing.half,
  },
});
