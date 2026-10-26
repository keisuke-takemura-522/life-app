import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { CalendarStatus, EventList } from '@/components/calendar-card';
import { JournalEntryView } from '@/components/journal-entry';
import { Screen, Section } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { useTheme } from '@/hooks/use-theme';
import { dateKey, formatJapaneseDate, monthDates } from '@/lib/date';
import { useAppData } from '@/lib/store';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function CalendarScreen() {
  const theme = useTheme();
  const { ready, data } = useAppData();
  const today = dateKey();
  const [ty, tm] = today.split('-').map(Number);
  // 表示している月（month は 1〜12）
  const [month, setMonth] = useState({ year: ty, month: tm });
  const [selected, setSelected] = useState(today);

  const dates = monthDates(month.year, month.month);
  const { events, error, loading, reload } = useCalendarEvents(dates);

  const moveMonth = (diff: number) => {
    // 月を0始まりにして足し引きし、年の繰り上がりは Date に任せる
    const d = new Date(month.year, month.month - 1 + diff, 1);
    const next = { year: d.getFullYear(), month: d.getMonth() + 1 };
    setMonth(next);
    // 今月に戻ったら今日、それ以外はその月の1日を選ぶ
    setSelected(next.year === ty && next.month === tm ? today : monthDates(next.year, next.month)[0]);
  };

  // 1日が何曜日かの分だけ前を空けて、7日ずつの週に分ける
  const blanks = new Date(month.year, month.month - 1, 1).getDay();
  const cells: (string | null)[] = [...Array<null>(blanks).fill(null), ...dates];
  const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, i) => {
    const week = cells.slice(i * 7, i * 7 + 7);
    return [...week, ...Array<null>(7 - week.length).fill(null)];
  });

  const hasEvents = new Set(events?.map((e) => e.date));
  const selectedEvents = events?.filter((e) => e.date === selected) ?? [];

  return (
    <Screen title="カレンダー">
      <View style={styles.header}>
        <MonthButton label="‹" onPress={() => moveMonth(-1)} />
        <ThemedText type="smallBold">
          {month.year}年{month.month}月
        </ThemedText>
        <MonthButton label="›" onPress={() => moveMonth(1)} />
      </View>

      <View>
        <View style={styles.row}>
          {WEEKDAYS.map((w) => (
            <ThemedText key={w} type="small" themeColor="textSecondary" style={styles.weekday}>
              {w}
            </ThemedText>
          ))}
        </View>
        {weeks.map((week, i) => (
          <View key={i} style={styles.row}>
            {week.map((date, j) =>
              date === null ? (
                <View key={j} style={styles.cell} />
              ) : (
                <Pressable
                  key={date}
                  onPress={() => setSelected(date)}
                  style={[
                    styles.cell,
                    date === today && { borderColor: theme.accent, borderWidth: 1 },
                    date === selected && { backgroundColor: theme.accent },
                  ]}>
                  <ThemedText type="small" style={date === selected && styles.selectedText}>
                    {Number(date.slice(8))}
                  </ThemedText>
                  {/* 総合評価がある日は「★4」のように出す */}
                  <ThemedText
                    style={[
                      styles.rating,
                      { color: date === selected ? '#ffffff' : theme.textSecondary },
                    ]}>
                    {data.journal[date]?.rating ? `★${data.journal[date].rating}` : ' '}
                  </ThemedText>
                  {/* 予定がある日に点を付ける */}
                  <View
                    style={[
                      styles.dot,
                      hasEvents.has(date) && { backgroundColor: date === selected ? '#ffffff' : theme.accent },
                    ]}
                  />
                </Pressable>
              ),
            )}
          </View>
        ))}
      </View>

      <Section title={formatJapaneseDate(selected)}>
        {events === null && loading ? (
          <ActivityIndicator />
        ) : (
          <EventList events={selectedEvents} emptyText="予定はない" />
        )}
        <CalendarStatus error={error} loading={loading} onReload={reload} />
      </Section>

      {/* 記録は過去と今日の分だけ。未来の日にはまだない */}
      {ready && selected <= today && (
        <Section title="記録">
          <JournalEntryView date={selected} entry={data.journal[selected]} data={data} showDate={false} />
        </Section>
      )}
    </Screen>
  );
}

function MonthButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedText type="subtitle">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  row: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
  },
  rating: {
    fontSize: 10,
    lineHeight: 12,
  },
  selectedText: {
    color: '#ffffff',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pressed: {
    opacity: 0.6,
  },
});
