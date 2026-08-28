'use server';

import {
  FILE_LIMITS,
  TryOnError,
  userMessageForCode,
  validateImageFile,
} from '@/lib/validators';
import {
  getDefaultAiTryOnProvider,
  makeRequestId,
} from '@/services/ai-try-on';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { getCurrentUser } from '@/lib/session';
import type { ClothingCategory, TryResult } from '@/types/game';
import type {
  ActionError,
  ActionResult,
  GenerateTryOnInput,
  GenerateTryOnOutput,
  ValidatedUpload,
} from '@/lib/try-on-types';

function toError(err: unknown): ActionError {
  if (err instanceof TryOnError) {
    console.error('[TryOnAction] TryOnError:', {
      code: err.code,
      userMessage: err.userMessage,
      cause: err.cause ?? err.message,
      stack: err.stack,
    });
    return {
      ok: false,
      code: err.code,
      message: err.userMessage,
      retryable: err.retryable,
    };
  }
  console.error('[TryOnAction] UNKNOWN error:', err);
  if (err instanceof Error) {
    console.error('[TryOnAction]   name=', err.name, 'message=', err.message);
    console.error('[TryOnAction]   stack=', err.stack);
  }
  return {
    ok: false,
    code: 'UNKNOWN',
    message: userMessageForCode('UNKNOWN'),
    retryable: true,
  };
}

/**
 * Upload + validate a single image. Returns a stable URL.
 * Note: file must be sent as a FormData entry so Next serializes it over RSC.
 */
export async function validateAndStoreImage(
  formData: FormData,
  field = 'file',
  maxSizeBytes = FILE_LIMITS.MAX_SIZE_BYTES,
): Promise<ActionResult<ValidatedUpload>> {
  try {
    const fileEntry = formData.get(field);
    if (!fileEntry || !(fileEntry instanceof Blob)) {
      return {
        ok: false,
        code: 'INVALID_IMAGE',
        message: '未接收到图片文件。',
        retryable: true,
      };
    }
    const v = validateImageFile(fileEntry, maxSizeBytes);
    if (!v.ok) {
      return toError(v.error);
    }
    const url = await blobToDataURL(fileEntry);
    return {
      ok: true,
      data: {
        ok: true as const,
        url,
        bytes: fileEntry.size,
        mime: fileEntry.type || 'image/jpeg',
      },
    };
  } catch (err) {
    return toError(err);
  }
}

export async function generateTryOn(
  input: GenerateTryOnInput,
): Promise<ActionResult<GenerateTryOnOutput>> {
  try {
    // 登录校验：未登录不允许试穿
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        ok: false,
        code: 'UNAUTHORIZED',
        message: '请先登录后再进行试穿。',
        retryable: false,
      };
    }

    // Turnstile 人机验证：防止机器人刷 API 额度
    const ts = await verifyTurnstileToken(input.turnstileToken, 'try-on');
    if (!ts.ok) {
      return {
        ok: false,
        code: 'UNKNOWN',
        message: ts.message ?? '人机验证未通过，请刷新页面重试。',
        retryable: false,
      };
    }

    if (!input.personImageDataUrl || !input.clothingImageDataUrl) {
      return {
        ok: false,
        code: 'INVALID_IMAGE',
        message: '请同时上传你的照片和服装图片。',
        retryable: false,
      };
    }
    // MVP: Pre-authorization check. In production this runs inside a DB transaction that
    // atomically decrements UsageInfo.usedCredits and writes a UsageLog row with reason=GENERATE.
    if (typeof input.clientRemainingCredits === 'number') {
      const need = input.creditsRequired ?? 1;
      if (input.clientRemainingCredits < need) {
        return {
          ok: false,
          code: 'INSUFFICIENT_CREDITS',
          message: userMessageForCode('INSUFFICIENT_CREDITS'),
          retryable: false,
        };
      }
    }

    const provider = getDefaultAiTryOnProvider();
    const requestId = makeRequestId();
    const personBlob = await dataUrlToBlob(input.personImageDataUrl);
    const clothingBlob = await dataUrlToBlob(input.clothingImageDataUrl);

    const p = await provider.detectCategory({
      clothingImage: clothingBlob,
      clothingFilename: input.clothingFilename,
      requestId,
    });

    const category = p.category;

    const generated = await provider.generate({
      personImage: personBlob,
      clothingImage: clothingBlob,
      personFilename: input.personFilename,
      clothingFilename: input.clothingFilename,
      category,
      requestId,
    });

    const creditsAfter =
      typeof input.clientRemainingCredits === 'number'
        ? {
            used: 1,
            remaining: Math.max(0, input.clientRemainingCredits - (input.creditsRequired ?? 1)),
          }
        : null;

    const result: TryResult = {
      id: requestId,
      originalPersonUrl: input.personImageDataUrl,
      originalClothingUrl: input.clothingImageDataUrl,
      resultImageUrl: generated.resultImageUrl,
      category: generated.category,
      createdAt: new Date().toISOString(),
      generationMs: generated.generationMs,
      status: 'success',
    };

    return {
      ok: true,
      data: {
        requestId,
        result,
        category: generated.category,
        outputQuality: generated.outputQuality,
        watermarked: generated.watermarked,
        creditsAfter,
      },
    };
  } catch (err) {
    return toError(err);
  }
}

async function blobToDataURL(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  return `data:${blob.type || 'image/jpeg'};base64,${base64}`;
}

async function dataUrlToBlob(url: string): Promise<Blob> {
  const trimmed = (url ?? '').trim();
  if (!trimmed) {
    throw new TryOnError({
      code: 'INVALID_IMAGE',
      message: 'Empty image URL',
      userMessage: '图片内容为空，请重新上传后再试。',
    });
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const res = await fetch(trimmed, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) {
        throw new TryOnError({
          code: 'INVALID_IMAGE',
          message: `Failed to fetch image URL: ${res.status}`,
          userMessage: '图片下载失败，请重新上传后再试。',
        });
      }
      return await res.blob();
    } catch (err) {
      if (err instanceof TryOnError) throw err;
      throw new TryOnError({
        code: 'INVALID_IMAGE',
        message: err instanceof Error ? err.message : 'Failed to fetch image URL',
        userMessage: '图片下载失败，请重新上传后再试。',
        retryable: true,
      });
    }
  }

  if (/^blob:/i.test(trimmed)) {
    throw new TryOnError({
      code: 'INVALID_IMAGE',
      message: 'blob URLs are local-only and cannot be used in server actions',
      userMessage: '预览链接无效，请重新选择或上传图片。',
    });
  }

  const idx = trimmed.indexOf(',');
  if (idx === -1 || !trimmed.startsWith('data:')) {
    throw new TryOnError({
      code: 'INVALID_IMAGE',
      message: 'Unsupported image URL format',
      userMessage: '不支持的图片格式，请重新上传后再试。',
    });
  }
  const header = trimmed.slice(5, idx);
  const parts = header.split(';');
  const mime = parts[0] || 'image/jpeg';
  const base64 = parts.includes('base64');
  const payload = trimmed.slice(idx + 1);
  if (base64) {
    const bin = typeof atob === 'function' ? atob(payload) : Buffer.from(payload, 'base64').toString('binary');
    const len = bin.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
    return new Blob([out], { type: mime });
  }
  return new Blob([decodeURIComponent(payload)], { type: mime });
}
