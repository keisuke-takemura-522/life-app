import { AddRow } from '@/components/add-row';
import { ItemRow } from '@/components/item-row';
import { EmptyText, Screen, Section } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { dateKey, formatJapaneseDate } from '@/lib/date';
import { addTask, removeTask, toggleHabit, toggleTask, useAppData } from '@/lib/store';

export default function TodayScreen() {
  const { ready, data } = useAppData();
  const today = dateKey();

  if (!ready) return <Screen title={formatJapaneseDate(today)}>{null}</Screen>;

  const doneHabits = data.habitLog[today] ?? [];
  const openTasks = data.tasks.filter((t) => !t.done);
  // 完了したタスクは今日終わった分だけ表示する
  const doneToday = data.tasks.filter((t) => t.done && t.doneAt && dateKey(new Date(t.doneAt)) === today);

  return (
    <Screen title={formatJapaneseDate(today)}>
      <Section title="AIの提案">
        <ThemedText type="small" themeColor="textSecondary">
          APIキーをつないだら、ここに「今日やること3つ」が出るようになる。
        </ThemedText>
      </Section>

      <Section title={`習慣 ${doneHabits.length}/${data.habits.length}`}>
        {data.habits.length === 0 ? (
          <EmptyText>「目標」タブで追いかけたい習慣を追加しよう</EmptyText>
        ) : (
          data.habits.map((h) => (
            <ItemRow
              key={h.id}
              label={h.name}
              checked={doneHabits.includes(h.id)}
              onToggle={() => toggleHabit(today, h.id)}
            />
          ))
        )}
      </Section>

      <Section title="やること">
        {openTasks.length === 0 && doneToday.length === 0 && (
          <EmptyText>やることを追加しよう。長押しで削除できる</EmptyText>
        )}
        {[...openTasks, ...doneToday].map((t) => (
          <ItemRow
            key={t.id}
            label={t.text}
            checked={t.done}
            onToggle={() => toggleTask(t.id)}
            onDelete={() => removeTask(t.id)}
          />
        ))}
        <AddRow placeholder="タスクを追加" onAdd={addTask} />
      </Section>
    </Screen>
  );
}
