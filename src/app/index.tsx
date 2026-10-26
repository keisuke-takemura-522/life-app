import { AddRow } from '@/components/add-row';
import { ItemRow } from '@/components/item-row';
import { EmptyText, Screen, Section } from '@/components/screen';
import { SuggestionCard } from '@/components/suggestion-card';
import { dateKey, formatJapaneseDate } from '@/lib/date';
import { addTask, removeTask, toggleHabit, toggleTask, useAppData } from '@/lib/store';
import { habitStreak } from '@/lib/streak';

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
        <SuggestionCard data={data} today={today} />
      </Section>

      <Section title={`習慣 ${doneHabits.length}/${data.habits.length}`}>
        {data.habits.length === 0 ? (
          <EmptyText>「目標」タブで追いかけたい習慣を追加しよう</EmptyText>
        ) : (
          data.habits.map((h) => {
            const streak = habitStreak(data.habitLog, h.id, today);
            return (
              <ItemRow
                key={h.id}
                label={streak > 0 ? `${h.name} 🔥${streak}日` : h.name}
                checked={doneHabits.includes(h.id)}
                onToggle={() => toggleHabit(today, h.id)}
              />
            );
          })
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
