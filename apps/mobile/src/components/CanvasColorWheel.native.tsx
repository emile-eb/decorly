import React, { useEffect } from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Paint,
  SweepGradient,
  useTouchHandler,
  useValue,
  vec
} from '@shopify/react-native-skia';

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

function hslToHex(h: number, s = 1, l = 0.5) {
  // Convert HSL to RGB then to hex (for gradient stops)
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (0 <= hp && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (1 <= hp && hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (2 <= hp && hp < 3) [r1, g1, b1] = [0, c, x];
  else if (3 <= hp && hp < 4) [r1, g1, b1] = [0, x, c];
  else if (4 <= hp && hp < 5) [r1, g1, b1] = [x, 0, c];
  else if (5 <= hp && hp < 6) [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  return rgbToHex(r, g, b);
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
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8; // match web: outer edge
  const ringStroke = outerR; // center stroke at outerR/2, width outerR
  const ringRadius = outerR / 2;

  const h = useValue(0);
  const s = useValue(1);

  useEffect(() => {
    const { r, g, b } = hsvToRgb(h.current, s.current, value);
    onChange?.(rgbToHex(r, g, b), { h: h.current, s: s.current, v: value });
  }, [onChange, value, h, s]);

  const onTouch = useTouchHandler({
    onStart: (pt) => {
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const angle = Math.atan2(dy, dx);
      let deg = (angle * 180) / Math.PI;
      if (deg < 0) deg += 360;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const sat = Math.min(1, Math.max(0, dist / outerR));
      h.current = deg;
      s.current = sat;
      const { r, g, b } = hsvToRgb(h.current, s.current, value);
      onChange?.(rgbToHex(r, g, b), { h: h.current, s: s.current, v: value });
    },
    onActive: (pt) => {
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const angle = Math.atan2(dy, dx);
      let deg = (angle * 180) / Math.PI;
      if (deg < 0) deg += 360;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const sat = Math.min(1, Math.max(0, dist / outerR));
      h.current = deg;
      s.current = sat;
      const { r, g, b } = hsvToRgb(h.current, s.current, value);
      onChange?.(rgbToHex(r, g, b), { h: h.current, s: s.current, v: value });
    }
  });

  // Gradient stops for a full hue cycle (close the loop with 0 and 360 same color)
  const hues = [0, 60, 120, 180, 240, 300, 360];
  const colors = hues.map((deg) => hslToHex(deg));
  const positions = hues.map((deg) => deg / 360);

  const handleR = 8;
  const handleX = cx + Math.cos((h.current * Math.PI) / 180) * (outerR * s.current);
  const handleY = cy + Math.sin((h.current * Math.PI) / 180) * (outerR * s.current);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }} onTouch={onTouch}>
        <Group>
          <Paint style="stroke" strokeWidth={ringStroke}>
            <SweepGradient c={vec(cx, cy)} colors={colors} positions={positions} />
          </Paint>
          <Circle cx={cx} cy={cy} r={ringRadius} />
        </Group>

        {/* Selection handle */}
        <Group>
          <Paint style="stroke" strokeWidth={3} color="white" />
          <Paint style="fill" color="rgba(0,0,0,0.35)" />
          <Circle cx={handleX} cy={handleY} r={handleR} />
        </Group>
      </Canvas>
    </View>
  );
}

