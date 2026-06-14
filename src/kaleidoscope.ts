export type SceneContext = {
  ctx: CanvasRenderingContext2D;
  time: number;
  size: number;
  pointer: { x: number; y: number; active: boolean };
};

export type Scene = {
  id: string;
  name: string;
  segments: number;
  draw: (sctx: SceneContext) => void;
};

const TAU = Math.PI * 2;

export type RenderOptions = {
  segments: number;
  spin: number;
};

/**
 * Renders a source pattern into a kaleidoscope on the target canvas.
 * The source painter draws into a single wedge; the renderer mirrors + rotates
 * that wedge `segments` times around the center to form full radial symmetry.
 */
export function renderKaleidoscope(
  target: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  options: RenderOptions,
) {
  const { width, height } = target.canvas;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.hypot(width, height) / 2 + 4;
  const segments = Math.max(2, Math.floor(options.segments));
  const wedge = TAU / segments;

  target.save();
  target.fillStyle = '#05050a';
  target.fillRect(0, 0, width, height);

  target.translate(cx, cy);
  target.rotate(options.spin);

  for (let i = 0; i < segments; i++) {
    target.save();
    target.rotate(i * wedge);
    if (i % 2 === 1) target.scale(1, -1);

    target.beginPath();
    target.moveTo(0, 0);
    target.lineTo(radius, 0);
    target.arc(0, 0, radius, 0, wedge);
    target.closePath();
    target.clip();

    target.drawImage(source, 0, 0, source.width, source.height, 0, -radius * Math.tan(wedge / 2) - 1, radius, radius * Math.tan(wedge / 2) * 2 + 2);
    target.restore();
  }

  target.restore();
}

const rand = (seed: number) => {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 100000) / 100000;
  };
};

function hsl(h: number, s: number, l: number, a = 1) {
  return `hsla(${(h % 360 + 360) % 360}, ${s}%, ${l}%, ${a})`;
}

export const SCENES: Scene[] = [
  {
    id: 'bubbles',
    name: '버블',
    segments: 12,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#0a0612';
      ctx.fillRect(0, 0, size, size);
      const r = rand(1);
      const t = time * 0.0008;
      for (let i = 0; i < 26; i++) {
        const seed = r();
        const x = (Math.sin(t * (0.4 + seed) + seed * 7) * 0.5 + 0.5) * size;
        const y = (Math.cos(t * (0.3 + seed * 1.2) + seed * 5) * 0.5 + 0.5) * size;
        const radius = (0.04 + seed * 0.18) * size;
        const hue = (seed * 360 + t * 30) % 360;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, hsl(hue, 95, 70, 0.95));
        grad.addColorStop(0.6, hsl(hue + 40, 90, 55, 0.55));
        grad.addColorStop(1, hsl(hue + 80, 80, 35, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
      }
    },
  },
  {
    id: 'petals',
    name: '꽃잎',
    segments: 8,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#0c0418';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0006;
      ctx.save();
      ctx.translate(size * 0.15, size * 0.5);
      for (let i = 0; i < 18; i++) {
        const phase = i / 18;
        const a = t + phase * TAU;
        const x = Math.cos(a) * size * 0.35 + size * 0.45;
        const y = Math.sin(a * 1.5) * size * 0.25;
        const hue = (phase * 360 + t * 80) % 360;
        ctx.fillStyle = hsl(hue, 88, 62, 0.85);
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.18, size * 0.04, a * 2, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    },
  },
  {
    id: 'stardust',
    name: '별가루',
    segments: 14,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(4, 4, 14, 0.35)';
      ctx.fillRect(0, 0, size, size);
      const r = rand(42);
      const t = time * 0.001;
      for (let i = 0; i < 120; i++) {
        const seed = r();
        const x = (Math.sin(t * 0.5 + seed * 30) * 0.5 + 0.5) * size;
        const y = ((seed * 7 + t * (0.4 + seed)) % 1) * size;
        const radius = seed * 2.4 + 0.4;
        const hue = 200 + seed * 160;
        ctx.fillStyle = hsl(hue, 90, 78, 0.9);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
        if (seed > 0.85) {
          ctx.strokeStyle = hsl(hue, 100, 85, 0.4);
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(x - radius * 3, y);
          ctx.lineTo(x + radius * 3, y);
          ctx.moveTo(x, y - radius * 3);
          ctx.lineTo(x, y + radius * 3);
          ctx.stroke();
        }
      }
    },
  },
  {
    id: 'liquid',
    name: '리퀴드',
    segments: 6,
    draw({ ctx, time, size }) {
      const t = time * 0.0005;
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, hsl(t * 40, 80, 18));
      grad.addColorStop(1, hsl(t * 40 + 90, 70, 10));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 6; i++) {
        const phase = i / 6;
        const x = (Math.sin(t * (0.6 + phase) + phase * 7) * 0.5 + 0.5) * size;
        const y = (Math.cos(t * (0.5 + phase) + phase * 5) * 0.5 + 0.5) * size;
        const radius = size * (0.25 + 0.15 * Math.sin(t + phase * 3));
        const hue = (phase * 360 + t * 60) % 360;
        const blob = ctx.createRadialGradient(x, y, 0, x, y, radius);
        blob.addColorStop(0, hsl(hue, 95, 60, 0.85));
        blob.addColorStop(1, hsl(hue, 95, 50, 0));
        ctx.fillStyle = blob;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
      }
    },
  },
  {
    id: 'threads',
    name: '실타래',
    segments: 10,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(6, 4, 16, 0.18)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0009;
      ctx.lineWidth = 1.4;
      for (let line = 0; line < 24; line++) {
        const phase = line / 24;
        const hue = (phase * 360 + t * 50) % 360;
        ctx.strokeStyle = hsl(hue, 90, 65, 0.7);
        ctx.beginPath();
        for (let x = 0; x <= size; x += 4) {
          const nx = x / size;
          const y =
            size * 0.5 +
            Math.sin(nx * 6 + t + phase * 4) * size * 0.18 +
            Math.cos(nx * 12 + t * 1.6 + phase * 8) * size * 0.06 +
            (phase - 0.5) * size * 0.7;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: 'confetti',
    name: '컨페티',
    segments: 16,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#080614';
      ctx.fillRect(0, 0, size, size);
      const r = rand(7);
      const t = time * 0.0007;
      for (let i = 0; i < 60; i++) {
        const seed = r();
        const x = (Math.sin(t * (0.5 + seed) + seed * 11) * 0.5 + 0.5) * size;
        const y = (Math.cos(t * (0.6 + seed * 0.7) + seed * 9) * 0.5 + 0.5) * size;
        const s = (0.02 + seed * 0.06) * size;
        const hue = (seed * 360 + t * 40) % 360;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 2 + seed * 10);
        ctx.fillStyle = hsl(hue, 95, 60, 0.92);
        if (seed < 0.33) {
          ctx.fillRect(-s / 2, -s / 2, s, s);
        } else if (seed < 0.66) {
          ctx.beginPath();
          ctx.moveTo(0, -s / 2);
          ctx.lineTo(s / 2, s / 2);
          ctx.lineTo(-s / 2, s / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, s / 2, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    },
  },
  {
    id: 'plasma',
    name: '플라즈마',
    segments: 18,
    draw({ ctx, time, size }) {
      const t = time * 0.0008;
      const step = 8;
      const cols = Math.ceil(size / step);
      const rows = Math.ceil(size / step);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i / cols;
          const y = j / rows;
          const v =
            Math.sin(x * 6 + t) +
            Math.sin(y * 8 - t * 1.3) +
            Math.sin((x + y) * 5 + t * 0.7) +
            Math.sin(Math.hypot(x - 0.5, y - 0.5) * 14 - t * 2);
          const hue = (v * 60 + t * 80) % 360;
          ctx.fillStyle = hsl(hue, 90, 55);
          ctx.fillRect(i * step, j * step, step + 1, step + 1);
        }
      }
    },
  },
  {
    id: 'crystal',
    name: '크리스탈',
    segments: 9,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#040312';
      ctx.fillRect(0, 0, size, size);
      const r = rand(13);
      const t = time * 0.0004;
      for (let i = 0; i < 14; i++) {
        const seed = r();
        const x = (Math.sin(t + seed * 9) * 0.5 + 0.5) * size;
        const y = (Math.cos(t * 1.2 + seed * 5) * 0.5 + 0.5) * size;
        const radius = (0.12 + seed * 0.2) * size;
        const sides = 3 + Math.floor(seed * 5);
        const rot = t * (0.5 + seed) + seed * 8;
        const hue = (seed * 360 + t * 100) % 360;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.strokeStyle = hsl(hue, 100, 65, 0.85);
        ctx.fillStyle = hsl(hue + 40, 90, 55, 0.18);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let k = 0; k < sides; k++) {
          const a = (k / sides) * TAU;
          const px = Math.cos(a) * radius;
          const py = Math.sin(a) * radius;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    },
  },
];
