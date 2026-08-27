'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  searchPlaceholder?: string;
  search: string;
  statusOptions: { value: string; label: string }[];
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
}

export function FilterBar({
  searchPlaceholder = '搜索...',
  search,
  statusOptions,
  status,
  onSearchChange,
  onStatusChange,
  onReset,
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search);

  const handleSearchSubmit = () => {
    onSearchChange(localSearch);
  };

  const handleReset = () => {
    setLocalSearch('');
    onReset();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white/[0.02] border-b border-white/10">
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          className="h-9 w-full max-w-sm rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.11_195)]"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleSearchSubmit}
          className="h-9"
        >
          搜索
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.11_195)]"
        >
          <option value="">全部状态</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className="h-9 text-white/60 hover:text-white"
      >
        重置
      </Button>
    </div>
  );
}
