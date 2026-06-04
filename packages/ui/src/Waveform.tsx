'use client';
import React from 'react';

interface Props {
  heights?: number[];
  active?: boolean;
  color?: string;
  className?: string;
}

export default function Waveform({ heights = [12, 24, 18, 32, 15, 28, 20], active = false, color = '#f97316', className = '' }: Props) {
  return (
    <div className={`waveform ${className}`}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            height: `${h}px`,
            background: active ? color : '#52525b',
            transition: 'height 60ms ease-out',
          }}
        />
      ))}
    </div>
  );
}
