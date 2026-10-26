import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyText } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { requestChatReply } from '@/lib/ai';
import { dateKey, formatJapaneseDate } from '@/lib/date';
import { addChatMessage, type ChatMessage, useAppData } from '@/lib/store';

export default function ChatScreen() {
  const theme = useTheme();
  const { ready, data } = useAppData();
  const today = dateKey();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 会話は日ごとに分けて保存しているので、今日の分だけ表示してAIに送る
  const messages = data.chats[today] ?? [];

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;

    const userMessage: Omit<ChatMessage, 'createdAt'> = { role: 'user', content };
    addChatMessage(today, userMessage);
    setText('');
    setSending(true);
    setError(null);
    try {
      // data は送信前の状態なので、今送った発言を足してからサーバーに渡す
      const reply = await requestChatReply(data, today, [...messages, userMessage]);
      addChatMessage(today, { role: 'assistant', content: reply });
    } catch (e) {
      setError(e instanceof Error ? e.message : '返事をもらえなかった');
    } finally {
      setSending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          // メッセージが増えたら一番下までスクロールする
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          <ThemedText type="subtitle">チャット</ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {formatJapaneseDate(today)}
          </ThemedText>

          {ready && messages.length === 0 && (
            <EmptyText>目標・習慣・記録を知った上で話せる。今日の調子とか、なんでも話しかけてみて</EmptyText>
          )}

          {messages.map((m, i) => {
            const mine = m.role === 'user';
            return (
              <View
                key={i}
                style={[
                  styles.bubble,
                  mine
                    ? [styles.mine, { backgroundColor: theme.accent }]
                    : [styles.theirs, { backgroundColor: theme.backgroundElement }],
                ]}>
                <ThemedText style={mine && styles.mineText}>{m.content}</ThemedText>
              </View>
            );
          })}

          {sending && <ActivityIndicator style={styles.theirs} />}

          {error && (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="メッセージ"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <Pressable
              onPress={send}
              disabled={!ready || sending}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.accent },
                (pressed || sending) && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                送信
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  mine: {
    alignSelf: 'flex-end',
  },
  theirs: {
    alignSelf: 'flex-start',
  },
  mineText: {
    color: '#ffffff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    justifyContent: 'center',
    borderRadius: Spacing.two,
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
