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

  const destH = radius * Math.sin(wedge) + 2;
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

    target.drawImage(source, 0, 0, source.width, source.height, 0, 0, radius, destH);
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
  {
    id: 'aurora',
    name: '오로라',
    segments: 7,
    draw({ ctx, time, size }) {
      const t = time * 0.0004;
      const bg = ctx.createLinearGradient(0, 0, 0, size);
      bg.addColorStop(0, '#02021a');
      bg.addColorStop(1, '#070414');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
      for (let band = 0; band < 5; band++) {
        const phase = band / 5;
        const hue = (180 + phase * 160 + t * 40) % 360;
        const grad = ctx.createLinearGradient(0, 0, size, 0);
        grad.addColorStop(0, hsl(hue, 90, 55, 0));
        grad.addColorStop(0.5, hsl(hue, 95, 65, 0.7));
        grad.addColorStop(1, hsl(hue + 60, 90, 60, 0));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 18 + Math.sin(t + band) * 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = 0; x <= size; x += 6) {
          const nx = x / size;
          const y =
            size * (0.2 + phase * 0.14) +
            Math.sin(nx * 4 + t * 1.2 + band) * size * 0.08 +
            Math.cos(nx * 8 - t + band * 2) * size * 0.04;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: 'fireworks',
    name: '불꽃',
    segments: 12,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(4, 2, 12, 0.22)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.001;
      const bursts = 4;
      for (let b = 0; b < bursts; b++) {
        const cycle = (t + b * 0.7) % 1.4;
        if (cycle > 1.2) continue;
        const r = rand(b * 97 + Math.floor((t + b * 0.7) / 1.4) * 13);
        const cx = r() * size;
        const cy = r() * size;
        const hue = r() * 360;
        const radius = cycle * size * 0.35;
        const alpha = Math.max(0, 1 - cycle / 1.2);
        const particles = 28;
        for (let i = 0; i < particles; i++) {
          const a = (i / particles) * TAU + r();
          const dist = radius * (0.7 + r() * 0.5);
          const x = cx + Math.cos(a) * dist;
          const y = cy + Math.sin(a) * dist + cycle * cycle * size * 0.05;
          const ps = 1.6 + (1 - cycle) * 2;
          ctx.fillStyle = hsl(hue + i * 3, 100, 60 + cycle * 20, alpha);
          ctx.beginPath();
          ctx.arc(x, y, ps, 0, TAU);
          ctx.fill();
        }
      }
    },
  },
  {
    id: 'mandala',
    name: '만다라',
    segments: 10,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#06031a';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0003;
      const cx = size * 0.5;
      const cy = size * 0.5;
      for (let ring = 1; ring < 9; ring++) {
        const radius = (ring / 9) * size * 0.55;
        const sides = ring * 3 + 3;
        const rot = t * (ring % 2 === 0 ? 1 : -1) * (0.3 + ring * 0.05);
        const hue = (ring * 36 + t * 60) % 360;
        ctx.strokeStyle = hsl(hue, 90, 60 + ring * 2, 0.85);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const a = (i / sides) * TAU + rot;
          const x = cx + Math.cos(a) * radius;
          const y = cy + Math.sin(a) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * TAU + rot;
          const x = cx + Math.cos(a) * radius;
          const y = cy + Math.sin(a) * radius;
          ctx.fillStyle = hsl(hue + 60, 100, 70, 0.9);
          ctx.beginPath();
          ctx.arc(x, y, 2 + ring * 0.4, 0, TAU);
          ctx.fill();
        }
      }
    },
  },
  {
    id: 'ripple',
    name: '물결',
    segments: 6,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#020616';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0009;
      const sources = 3;
      const r = rand(31);
      for (let s = 0; s < sources; s++) {
        const seed = r();
        const cx = (Math.sin(t * 0.4 + seed * 9) * 0.3 + 0.5) * size;
        const cy = (Math.cos(t * 0.5 + seed * 7) * 0.3 + 0.5) * size;
        const baseHue = (seed * 360 + t * 50) % 360;
        for (let ring = 0; ring < 8; ring++) {
          const phase = (t * 0.8 + seed + ring * 0.18) % 1;
          const radius = phase * size * 0.6;
          const alpha = Math.max(0, 1 - phase) * 0.6;
          ctx.strokeStyle = hsl(baseHue + ring * 12, 90, 60, alpha);
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, TAU);
          ctx.stroke();
        }
      }
    },
  },
  {
    id: 'neuron',
    name: '뉴런',
    segments: 11,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#04031a';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0005;
      const count = 22;
      const r = rand(53);
      const pts: { x: number; y: number; h: number }[] = [];
      for (let i = 0; i < count; i++) {
        const seed = r();
        const baseX = r();
        const baseY = r();
        pts.push({
          x: (baseX + Math.sin(t + seed * 9) * 0.15) * size,
          y: (baseY + Math.cos(t * 1.1 + seed * 7) * 0.15) * size,
          h: (seed * 360 + t * 80) % 360,
        });
      }
      const threshold = size * 0.22;
      ctx.lineWidth = 1;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const a = pts[i];
          const b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > threshold) continue;
          const alpha = (1 - d / threshold) * 0.7;
          ctx.strokeStyle = hsl((a.h + b.h) / 2, 90, 65, alpha);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      for (const p of pts) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
        glow.addColorStop(0, hsl(p.h, 100, 75, 1));
        glow.addColorStop(1, hsl(p.h, 100, 60, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, TAU);
        ctx.fill();
      }
    },
  },
  {
    id: 'comet',
    name: '혜성',
    segments: 9,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(4, 2, 14, 0.18)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0009;
      const r = rand(71);
      ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const seed = r();
        const a = t * (0.4 + seed) + seed * TAU;
        const radius = (0.2 + seed * 0.35) * size;
        const cx = size * 0.5 + Math.cos(a) * radius;
        const cy = size * 0.5 + Math.sin(a) * radius;
        const speed = 0.15 + seed * 0.2;
        const tx = cx - Math.cos(a) * size * speed;
        const ty = cy - Math.sin(a) * size * speed;
        const hue = (seed * 360 + t * 80) % 360;
        const grad = ctx.createLinearGradient(tx, ty, cx, cy);
        grad.addColorStop(0, hsl(hue, 100, 60, 0));
        grad.addColorStop(1, hsl(hue, 100, 75, 1));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3 + seed * 4;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.fillStyle = hsl(hue, 100, 85, 0.95);
        ctx.beginPath();
        ctx.arc(cx, cy, 3 + seed * 2, 0, TAU);
        ctx.fill();
      }
    },
  },
  {
    id: 'honeycomb',
    name: '벌집',
    segments: 6,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#06051a';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0008;
      const radius = size * 0.045;
      const dx = radius * Math.sqrt(3);
      const dy = radius * 1.5;
      const cols = Math.ceil(size / dx) + 1;
      const rows = Math.ceil(size / dy) + 1;
      const cxBase = size * 0.5;
      const cyBase = size * 0.5;
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const x = col * dx + (row % 2 ? dx / 2 : 0);
          const y = row * dy;
          const d = Math.hypot(x - cxBase, y - cyBase) / size;
          const pulse = Math.sin(d * 12 - t * 4) * 0.5 + 0.5;
          const hue = (d * 280 + t * 60) % 360;
          ctx.fillStyle = hsl(hue, 90, 35 + pulse * 35, 0.85);
          ctx.strokeStyle = hsl(hue + 40, 100, 70, 0.6);
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * TAU + Math.PI / 6;
            const px = x + Math.cos(a) * radius * (0.78 + pulse * 0.2);
            const py = y + Math.sin(a) * radius * (0.78 + pulse * 0.2);
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    },
  },
  {
    id: 'spiro',
    name: '회전초',
    segments: 8,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(4, 2, 18, 0.16)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0004;
      const cx = size * 0.5;
      const cy = size * 0.5;
      ctx.lineWidth = 1.4;
      for (let curve = 0; curve < 4; curve++) {
        const k = 3 + curve + Math.sin(t * 0.6 + curve) * 1.5;
        const baseHue = (curve * 90 + t * 50) % 360;
        ctx.beginPath();
        const steps = 220;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * TAU * 2;
          const r = size * 0.32 * Math.cos(k * theta + t + curve);
          const x = cx + Math.cos(theta + t * 0.4) * r;
          const y = cy + Math.sin(theta + t * 0.4) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = hsl(baseHue, 95, 65, 0.7);
        ctx.stroke();
      }
    },
  },
  {
    id: 'galaxy',
    name: '갤럭시',
    segments: 13,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(2, 2, 12, 0.22)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0003;
      const cx = size * 0.5;
      const cy = size * 0.5;
      const arms = 3;
      const r = rand(89);
      for (let i = 0; i < 220; i++) {
        const seed = r();
        const dist = Math.pow(seed, 0.6) * size * 0.55;
        const arm = i % arms;
        const theta = (arm / arms) * TAU + dist * 0.018 + t + seed * 0.4;
        const x = cx + Math.cos(theta) * dist;
        const y = cy + Math.sin(theta) * dist;
        const hue = 220 + dist / size * 200;
        const ps = 0.6 + seed * 2.2;
        ctx.fillStyle = hsl(hue, 90, 70 + seed * 20, 0.9);
        ctx.beginPath();
        ctx.arc(x, y, ps, 0, TAU);
        ctx.fill();
      }
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.18);
      core.addColorStop(0, hsl(40 + t * 20, 100, 80, 0.6));
      core.addColorStop(1, hsl(40 + t * 20, 100, 60, 0));
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.18, 0, TAU);
      ctx.fill();
    },
  },
  {
    id: 'rain',
    name: '레인',
    segments: 8,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(4, 4, 16, 0.28)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.001;
      const r = rand(101);
      ctx.lineCap = 'round';
      for (let i = 0; i < 36; i++) {
        const seed = r();
        const x = seed * size;
        const speed = 0.4 + seed * 0.8;
        const y = ((t * speed + seed * 3) % 1.2) * size;
        const len = size * 0.08 * (0.6 + seed);
        const hue = 180 + seed * 60;
        const grad = ctx.createLinearGradient(x, y - len, x, y);
        grad.addColorStop(0, hsl(hue, 80, 60, 0));
        grad.addColorStop(1, hsl(hue, 90, 80, 0.9));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2 + seed * 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y - len);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (y > size * 0.9 && seed > 0.6) {
          ctx.strokeStyle = hsl(hue, 90, 85, 0.5);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, size * 0.95, 4 + seed * 4, Math.PI, 0);
          ctx.stroke();
        }
      }
    },
  },
];
