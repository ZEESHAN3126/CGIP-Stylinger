import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Columns } from 'lucide-react';

interface CompareSliderProps {
  originalImage: string;
  resultImage: string;
  leftLabel?: string;
  rightLabel?: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  originalImage,
  resultImage,
  leftLabel = 'Before: Original Portrait',
  rightLabel = 'After: Styled Composite',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className="compare-container"
      style={{ position: 'relative', width: '100%', height: '520px', backgroundColor: '#090b0e', borderRadius: '12px' }}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      {/* Base Layer: Original Image (Before) */}
      <img
        src={originalImage}
        alt="Original Portrait (Before)"
        className="compare-image-base"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          padding: '4px 10px',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          color: '#8e95a5',
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {leftLabel}
      </div>

      {/* Overlay Layer: Transformed Result (After) clipped to sliderPosition */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
        }}
      >
        <img
          src={resultImage}
          alt="Styled Result (After)"
          className="compare-image-overlay"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: `${100 - sliderPosition + 2}%`,
            padding: '4px 10px',
            background: 'rgba(200, 169, 126, 0.2)',
            backdropFilter: 'blur(8px)',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            color: '#dfc299',
            border: '1px solid rgba(200, 169, 126, 0.4)',
            pointerEvents: 'none',
            zIndex: 5,
            whiteSpace: 'nowrap',
          }}
        >
          {rightLabel}
        </div>
      </div>

      {/* Interactive Drag Divider Line */}
      <div
        className="compare-divider"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: '2px',
          backgroundColor: '#c8a97e',
          boxShadow: '0 0 12px rgba(200, 169, 126, 0.8)',
          zIndex: 10,
        }}
      >
        <div
          className="compare-handle"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '32px',
            height: '32px',
            backgroundColor: '#0b0d10',
            border: '2px solid #c8a97e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'ew-resize',
            boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
          }}
        >
          <Columns size={14} color="#dfc299" />
        </div>
      </div>
    </div>
  );
};
