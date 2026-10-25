import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type GoalHorizon = 'life' | 'year' | 'month';

export type Goal = { id: string; text: string; horizon: GoalHorizon; createdAt: string };
export type Habit = { id: string; name: string; createdAt: string };
export type Task = { id: string; text: string; done: boolean; createdAt: string; doneAt?: string };
export type JournalEntry = { date: string; mood: number | null; note: string; updatedAt: string };
export type DailySuggestion = {
  message: string;
  suggestions: { title: string; reason: string }[];
  createdAt: string;
};

export type AppData = {
  goals: Goal[];
  habits: Habit[];
  /** 日付(YYYY-MM-DD) → その日に達成した習慣のid */
  habitLog: Record<string, string[]>;
  tasks: Task[];
  /** 日付(YYYY-MM-DD) → その日の記録 */
  journal: Record<string, JournalEntry>;
  /** 日付(YYYY-MM-DD) → その日にAIからもらった提案 */
  suggestions: Record<string, DailySuggestion>;
};

const STORAGE_KEY = 'life-app/data/v1';

const emptyData: AppData = {
  goals: [],
  habits: [],
  habitLog: {},
  tasks: [],
  journal: {},
  suggestions: {},
};

type Snapshot = { ready: boolean; data: AppData };

// アプリ全体で1つのデータを持ち、変更があったら購読している画面に知らせる
let snapshot: Snapshot = { ready: false, data: emptyData };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

AsyncStorage.getItem(STORAGE_KEY)
  .then((raw) => {
    const saved: Partial<AppData> = raw ? JSON.parse(raw) : {};
    snapshot = { ready: true, data: { ...emptyData, ...saved } };
  })
  .catch((e) => {
    console.warn('データの読み込みに失敗', e);
    snapshot = { ready: true, data: emptyData };
  })
  .finally(emit);

function update(fn: (data: AppData) => AppData) {
  // 読み込み前に書き込むと保存済みデータを上書きしてしまうので無視する
  if (!snapshot.ready) return;
  snapshot = { ...snapshot, data: fn(snapshot.data) };
  emit();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.data)).catch((e) =>
    console.warn('データの保存に失敗', e),
  );
}

export function useAppData() {
  return useSyncExternalStore(subscribe, () => snapshot);
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function now() {
  return new Date().toISOString();
}

// --- 目標 ---

export function addGoal(text: string, horizon: GoalHorizon) {
  update((d) => ({ ...d, goals: [...d.goals, { id: newId(), text, horizon, createdAt: now() }] }));
}

export function removeGoal(id: string) {
  update((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
}

// --- 習慣 ---

export function addHabit(name: string) {
  update((d) => ({ ...d, habits: [...d.habits, { id: newId(), name, createdAt: now() }] }));
}

export function removeHabit(id: string) {
  update((d) => ({ ...d, habits: d.habits.filter((h) => h.id !== id) }));
}

export function toggleHabit(date: string, habitId: string) {
  update((d) => {
    const done = d.habitLog[date] ?? [];
    const next = done.includes(habitId) ? done.filter((id) => id !== habitId) : [...done, habitId];
    return { ...d, habitLog: { ...d.habitLog, [date]: next } };
  });
}

// --- タスク ---

export function addTask(text: string) {
  update((d) => ({
    ...d,
    tasks: [...d.tasks, { id: newId(), text, done: false, createdAt: now() }],
  }));
}

export function toggleTask(id: string) {
  update((d) => ({
    ...d,
    tasks: d.tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done, doneAt: t.done ? undefined : now() } : t,
    ),
  }));
}

export function removeTask(id: string) {
  update((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
}

// --- 記録 ---

export function saveJournal(date: string, mood: number | null, note: string) {
  update((d) => ({
    ...d,
    journal: { ...d.journal, [date]: { date, mood, note, updatedAt: now() } },
  }));
}

// --- AIの提案 ---

export function saveSuggestion(date: string, suggestion: Omit<DailySuggestion, 'createdAt'>) {
  update((d) => ({
    ...d,
    suggestions: { ...d.suggestions, [date]: { ...suggestion, createdAt: now() } },
  }));
}
