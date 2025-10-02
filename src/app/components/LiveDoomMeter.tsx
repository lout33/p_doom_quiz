'use client';

import { useEffect, useState } from 'react';

interface LiveDoomMeterProps {
  currentDoom: number;
  previousDoom: number;
  className?: string;
}

export default function LiveDoomMeter({ 
  currentDoom, 
  previousDoom,
  className = '' 
}: LiveDoomMeterProps) {
  const [displayDoom, setDisplayDoom] = useState(previousDoom);
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    // Animate the doom value change
    setAnimate(true);
    const timer = setTimeout(() => {
      setDisplayDoom(currentDoom);
      setTimeout(() => setAnimate(false), 1000);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentDoom]);
  
  // Determine color and intensity
  const getDoomColor = () => {
    if (currentDoom < 10) return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)' }; // green
    if (currentDoom < 30) return { main: '#eab308', glow: 'rgba(234, 179, 8, 0.5)' }; // yellow
    if (currentDoom < 60) return { main: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' }; // orange
    return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' }; // red
  };
  
  const colors = getDoomColor();
  const change = currentDoom - previousDoom;
  const showArrow = Math.abs(change) > 0.5;
  
  // Calculate stroke dash for circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayDoom / 100) * circumference;
  
  return (
    <div className={`${className}`}>
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 border-2 border-gray-700 shadow-2xl">
        <h3 className="text-sm font-semibold text-gray-400 mb-4 text-center uppercase tracking-wide">
          Live P(doom) Estimate
        </h3>
        
        {/* Circular Doom Meter */}
        <div className="relative w-48 h-48 mx-auto mb-4">
          {/* Background circle */}
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-800"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke={colors.main}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ease-out ${animate ? 'opacity-100' : 'opacity-90'}`}
              style={{
                filter: `drop-shadow(0 0 8px ${colors.glow})`,
              }}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div 
              className={`text-5xl font-bold transition-all duration-500 ${animate ? 'scale-110' : 'scale-100'}`}
              style={{ color: colors.main, textShadow: `0 0 20px ${colors.glow}` }}
            >
              {displayDoom.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">by 2035</div>
          </div>
        </div>
        
        {/* Trajectory indicator */}
        {showArrow && (
          <div className={`text-center transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="flex items-center justify-center space-x-2">
              {change > 0 ? (
                <>
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-red-400">
                    +{change.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-green-400">
                    {change.toFixed(1)}%
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {change > 0 ? 'Risk increasing' : 'Risk decreasing'}
            </p>
          </div>
        )}
        
        {/* Info text */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">
            Updates as you answer questions
          </p>
        </div>
      </div>
    </div>
  );
}