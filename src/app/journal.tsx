import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { DoneList, JournalEntryView, MOODS } from '@/components/journal-entry';
import { EmptyText, Screen, Section } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dateKey, formatJapaneseDate } from '@/lib/date';
import { type AppData, type JournalEntry, saveJournal, useAppData } from '@/lib/store';

const RATINGS = [1, 2, 3, 4, 5];

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
          <JournalEntryView key={e.date} date={e.date} entry={e} data={data} />
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
});
