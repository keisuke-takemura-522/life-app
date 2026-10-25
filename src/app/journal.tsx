import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { EmptyText, Screen, Section } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dateKey, formatJapaneseDate } from '@/lib/date';
import { type JournalEntry, saveJournal, useAppData } from '@/lib/store';

const MOODS = ['😞', '😕', '😐', '🙂', '😄'];

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
        <TodayEditor date={today} entry={data.journal[today]} />
      </Section>

      <Section title="これまで">
        {past.length === 0 && <EmptyText>まだ記録がない</EmptyText>}
        {past.map((e) => (
          <View key={e.date} style={styles.pastEntry}>
            <ThemedText type="smallBold">
              {formatJapaneseDate(e.date)} {e.mood ? MOODS[e.mood - 1] : ''}
            </ThemedText>
            {!!e.note && <ThemedText type="small">{e.note}</ThemedText>}
          </View>
        ))}
      </Section>
    </Screen>
  );
}

function TodayEditor({ date, entry }: { date: string; entry?: JournalEntry }) {
  const theme = useTheme();
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [note, setNote] = useState(entry?.note ?? '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveJournal(date, mood, note.trim());
    setSaved(true);
  };

  return (
    <>
      <View style={styles.moods}>
        {MOODS.map((emoji, i) => {
          const value = i + 1;
          const selected = mood === value;
          return (
            <Pressable
              key={value}
              onPress={() => {
                setMood(selected ? null : value);
                setSaved(false);
              }}
              style={[styles.mood, selected && { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={styles.moodEmoji}>{emoji}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={note}
        onChangeText={(text) => {
          setNote(text);
          setSaved(false);
        }}
        placeholder="今日あったこと、考えたこと"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[styles.note, { color: theme.text, backgroundColor: theme.background }]}
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

const styles = StyleSheet.create({
  moods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mood: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  note: {
    minHeight: 120,
    fontSize: 16,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    textAlignVertical: 'top',
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
});
