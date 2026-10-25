import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { requestSuggestion } from '@/lib/ai';
import { addTask, type AppData, saveSuggestion } from '@/lib/store';

export function SuggestionCard({ data, today }: { data: AppData; today: string }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestion = data.suggestions[today];
  const taskTexts = data.tasks.map((t) => t.text);

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      saveSuggestion(today, await requestSuggestion(data, today));
    } catch (e) {
      setError(e instanceof Error ? e.message : '提案をもらえなかった');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {suggestion ? (
        <>
          <ThemedText>{suggestion.message}</ThemedText>
          {suggestion.suggestions.map((s, i) => {
            const added = taskTexts.includes(s.title);
            return (
              <View key={i} style={styles.item}>
                <View style={styles.itemText}>
                  <ThemedText type="smallBold">
                    {i + 1}. {s.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {s.reason}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => addTask(s.title)}
                  disabled={added}
                  style={({ pressed }) => [
                    styles.addButton,
                    { borderColor: theme.accent },
                    (pressed || added) && styles.pressed,
                  ]}>
                  <ThemedText type="small" style={{ color: theme.accent }}>
                    {added ? '追加済み' : 'タスクに'}
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          目標・習慣・記録をもとに、今日やることを3つ提案する。
        </ThemedText>
      )}

      {error && (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      )}

      <Pressable
        onPress={fetchSuggestion}
        disabled={loading}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.accent },
          (pressed || loading) && styles.pressed,
        ]}>
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <ThemedText type="smallBold" style={styles.buttonText}>
            {suggestion ? '作り直す' : '提案をもらう'}
          </ThemedText>
        )}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  itemText: {
    flex: 1,
    gap: Spacing.half,
  },
  addButton: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  button: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.6,
  },
  error: {
    color: '#E5484D',
  },
});
