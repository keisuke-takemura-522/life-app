import { AddRow } from '@/components/add-row';
import { ItemRow } from '@/components/item-row';
import { EmptyText, Screen, Section } from '@/components/screen';
import { addGoal, addHabit, type GoalHorizon, removeGoal, removeHabit, useAppData } from '@/lib/store';

const HORIZONS: { key: GoalHorizon; title: string; placeholder: string }[] = [
  { key: 'life', title: '人生の方向性（5〜10年）', placeholder: '例：大学院に進む' },
  { key: 'year', title: '今年の目標', placeholder: '例：英語を習慣にする' },
  { key: 'month', title: '今月の目標', placeholder: '例：バイトを1つ決める' },
];

export default function GoalsScreen() {
  const { ready, data } = useAppData();

  if (!ready) return <Screen title="目標">{null}</Screen>;

  return (
    <Screen title="目標">
      {HORIZONS.map(({ key, title, placeholder }) => {
        const goals = data.goals.filter((g) => g.horizon === key);
        return (
          <Section key={key} title={title}>
            {goals.length === 0 && <EmptyText>まだない</EmptyText>}
            {goals.map((g) => (
              <ItemRow key={g.id} label={g.text} onDelete={() => removeGoal(g.id)} />
            ))}
            <AddRow placeholder={placeholder} onAdd={(text) => addGoal(text, key)} />
          </Section>
        );
      })}

      <Section title="追いかける習慣">
        {data.habits.length === 0 && <EmptyText>毎日チェックしたいことを追加しよう</EmptyText>}
        {data.habits.map((h) => (
          <ItemRow key={h.id} label={h.name} onDelete={() => removeHabit(h.id)} />
        ))}
        <AddRow placeholder="例：1時までに寝る" onAdd={addHabit} />
      </Section>
    </Screen>
  );
}
