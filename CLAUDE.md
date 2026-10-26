# life-app

自分用の生活管理アプリ。目標・習慣・やること・日記・Googleカレンダーの予定をもとに、AIが今日やることを提案し、チャットで相談にも乗る。
ExpoのルールはAGENTS.mdを参照：@AGENTS.md

## 話し方
- 必ず日本語で、友達っぽいタメ口で話す。英語に切り替えない
- 本人は京大情報学科の2回生。C++/Pythonは触ったことがあるが、React Native / TypeScript / アプリ開発は初めて
- 文法の説明が要るときは docs/typescript-basics.md（本人用の文法メモ）を参照し、そこにない書き方が出てきたら追記する

## 今の目標（2026-11-01 のインターン面談）
- 京大発AIスタートアップのエンジニアインターンの面談に、このアプリを作品として持っていく
- ゴールは「Claude Codeと一緒に作った。設計の判断と、コードの中身は全部説明できる」と言える状態
- 進め方：
  1. 全体像を口で説明できるようにする
  2. 大事なファイル（src/lib/store.ts, src/lib/ai.ts, src/components/suggestion-card.tsx, server/src/index.ts）を一緒に読み、質問して理解を確かめる
  3. 次の機能（例：習慣の「連続◯日」表示）は本人が書く。Claudeはヒントとレビューだけにして、勝手に全部書かない
  4. 面談で聞かれそうな質問の練習
- 進捗（2026-10-26）：
  - 連続◯日（src/lib/streak.ts）は本人が仕様・設計・実装まで書いた
  - チャット・振り返り（★評価・やったこと）・カレンダーは、時間の都合で本人の希望によりClaudeが書いた。仕様と設計の判断は本人と一緒に決め、Claudeが解説した
  - カレンダー：Expo Goでは expo-calendar が使えず、TimeTreeは公式APIが終了していて予定を取り出せないため、自分の予定はGoogleカレンダーに移し、サーバーがiCal URLを読む形にした
  - 次は進め方の2：Claudeが書いた chat / calendar まわりを中心に一緒に読む
- その後の予定：「学習」（会話から分かったことをプロフィールとして覚えさせ、提案とチャットに使う）。面談で今後の計画として話す

## 構成
```
[iPhone: Expo Go] → [Cloudflare Workers: server/] → [Claude API]
 AsyncStorageに保存    合言葉をチェックし、       ↘
                      APIキーを付けてClaudeに送る  [Googleカレンダー: iCal形式の非公開URL]
```
- src/app/：画面（index=今日、calendar=月のカレンダー、chat=チャット、goals=目標、journal=記録）
- src/lib/store.ts：データの保存・更新（全体で1つのデータをAsyncStorageに保存し、useSyncExternalStoreで画面に配る）。会話は chats に日付ごとに文字だけ保存
- src/lib/ai.ts：サーバーとのやりとり。直近7日分の記録をまとめ、予定は「日付と時差」をサーバーに送って取ってもらう（サーバーはUTCで動くので、日付はアプリが決める）
- src/lib/streak.ts（連続◯日）、src/lib/review.ts（その日に完了したタスク・習慣）：保存せず毎回計算する
- src/hooks/use-calendar-events.ts：予定の読み込み（今日の画面とカレンダーの画面で共通）。予定は保存しない
- server/src/index.ts：POST /suggest（構造化出力 zod）、/chat（プロンプトキャッシュ）、/calendar。claude-opus-5-5、effort low、fallbacks: "default"
- server/src/calendar.ts：ical.js でiCalを読み、繰り返し予定も展開して指定日の分を返す
- サーバーのURL：https://life-app-server.keisuke-522.workers.dev
- .env（gitには上げない）：EXPO_PUBLIC_API_URL と EXPO_PUBLIC_APP_TOKEN
- サーバーの秘密情報：ANTHROPIC_API_KEY、APP_TOKEN、CALENDAR_ICS_URL（wrangler secret）。iCal URLは知っている人なら予定を全部見られるので、チャットやコードに書かない

## このPC特有の注意
- Windows / Macなし。iPhoneの実機確認は Expo Go で行う（同じWi-Fi、PCが起動している必要がある）
- PowerShellでは `npx` ではなく `npx.cmd` を使う
- Expoは必ず `life-app` で起動する（`server` の中で起動すると壊れる）
- Expoのログインは `npx.cmd expo login --no-browser`
- `wrangler secret put` に PowerShell からパイプで値を渡すと改行が混ざる。bashの `printf '%s'` で渡すか、対話入力で貼り付ける
- サーバーを本番に出す前のテストは `server` で `npx wrangler dev --remote`（本番の秘密情報を使って試せる）+ node の fetch
- `.expo/types/router.d.ts` が壊れて型チェックが落ちることがある（自動生成なので消せばExpoが作り直す）
- PowerShell 5.1 の Invoke-WebRequest はTLSで失敗する。HTTPのテストは node の fetch で行う
- 型チェック：`npx.cmd tsc --noEmit`（アプリ）、`server` で `npx.cmd tsc --noEmit`。lint：`npx.cmd expo lint`
- GitHub：keisuke-takemura-522/life-app（public）。main に直接コミットしている
