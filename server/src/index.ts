import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

type Env = {
  ANTHROPIC_API_KEY: string;
  APP_TOKEN: string;
};

const MODEL = 'claude-opus-5-5';

const SuggestionSchema = z.object({
  message: z.string().describe('今日のひとこと。1〜2文'),
  suggestions: z
    .array(
      z.object({
        title: z.string().describe('今日やること。短く具体的に'),
        reason: z.string().describe('なぜそれをやるのか。記録を根拠に1文で'),
      }),
    )
    .describe('今日やること。ちょうど3つ'),
});

const SYSTEM_PROMPT = `あなたはユーザーの生活を一緒に整える相棒。友達のようなタメ口で、率直に話す。

ユーザーの記録（目標、習慣と直近の達成状況、やることリスト、日記）を受け取り、今日やることを3つ提案する。

- 3つとも今日中に終わる、具体的な行動にする（「英語を頑張る」ではなく「単語アプリを15分」）
- 今月・今年の目標につながるものを優先する
- 達成率が落ちている習慣があれば、立て直す小さな一歩を入れる
- 直近の気分が低い日が続いていたら、負荷を下げた提案にする
- 続いていること・できていることがあれば message で先に触れる
- 記録に書かれていないことを決めつけない`;

const ChatRequestSchema = z.object({
  context: z.unknown(),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1) }))
    .min(1)
    .max(200),
});

const CHAT_SYSTEM_PROMPT = `あなたはユーザーの生活を一緒に整える相棒。友達のようなタメ口で、率直に話す。

ユーザーの記録（目標、習慣と直近の達成状況、やることリスト、日記）を知った上で、チャットで話し相手になる。

- スマホで読むので、返事は短く。ふだんは2〜4文、長くても10行まで
- 見出しや太字などのMarkdownは使わない。箇条書きが必要なときだけ「・」を使う
- 記録に関係があるときは、具体的に触れる（「今週は筋トレ4/7日続いてるね」など）
- 相談には、今日できる小さな一歩を一緒に考える
- 記録に書かれていないことを決めつけない。分からないことは聞き返す`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function suggest(client: Anthropic, context: unknown) {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // 安全フィルタで断られたとき、別のモデルで自動的にやり直す
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(SuggestionSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `ユーザーの記録:\n${JSON.stringify(context)}` }],
  });

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    return json({ error: 'AIが提案を作れなかった' }, 502);
  }
  return json(response.parsed_output);
}

async function chat(client: Anthropic, body: unknown) {
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'リクエストの形式が正しくない' }, 400);
  }
  const { context, messages } = parsed.data;
  if (messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') {
    return json({ error: '会話はユーザーの発言で始まり、ユーザーの発言で終わる必要がある' }, 400);
  }

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // 安全フィルタで断られたとき、別のモデルで自動的にやり直す
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    // 前回と同じ先頭部分（指示・記録・それまでの会話）を安く読めるようにキャッシュする
    cache_control: { type: 'ephemeral' },
    // キャッシュは先頭から同じ部分にしか効かないので、変わらないもの→たまに変わるもの→毎回増えるものの順に並べる
    system: [
      { type: 'text', text: CHAT_SYSTEM_PROMPT },
      { type: 'text', text: `ユーザーの記録:\n${JSON.stringify(context)}` },
    ],
    messages,
  });

  const reply = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
  if (response.stop_reason === 'refusal' || !reply) {
    return json({ error: 'AIが返事を作れなかった' }, 502);
  }
  return json({ reply });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'POST' || !['/suggest', '/chat'].includes(url.pathname)) {
      return json({ error: 'not found' }, 404);
    }
    // URLを知っている他人にAPI代を使われないよう、合言葉を確認する
    if (request.headers.get('Authorization') !== `Bearer ${env.APP_TOKEN}`) {
      return json({ error: 'unauthorized' }, 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'リクエストの形式が正しくない' }, 400);
    }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    try {
      return url.pathname === '/chat' ? await chat(client, body) : await suggest(client, body);
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) {
        return json({ error: 'APIキーが正しくない' }, 500);
      } else if (e instanceof Anthropic.RateLimitError) {
        return json({ error: '混み合っている。少し待ってからもう一回' }, 429);
      } else if (e instanceof Anthropic.APIError) {
        console.error('Claude API error', e.status, e.message);
        return json({ error: `Claude APIのエラー（${e.status}）` }, 502);
      }
      throw e;
    }
  },
};
