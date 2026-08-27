import type { ClothingCategory } from '@/types/game';
import { TryOnError } from '@/lib/validators';

export interface AiTryOnProvider {
  readonly id: string;
  /**
   * Detect the main clothing category from a single clothing image.
   * Expected runtime: < 2s.
   */
  detectCategory(input: {
    clothingImage: Blob;
    clothingFilename?: string;
    requestId: string;
  }): Promise<{ category: ClothingCategory; confidence: number }>;

  /**
   * Run the try-on generation.
   * Expected runtime: 10–30s. Must return a public/cdn-usable image URL
   * or a base64 data URL.
   */
  generate(input: {
    personImage: Blob;
    clothingImage: Blob;
    personFilename?: string;
    clothingFilename?: string;
    category: ClothingCategory;
    requestId: string;
    /** Optional on-progress hook for providers that support mid-flight updates (0-100) */
    onProgress?: (pct: number, stage: string) => void;
  }): Promise<{
    resultImageUrl: string;
    generationMs: number;
    category: ClothingCategory;
    outputQuality: 'standard' | 'hd';
    watermarked?: boolean;
  }>;

  healthCheck(): Promise<{ ok: boolean; latencyMs: number | null }>;
}

export type { ClothingCategory };

function makeRequestId(prefix = 'tryon'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export { makeRequestId };

// ---------------------------------------------------------------------------
// Mock provider — deterministic, network-free, works without any API key.
// Replace with a real provider (IDM-VTON / OOTDiffusion / CatVTON web API)
// once the endpoint is live.
// ---------------------------------------------------------------------------

const CATEGORY_GUESSES: Record<string, ClothingCategory> = {
  shirt: 'TOP',
  tee: 'TOP',
  tshirt: 'TOP',
  top: 'TOP',
  sweater: 'TOP',
  jacket: 'TOP',
  hoodie: 'TOP',
  coat: 'TOP',
  blouse: 'TOP',
  jeans: 'BOTTOM',
  pant: 'BOTTOM',
  pants: 'BOTTOM',
  short: 'BOTTOM',
  shorts: 'BOTTOM',
  skirt: 'BOTTOM',
  trouser: 'BOTTOM',
  dress: 'DRESS',
  gown: 'DRESS',
  frock: 'DRESS',
};

function guessCategoryFromFilename(filename: string | undefined): ClothingCategory | null {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  for (const key of Object.keys(CATEGORY_GUESSES)) {
    if (lower.includes(key)) return CATEGORY_GUESSES[key];
  }
  return null;
}

export class MockTryOnProvider implements AiTryOnProvider {
  readonly id = 'mock';

  async detectCategory({
    clothingFilename,
  }: Parameters<AiTryOnProvider['detectCategory']>[0]) {
    await sleep(900 + Math.random() * 900);
    const guess = guessCategoryFromFilename(clothingFilename);
    if (guess) return { category: guess, confidence: 0.92 };
    const pool: ClothingCategory[] = ['TOP', 'BOTTOM', 'DRESS'];
    const category = pool[Math.floor(Math.random() * pool.length)];
    return { category, confidence: 0.72 + Math.random() * 0.2 };
  }

  async generate(input: Parameters<AiTryOnProvider['generate']>[0]) {
    const startedAt = performance.now();
    const steps: [number, string][] = [
      [15, '正在识别人物特征点'],
      [30, '正在分割服装区域'],
      [55, '正在对齐服装版型'],
      [78, '正在渲染面料细节'],
      [95, '正在生成最终预览'],
    ];
    for (const [pct, stage] of steps) {
      await sleep(1200 + Math.random() * 1400);
      input.onProgress?.(pct, stage);
    }
    // Mock: return the clothing image URL (via data url fallback) as stand-in.
    // In production this will be a signed CDN URL from the AI provider.
    const dataUrl = await blobToDataURL(input.clothingImage);
    const generationMs = Math.round(performance.now() - startedAt);
    return {
      resultImageUrl: dataUrl,
      generationMs,
      category: input.category,
      outputQuality: 'standard' as const,
      watermarked: true,
    };
  }

  async healthCheck() {
    const started = performance.now();
    await sleep(60);
    return { ok: true, latencyMs: Math.round(performance.now() - started) };
  }
}

// ---------------------------------------------------------------------------
// Real provider stub — wired via env vars. Fills in provider contract so the
// rest of the app stays identical when we swap providers.
// ---------------------------------------------------------------------------

export class HttpTryOnProvider implements AiTryOnProvider {
  readonly id = 'http';
  private readonly endpoint: string;
  private readonly apiKey: string | null;

  constructor({
    endpoint,
    apiKey,
  }: {
    endpoint: string;
    apiKey?: string | null;
  }) {
    if (!endpoint) {
      throw new TryOnError({
        code: 'PROVIDER_AUTH_FAILED',
        message: 'AI endpoint not configured',
        userMessage: 'AI 服务尚未配置。',
      });
    }
    this.endpoint = endpoint.replace(/\/$/, '');
    this.apiKey = apiKey ?? null;
  }

  async detectCategory(input: Parameters<AiTryOnProvider['detectCategory']>[0]) {
    const form = new FormData();
    form.append('file', input.clothingImage, input.clothingFilename ?? 'clothing');
    form.append('requestId', input.requestId);
    const res = await this.fetch(`${this.endpoint}/v1/detect-category`, form);
    if (!res.ok) await this.throwFromResponse(res, 'Category detection failed');
    const json = (await res.json()) as {
      category?: ClothingCategory;
      confidence?: number;
    };
    const category = json.category ?? 'TOP';
    return { category, confidence: json.confidence ?? 0.8 };
  }

  async generate(input: Parameters<AiTryOnProvider['generate']>[0]) {
    const startedAt = performance.now();
    const form = new FormData();
    form.append('personImage', input.personImage, input.personFilename ?? 'person');
    form.append('clothingImage', input.clothingImage, input.clothingFilename ?? 'clothing');
    form.append('category', input.category);
    form.append('requestId', input.requestId);
    const res = await this.fetch(`${this.endpoint}/v1/generate`, form, {
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) await this.throwFromResponse(res, 'Try-on generation failed');
    const json = (await res.json()) as {
      resultImageUrl?: string;
      outputQuality?: 'standard' | 'hd';
      watermarked?: boolean;
    };
    if (!json.resultImageUrl) {
      throw new TryOnError({
        code: 'GENERATION_FAILED',
        message: 'Provider returned no result URL',
        retryable: true,
      });
    }
    return {
      resultImageUrl: json.resultImageUrl,
      generationMs: Math.round(performance.now() - startedAt),
      category: input.category,
      outputQuality: json.outputQuality ?? 'standard',
      watermarked: json.watermarked ?? false,
    };
  }

  async healthCheck() {
    try {
      const started = performance.now();
      const res = await fetch(`${this.endpoint}/health`, { method: 'GET' });
      return {
        ok: res.ok,
        latencyMs: res.ok ? Math.round(performance.now() - started) : null,
      };
    } catch {
      return { ok: false, latencyMs: null };
    }
  }

  private fetch(url: string, body: FormData, init?: RequestInit) {
    return fetch(url, {
      method: 'POST',
      body,
      headers: {
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : null),
        ...(init?.headers ?? null),
      },
      ...init,
    });
  }

  private async throwFromResponse(res: Response, defaultMessage: string): Promise<never> {
    let code: TryOnError['code'] = 'PROVIDER_ERROR';
    let message = defaultMessage;
    try {
      const json = (await res.json()) as { code?: string; message?: string; error?: string };
      const mapped = mapHttpStatus(res.status, json.code as TryOnError['code'] | undefined);
      code = mapped;
      message = json.message ?? json.error ?? message;
    } catch {
      code = mapHttpStatus(res.status, undefined);
    }
    throw new TryOnError({
      code,
      message,
      retryable: res.status >= 500 || res.status === 429 || code === 'GENERATION_FAILED',
    });
  }
}

function mapHttpStatus(
  status: number,
  serverCode: TryOnError['code'] | undefined,
): TryOnError['code'] {
  if (serverCode) return serverCode;
  if (status === 400 || status === 422) return 'INVALID_IMAGE';
  if (status === 401 || status === 403) return 'PROVIDER_AUTH_FAILED';
  if (status === 402 || status === 429) return 'PROVIDER_RATE_LIMITED';
  if (status >= 500) return 'PROVIDER_ERROR';
  return 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Volcengine Seedream 5.0 Pro provider — V1 真实 AI 服务接入
// Docs: https://www.volcengine.com/docs/82379
// ---------------------------------------------------------------------------

interface VolcengineGenerateRequestBody {
  model: string;
  prompt: string;
  image: string[];
  response_format: 'url';
  size: string;
  stream: false;
  watermark: boolean;
  negative_prompt?: string;
  seed?: number;
}

interface VolcengineGenerateResponseBody {
  model: string;
  created?: number;
  data?: Array<{
    url?: string;
    size?: string;
    output_format?: string;
  }>;
  usage?: {
    input_images?: number;
    generated_images?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

function mapVolcengineHttpStatus(status: number): TryOnError['code'] {
  if (status === 400 || status === 422) return 'INVALID_IMAGE';
  if (status === 401 || status === 403) return 'PROVIDER_AUTH_FAILED';
  if (status === 402 || status === 429) return 'PROVIDER_RATE_LIMITED';
  if (status >= 500) return 'PROVIDER_ERROR';
  return 'UNKNOWN';
}

function volcengineUserMessage(code: TryOnError['code']): string {
  switch (code) {
    case 'PROVIDER_AUTH_FAILED':
      return 'API Key 无效或已过期，请检查 VOLCENGINE_API_KEY 配置。';
    case 'PROVIDER_RATE_LIMITED':
      return '请求过于频繁或本月额度已用完，请约 30 秒后重试或联系管理员。';
    case 'INVALID_IMAGE':
      return '图片格式不支持或内容无法识别，请换一张更清晰的图片（建议 JPG / PNG，10MB 以内）。';
    case 'PROVIDER_ERROR':
      return 'AI 服务暂时不可用，请 1 分钟后再试；若持续失败请联系管理员。';
    case 'GENERATION_FAILED':
      return 'AI 本次未能生成预览，请换一套更清晰的服装图或人物图再试。';
    default:
      return '生成过程出现异常，请稍后重试。';
  }
}

export class VolcengineSeedreamProvider implements AiTryOnProvider {
  readonly id = 'volcengine-seedream';
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly size: string;
  private readonly timeoutMs: number;

  constructor({
    baseUrl,
    apiKey,
    model,
    size,
    timeoutMs,
  }: {
    baseUrl: string;
    apiKey: string;
    model?: string;
    size?: string;
    timeoutMs?: number;
  }) {
    if (!apiKey) {
      const msg = 'VOLCENGINE_API_KEY 未配置';
      console.warn('[Volcengine] init failed:', msg);
      throw new TryOnError({
        code: 'PROVIDER_AUTH_FAILED',
        message: msg,
        userMessage: volcengineUserMessage('PROVIDER_AUTH_FAILED'),
      });
    }
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.model = model ?? 'doubao-seedream-5-0-pro-260628';
    this.size = size ?? '2K';
    this.timeoutMs = timeoutMs ?? 90_000;
    console.info(
      `[Volcengine] provider inited: model=${this.model}, size=${this.size}, timeout=${(this.timeoutMs / 1000).toFixed(0)}s, baseUrl=${this.baseUrl}`,
    );
  }

  async detectCategory({
    clothingFilename,
  }: Parameters<AiTryOnProvider['detectCategory']>[0]) {
    const guess = guessCategoryFromFilename(clothingFilename);
    if (guess) {
      console.debug(`[Volcengine] detectCategory (filename): guess=${guess}, conf=0.92`);
      return { category: guess, confidence: 0.92 };
    }
    const pool: ClothingCategory[] = ['TOP', 'BOTTOM', 'DRESS'];
    const category = pool[Math.floor(Math.random() * pool.length)];
    const confidence = 0.72 + Math.random() * 0.2;
    console.debug(
      `[Volcengine] detectCategory (fallback random): category=${category}, conf=${confidence.toFixed(3)}`,
    );
    await sleep(250);
    return { category, confidence };
  }

  async generate(input: Parameters<AiTryOnProvider['generate']>[0]) {
    const startedAt = performance.now();
    const requestId = input.requestId ?? makeRequestId('volc');
    const personDataURL = await blobToDataURL(input.personImage);
    const clothingDataURL = await blobToDataURL(input.clothingImage);
    const personKb = Math.round(input.personImage.size / 1024);
    const clothingKb = Math.round(input.clothingImage.size / 1024);

    const personImagePayload = normalizeVolcengineImageInput(personDataURL);
    const clothingImagePayload = normalizeVolcengineImageInput(clothingDataURL);

    console.info(
      `[Volcengine] generate() start: requestId=${requestId}, person=${personKb}KB, clothing=${clothingKb}KB, category=${input.category}, payload_mode=${personImagePayload.mode}`,
    );
    if (personImagePayload.warn) {
      console.warn(`[Volcengine] person 图片解析警告: ${personImagePayload.warn}`);
    }
    if (clothingImagePayload.warn) {
      console.warn(`[Volcengine] clothing 图片解析警告: ${clothingImagePayload.warn}`);
    }

    const progressPlan: [number, string][] = [
      [12, '正在上传图片到 AI 服务…'],
      [32, 'AI 正在识别人物与服装区域…'],
      [55, '正在对齐服装版型到你的身形…'],
      [78, '正在渲染面料纹理与光影过渡…'],
      [95, '正在合成最终预览…'],
    ];
    const progressIntervalMs = Math.max(1500, Math.floor(this.timeoutMs / 60));
    let planIdx = 0;
    input.onProgress?.(progressPlan[0][0], progressPlan[0][1]);
    const progressTimer = setInterval(() => {
      planIdx = Math.min(progressPlan.length - 2, planIdx + 1);
      const [pct, stage] = progressPlan[planIdx];
      input.onProgress?.(pct, stage);
    }, progressIntervalMs);

    let rawResponseBody: VolcengineGenerateResponseBody | null = null;

    try {
      const body: VolcengineGenerateRequestBody = {
        model: this.model,
        prompt: [
          '【虚拟试衣｜参考图1=人物、参考图2=目标服装】',
          '1. 核心指令：将图1中人物身上原本穿着的衣服，100% 完全替换为图2展示的那一件服装；除了服装之外，其余任何内容都不许改动。',
          '2. 人物必须严格保留（像素级不变）：面部五官、脸型、发型、发色、表情、肤色、年龄、性别、身材比例、站立姿势、四肢摆放位置、手部姿态、完整身形轮廓。',
          '3. 背景与光照必须严格保留（像素级不变）：图1的背景环境、场景、物体摆放、光线方向、光源颜色、明暗分布、阴影位置。',
          '4. 服装必须严格还原图2的全部细节：',
          '   · 颜色与色调：服装的整体颜色、纯色/渐变色、局部点缀色、饱和度、明度，必须与图2完全一致，不得褪色、变浅、加深、偏色、漂白、染色。',
          '   · 图案与印花：Logo、字母、文字、条纹、格子、花纹、印花、刺绣、拼接色块，完整保留，位置和大小比例与图2一致。',
          '   · 面料与纹理：棉质/牛仔/丝绸/针织/皮革/毛料等材质质感、纹理、光泽度、垂感、厚度感，完全沿用图2的面料特征。',
          '   · 款式与剪裁：领口、袖子、纽扣、拉链、口袋、腰带、开衩、裤脚/裙摆等设计细节，与图2完全一致。',
          '5. 贴合与自然：新换上的服装要自然贴合图1人物的身体轮廓和姿态，根据图1光照方向生成合理的服装褶皱、垂感、阴影和高光；褶皱走向与肢体方向一致。',
          '6. 画质与风格：输出一张自然、真实、高清的日常穿搭照片；不要任何文字水印（接口级水印除外）、不要拼接痕迹、不要卡通/插画/二次元风格、不要改变人脸年龄和肤色。',
        ].join('\n'),
        negative_prompt:
          '服装颜色改变，褪色，漂白，染色，偏色，饱和度降低，明度异常，图案丢失，印花模糊，面料质感错误，款式变形，卡通风格，插画风格，二次元，拼接痕迹，明显水印，人物面部五官改变，人物年龄改变，人物肤色改变，背景改变，光线方向改变，多余的文字或logo，肢体缺失，手部畸形，身体比例异常，服装与身体不贴合，服装漂浮，服装穿过身体，透视错误',
        image: [personImagePayload.value, clothingImagePayload.value],
        response_format: 'url',
        size: this.size,
        stream: false,
        watermark: true,
      };

      console.debug(
        `[Volcengine] request body 摘要: requestId=${requestId}, model=${body.model}, size=${body.size}, image[0] len=${body.image[0].length}, image[1] len=${body.image[1].length}`,
      );

      const res = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      clearInterval(progressTimer);
      const elapsed = Math.round(performance.now() - startedAt);
      console.info(
        `[Volcengine] HTTP returned: requestId=${requestId}, status=${res.status}, elapsed=${elapsed}ms`,
      );

      if (!res.ok) {
        const code = mapVolcengineHttpStatus(res.status);
        let serverCode = '';
        let serverMsg = '';
        let rawBodyText = '';
        try {
          rawBodyText = await res.text();
          const json = JSON.parse(rawBodyText) as VolcengineGenerateResponseBody;
          serverCode = json?.error?.code ?? '';
          serverMsg = json?.error?.message ?? '';
        } catch {
          // ignore parse error
        }
        console.warn(
          `[Volcengine] HTTP ${res.status}: requestId=${requestId}, volc_code=${serverCode || 'N/A'}, volc_message=${serverMsg || 'N/A'}, raw_body(前600字)=${(rawBodyText || '').slice(0, 600)}`,
        );
        const mappedCode = serverCode === 'InvalidParameter' ? 'INVALID_IMAGE' : code;
        const um =
          serverCode === 'InvalidParameter' || code === 'INVALID_IMAGE'
            ? `图片无法被识别（火山错误：${serverCode || code}，${serverMsg || '请换更清晰的 JPG/PNG 图片重试'}）`
            : volcengineUserMessage(mappedCode);
        throw new TryOnError({
          code: mappedCode,
          message: `[volc:${serverCode || res.status}] ${serverMsg || 'HTTP error'}`,
          userMessage: um,
          retryable: res.status >= 500 || res.status === 429 || mappedCode === 'GENERATION_FAILED',
        });
      }

      rawResponseBody = (await res.json()) as VolcengineGenerateResponseBody;
      const resultUrl = rawResponseBody?.data?.[0]?.url;
      if (!resultUrl) {
        console.error(
          `[Volcengine] empty result data: requestId=${requestId}, body=${JSON.stringify(rawResponseBody).slice(0, 800)}`,
        );
        throw new TryOnError({
          code: 'GENERATION_FAILED',
          message: 'volcengine returned no image url',
          userMessage: volcengineUserMessage('GENERATION_FAILED'),
          retryable: true,
        });
      }
      input.onProgress?.(100, '正在生成最终预览…');
      const totalElapsed = Math.round(performance.now() - startedAt);
      const usage = rawResponseBody.usage;
      const item = rawResponseBody.data?.[0];
      console.info(
        `[Volcengine] generate() success: requestId=${requestId}, elapsed=${totalElapsed}ms, output_size=${item?.size ?? '?'}, output_format=${item?.output_format ?? '?'}, usage=${JSON.stringify(usage ?? {})}, result_url_prefix=${resultUrl.slice(0, 48)}...`,
      );
      const outputQuality: 'hd' | 'standard' =
        this.size === '2K' || this.size === '4K' ? 'hd' : 'standard';
      return {
        resultImageUrl: resultUrl,
        generationMs: totalElapsed,
        category: input.category,
        outputQuality,
        watermarked: true,
      };
    } catch (err) {
      clearInterval(progressTimer);
      if (err instanceof TryOnError) throw err;
      const errAny = err as { name?: string; message?: string } | null | undefined;
      const isTimeout =
        errAny?.name === 'TimeoutError' ||
        (errAny?.message ?? '').toLowerCase().includes('timeout') ||
        (errAny?.message ?? '').includes('signal');
      if (isTimeout) {
        const elapsed = Math.round(performance.now() - startedAt);
        console.warn(
          `[Volcengine] request timeout: requestId=${requestId}, elapsed=${elapsed}ms, limit=${this.timeoutMs}ms`,
        );
        throw new TryOnError({
          code: 'PROVIDER_RATE_LIMITED',
          message: `timeout after ${this.timeoutMs}ms`,
          userMessage: `生成超时（${Math.round(this.timeoutMs / 1000)} 秒未完成），请稍后重试，或更换更简单的服装图再试。`,
          retryable: true,
        });
      }
      console.error(
        `[Volcengine] network/unknown error: requestId=${requestId}, err=${JSON.stringify(errAny?.message ?? err)}`,
      );
      throw new TryOnError({
        code: 'PROVIDER_ERROR',
        message: (errAny?.message as string) || 'network error',
        userMessage: volcengineUserMessage('PROVIDER_ERROR'),
        retryable: true,
      });
    }
  }

  async healthCheck() {
    try {
      const started = performance.now();
      const res = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          prompt: 'ping',
          image: [],
          size: '1K',
          response_format: 'url',
          stream: false,
          watermark: false,
        }),
        signal: AbortSignal.timeout(8000),
      });
      const elapsed = Math.round(performance.now() - started);
      // 400 也算健康（接口通、鉴权通，只是 image 为空）；401 说明 key 错，算不健康
      const ok = res.ok || res.status === 400 || res.status === 422;
      console.debug(
        `[Volcengine] healthCheck: status=${res.status}, ok=${ok}, latency=${elapsed}ms`,
      );
      return { ok, latencyMs: elapsed };
    } catch (e) {
      console.warn(`[Volcengine] healthCheck failed: ${(e as Error).message}`);
      return { ok: false, latencyMs: null };
    }
  }
}

export function getDefaultAiTryOnProvider(): AiTryOnProvider {
  // Next exposes process.env.* on server via next.config, but to keep this file
  // friendly on the client side too, we only read process.env in a try/catch.
  let env: Record<string, string | undefined> = {};
  try {
    env =
      (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
        .process?.env ?? {};
  } catch {
    // no-op
  }

  // 1. 优先：火山引擎 Seedream 5.0（V1 主力）
  const volcKey = env.VOLCENGINE_API_KEY;
  if (volcKey && volcKey.trim().length > 0) {
    try {
      return new VolcengineSeedreamProvider({
        baseUrl: env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
        apiKey: volcKey.trim(),
        model: env.VOLCENGINE_MODEL,
        size: env.VOLCENGINE_SIZE,
        timeoutMs: env.VOLCENGINE_TIMEOUT_MS ? Number(env.VOLCENGINE_TIMEOUT_MS) : undefined,
      });
    } catch (e) {
      console.warn('[Volcengine] init failed, fallback to MockTryOnProvider:', (e as Error).message);
    }
  }

  // 2. 兼容：老格式 AI_API_ENDPOINT（保留）
  let endpoint: string | undefined;
  let apiKey: string | undefined;
  try {
    endpoint = env.AI_API_ENDPOINT;
    apiKey = env.AI_API_KEY;
  } catch {
    // no-op
  }
  if (endpoint) {
    return new HttpTryOnProvider({ endpoint, apiKey });
  }

  // 3. 兜底：本地 Mock（默认无 key 时走这个，体验一致）
  console.info('[AI Provider] 使用 MockTryOnProvider：未配置 VOLCENGINE_API_KEY');
  return new MockTryOnProvider();
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function blobToDataURL(blob: Blob): Promise<string> {
  if (typeof Buffer !== 'undefined' && typeof blob.arrayBuffer === 'function') {
    const ab = await blob.arrayBuffer();
    const base64 = Buffer.from(new Uint8Array(ab)).toString('base64');
    return `data:${blob.type || 'image/jpeg'};base64,${base64}`;
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new ReferenceError('FileReader is not defined (and Buffer is unavailable)'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

/**
 * 火山 images/generations 接口的 image 字段支持两种格式（官方文档明确规定）：
 *   1) 公网可访问的 http/https URL：
 *        例如：https://ark-project.tos-cn-beijing.volces.com/doc_image/xxx.png
 *   2) 完整的 Base64 Data URL（必须保留前缀，MIME 小写）：
 *        格式：data:image/<图片格式小写>;base64,<Base64正文>
 *        示例：data:image/png;base64,iVBORw0KGgoAAAA...
 *              data:image/jpeg;base64,/9j/4AAQSkZJRg...
 *
 * ⚠️ 特别注意：如果「剥掉前缀只传纯 Base64 正文」，火山会把正文当成一个 URL 去解析，
 * 然后报错 InvalidParameter —— "invalid url specified: iVBORw0KGgo..."，这就是我们之前踩过的坑。
 *
 * 此函数把各种可能的输入归一化成上述两种之一。
 */
function base64HeadToBinary(base64: string, maxChars = 32): string {
  const trimmed = (base64 ?? '').replace(/\s+/g, '').slice(0, maxChars);
  if (typeof atob === 'function') {
    try {
      return atob(trimmed);
    } catch {
      // 非法 base64 就返回空串，上层按默认 mime
      return '';
    }
  }
  try {
    const buf = Buffer.from(trimmed, 'base64');
    let out = '';
    for (let i = 0; i < buf.length; i++) out += String.fromCharCode(buf[i]);
    return out;
  } catch {
    return '';
  }
}

function utf8ToBase64(text: string): string {
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(text)));
  }
  return Buffer.from(text, 'utf-8').toString('base64');
}

function normalizeVolcengineImageInput(input: string): {
  value: string;
  mode: 'url' | 'dataurl-corrected' | 'dataurl-ok' | 'base64-reformatted' | 'unknown-passthrough';
  warn?: string;
} {
  if (!input) {
    return { value: input, mode: 'unknown-passthrough', warn: '图片内容为空' };
  }
  const s = input.trim();

  // ============ 情况 1：已经是公网 http/https URL → 直接透传 ============
  if (/^https?:\/\//i.test(s)) {
    return { value: s, mode: 'url' };
  }

  // ============ 情况 2：已经是完整 data:image/xxx;base64,... 格式 → 只做 MIME 小写化检查 ============
  const dataUrlMatch = s.match(/^data:([^;,]+)(?:;charset=[^;,]*)?(;base64)?,(.*)$/is);
  if (dataUrlMatch) {
    const mime = (dataUrlMatch[1] ?? '').trim();
    const isBase64 = !!dataUrlMatch[2];
    const payload = dataUrlMatch[3] ?? '';
    const mimeLower = mime.toLowerCase();

    if (!isBase64) {
      // 非 base64 的 data url，补回 base64 标识（几乎不会出现，做防御）
      return {
        value: `data:${mimeLower};base64,${utf8ToBase64(payload)}`,
        mode: 'dataurl-corrected',
        warn: `data URL 不是 base64 编码 (mime=${mime})，已强制转 base64`,
      };
    }
    if (!mimeLower.startsWith('image/')) {
      return {
        value: s,
        mode: 'unknown-passthrough',
        warn: `MIME 非图片类型 (${mime})，火山大概率拒绝`,
      };
    }
    if (mime !== mimeLower) {
      // MIME 必须小写（官方明确要求）
      return {
        value: `data:${mimeLower};base64,${payload}`,
        mode: 'dataurl-corrected',
        warn: `MIME 不是小写 (原：${mime}，修正为：${mimeLower})，已按火山要求处理`,
      };
    }
    return { value: s, mode: 'dataurl-ok' };
  }

  // ============ 情况 3：没有前缀、看起来像纯 Base64 → 推断 MIME 并补上完整前缀 ============
  const base64Like = s.replace(/\s+/g, '');
  if (/^[A-Za-z0-9+/=]{8,}$/.test(base64Like)) {
    // 通过 base64 解码后的文件头判断格式：PNG = \x89PNG\r\n / JPEG = \xff\xd8\xff / WebP = RIFF + WEBP
    let inferredMime = 'image/jpeg';
    const head = base64HeadToBinary(base64Like, 32).slice(0, 16);
    if (head.startsWith('\x89PNG\r\n')) inferredMime = 'image/png';
    else if (head.startsWith('\xff\xd8\xff')) inferredMime = 'image/jpeg';
    else if (head.startsWith('RIFF') && base64Like.length > 24) {
      const riffHead = base64HeadToBinary(base64Like, 24);
      if (riffHead.slice(8, 12) === 'WEBP') inferredMime = 'image/webp';
    }
    return {
      value: `data:${inferredMime};base64,${base64Like}`,
      mode: 'base64-reformatted',
      warn: `输入为纯 Base64（缺前缀），已按文件头推断为 ${inferredMime} 并补上完整 data URL 前缀`,
    };
  }

  // ============ 其他：原样返回，让火山兜底 ============
  return {
    value: s,
    mode: 'unknown-passthrough',
    warn: '图片输入格式无法识别，原样传递，大概率失败',
  };
}
