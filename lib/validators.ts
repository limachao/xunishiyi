import type { ClothingCategory, TryResult } from '@/types/game';

export type TryOnErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'EMPTY_FILE'
  | 'INVALID_IMAGE'
  | 'CLOTHING_CATEGORY_NOT_SUPPORTED'
  | 'INSUFFICIENT_CREDITS'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_ERROR'
  | 'GENERATION_FAILED'
  | 'UNKNOWN';

export class TryOnError extends Error {
  readonly code: TryOnErrorCode;
  readonly cause?: unknown;
  readonly userMessage: string;
  readonly retryable: boolean;

  constructor(opts: {
    code: TryOnErrorCode;
    message: string;
    cause?: unknown;
    retryable?: boolean;
    userMessage?: string;
  }) {
    super(opts.message);
    this.name = 'TryOnError';
    this.code = opts.code;
    this.cause = opts.cause;
    this.retryable = opts.retryable ?? false;
    this.userMessage = opts.userMessage ?? opts.message;
  }
}

export const FILE_LIMITS = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ACCEPTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
} as const;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateImageFile(
  file: File | Blob,
  maxSizeBytes = FILE_LIMITS.MAX_SIZE_BYTES,
  acceptedTypes: readonly string[] = FILE_LIMITS.ACCEPTED_TYPES,
): { ok: true } | { ok: false; error: TryOnError } {
  if (file.size === 0) {
    return {
      ok: false,
      error: new TryOnError({
        code: 'EMPTY_FILE',
        message: 'File is empty',
        userMessage: '文件看起来是空的，请换一张图片再试。',
      }),
    };
  }
  if (file.size > maxSizeBytes) {
    return {
      ok: false,
      error: new TryOnError({
        code: 'FILE_TOO_LARGE',
        message: `File size ${formatBytes(file.size)} exceeds ${formatBytes(maxSizeBytes)}`,
        userMessage: `文件过大（${formatBytes(file.size)}），最大支持 ${formatBytes(maxSizeBytes)}。`,
      }),
    };
  }
  const type = file.type;
  if (type && !acceptedTypes.includes(type)) {
    return {
      ok: false,
      error: new TryOnError({
        code: 'UNSUPPORTED_FILE_TYPE',
        message: `Unsupported file type: ${type}`,
        userMessage: `不支持的文件格式（${type.replace('image/', '').toUpperCase() || '未知'}），请使用 JPG、PNG 或 WebP。`,
      }),
    };
  }
  return { ok: true };
}

export function userMessageForCode(code: TryOnErrorCode): string {
  switch (code) {
    case 'FILE_TOO_LARGE':
      return '图片文件过大，请使用 10MB 以内的图片。';
    case 'UNSUPPORTED_FILE_TYPE':
      return '不支持的文件格式，请上传 JPG、PNG 或 WebP。';
    case 'EMPTY_FILE':
      return '文件看起来是空的，请换一张图片再试。';
    case 'INVALID_IMAGE':
      return '图片格式不支持或内容无法识别，请换一张更清晰的图片（建议 JPG / PNG，10MB 以内）。';
    case 'CLOTHING_CATEGORY_NOT_SUPPORTED':
      return '当前版本仅支持上衣、下装和连衣裙，一次试穿一件。';
    case 'INSUFFICIENT_CREDITS':
      return '免费试穿次数已用完，升级套餐即可继续使用。';
    case 'PROVIDER_RATE_LIMITED':
      return '请求过于频繁或本月额度已用完，请约 30 秒后重试，或联系管理员升级额度。';
    case 'PROVIDER_AUTH_FAILED':
      return 'API Key 无效或已过期，请检查 VOLCENGINE_API_KEY 配置。';
    case 'PROVIDER_ERROR':
      return 'AI 服务暂时不可用，请 1 分钟后再试；若持续失败请联系管理员。';
    case 'GENERATION_FAILED':
      return 'AI 本次未能生成预览，请换一套更清晰的服装图或人物图再试。';
    default:
      return '出现问题，请稍后再试。';
  }
}

export type ClothingCategoryFromProvider = ClothingCategory;
