'use client';

import { useEffect, useRef } from 'react';

interface EmberParticlesProps {
  count?: number;
  className?: string;
}

export default function EmberParticles({ 
  count = 30,
  className = '' 
}: EmberParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing embers
    container.innerHTML = '';

    // Create ember particles
    for (let i = 0; i < count; i++) {
      const ember = document.createElement('div');
      ember.className = 'ember-particle';
      
      // Random starting position
      ember.style.left = `${Math.random() * 100}%`;
      ember.style.animationDelay = `${Math.random() * 5}s`;
      ember.style.animationDuration = `${3 + Math.random() * 4}s`;
      
      // Random size
      const size = Math.random() * 3 + 1;
      ember.style.width = `${size}px`;
      ember.style.height = `${size}px`;
      
      container.appendChild(ember);
    }
  }, [count]);

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 1 }}
    />
  );
}