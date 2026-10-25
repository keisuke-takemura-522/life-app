import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (text: string) => void }) {
  const theme = useTheme();
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
  };

  return (
    <View style={styles.row}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        submitBehavior="submit"
        style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
      />
      <Pressable
        onPress={submit}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.accent },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold" style={styles.buttonText}>
          追加
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    borderRadius: Spacing.two,
  },
  buttonText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.6,
  },
});
