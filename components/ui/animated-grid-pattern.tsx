'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGridPatternProps {
  className?: string;
  cellSize?: number;
  strokeWidth?: number;
  duration?: number;
  opacity?: number;
}

export default function AnimatedGridPattern({
  className,
  cellSize = 60,
  strokeWidth = 1,
  duration = 20,
  opacity = 0.1,
}: AnimatedGridPatternProps) {
  const id = React.useId();
  
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <svg
        className="absolute inset-0 h-full w-full"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`grid-${id}`}
            width={cellSize}
            height={cellSize}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={cellSize}
              height={cellSize}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          </pattern>
          
          {/* Animated mask for the wave effect */}
          <mask id={`wave-mask-${id}`}>
            <rect width="100%" height="100%" fill="url(#wave-gradient)" />
          </mask>
          
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8">
              <animate
                attributeName="stop-opacity"
                values="0.8;0.3;0.8"
                dur={`${duration}s`}
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="white" stopOpacity="0.5">
              <animate
                attributeName="stop-opacity"
                values="0.5;0.8;0.5"
                dur={`${duration}s`}
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="white" stopOpacity="0.2">
              <animate
                attributeName="stop-opacity"
                values="0.2;0.6;0.2"
                dur={`${duration}s`}
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
        
        {/* Base grid pattern */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#grid-${id})`}
          className="text-gray-300 dark:text-gray-600"
        />
        
        {/* Animated overlay */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#grid-${id})`}
          mask={`url(#wave-mask-${id})`}
          className="text-blue-400 dark:text-blue-500"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}