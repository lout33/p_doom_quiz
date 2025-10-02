'use client';

import { useEffect, useRef } from 'react';

interface FlameEffectProps {
  intensity?: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function FlameEffect({ 
  intensity = 'medium', 
  size = 'medium',
  className = '' 
}: FlameEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Flame particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      hue: number;
    }> = [];

    const particleCount = intensity === 'low' ? 20 : intensity === 'medium' ? 40 : 60;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        life: Math.random() * 100,
        maxLife: 100,
        size: Math.random() * 8 + 4,
        hue: Math.random() * 30 + 10 // 10-40 (red-orange range)
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        // Update
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.size *= 0.98;

        // Reset if dead
        if (p.life <= 0 || p.y < -10) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 20;
          p.vx = (Math.random() - 0.5) * 2;
          p.vy = -Math.random() * 3 - 1;
          p.life = 100;
          p.size = Math.random() * 8 + 4;
          p.hue = Math.random() * 30 + 10;
        }

        // Draw
        const alpha = p.life / p.maxLife;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 60%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${p.hue + 10}, 100%, 50%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${p.hue + 20}, 100%, 30%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationId);
    };
  }, [intensity]);

  const sizeClasses = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64'
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${sizeClasses[size]} ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
}