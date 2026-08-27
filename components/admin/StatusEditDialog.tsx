'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StatusEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  currentStatus: string;
  statusOptions: { value: string; label: string }[];
  onConfirm: (newStatus: string) => Promise<void> | void;
}

export function StatusEditDialog({
  open,
  onOpenChange,
  title,
  currentStatus,
  statusOptions,
  onConfirm,
}: StatusEditDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (selectedStatus === currentStatus) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onConfirm(selectedStatus);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedStatus(currentStatus);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => handleOpenChange(false)}
        />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[oklch(0.08_0.008_155)] p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>

          <div className="space-y-3">
            <label className="text-sm text-white/60">选择新状态</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.11_195)]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSaving || selectedStatus === currentStatus}
            >
              {isSaving ? '保存中...' : '确认'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
