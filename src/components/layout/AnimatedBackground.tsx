'use client';

// Ambient background: subtle grid + radial glows

export default function AnimatedBackground() {
  return (
    <>
      {/* Grid background */}
      <div className="bg-grid" />

      {/* Primary radial glow — teal top center */}
      <div
        style={{
          position: 'fixed',
          top: '-25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '160%',
          height: '70%',
          background: 'radial-gradient(ellipse at center, rgba(13,148,136,0.12) 0%, rgba(13,148,136,0.04) 40%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Secondary radial glow — cyan bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120%',
          height: '55%',
          background: 'radial-gradient(ellipse at center, rgba(8,145,178,0.08) 0%, rgba(8,145,178,0.03) 40%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
