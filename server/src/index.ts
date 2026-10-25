import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

type Env = {
  ANTHROPIC_API_KEY: string;
  APP_TOKEN: string;
};

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/suggest') {
      return json({ error: 'not found' }, 404);
    }
    // URLを知っている他人にAPI代を使われないよう、合言葉を確認する
    if (request.headers.get('Authorization') !== `Bearer ${env.APP_TOKEN}`) {
      return json({ error: 'unauthorized' }, 401);
    }

    let context: unknown;
    try {
      context = await request.json();
    } catch {
      return json({ error: 'リクエストの形式が正しくない' }, 400);
    }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    try {
      const response = await client.beta.messages.parse({
        model: 'claude-opus-5-5',
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
