'use client';

import { cn } from '@/lib/utils';
import React, { useRef, useState, useEffect } from 'react';

interface GlowingEffectProps {
  blur?: number;
  spread?: number;
  proximity?: number;
  inactiveZone?: number;
  borderWidth?: number;
  glow?: boolean;
  disabled?: boolean;
  className?: string;
}

export function GlowingEffect({
  blur = 0,
  spread = 40,
  proximity = 64,
  inactiveZone = 0.01,
  borderWidth = 3,
  glow = true,
  disabled = false,
  className,
}: GlowingEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if mouse is within proximity
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);

      if (distance <= maxDistance + proximity) {
        setIsHovering(true);
        setPosition({ x, y });
        const proximityOpacity = Math.max(0, 1 - distance / (maxDistance + proximity));
        setOpacity(proximityOpacity);
      } else {
        setIsHovering(false);
        setOpacity(0);
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      setOpacity(0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [proximity]);

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: glow && isHovering ? opacity : 0,
        }}
      >
        <div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            background: `radial-gradient(${spread}px circle at ${position.x}px ${position.y}px, oklch(0.62 0.11 195 / 0.5), transparent 100%)`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
        />
      </div>
      <div
        className="absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: glow && isHovering ? opacity * 0.6 : 0,
          padding: `${borderWidth}px`,
        }}
      >
        <div
          className="h-full w-full rounded-[inherit]"
          style={{
            background: `radial-gradient(${spread * 1.5}px circle at ${position.x}px ${position.y}px, oklch(0.62 0.11 195 / 0.8), transparent 100%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      </div>
    </div>
  );
}
