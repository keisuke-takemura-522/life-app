# TypeScript / JSX / React の文法メモ

C++とPythonを知っている前提で、このアプリに実際に出てくる書き方だけをまとめたもの。

---

# 第1部：TypeScript の文法

## 1. 変数：`const` と `let`
```ts
const today = dateKey();   // 後から変えない（C++の const）
let streak = 0;            // 後から変える
streak++;
```
基本は `const`。変える必要があるときだけ `let`。（`var` という古い書き方もあるけど使わない）

## 2. 型の書き方
**型は名前の後ろに `:` で書く**（C++と逆）
```ts
let count: number = 0;              // C++: int count = 0;
function habitStreak(habitId: string, today: string): number { ... }
//                   引数: 型                         戻り値の型
```
型は省略しても、TypeScriptが推測してくれることが多い（`const today = dateKey()` は自動で `string` になる）。

**よく出てくる型**
| TypeScript | 意味 | C++ / Python だと |
|---|---|---|
| `string` | 文字列 | `std::string` / `str` |
| `number` | 数（整数も小数も） | `int`, `double` / `int`, `float` |
| `boolean` | true / false | `bool` |
| `string[]` | 文字列の配列 | `vector<string>` / `list[str]` |
| `Record<string, string[]>` | 辞書 | `map<string, vector<string>>` / `dict` |
| `null` / `undefined` | 「ない」 | `nullptr` / `None` |

**自分で型を作る：`type`**（C++の `struct` っぽいもの）
```ts
export type Task = { id: string; text: string; done: boolean; doneAt?: string };
```
`doneAt?:` の **`?`** は「この項目はなくてもいい」。

**「AかB」：`|`（ユニオン型）**
```ts
mood: number | null;               // 数字か、null
role: 'user' | 'assistant';        // この2つの文字列のどちらかだけ
```
2つ目はC++の `enum` みたいな使い方。それ以外の文字列を入れると型エラーになる。

**型から型を作る**
```ts
Omit<ChatMessage, 'createdAt'>     // ChatMessage から createdAt を抜いた型
```

## 3. 関数
**普通の書き方**
```ts
function newId() {
  return Date.now().toString(36);
}
```

**アロー関数**（`=>`）。Pythonの `lambda` を何行でも書けるようにした感じ。このアプリで一番よく出てくる
```ts
const pad = (n: number) => String(n).padStart(2, '0');   // 1行なら return 不要

const send = async () => {     // { } を使うなら return を書く
  ...
};
```

**`async` / `await`**：時間がかかる処理（通信など）を待つ
```ts
const res = await fetch(url);   // サーバーの返事が来るまで待つ
```
- `await` は `async` が付いた関数の中でしか使えない
- `async` 関数は **Promise**（「後で値が届く約束」）を返す。だから戻り値の型が `Promise<string>` みたいになる

**エラー処理**：C++ や Python とほぼ同じ
```ts
try { ... } catch (e) { ... } finally { ... }   // finally は成功しても失敗しても最後に動く
throw new Error('メッセージ');
```

## 4. オブジェクトと配列
**オブジェクト**：Pythonの辞書っぽいもの
```ts
const message = { role: 'user', content: 'こんにちは' };
message.role;   // 'user'
```

**スプレッド `...`**：中身を展開してコピー。**このアプリで超重要**
```ts
[...messages, userMessage]        // messagesをコピーして、最後に1個足した新しい配列
{ ...d, goals: newGoals }         // dをコピーして、goalsだけ差し替えた新しいオブジェクト
```
元のデータを書き換えずに、新しいデータを作るために使っている（Reactは「新しく作り直された」ことで変更に気づくから）。

**分割代入**：中身を取り出して変数にする
```ts
const { ready, data } = useAppData();          // オブジェクトから取り出す
const [y, m, d] = today.split('-').map(Number); // 配列から取り出す（Pythonの y, m, d = ...）
```

**配列の便利メソッド**
```ts
data.tasks.filter((t) => !t.done)    // 条件に合うものだけ残す
data.tasks.map((t) => t.text)        // 1個ずつ変換する（Pythonの [t.text for t in tasks]）
['a', 'b'].join(',')                 // つなげて文字列に → 'a,b'
habits.includes(id)                  // 入っているか（Pythonの in）
```

## 5. 文字列の中に変数を埋め込む
```ts
`${h.name} 🔥${streak}日`             // バッククォート ` で囲む。Pythonの f"{h.name} 🔥{streak}日"
```

## 6. よく出てくる記号
| 記号 | 意味 | 例 |
|---|---|---|
| `===` / `!==` | 等しい / 等しくない。**`==` じゃなくてこっちを使う** | `m.role === 'user'` |
| `?.` | 左が `null`/`undefined` ならエラーにせず `undefined` を返す | `habitLog[day]?.includes(id)` |
| `??` | 左が `null`/`undefined` なら右を使う | `data.chats[today] ?? []` |
| `!` | 否定 | `!t.done` |
| `!!` | 何でも true/false に変換 | `!!entry.note`（空文字なら false） |
| `? :` | 三項演算子。C++と同じ | `streak > 0 ? '🔥' : ''` |

## 7. `import` / `export`：ファイル同士をつなぐ
```ts
// streak.ts
export function habitStreak(...) { ... }        // 他のファイルから使えるようにする

// index.tsx
import { habitStreak } from '@/lib/streak';     // 使う側。@/ は src/ のこと
```
C++の `#include`、Pythonの `from ... import ...` と同じ感覚。

---

# 第2部：JSX（`.tsx` ファイル）の文法

`.tsx` は、TypeScriptの中に**画面の見た目をHTMLっぽく書ける**ようにしたもの。

## 1. コンポーネント＝見た目を返す関数
```tsx
function Label({ children }: { children: string }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary">
      {children}
    </ThemedText>
  );
}
```
- **大文字で始まる関数**で、`<...>` の見た目を `return` すると、それが**部品（コンポーネント）**になる
- 使うときは `<Label>気分</Label>` みたいにタグとして書く

## 2. props：部品に渡す引数
```tsx
<ItemRow label={h.name} checked={true} onToggle={() => toggleHabit(today, h.id)} />
```
- `名前={値}` で渡す。受け取る側は、関数の引数でまとめて受け取る
- 文字列なら `type="small"` みたいに `""` でもOK
- 中身がないタグは `<ItemRow ... />` みたいに `/>` で閉じる

## 3. `{ }` の中は TypeScript
```tsx
<ThemedText>{m.content}</ThemedText>
<ThemedText>{formatJapaneseDate(today)}</ThemedText>
```
タグの中で `{ }` を使うと、そこだけTypeScriptに戻れる。

## 4. 条件で出し分ける
```tsx
{error && <ThemedText>{error}</ThemedText>}                         // error があるときだけ出す
{loading ? <ActivityIndicator /> : <ThemedText>送信</ThemedText>}   // どっちかを出す
```
JSXの中には `if` が書けないので、`&&` と `? :` を使う。

## 5. リストを並べる
```tsx
{messages.map((m, i) => (
  <View key={i}>
    <ThemedText>{m.content}</ThemedText>
  </View>
))}
```
- 配列を `map` で見た目の配列に変換すると、並べて表示される
- **`key`** は「どれがどれか」をReactが見分けるための目印。リストには必ず付ける

## 6. 見た目（スタイル）
```tsx
<View style={styles.row} />
<View style={[styles.bubble, mine && styles.mine]} />   // 配列で重ねられる。false は無視される

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
});
```
CSSに似ているけど、`flex-direction` ではなく `flexDirection` のようにつなげて書く。

---

# 第3部：React の仕組み（hook）

## `useState`：画面が覚えておく値
```tsx
const [text, setText] = useState('');
```
- `text`：今の値
- `setText(...)`：値を変える。**変えると画面が自動で描き直される**
- 普通の変数を変えても画面は変わらない。だから画面に関係する値は `useState` で持つ

## `useEffect`：画面を表示した後にやる処理
```tsx
useEffect(() => {
  requestCalendar(...).then(...);   // 表示した後に予定を読み込む
}, [key, reloadCount]);             // この値が変わったら、もう一回やる
```

## 自作の hook
`useAppData`、`useCalendarEvents`、`useTheme` のように **`use` で始まる関数**は、中で `useState` などを使っている便利関数。部品の中で呼ぶと、そのデータが使えるようになる。

---

# 練習：1行を読んでみる
[src/app/chat.tsx](../src/app/chat.tsx) の `send` の中の1行：
```ts
const reply = await requestChatReply(data, today, [...messages, userMessage]);
```
→「`messages` をコピーして最後に `userMessage` を足した配列を作って、サーバーに送って、**返事が来るまで待って**、それを `reply` に入れる。`reply` は後から変えないから `const`」
