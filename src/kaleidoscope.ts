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
  {
    id: 'butterfly',
    name: '나비',
    segments: 12,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(6, 2, 18, 0.18)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0006;
      const cx = size * 0.5;
      const cy = size * 0.5;
      ctx.lineWidth = 1.2;
      for (let layer = 0; layer < 3; layer++) {
        const offset = layer * 0.4 + t;
        const hue = (layer * 120 + t * 60) % 360;
        ctx.strokeStyle = hsl(hue, 90, 65, 0.75);
        ctx.beginPath();
        const steps = 260;
        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * TAU * 6;
          const r =
            (Math.exp(Math.cos(theta + offset)) -
              2 * Math.cos(4 * theta) -
              Math.pow(Math.sin(theta / 12 + t * 0.3), 5)) *
            size *
            0.07;
          const x = cx + Math.sin(theta) * r;
          const y = cy - Math.cos(theta) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  },
  {
    id: 'circuit',
    name: '회로',
    segments: 4,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#03060a';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0008;
      const grid = 9;
      const cell = size / grid;
      const r = rand(127);
      ctx.lineWidth = 1.4;
      const traces: { x: number; y: number; dir: 0 | 1 }[] = [];
      for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
          if (r() < 0.55) traces.push({ x: i, y: j, dir: r() < 0.5 ? 0 : 1 });
        }
      }
      ctx.strokeStyle = 'rgba(80, 220, 200, 0.35)';
      for (const tr of traces) {
        const sx = tr.x * cell + cell * 0.5;
        const sy = tr.y * cell + cell * 0.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        if (tr.dir === 0) ctx.lineTo(sx + cell, sy);
        else ctx.lineTo(sx, sy + cell);
        ctx.stroke();
      }
      for (let i = 0; i < traces.length; i++) {
        const tr = traces[i];
        const sx = tr.x * cell + cell * 0.5;
        const sy = tr.y * cell + cell * 0.5;
        const phase = (t + i * 0.13) % 1;
        const px = tr.dir === 0 ? sx + cell * phase : sx;
        const py = tr.dir === 1 ? sy + cell * phase : sy;
        const hue = (i * 17 + t * 80) % 360;
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 14);
        glow.addColorStop(0, hsl(hue, 100, 75, 1));
        glow.addColorStop(1, hsl(hue, 100, 60, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, TAU);
        ctx.fill();
      }
    },
  },
  {
    id: 'ink',
    name: '잉크',
    segments: 5,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(248, 246, 232, 0.06)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0004;
      const r = rand(199);
      for (let i = 0; i < 8; i++) {
        const seed = r();
        const cycle = (t + seed) % 1.5;
        if (cycle > 1.3) continue;
        const cx = r() * size;
        const cy = r() * size;
        const maxR = size * (0.05 + r() * 0.25);
        const radius = maxR * (1 - Math.pow(1 - cycle / 1.3, 2));
        const alpha = (1 - cycle / 1.3) * 0.55;
        const hue = (seed * 360 + t * 40) % 360;
        ctx.fillStyle = hsl(hue, 70, 18, alpha);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, TAU);
        ctx.fill();
        for (let drip = 0; drip < 4; drip++) {
          const a = drip / 4 * TAU + seed * 9;
          const dr = radius * (1 + r() * 0.4);
          ctx.fillStyle = hsl(hue, 70, 22, alpha * 0.7);
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * dr, cy + Math.sin(a) * dr, radius * 0.35, 0, TAU);
          ctx.fill();
        }
      }
    },
  },
  {
    id: 'vortex',
    name: '소용돌이',
    segments: 14,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(2, 4, 14, 0.18)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0008;
      const cx = size * 0.5;
      const cy = size * 0.5;
      const r = rand(233);
      for (let i = 0; i < 120; i++) {
        const seed = r();
        const lifetime = (t * (0.4 + seed) + seed) % 1;
        const dist = (1 - lifetime) * size * 0.5;
        const theta = lifetime * TAU * 4 + seed * TAU + t;
        const x = cx + Math.cos(theta) * dist;
        const y = cy + Math.sin(theta) * dist;
        const hue = 270 + seed * 80 + t * 40;
        const alpha = lifetime * 0.9;
        ctx.fillStyle = hsl(hue, 95, 65, alpha);
        ctx.beginPath();
        ctx.arc(x, y, 1.4 + seed * 1.8, 0, TAU);
        ctx.fill();
      }
      const eye = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.12);
      eye.addColorStop(0, 'rgba(0,0,0,0.95)');
      eye.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eye;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.12, 0, TAU);
      ctx.fill();
    },
  },
  {
    id: 'forest',
    name: '숲',
    segments: 6,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#04120a';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0003;
      const branch = (
        x: number,
        y: number,
        angle: number,
        len: number,
        depth: number,
        hueBase: number,
      ) => {
        if (depth === 0 || len < 3) return;
        const x2 = x + Math.cos(angle) * len;
        const y2 = y + Math.sin(angle) * len;
        ctx.strokeStyle = hsl(hueBase + depth * 15, 70, 25 + depth * 8, 0.85);
        ctx.lineWidth = depth * 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const sway = Math.sin(t * 2 + depth) * 0.15;
        branch(x2, y2, angle - 0.55 + sway, len * 0.72, depth - 1, hueBase);
        branch(x2, y2, angle + 0.55 + sway, len * 0.72, depth - 1, hueBase);
      };
      for (let i = 0; i < 4; i++) {
        const rootX = ((i + 0.5) / 4) * size;
        const tilt = Math.sin(t + i) * 0.2;
        branch(rootX, size, -Math.PI / 2 + tilt, size * 0.18, 7, 100 + i * 25);
      }
    },
  },
  {
    id: 'stipple',
    name: '점묘',
    segments: 16,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#0a0418';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0005;
      const cols = 32;
      const rows = 32;
      const cell = size / cols;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const nx = i / cols;
          const ny = j / rows;
          const v =
            Math.sin(nx * 5 + t) +
            Math.cos(ny * 7 - t * 1.3) +
            Math.sin((nx + ny) * 4 + t * 0.8);
          const radius = (v * 0.25 + 0.6) * cell * 0.45;
          if (radius < 0.4) continue;
          const hue = (v * 80 + t * 50 + 200) % 360;
          ctx.fillStyle = hsl(hue, 90, 65, 0.9);
          ctx.beginPath();
          ctx.arc(i * cell + cell / 2, j * cell + cell / 2, radius, 0, TAU);
          ctx.fill();
        }
      }
    },
  },
  {
    id: 'lightning',
    name: '번개',
    segments: 6,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(2, 4, 18, 0.32)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.001;
      const bolts = 3;
      for (let b = 0; b < bolts; b++) {
        const phase = (t + b * 0.45) % 1;
        if (phase > 0.4) continue;
        const r = rand(b * 53 + Math.floor((t + b * 0.45) / 1) * 11);
        const startX = r() * size;
        const alpha = (1 - phase / 0.4) * 0.9;
        const hue = 180 + r() * 80;
        ctx.shadowColor = hsl(hue, 100, 80, 0.9);
        ctx.shadowBlur = 18;
        const draw = (x: number, y: number, dx: number, dy: number, depth: number) => {
          if (depth === 0) return;
          const x2 = x + dx + (r() - 0.5) * size * 0.06;
          const y2 = y + dy + (r() - 0.3) * size * 0.04;
          ctx.strokeStyle = hsl(hue, 100, 90, alpha * (depth / 6));
          ctx.lineWidth = depth * 0.45;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          draw(x2, y2, dx, dy, depth - 1);
          if (r() < 0.4 && depth > 2)
            draw(x2, y2, dx * 0.6 + (r() - 0.5) * size * 0.05, dy * 0.6, depth - 2);
        };
        draw(startX, 0, 0, size * 0.16, 6);
        ctx.shadowBlur = 0;
      }
    },
  },
  {
    id: 'solar',
    name: '태양',
    segments: 16,
    draw({ ctx, time, size }) {
      const t = time * 0.0006;
      const cx = size * 0.5;
      const cy = size * 0.5;
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.7);
      bg.addColorStop(0, '#2a0a04');
      bg.addColorStop(1, '#04020a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
      const flares = 32;
      for (let i = 0; i < flares; i++) {
        const a = (i / flares) * TAU + t * 0.4;
        const len = size * (0.25 + Math.sin(t * 2 + i * 0.7) * 0.08);
        const hue = 25 + Math.sin(t + i * 0.3) * 30;
        const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        grad.addColorStop(0, hsl(hue, 100, 75, 0.85));
        grad.addColorStop(1, hsl(hue, 100, 50, 0));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 4 + Math.sin(t * 3 + i) * 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        ctx.stroke();
      }
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.2);
      core.addColorStop(0, '#fff6c0');
      core.addColorStop(0.4, hsl(35, 100, 65, 1));
      core.addColorStop(1, hsl(20, 100, 40, 0));
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.2, 0, TAU);
      ctx.fill();
    },
  },
  {
    id: 'interference',
    name: '파동',
    segments: 8,
    draw({ ctx, time, size }) {
      const t = time * 0.001;
      const step = 6;
      const cols = Math.ceil(size / step);
      const rows = Math.ceil(size / step);
      const s1x = size * (0.3 + Math.sin(t * 0.5) * 0.1);
      const s1y = size * (0.4 + Math.cos(t * 0.4) * 0.1);
      const s2x = size * (0.7 + Math.sin(t * 0.6 + 2) * 0.1);
      const s2y = size * (0.6 + Math.cos(t * 0.5 + 1) * 0.1);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * step;
          const y = j * step;
          const d1 = Math.hypot(x - s1x, y - s1y);
          const d2 = Math.hypot(x - s2x, y - s2y);
          const v = Math.sin(d1 * 0.08 - t * 3) + Math.sin(d2 * 0.08 - t * 3);
          const hue = (v * 70 + t * 60 + 200) % 360;
          const l = 40 + Math.abs(v) * 20;
          ctx.fillStyle = hsl(hue, 85, l);
          ctx.fillRect(x, y, step + 1, step + 1);
        }
      }
    },
  },
  {
    id: 'ice',
    name: '얼음',
    segments: 12,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#040814';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0003;
      const r = rand(311);
      ctx.lineJoin = 'round';
      for (let i = 0; i < 20; i++) {
        const seed = r();
        const cx = (Math.sin(t * 0.3 + seed * 9) * 0.4 + 0.5) * size;
        const cy = (Math.cos(t * 0.25 + seed * 7) * 0.4 + 0.5) * size;
        const radius = (0.06 + seed * 0.18) * size;
        const rot = t * (0.2 + seed * 0.5) + seed * 6;
        const hue = 190 + seed * 40;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        const grad = ctx.createLinearGradient(-radius, 0, radius, 0);
        grad.addColorStop(0, hsl(hue, 80, 70, 0.25));
        grad.addColorStop(0.5, hsl(hue, 100, 85, 0.7));
        grad.addColorStop(1, hsl(hue + 30, 70, 60, 0.25));
        ctx.fillStyle = grad;
        ctx.strokeStyle = hsl(hue, 100, 90, 0.6);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius * 0.5, -radius * 0.2);
        ctx.lineTo(radius, radius * 0.3);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius, radius * 0.3);
        ctx.lineTo(-radius * 0.5, -radius * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    },
  },
  {
    id: 'peacock',
    name: '공작',
    segments: 10,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#021018';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0004;
      const cx = size * 0.5;
      const cy = size * 0.5;
      const rings = 4;
      const perRing = 12;
      for (let ring = 1; ring <= rings; ring++) {
        const radius = (ring / rings) * size * 0.42;
        const eyeSize = size * 0.05 * (1 - ring * 0.12);
        for (let i = 0; i < perRing; i++) {
          const a = (i / perRing) * TAU + t * (ring % 2 ? 1 : -1) * 0.5;
          const x = cx + Math.cos(a) * radius;
          const y = cy + Math.sin(a) * radius;
          const hue = (a * 60 + ring * 40) % 360;
          const outer = ctx.createRadialGradient(x, y, 0, x, y, eyeSize);
          outer.addColorStop(0, hsl(hue, 90, 70, 0.9));
          outer.addColorStop(0.5, hsl(hue + 60, 95, 50, 0.85));
          outer.addColorStop(1, hsl(hue + 120, 80, 30, 0.3));
          ctx.fillStyle = outer;
          ctx.beginPath();
          ctx.ellipse(x, y, eyeSize, eyeSize * 1.5, a + Math.PI / 2, 0, TAU);
          ctx.fill();
          ctx.fillStyle = hsl(hue + 180, 100, 20, 0.95);
          ctx.beginPath();
          ctx.arc(x, y, eyeSize * 0.35, 0, TAU);
          ctx.fill();
        }
      }
    },
  },
  {
    id: 'checker',
    name: '체크',
    segments: 8,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#06061a';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0006;
      const cells = 12;
      const cell = size / cells;
      const cx = size * 0.5;
      const cy = size * 0.5;
      for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
          if ((i + j) % 2 !== 0) continue;
          const x = i * cell;
          const y = j * cell;
          const d = Math.hypot(x + cell / 2 - cx, y + cell / 2 - cy) / size;
          const wave = Math.sin(d * 12 - t * 3) * 0.5 + 0.5;
          const scale = 0.45 + wave * 0.5;
          const hue = (d * 320 + t * 80) % 360;
          ctx.fillStyle = hsl(hue, 90, 50 + wave * 30, 0.9);
          ctx.save();
          ctx.translate(x + cell / 2, y + cell / 2);
          ctx.rotate(t + d * 3);
          ctx.fillRect(-cell * scale / 2, -cell * scale / 2, cell * scale, cell * scale);
          ctx.restore();
        }
      }
    },
  },
  {
    id: 'snowflake',
    name: '눈송이',
    segments: 12,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#04081a';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0003;
      const r = rand(347);
      ctx.lineCap = 'round';
      for (let f = 0; f < 5; f++) {
        const seed = r();
        const cx = (Math.sin(t * 0.3 + seed * 9) * 0.35 + 0.5) * size;
        const cy = (Math.cos(t * 0.25 + seed * 7) * 0.35 + 0.5) * size;
        const armLen = (0.07 + seed * 0.1) * size;
        const rot = t * (0.4 + seed) + seed * 6;
        const hue = 190 + seed * 60;
        ctx.strokeStyle = hsl(hue, 90, 80, 0.85);
        ctx.lineWidth = 1.4;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        for (let arm = 0; arm < 6; arm++) {
          ctx.save();
          ctx.rotate((arm / 6) * TAU);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(armLen, 0);
          ctx.stroke();
          for (let s = 1; s <= 3; s++) {
            const sx = (s / 4) * armLen;
            const branch = armLen * (0.35 - s * 0.07);
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx + branch * Math.cos(Math.PI / 3), branch * Math.sin(Math.PI / 3));
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx + branch * Math.cos(-Math.PI / 3), branch * Math.sin(-Math.PI / 3));
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.fillStyle = hsl(hue, 100, 90, 0.95);
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    },
  },
  {
    id: 'dna',
    name: 'DNA',
    segments: 6,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#040414';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0008;
      const steps = 60;
      const amp = size * 0.18;
      const cx = size * 0.5;
      ctx.lineWidth = 2.4;
      for (let strand = 0; strand < 2; strand++) {
        const phase = strand === 0 ? 0 : Math.PI;
        const hue = strand === 0 ? 200 : 320;
        ctx.strokeStyle = hsl(hue, 90, 65, 0.9);
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const y = (i / steps) * size;
          const x = cx + Math.sin(i * 0.3 + t + phase) * amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let i = 0; i < steps; i += 3) {
        const y = (i / steps) * size;
        const x1 = cx + Math.sin(i * 0.3 + t) * amp;
        const x2 = cx + Math.sin(i * 0.3 + t + Math.PI) * amp;
        const depth = (Math.sin(i * 0.3 + t) + 1) * 0.5;
        const hue = (i * 8 + t * 60) % 360;
        ctx.strokeStyle = hsl(hue, 90, 55 + depth * 25, 0.5 + depth * 0.4);
        ctx.lineWidth = 1.2 + depth * 1.4;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      }
    },
  },
  {
    id: 'constellation',
    name: '별자리',
    segments: 9,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(2, 2, 14, 0.16)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0003;
      const count = 18;
      const r = rand(401);
      const pts: { x: number; y: number; tw: number }[] = [];
      for (let i = 0; i < count; i++) {
        const seed = r();
        const baseX = r();
        const baseY = r();
        pts.push({
          x: (baseX + Math.sin(t + seed * 9) * 0.04) * size,
          y: (baseY + Math.cos(t * 1.1 + seed * 7) * 0.04) * size,
          tw: Math.sin(t * 4 + seed * 12) * 0.5 + 0.5,
        });
      }
      ctx.strokeStyle = 'rgba(150, 200, 255, 0.4)';
      ctx.lineWidth = 0.7;
      for (let i = 0; i < count - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const p of pts) {
        const radius = 1.5 + p.tw * 3.5;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4);
        glow.addColorStop(0, `rgba(255, 255, 255, ${0.4 + p.tw * 0.6})`);
        glow.addColorStop(0.4, `rgba(180, 200, 255, ${0.2 + p.tw * 0.3})`);
        glow.addColorStop(1, 'rgba(120, 160, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 4, 0, TAU);
        ctx.fill();
      }
    },
  },
  {
    id: 'dandelion',
    name: '민들레',
    segments: 15,
    draw({ ctx, time, size }) {
      ctx.fillStyle = 'rgba(8, 8, 22, 0.16)';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0006;
      const cx = size * 0.5;
      const cy = size * 0.5;
      const seeds = 90;
      const r = rand(457);
      for (let i = 0; i < seeds; i++) {
        const seed = r();
        const phase = (t * (0.3 + seed * 0.6) + seed) % 1;
        const dist = phase * size * 0.5;
        const angle = seed * TAU + Math.sin(t + seed * 4) * 0.4;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist + phase * size * 0.05;
        const alpha = Math.max(0, 1 - phase) * 0.9;
        ctx.strokeStyle = `rgba(220, 230, 250, ${alpha * 0.6})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * TAU;
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4);
        }
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 240, 200, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, TAU);
        ctx.fill();
      }
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.08);
      core.addColorStop(0, 'rgba(200, 180, 120, 0.9)');
      core.addColorStop(1, 'rgba(120, 80, 40, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.08, 0, TAU);
      ctx.fill();
    },
  },
  {
    id: 'iris',
    name: '눈동자',
    segments: 10,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#080614';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0005;
      const cx = size * 0.5;
      const cy = size * 0.5;
      const irisR = size * 0.4;
      const sclera = ctx.createRadialGradient(cx, cy, irisR * 0.4, cx, cy, irisR);
      sclera.addColorStop(0, hsl(180 + t * 60, 70, 35, 1));
      sclera.addColorStop(0.7, hsl(220 + t * 60, 80, 25, 1));
      sclera.addColorStop(1, hsl(260 + t * 60, 60, 12, 1));
      ctx.fillStyle = sclera;
      ctx.beginPath();
      ctx.arc(cx, cy, irisR, 0, TAU);
      ctx.fill();
      const stripes = 64;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < stripes; i++) {
        const a = (i / stripes) * TAU + t * 0.3;
        const r1 = size * 0.1;
        const r2 = irisR * (0.85 + Math.sin(i * 0.7 + t * 2) * 0.1);
        const hue = (180 + i * 4 + t * 60) % 360;
        ctx.strokeStyle = hsl(hue, 80, 55, 0.6);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
      }
      const pupilR = size * (0.07 + Math.sin(t * 1.5) * 0.025);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, pupilR, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(cx - pupilR * 0.4, cy - pupilR * 0.4, pupilR * 0.3, 0, TAU);
      ctx.fill();
    },
  },
  {
    id: 'web',
    name: '거미줄',
    segments: 12,
    draw({ ctx, time, size }) {
      ctx.fillStyle = '#03031a';
      ctx.fillRect(0, 0, size, size);
      const t = time * 0.0003;
      const cx = size * 0.5;
      const cy = size * 0.5;
      const spokes = 16;
      const rings = 8;
      const maxR = size * 0.5;
      ctx.strokeStyle = 'rgba(220, 220, 240, 0.5)';
      ctx.lineWidth = 0.8;
      for (let s = 0; s < spokes; s++) {
        const a = (s / spokes) * TAU + t * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
        ctx.stroke();
      }
      for (let ring = 1; ring <= rings; ring++) {
        const baseR = (ring / rings) * maxR;
        ctx.beginPath();
        for (let s = 0; s <= spokes; s++) {
          const a = (s / spokes) * TAU + t * 0.3;
          const sag = Math.sin(t * 2 + ring + s) * 4;
          const r2 = baseR + sag;
          const x = cx + Math.cos(a) * r2;
          const y = cy + Math.sin(a) * r2;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      const r = rand(503);
      for (let i = 0; i < 3; i++) {
        const ring = 2 + Math.floor(r() * (rings - 2));
        const spoke = Math.floor(r() * spokes);
        const a = (spoke / spokes) * TAU + t * 0.3;
        const baseR = (ring / rings) * maxR;
        const x = cx + Math.cos(a) * baseR;
        const y = cy + Math.sin(a) * baseR;
        const hue = (i * 120 + t * 80) % 360;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 12);
        glow.addColorStop(0, hsl(hue, 100, 70, 1));
        glow.addColorStop(1, hsl(hue, 100, 50, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, TAU);
        ctx.fill();
      }
    },
  },
];
