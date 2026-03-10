'use client';

import { useEffect, useRef } from 'react';

// Larger, more visible particles with variety
const PARTICLES = [
  { size: 6, left: '8%', duration: '14s', delay: '0s', opacity: 0.7 },
  { size: 4, left: '18%', duration: '18s', delay: '2s', opacity: 0.5 },
  { size: 8, left: '32%', duration: '12s', delay: '1s', opacity: 0.8 },
  { size: 3, left: '45%', duration: '20s', delay: '4s', opacity: 0.4 },
  { size: 7, left: '58%', duration: '15s', delay: '0.5s', opacity: 0.6 },
  { size: 5, left: '72%', duration: '13s', delay: '3s', opacity: 0.7 },
  { size: 4, left: '83%', duration: '17s', delay: '6s', opacity: 0.5 },
  { size: 6, left: '93%', duration: '11s', delay: '2.5s', opacity: 0.8 },
  { size: 3, left: '5%', duration: '22s', delay: '7s', opacity: 0.4 },
  { size: 5, left: '50%', duration: '16s', delay: '5s', opacity: 0.6 },
  { size: 9, left: '65%', duration: '19s', delay: '1.5s', opacity: 0.5 },
  { size: 4, left: '38%', duration: '14s', delay: '8s', opacity: 0.7 },
];

// Canvas-based subtle noise overlay for depth
function NoiseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 200;

    const imageData = ctx.createImageData(200, 200);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 255;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 8; // very subtle
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.4,
        mixBlendMode: 'overlay',
      }}
    />
  );
}

export default function AnimatedBackground() {
  return (
    <>
      {/* Grid background — stronger visibility */}
      <div className="bg-grid" />

      {/* Primary radial glow — blue top center (MUCH stronger) */}
      <div
        style={{
          position: 'fixed',
          top: '-25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '160%',
          height: '70%',
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Secondary radial glow — purple bottom (stronger) */}
      <div
        style={{
          position: 'fixed',
          bottom: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120%',
          height: '55%',
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Accent glow — cyan left side for asymmetry */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '-10%',
          width: '50%',
          height: '60%',
          background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.06) 0%, transparent 60%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Noise overlay for cinematic texture */}
      <NoiseCanvas />

      {/* Floating particles — bigger, brighter */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: p.left,
            opacity: p.opacity,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  );
}
