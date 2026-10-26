import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { EmptyText, Screen, Section } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dateKey, formatJapaneseDate } from '@/lib/date';
import { doneOn } from '@/lib/review';
import { type AppData, type JournalEntry, saveJournal, useAppData } from '@/lib/store';

const MOODS = ['😞', '😕', '😐', '🙂', '😄'];
const RATINGS = [1, 2, 3, 4, 5];

function stars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export default function JournalScreen() {
  const { ready, data } = useAppData();
  const today = dateKey();

  if (!ready) return <Screen title="記録">{null}</Screen>;

  const past = Object.values(data.journal)
    .filter((e) => e.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen title="記録">
      <Section title={`今日 ${formatJapaneseDate(today)}`}>
        <TodayEditor date={today} entry={data.journal[today]} data={data} />
      </Section>

      <Section title="これまで">
        {past.length === 0 && <EmptyText>まだ記録がない</EmptyText>}
        {past.map((e) => (
          <PastEntry key={e.date} entry={e} data={data} />
        ))}
      </Section>
    </Screen>
  );
}

function TodayEditor({ date, entry, data }: { date: string; entry?: JournalEntry; data: AppData }) {
  const theme = useTheme();
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [rating, setRating] = useState<number | null>(entry?.rating ?? null);
  const [done, setDone] = useState(entry?.done ?? '');
  const [note, setNote] = useState(entry?.note ?? '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveJournal(date, { mood, rating, done: done.trim(), note: note.trim() });
    setSaved(true);
  };

  // 入力が変わったら「保存した ✓」を消す
  const changed = () => setSaved(false);

  return (
    <>
      <Label>気分</Label>
      <View style={styles.choices}>
        {MOODS.map((emoji, i) => {
          const value = i + 1;
          const selected = mood === value;
          return (
            <Pressable
              key={value}
              onPress={() => {
                setMood(selected ? null : value);
                changed();
              }}
              style={[styles.choice, selected && { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={styles.choiceText}>{emoji}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Label>今日の総合評価</Label>
      <View style={styles.choices}>
        {RATINGS.map((value) => (
          // 押した★まで塗る。同じ★をもう一回押すと未評価に戻す
          <Pressable
            key={value}
            onPress={() => {
              setRating(rating === value ? null : value);
              changed();
            }}
            style={styles.choice}>
            <ThemedText style={[styles.choiceText, { color: theme.accent }]}>
              {rating !== null && value <= rating ? '★' : '☆'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Label>やったこと</Label>
      <DoneList data={data} date={date} />
      <TextInput
        value={done}
        onChangeText={(text) => {
          setDone(text);
          changed();
        }}
        placeholder="ほかにやったこと"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[styles.input, styles.doneInput, { color: theme.text, backgroundColor: theme.background }]}
      />

      <Label>メモ</Label>
      <TextInput
        value={note}
        onChangeText={(text) => {
          setNote(text);
          changed();
        }}
        placeholder="今日あったこと、考えたこと"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[styles.input, styles.noteInput, { color: theme.text, backgroundColor: theme.background }]}
      />

      <Pressable
        onPress={save}
        style={({ pressed }) => [styles.save, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={styles.saveText}>
          {saved ? '保存した ✓' : '保存'}
        </ThemedText>
      </Pressable>
    </>
  );
}

function PastEntry({ entry, data }: { entry: JournalEntry; data: AppData }) {
  const theme = useTheme();
  return (
    <View style={styles.pastEntry}>
      <ThemedText type="smallBold">
        {formatJapaneseDate(entry.date)} {entry.mood ? MOODS[entry.mood - 1] : ''}
      </ThemedText>
      <ThemedText type="small" style={entry.rating ? { color: theme.accent } : undefined} themeColor="textSecondary">
        {entry.rating ? stars(entry.rating) : '総合評価：記録なし'}
      </ThemedText>
      <DoneList data={data} date={entry.date} done={entry.done} />
      {!!entry.note && <ThemedText type="small">{entry.note}</ThemedText>}
    </View>
  );
}

/** その日に完了したタスク・習慣（自動）と、手書きのやったことを並べる */
function DoneList({ data, date, done }: { data: AppData; date: string; done?: string }) {
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

function Label({ children }: { children: string }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary">
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  choices: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  choice: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: {
    fontSize: 30,
    lineHeight: 36,
  },
  input: {
    fontSize: 16,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    textAlignVertical: 'top',
  },
  doneInput: {
    minHeight: 60,
  },
  noteInput: {
    minHeight: 120,
  },
  save: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  saveText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.6,
  },
  pastEntry: {
    gap: Spacing.one,
  },
  doneList: {
    gap: Spacing.half,
  },
});
