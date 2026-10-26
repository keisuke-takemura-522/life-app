import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { EmptyText } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useTheme } from '@/hooks/use-theme';
import type { CalendarEvent } from '@/lib/ai';
import { addDays } from '@/lib/date';

/** 今日の画面の「予定」。今日と明日の分を出す */
export function CalendarCard({ today }: { today: string }) {
  const { events, error, loading, reload } = useCalendarEvents([today, addDays(today, 1)]);

  const todayEvents = events?.filter((e) => e.date === today) ?? [];
  const tomorrowEvents = events?.filter((e) => e.date !== today) ?? [];

  return (
    <>
      {events === null && loading && <ActivityIndicator />}

      {events !== null && (
        <>
          <EventList events={todayEvents} emptyText="今日の予定はない" />
          <ThemedText type="smallBold" themeColor="textSecondary">
            明日
          </ThemedText>
          <EventList events={tomorrowEvents} emptyText="明日の予定はない" />
        </>
      )}

      <CalendarStatus error={error} loading={loading} onReload={reload} />
    </>
  );
}

/** エラーと「予定を更新」ボタン。カレンダーの画面でも使う */
export function CalendarStatus({
  error,
  loading,
  onReload,
}: {
  error: string | null;
  loading: boolean;
  onReload: () => void;
}) {
  const theme = useTheme();
  return (
    <>
      {error && (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      )}
      <Pressable onPress={onReload} disabled={loading} style={({ pressed }) => (pressed || loading) && styles.pressed}>
        <ThemedText type="small" style={{ color: theme.accent }}>
          {loading ? '読み込み中…' : '予定を更新'}
        </ThemedText>
      </Pressable>
    </>
  );
}

/** 予定の一覧。時刻（終日なら「終日」）とタイトルを1行ずつ */
export function EventList({ events, emptyText }: { events: CalendarEvent[]; emptyText: string }) {
  if (events.length === 0) return <EmptyText>{emptyText}</EmptyText>;
  return (
    <View style={styles.list}>
      {events.map((e, i) => (
        <View key={i} style={styles.event}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.time}>
            {e.allDay ? '終日' : `${e.start}${e.end ? `–${e.end}` : ''}`}
          </ThemedText>
          <ThemedText type="small" style={styles.title}>
            {e.title}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.one,
  },
  event: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  time: {
    width: 96,
  },
  title: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  error: {
    color: '#E5484D',
  },
});
