import { NextResponse } from 'next/server';

/**
 * Turnstile 诊断接口（临时排查用）：
 * 用假 token 调用 siteverify，根据 Cloudflare 返回判断 Secret Key 配置是否正确。
 * 不返回也不会存储任何密钥，只返回状态码和错误码。
 */
export async function GET() {
  const secret = process.env.TURNSTILE_SECRET ?? '';

  if (!secret.trim()) {
    return NextResponse.json(
      { ok: false, step: 'env', message: 'TURNSTILE_SECRET 未配置' },
      { status: 200 },
    );
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret,
        response: 'XXXX.DUMMY.TOKEN.XXXX',
      }),
    });
    const bodyText = await res.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      parsed = bodyText.slice(0, 300);
    }
    return NextResponse.json(
      {
        ok: true,
        http_status: res.status,
        cloudflare_response: parsed,
        how_to_read: {
          'error-codes 含 invalid-input-secret': 'Secret Key 配错了，请重新复制',
          'error-codes 含 invalid-input-response 或 timeout-or-duplicate':
            'Secret Key 是正确的，接口连通正常',
          'http_status 不是 200': '网络被拦截，把 cloudflare_response 发给 AI 看',
        },
      },
      { status: 200 },
    );
  } catch (e) {
    const err = e as { name?: string; message?: string; cause?: unknown };
    return NextResponse.json(
      {
        ok: false,
        step: 'fetch',
        error_name: err?.name ?? 'unknown',
        error_message: err?.message ?? 'unknown',
        error_cause:
          err?.cause instanceof Error
            ? { name: err.cause.name, message: err.cause.message }
            : String(err?.cause ?? ''),
      },
      { status: 200 },
    );
  }
}
