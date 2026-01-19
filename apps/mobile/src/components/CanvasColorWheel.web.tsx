import React, { useEffect, useMemo, useRef, useState } from 'react';

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (0 <= hp && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (1 <= hp && hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (2 <= hp && hp < 3) [r1, g1, b1] = [0, c, x];
  else if (3 <= hp && hp < 4) [r1, g1, b1] = [0, x, c];
  else if (4 <= hp && hp < 5) [r1, g1, b1] = [x, 0, c];
  else if (5 <= hp && hp < 6) [r1, g1, b1] = [c, 0, x];
  const m = v - c;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function CanvasColorWheel({
  size = 260,
  value = 1,
  onChange
}: {
  size?: number;
  value?: number;
  onChange?: (hex: string, hsv: { h: number; s: number; v: number }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [h, setH] = useState(0);
  const [s, setS] = useState(1);

  // Outer radius of the ring (px from center to outer edge)
  const radius = useMemo(() => size / 2 - 8, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);
    for (let deg = 0; deg < 360; deg += 1) {
      const start = (deg - 1) * (Math.PI / 180);
      const end = deg * (Math.PI / 180);
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${deg}, 100%, 50%)`;
      // Draw a thick ring from inner=0 to outer=radius by using
      // a centered arc at radius/2 with lineWidth=radius
      ctx.lineWidth = radius;
      ctx.arc(cx, cy, radius / 2, start, end);
      ctx.stroke();
    }

    const angle = (h * Math.PI) / 180;
    // Map saturation 0..1 to center..outer edge of the ring (0..radius)
    const r = radius * s;
    const ix = cx + Math.cos(angle) * r;
    const iy = cy + Math.sin(angle) * r;

    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.arc(ix, iy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [size, radius, h, s]);

  useEffect(() => {
    const { r, g, b } = hsvToRgb(h, s, value);
    const hex = rgbToHex(r, g, b);
    onChange?.(hex, { h, s, v: value });
  }, [h, s, value, onChange]);

  function updateFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = size / 2;
    const cy = size / 2;
    const dx = x - cx;
    const dy = y - cy;
    const angle = Math.atan2(dy, dx);
    let deg = (angle * 180) / Math.PI;
    if (deg < 0) deg += 360;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Clamp saturation to full outer radius of the ring
    const maxR = radius;
    const sat = Math.min(1, Math.max(0, dist / maxR));
    setH(deg);
    setS(sat);
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ touchAction: 'none', borderRadius: '50%', display: 'block' }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
        updateFromEvent(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons !== 1) return;
        updateFromEvent(e);
      }}
    />
  );
}
