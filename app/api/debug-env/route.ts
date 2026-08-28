import { NextResponse } from 'next/server';

export function GET() {
  const key = process.env.VOLCENGINE_API_KEY ?? '';
  const model = process.env.VOLCENGINE_MODEL ?? '';
  const baseUrl = process.env.VOLCENGINE_BASE_URL ?? '';
  const size = process.env.VOLCENGINE_SIZE ?? '';
  const tsSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
  const tsSecret = process.env.TURNSTILE_SECRET ?? '';

  return NextResponse.json({
    volcengine_api_key_set: key.trim().length > 0,
    volcengine_api_key_length: key.trim().length,
    model: model || '(未设置)',
    base_url: baseUrl || '(未设置)',
    size: size || '(未设置)',
    turnstile_site_key_set: tsSiteKey.trim().length > 0,
    turnstile_secret_set: tsSecret.trim().length > 0,
    node_env: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  });
}