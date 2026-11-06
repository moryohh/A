import React, { useEffect, useRef } from 'react';
import { clearFrame, composite, createFrame, createFx } from 'pixelfx';
import * as bigExplosion from 'pixelfx/fx/explosions/big-explosion';
import * as meteorImpact from 'pixelfx/fx/fire/meteor';
import * as lightningStrike from 'pixelfx/fx/lightning/lightning-strike';
import * as rocketProjectile from 'pixelfx/fx/projectiles/rocket';

export type TargetReactionKind = 'angry' | 'think' | 'laugh' | 'rocket';

const LABELS: Record<TargetReactionKind, string> = {
  angry: 'نيزك ناري يصيب الهدف',
  think: 'صاعقة برق تضرب الهدف',
  laugh: 'انفجار قنبلة',
  rocket: 'صاروخ متحرك',
};

const EFFECTS = {
  angry: { module: meteorImpact, width: 272, height: 232, x: 150, y: 208, duration: 5 },
  think: { module: lightningStrike, width: 240, height: 264, x: 120, y: 228, duration: 3 },
  laugh: { module: bigExplosion, width: 200, height: 140, x: 100, y: 101, duration: 2.2 },
  rocket: { module: rocketProjectile, width: 288, height: 76, x: 252, y: 42, duration: 1.7 },
} as const;

export function PixelReactionEffect({ kind, nonce, delayMs = 0 }: { kind: TargetReactionKind; nonce: number; delayMs?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const effect = EFFECTS[kind];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    canvas.width = effect.width;
    canvas.height = effect.height;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const frame = createFrame(effect.width, effect.height);
    const image = ctx.createImageData(effect.width, effect.height);
    const fx = createFx(effect.module, {
      x: effect.x,
      y: effect.y,
      seed: Math.max(1, nonce % 997),
    });
    let raf = 0;
    let delayTimer = 0;
    let previous = performance.now();
    let elapsed = 0;
    const duration = reducedMotion ? Math.min(1.2, effect.duration) : effect.duration;

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
      ctx.clearRect(0, 0, effect.width, effect.height);
      ctx.putImageData(image, 0, 0);
      if (elapsed < duration) raf = requestAnimationFrame(render);
    };
    const start = () => {
      previous = performance.now();
      raf = requestAnimationFrame(render);
    };
    if (delayMs > 0) delayTimer = window.setTimeout(start, delayMs);
    else start();
    return () => {
      window.clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
    };
  }, [delayMs, kind, nonce]);

  return (
    <div aria-label={LABELS[kind]} data-vfx-source={kind === 'angry' ? 'pixelfx-meteor' : kind === 'think' ? 'pixelfx-lightning-strike' : kind === 'rocket' ? 'pixelfx-rocket' : 'pixelfx-big-explosion'} className={`relative h-full w-full overflow-visible gibha-vfx-${kind}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain [image-rendering:pixelated]" />
    </div>
  );
}
