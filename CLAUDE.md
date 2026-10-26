# life-app

自分用の生活管理アプリ。目標・習慣・やること・日記を入力すると、AIが今日やることを提案する。
ExpoのルールはAGENTS.mdを参照：@AGENTS.md

## 話し方
- 必ず日本語で、友達っぽいタメ口で話す。英語に切り替えない
- 本人は京大情報学科の2回生。C++/Pythonは触ったことがあるが、React Native / TypeScript / アプリ開発は初めて

## 今の目標（2026-11-01 のインターン面談）
- 京大発AIスタートアップのエンジニアインターンの面談に、このアプリを作品として持っていく
- ゴールは「Claude Codeと一緒に作った。設計の判断と、コードの中身は全部説明できる」と言える状態
- 進め方：
  1. 全体像を口で説明できるようにする
  2. 大事なファイル（src/lib/store.ts, src/lib/ai.ts, src/components/suggestion-card.tsx, server/src/index.ts）を一緒に読み、質問して理解を確かめる
  3. 次の機能（例：習慣の「連続◯日」表示）は本人が書く。Claudeはヒントとレビューだけにして、勝手に全部書かない
  4. 面談で聞かれそうな質問の練習
- その後の予定：チャット機能と「学習」（会話から分かったことをプロフィールとして覚えさせ、提案に使う）

## 構成
```
[iPhone: Expo Go] → [Cloudflare Workers: server/] → [Claude API]
 AsyncStorageに保存    合言葉をチェックし、APIキーを付けてClaudeに送る
```
- src/app/：画面（index=今日、goals=目標、journal=記録）
- src/lib/store.ts：データの保存・更新（全体で1つのデータをAsyncStorageに保存し、useSyncExternalStoreで画面に配る）
- src/lib/ai.ts：直近7日分の記録をまとめてサーバーに送る
- server/src/index.ts：POST /suggest。claude-opus-5-5、effort low、構造化出力（zod）、fallbacks: "default"
- サーバーのURL：https://life-app-server.keisuke-522.workers.dev
- .env（gitには上げない）：EXPO_PUBLIC_API_URL と EXPO_PUBLIC_APP_TOKEN
- サーバーの秘密情報：ANTHROPIC_API_KEY と APP_TOKEN（wrangler secret）

## このPC特有の注意
- Windows / Macなし。iPhoneの実機確認は Expo Go で行う（同じWi-Fi、PCが起動している必要がある）
- PowerShellでは `npx` ではなく `npx.cmd` を使う
- Expoは必ず `life-app` で起動する（`server` の中で起動すると壊れる）
- Expoのログインは `npx.cmd expo login --no-browser`
- `wrangler secret put` に PowerShell からパイプで値を渡すと改行が混ざる。bashの `printf '%s'` で渡す
- PowerShell 5.1 の Invoke-WebRequest はTLSで失敗する。HTTPのテストは node の fetch で行う
- 型チェック：`npx.cmd tsc --noEmit`（アプリ）、`server` で `npx.cmd tsc --noEmit`。lint：`npx.cmd expo lint`
- GitHub：keisuke-takemura-522/life-app（public）。main に直接コミットしている
