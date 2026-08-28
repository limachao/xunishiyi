/**
 * Cloudflare Turnstile 服务端校验（canonical siteverify）。
 *
 * 浏览器 → 你的后端（这里） → Cloudflare siteverify
 * 绝不在浏览器端直接调用 siteverify。
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResult {
  ok: boolean;
  /** 校验失败时给用户看的提示 */
  message?: string;
}

export async function verifyTurnstileToken(
  token: unknown,
  expectedAction: string,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET;

  // 未配置 secret 时降级跳过（本地开发友好）。
  // 生产环境务必在 Vercel 配置 TURNSTILE_SECRET，否则人机验证形同虚设。
  if (!secret || secret.trim().length === 0) {
    console.warn('[Turnstile] TURNSTILE_SECRET 未配置，跳过人机验证');
    return { ok: true };
  }

  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) {
    return { ok: false, message: '人机验证未完成，请刷新页面重试。' };
  }

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });
    if (!res.ok) {
      console.error('[Turnstile] siteverify HTTP error:', res.status);
      return { ok: false, message: '人机验证服务暂时不可用，请稍后重试。' };
    }
    const result = (await res.json()) as {
      success: boolean;
      action?: string;
      hostname?: string;
      'error-codes'?: string[];
    };
    if (!result.success) {
      console.warn('[Turnstile] siteverify failed:', result['error-codes'] ?? []);
      return { ok: false, message: '人机验证未通过，请刷新页面重试。' };
    }
    if (result.action && result.action !== expectedAction) {
      console.warn(`[Turnstile] action mismatch: got=${result.action}, expected=${expectedAction}`);
      return { ok: false, message: '人机验证未通过，请刷新页面重试。' };
    }
    return { ok: true };
  } catch (e) {
    console.error('[Turnstile] siteverify request failed:', e);
    return { ok: false, message: '人机验证服务暂时不可用，请稍后重试。' };
  }
}
