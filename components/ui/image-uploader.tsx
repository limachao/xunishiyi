'use client';

import * as React from 'react';
import {
  Upload,
  X,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const DEFAULT_MAX_SIZE_MB = 10;

export interface ImageSample {
  label: string;
  url: string;
  tag?: string;
}

export interface ImageUploaderProps {
  label?: string;
  description?: string;
  hint?: string;
  valueFile?: File | null;
  valueUrl?: string | null;
  maxSizeMb?: number;
  acceptedTypes?: string[];
  aspectRatioHint?: string;
  samples?: ImageSample[];
  tips?: { title: string; items: string[] }[];
  error?: string | null;
  disabled?: boolean;
  loading?: boolean;
  showReplace?: boolean;
  onFileChange: (file: File, previewUrl: string) => void;
  onClear?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageUploader({
  label,
  description,
  hint,
  valueFile,
  valueUrl,
  maxSizeMb = DEFAULT_MAX_SIZE_MB,
  acceptedTypes = ACCEPTED_IMAGE_TYPES,
  aspectRatioHint,
  samples,
  tips,
  error: externalError,
  disabled,
  loading,
  showReplace = true,
  onFileChange,
  onClear,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const hasPreview = Boolean(valueUrl);
  const error = externalError ?? internalError;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const validateAndPick = React.useCallback(
    (file: File) => {
      setInternalError(null);
      if (!acceptedTypes.includes(file.type)) {
        setInternalError(
          `不支持的文件类型 "${file.type}"，请使用 JPG、PNG 或 WebP 格式。`,
        );
        return false;
      }
      if (file.size > maxSizeBytes) {
        setInternalError(
          `文件过大（${formatBytes(file.size)}），最大支持 ${maxSizeMb}MB。`,
        );
        return false;
      }
      if (file.size === 0) {
        setInternalError('文件为空，请换一张图再试。');
        return false;
      }
      return true;
    },
    [acceptedTypes, maxSizeBytes, maxSizeMb],
  );

  const readFileAsDataURL = React.useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') resolve(result);
        else reject(new Error('FileReader did not return a string data URL'));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const notifyFile = React.useCallback(
    async (file: File) => {
      try {
        const dataUrl = await readFileAsDataURL(file);
        onFileChange(file, dataUrl);
      } catch {
        setInternalError('图片读取失败，请换一张再试。');
      }
    },
    [onFileChange, readFileAsDataURL],
  );

  const handleFiles = React.useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!validateAndPick(file)) return;
      void notifyFile(file);
    },
    [notifyFile, validateAndPick],
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || loading) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, loading, handleFiles],
  );

  const handleChooseClick = () => {
    if (disabled || loading) return;
    inputRef.current?.click();
  };

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = '';
    setInternalError(null);
    onClear?.();
  };

  const handleSampleClick = (sample: ImageSample) => {
    if (disabled || loading) return;
    const width = 480;
    const height = 640;
    try {
      const canvas =
        typeof document !== 'undefined' &&
        (document.createElement('canvas') as HTMLCanvasElement | null);
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, '#e0e7ff');
          gradient.addColorStop(0.5, '#fce7f3');
          gradient.addColorStop(1, '#fef3c7');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = 'rgba(99, 102, 241, 0.85)';
          ctx.font = 'bold 20px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(sample.label, width / 2, height / 2 - 10);
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.font = '13px system-ui, sans-serif';
          ctx.fillText('FitMate AI 示例预览图', width / 2, height / 2 + 18);
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const base64Idx = dataUrl.indexOf(',');
        if (base64Idx === -1) {
          setInternalError('示例图加载失败，请上传你自己的图片。');
          return;
        }
        const base64 = dataUrl.slice(base64Idx + 1);
        let bin = '';
        if (typeof atob === 'function') {
          bin = atob(base64);
        } else {
          const buf = Buffer.from(base64, 'base64');
          for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        }
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const file = new File([bytes], sample.label.replace(/\s+/g, '-') + '.jpg', {
          type: 'image/jpeg',
        });
        if (!validateAndPick(file)) return;
        onFileChange(file, dataUrl);
      } else {
        setInternalError('示例图加载失败，请上传你自己的图片。');
      }
    } catch {
      setInternalError('示例图加载失败，请上传你自己的图片。');
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {label && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label className="text-[15px] font-semibold tracking-tight">{label}</Label>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-0.5 backdrop-blur-md">
              {acceptedTypes
                .map((t) => t.replace('image/', '').toUpperCase())
                .join(' · ')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-0.5 backdrop-blur-md">
              ≤ {maxSizeMb}MB
            </span>
            {aspectRatioHint && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-0.5 backdrop-blur-md">
                {aspectRatioHint}
              </span>
            )}
          </div>
        </div>
      )}
      {description && (
        <p className="text-[14px] leading-relaxed text-muted-foreground">{description}</p>
      )}

      {!hasPreview ? (
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled && !loading) setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !loading) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={handleChooseClick}
          role="button"
          tabIndex={disabled || loading ? -1 : 0}
          aria-disabled={disabled || loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleChooseClick();
            }
          }}
          className={cn(
            'group relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-[1.5rem] border p-8 text-center transition-all duration-300 ease-out',
            isDragging &&
              'border-primary/70 bg-[oklch(0.62_0.11_195_/_0.08)] scale-[1.01] tint-ring backdrop-blur-xl',
            !isDragging &&
              !error &&
              'glass-soft hover:bg-white/[0.08] hover:border-primary/30',
            error &&
              'border-[oklch(0.6_0.24_25_/_0.55)] bg-[oklch(0.6_0.24_25_/_0.08)] backdrop-blur-xl',
            (disabled || loading) && 'pointer-events-none opacity-60',
          )}
        >
          <div
            className={cn(
              'relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] transition-all duration-300 icon-red',
              isDragging
                ? 'bg-[oklch(0.62_0.11_195_/_0.14)] shadow-[0_0_0_1px_oklch(0.62_0.11_195_/_0.28)_inset,0_20px_40px_-16px_oklch(0.62_0.11_195_/_0.6)]'
                : 'bg-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_18px_36px_-18px_oklch(0_0_0_/_0.55)] group-hover:bg-[oklch(0.62_0.11_195_/_0.12)] group-hover:shadow-[0_0_0_1px_oklch(0.62_0.11_195_/_0.2)_inset,0_24px_48px_-20px_oklch(0.62_0.11_195_/_0.45)]',
            )}
          >
            {loading ? (
              <RefreshCw className="h-9 w-9 animate-spin" />
            ) : (
              <Upload className="h-9 w-9" />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-lg font-semibold tracking-tight">
              {loading
                ? '正在处理图片…'
                : isDragging
                  ? '松开即可导入图片'
                  : '拖拽图片到此处'}
            </p>
            <p className="text-[14px] text-muted-foreground">
              或
              <span className="mx-1.5 font-medium text-primary underline-offset-2 group-hover:underline">
                选择本地图片
              </span>
            </p>
          </div>
          {hint && (
            <p className="max-w-md text-[12px] leading-relaxed text-muted-foreground/90">
              {hint}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            className="hidden"
            disabled={disabled || loading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] glass">
          <div className="relative aspect-[4/5] w-full bg-black/20">
            <img
              src={valueUrl ?? undefined}
              alt={valueFile?.name ?? '已上传图片预览'}
              className="h-full w-full object-cover"
              draggable={false}
            />
            {showReplace && (
              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
                {valueFile?.name && (
                  <Badge variant="secondary" className="max-w-[70%] truncate">
                    {valueFile.name}
                  </Badge>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleChooseClick}
                    disabled={disabled || loading}
                    className="gap-1.5 icon-red"
                  >
                    <RefreshCw className="h-4 w-4" />
                    换一张
                  </Button>
                  {onClear && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      onClick={handleClear}
                      disabled={disabled || loading}
                      aria-label="删除图片"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept={acceptedTypes.join(',')}
                  className="hidden"
                  disabled={disabled || loading}
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
            )}
            {valueFile && (
              <div className="absolute bottom-4 left-4">
                <Badge variant="outline" className="bg-black/30 backdrop-blur-xl">
                  {formatBytes(valueFile.size)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-[oklch(0.6_0.24_25_/_0.38)] bg-[oklch(0.6_0.24_25_/_0.08)] p-4 text-[14px] text-[oklch(0.82_0.12_20)] backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05)_inset]">
          <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
          <span>{error}</span>
        </div>
      )}

      {samples && samples.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[14px] font-medium text-foreground">
            <ImageIcon className="h-4 w-4 text-primary" />
            或使用示例图快速体验
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {samples.map((sample) => (
              <button
                key={sample.url}
                type="button"
                disabled={disabled || loading}
                onClick={() => handleSampleClick(sample)}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_48px_-20px_oklch(0.62_0.11_195_/_0.35)] disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <div className="aspect-square w-full overflow-hidden">
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-3 text-left">
                  <div className="truncate text-[13px] font-medium">{sample.label}</div>
                  {sample.tag && (
                    <div className="mt-0.5 text-[11px] uppercase tracking-wide text-white/70">
                      {sample.tag}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tips && tips.length > 0 && (
        <div className="space-y-3 rounded-[1.5rem] glass p-5">
          {tips.map((tip) => (
            <div key={tip.title} className="space-y-2">
              <h4 className="text-[14px] font-semibold tracking-tight">{tip.title}</h4>
              <ul className="space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted-foreground">
                {tip.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
