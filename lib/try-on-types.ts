import type { TryOnError } from '@/lib/validators';
import type { ClothingCategory, TryResult } from '@/types/game';

export interface ValidatedUpload {
  ok: true;
  url: string;
  bytes: number;
  mime: string;
}

export interface ActionError {
  ok: false;
  code: TryOnError['code'];
  message: string;
  retryable: boolean;
}

export interface GenerateTryOnInput {
  personImageDataUrl: string;
  clothingImageDataUrl: string;
  personFilename?: string;
  clothingFilename?: string;
  creditsRequired?: number;
  clientRemainingCredits?: number;
}

export interface GenerateTryOnOutput {
  requestId: string;
  result: TryResult;
  category: ClothingCategory;
  outputQuality: 'standard' | 'hd';
  watermarked?: boolean;
  creditsAfter: { used: number; remaining: number } | null;
}

export type ActionResult<T> = { ok: true; data: T } | ActionError;