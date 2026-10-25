import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  /** 指定するとチェックボックス付きの行になる */
  checked?: boolean;
  onToggle?: () => void;
  /** 指定すると長押しで削除できる */
  onDelete?: () => void;
};

export function ItemRow({ label, checked, onToggle, onDelete }: Props) {
  const theme = useTheme();
  const checkable = checked !== undefined;

  const confirmDelete = () =>
    Alert.alert('削除する？', label, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: onDelete },
    ]);

  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onDelete && confirmDelete}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {checkable && (
        <View
          style={[
            styles.box,
            { borderColor: theme.textSecondary },
            checked && { backgroundColor: theme.accent, borderColor: theme.accent },
          ]}>
          {checked && <ThemedText style={styles.check}>✓</ThemedText>}
        </View>
      )}
      <ThemedText
        style={[styles.label, checked && styles.done]}
        themeColor={checked ? 'textSecondary' : 'text'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 700,
  },
  label: {
    flex: 1,
  },
  done: {
    textDecorationLine: 'line-through',
  },
});
