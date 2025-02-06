import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface WaveformRegionProps {
  className?: string;
  minWidth?: number;
}

const WaveformRegion = ({ 
  className,
  minWidth = 200 
}: WaveformRegionProps) => {
  const [width, setWidth] = useState(400);
  const [leftOffset, setLeftOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [startLeft, setStartLeft] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const delta = e.clientX - startX;
      
      if (isDragging === 'right') {
        const newWidth = Math.max(minWidth, startWidth + delta);
        setWidth(newWidth);
      } else if (isDragging === 'left') {
        const maxOffset = startLeft + startWidth - minWidth;
        const newOffset = Math.min(maxOffset, Math.max(0, startLeft + delta));
        setLeftOffset(newOffset);
        setWidth(startWidth - (newOffset - startLeft));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, startWidth, startLeft, minWidth]);

  const handleMouseDown = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    setIsDragging(side);
    setStartX(e.clientX);
    setStartWidth(width);
    setStartLeft(leftOffset);
  };

  return (
    <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
      <div
        ref={containerRef}
        style={{ 
          width: `${width}px`,
          transform: `translateX(${leftOffset}px)`,
        }}
        className={cn(
          "absolute h-full bg-[#F6B637] rounded-lg transition-colors overflow-hidden",
          "flex items-center justify-center",
          className
        )}
      >
        {/* Waveform visualization */}
        <div 
          className="absolute inset-0 flex items-center justify-around px-4"
          style={{
            width: '100%',
            transform: `translateX(0)`,
          }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white/30 rounded-full"
              style={{
                height: `${30 + Math.random() * 40}%`
              }}
            />
          ))}
        </div>

        {/* Left handle */}
        <div
          onMouseDown={handleMouseDown('left')}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize",
            "hover:bg-gray-600/50 group",
            isDragging === 'left' ? 'bg-gray-600/50' : 'bg-gray-600/30'
          )}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 rounded-sm bg-gray-600/30 group-hover:bg-gray-600/50" />
        </div>

        {/* Right handle */}
        <div
          onMouseDown={handleMouseDown('right')}
          className={cn(
            "absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize",
            "hover:bg-gray-600/50 group",
            isDragging === 'right' ? 'bg-gray-600/50' : 'bg-gray-600/30'
          )}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 rounded-sm bg-gray-600/30 group-hover:bg-gray-600/50" />
        </div>
      </div>
    </div>
  );
};

export default WaveformRegion;