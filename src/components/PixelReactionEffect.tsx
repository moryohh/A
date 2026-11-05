import React, { useEffect, useRef } from 'react';
import { clearFrame, composite, createFrame, createFx } from 'pixelfx';
import * as fireTornado from 'pixelfx/fx/fire/fire-tornado';
import * as zapHit from 'pixelfx/fx/lightning/zap-hit';
import * as bigExplosion from 'pixelfx/fx/explosions/big-explosion';

export type TargetReactionKind = 'angry' | 'think' | 'laugh';

const EFFECTS = { angry: fireTornado, think: zapHit, laugh: bigExplosion } as const;
const LABELS: Record<TargetReactionKind, string> = { angry: 'هجوم بكرة نار', think: 'صاعقة برق', laugh: 'انفجار قنبلة' };

export function PixelReactionEffect({ kind, nonce }: { kind: TargetReactionKind; nonce: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const width = 200;
    const height = 140;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const frame = createFrame(width, height);
    const image = ctx.createImageData(width, height);
    const fx = createFx(EFFECTS[kind], {
      x: width / 2,
      y: kind === 'laugh' ? height * 0.72 : kind === 'angry' ? height * 0.88 : height * 0.52,
      seed: Math.max(1, nonce % 997),
    });
    let raf = 0;
    let previous = performance.now();
    let elapsed = 0;
    const duration = reducedMotion ? 0.4 : kind === 'laugh' ? 2.15 : kind === 'think' ? 1.05 : 2.4;

    const render = (now: number) => {
      const dt = Math.min(0.034, Math.max(0, (now - previous) / 1000));
      previous = now;
      elapsed += dt;
      fx.update(dt);
      clearFrame(frame);
      fx.draw(frame, 'back');
      fx.draw(frame, 'front');
      image.data.fill(0);
      composite(frame, image.data);
      ctx.clearRect(0, 0, width, height);
      ctx.putImageData(image, 0, 0);
      if (elapsed < duration) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [kind, nonce]);

  return <canvas ref={canvasRef} aria-label={LABELS[kind]} className="h-full w-full [image-rendering:pixelated]" />;
}
