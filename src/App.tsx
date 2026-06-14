import { useEffect, useRef, useState } from 'react';
import { renderKaleidoscope, SCENES, type Scene } from './kaleidoscope';

const SOURCE_SIZE = 512;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });
  const spinRef = useRef(0);
  const tiltRef = useRef(0);

  const scene: Scene = SCENES[sceneIdx];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!sourceRef.current) {
      const off = document.createElement('canvas');
      off.width = SOURCE_SIZE;
      off.height = SOURCE_SIZE;
      sourceRef.current = off;
    }
    const source = sourceRef.current;
    const sctx = source.getContext('2d')!;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let startTime = performance.now();
    let pausedAt = 0;
    let accumulatedPause = 0;

    const loop = (now: number) => {
      const time = paused ? pausedAt : now - startTime - accumulatedPause;

      scene.draw({
        ctx: sctx,
        time,
        size: SOURCE_SIZE,
        pointer: pointerRef.current,
      });

      spinRef.current += 0.0015 + tiltRef.current * 0.02;
      renderKaleidoscope(ctx, source, {
        segments: scene.segments,
        spin: spinRef.current,
      });

      raf = requestAnimationFrame(loop);
    };

    if (paused) {
      pausedAt = performance.now() - startTime - accumulatedPause;
    } else if (pausedAt) {
      accumulatedPause += performance.now() - startTime - accumulatedPause - pausedAt;
      pausedAt = 0;
    }

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [scene, paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      pointerRef.current = { x: nx, y: ny, active: e.buttons > 0 || e.pointerType === 'touch' };
      tiltRef.current = (nx - 0.5) * 2;
    };
    const onLeave = () => {
      pointerRef.current.active = false;
      tiltRef.current = 0;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const captureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `magic-mirror-${scene.id}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const goFullscreen = async () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) await el.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  return (
    <div className="app">
      <div className="stage">
        <div className="title">
          MAGIC MIRROR <strong>{scene.name}</strong>
        </div>
        <canvas ref={canvasRef} />
        <div className="hint">움직여서 회전 · 탭으로 캡처</div>
        <div className="toolbar">
          <button className="icon-btn" onClick={() => setPaused((p) => !p)} title="일시정지">
            {paused ? '▶' : '⏸'}
          </button>
          <button className="icon-btn" onClick={captureSnapshot} title="저장">
            ⤓
          </button>
          <button className="icon-btn" onClick={goFullscreen} title="전체화면">
            ⛶
          </button>
        </div>
      </div>
      <div className="controls">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            className={`chip ${i === sceneIdx ? 'active' : ''}`}
            onClick={() => setSceneIdx(i)}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
