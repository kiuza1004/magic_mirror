import { useCallback, useEffect, useRef, useState } from 'react';
import { renderKaleidoscope, SCENES, type Scene } from './kaleidoscope';
import { isAudioOn, SCENE_TO_SCALE, setAudioScale, startAudio, stopAudio } from './audio';

const SOURCE_SIZE = 512;
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [idle, setIdle] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });
  const spinRef = useRef(0);
  const tiltRef = useRef(0);
  const idleTimerRef = useRef<number | null>(null);

  const scene: Scene = SCENES[sceneIdx];

  const resetIdle = useCallback(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    setIdle(false);
    idleTimerRef.current = window.setTimeout(() => {
      setIdle(true);
      setPaused(true);
    }, IDLE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    resetIdle();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [resetIdle, sceneIdx]);

  useEffect(() => {
    if (audioOn) setAudioScale(SCENE_TO_SCALE[scene.id] ?? 'cool');
  }, [audioOn, scene.id]);

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
      const parent = canvas.parentElement;
      const w = canvas.clientWidth || parent?.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || parent?.clientHeight || window.innerHeight;
      const pw = Math.max(1, Math.floor(w * dpr));
      const ph = Math.max(1, Math.floor(h * dpr));
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
    };
    resize();
    window.addEventListener('resize', resize);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const startTime = performance.now();
    let pausedAt = paused ? 0 : -1;
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

    if (paused) pausedAt = performance.now() - startTime - accumulatedPause;
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      ro.disconnect();
    };
  }, [scene, paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      pointerRef.current = { x: nx, y: (e.clientY - rect.top) / rect.height, active: e.buttons > 0 || e.pointerType === 'touch' };
      tiltRef.current = (nx - 0.5) * 2;
      resetIdle();
    };
    const onLeave = () => {
      pointerRef.current.active = false;
      tiltRef.current = 0;
    };
    const onKey = () => resetIdle();
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    window.addEventListener('keydown', onKey);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('keydown', onKey);
    };
  }, [resetIdle]);

  const captureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `magic-mirror-${scene.id}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const goFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  const toggleAudio = async () => {
    if (isAudioOn()) {
      stopAudio();
      setAudioOn(false);
    } else {
      await startAudio(SCENE_TO_SCALE[scene.id] ?? 'cool');
      setAudioOn(true);
    }
  };

  const resume = () => {
    setIdle(false);
    setPaused(false);
    resetIdle();
  };

  return (
    <div className="app">
      <div className="stage">
        <div className="title">
          MAGIC MIRROR <strong>{scene.name}</strong>
        </div>
        <canvas ref={canvasRef} />
        <div className="hint">움직여서 회전 · 15분 비활성 시 자동 정지</div>
        <div className="toolbar">
          <button className="icon-btn" onClick={() => { setPaused((p) => !p); resetIdle(); }} title="일시정지">
            {paused ? '▶' : '⏸'}
          </button>
          <button className="icon-btn" onClick={toggleAudio} title="음악">
            {audioOn ? '♪' : '♩'}
          </button>
          <button className="icon-btn" onClick={captureSnapshot} title="저장">
            ⤓
          </button>
          <button className="icon-btn" onClick={goFullscreen} title="전체화면">
            ⛶
          </button>
        </div>
        {idle && (
          <div className="idle-overlay" onClick={resume}>
            <div className="idle-card">
              <div className="idle-eye">⏾</div>
              <div className="idle-title">REST MODE</div>
              <div className="idle-sub">15분 동안 조작이 없어 자동으로 정지했어요.</div>
              <button className="resume-btn" onClick={resume}>다시 시작</button>
            </div>
          </div>
        )}
      </div>
      <div className="controls">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            className={`chip ${i === sceneIdx ? 'active' : ''}`}
            onClick={() => { setSceneIdx(i); resetIdle(); }}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
