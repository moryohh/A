import React, { useEffect, useRef } from 'react';
import { clearFrame, composite, createFrame, createFx } from 'pixelfx';
import * as bigExplosion from 'pixelfx/fx/explosions/big-explosion';

export type TargetReactionKind = 'angry' | 'think' | 'laugh';

const LABELS: Record<TargetReactionKind, string> = {
  angry: 'هجوم ناري واضح',
  think: 'صاعقة برق واضحة',
  laugh: 'انفجار قنبلة',
};

const PALETTES: Record<TargetReactionKind, string[]> = {
  angry: ['#2b0505', '#7f1010', '#d92310', '#ff5a14', '#ff9d21', '#ffd55a', '#fff2b0', '#ffffff'],
  think: ['#07133d', '#1237a6', '#176bff', '#35b8ff', '#6ee7ff', '#baf7ff', '#e9fdff', '#ffffff'],
  laugh: ['#2b1010', '#7a1c14', '#d43d1c', '#ff7a21', '#ffb72f', '#ffe16a', '#fff1b8', '#ffffff'],
};

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
    const fx = createFx(bigExplosion, {
      x: width / 2,
      y: height * 0.72,
      seed: Math.max(1, nonce % 997),
      palette: PALETTES[kind],
      light: kind === 'think' ? 1.35 : 1.1,
    });
    let raf = 0;
    let previous = performance.now();
    let elapsed = 0;
    const duration = reducedMotion ? 0.45 : 2.2;

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

  return (
    <div aria-label={LABELS[kind]} className={`gibha-guaranteed-vfx relative h-full w-full overflow-visible gibha-vfx-${kind}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
      {kind === 'think' && <div className="pointer-events-none absolute inset-0"><span className="gibha-electric-flash" /><span className="gibha-bolt gibha-bolt-one" /><span className="gibha-bolt gibha-bolt-two" /><span className="gibha-bolt gibha-bolt-three" /><span className="gibha-electric-ring" /></div>}
      {kind === 'angry' && <div className="pointer-events-none absolute inset-0"><span className="gibha-fireball-core" /><span className="gibha-fire-tail gibha-fire-tail-one" /><span className="gibha-fire-tail gibha-fire-tail-two" /><span className="gibha-fire-impact-ring" />{Array.from({ length: 7 }, (_, index) => <span key={index} className={`gibha-fire-ember gibha-fire-ember-${index + 1}`} />)}</div>}
      <style>{`
        .gibha-electric-flash{position:absolute;inset:10% 12%;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(71,211,255,.48) 24%,rgba(35,91,255,.12) 55%,transparent 72%);animation:gibhaElectricFlash 1.8s ease-out both;mix-blend-mode:screen}
        .gibha-bolt{position:absolute;top:-8%;width:22px;height:92%;background:linear-gradient(180deg,#fff 0%,#baf7ff 34%,#35b8ff 72%,#176bff 100%);clip-path:polygon(52% 0,100% 0,67% 37%,92% 37%,28% 100%,45% 52%,12% 52%);filter:drop-shadow(0 0 5px #fff) drop-shadow(0 0 12px #35b8ff);opacity:0;transform-origin:50% 0}
        .gibha-bolt-one{left:44%;animation:gibhaBoltStrike 1.55s .04s cubic-bezier(.2,.8,.2,1) both}.gibha-bolt-two{left:25%;height:66%;transform:rotate(-14deg) scale(.72);animation:gibhaBoltStrike 1.55s .22s cubic-bezier(.2,.8,.2,1) both}.gibha-bolt-three{right:20%;height:58%;transform:rotate(16deg) scale(.64);animation:gibhaBoltStrike 1.55s .38s cubic-bezier(.2,.8,.2,1) both}
        .gibha-electric-ring{position:absolute;left:50%;bottom:12%;width:92px;height:30px;border:3px solid #a5f3fc;border-radius:50%;filter:drop-shadow(0 0 9px #22d3ee);animation:gibhaElectricRing 1.7s .12s ease-out both}
        .gibha-fireball-core{position:absolute;left:50%;top:54%;width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 65% 35%,#fff 0 9%,#fff3a6 10% 22%,#ffb72f 34%,#ff5a14 58%,#9f1710 78%,transparent 79%);filter:drop-shadow(0 0 9px #fff3a6) drop-shadow(0 0 18px #ff5a14);animation:gibhaFireball 2.05s cubic-bezier(.18,.76,.22,1) both;z-index:4}
        .gibha-fire-tail{position:absolute;left:8%;top:62%;height:18px;border-radius:999px;transform-origin:right center;filter:blur(1px) drop-shadow(0 0 8px #ff7a21);opacity:0}.gibha-fire-tail-one{width:96px;background:linear-gradient(90deg,transparent,#d92310 35%,#ff7a21 70%,#fff2b0);animation:gibhaFireTail 2.05s ease-out both}.gibha-fire-tail-two{top:54%;width:72px;background:linear-gradient(90deg,transparent,#7f1010 28%,#ff5a14 72%,#ffd55a);animation:gibhaFireTail 2.05s .1s ease-out both}
        .gibha-fire-impact-ring{position:absolute;left:52%;top:55%;width:38px;height:38px;border:4px solid #ffd55a;border-radius:50%;opacity:0;filter:drop-shadow(0 0 10px #ff5a14);animation:gibhaFireImpact 1.2s .7s ease-out both}
        .gibha-fire-ember{position:absolute;left:60%;top:62%;width:7px;height:7px;border-radius:50%;background:#ffd55a;box-shadow:0 0 8px #ff5a14;opacity:0;animation:gibhaFireEmber 1.45s .72s ease-out both}.gibha-fire-ember-2{--ex:42px;--ey:-38px}.gibha-fire-ember-3{--ex:-36px;--ey:-42px}.gibha-fire-ember-4{--ex:52px;--ey:8px}.gibha-fire-ember-5{--ex:-46px;--ey:14px}.gibha-fire-ember-6{--ex:20px;--ey:38px}.gibha-fire-ember-7{--ex:-22px;--ey:42px}
        @keyframes gibhaElectricFlash{0%{opacity:0;transform:scale(.25)}14%{opacity:1;transform:scale(1.08)}28%{opacity:.15}40%{opacity:.9}70%{opacity:.35}100%{opacity:0;transform:scale(1.22)}}@keyframes gibhaBoltStrike{0%{opacity:0;transform:translateY(-24px) scaleY(.2)}12%{opacity:1;transform:translateY(0) scaleY(1.06)}24%{opacity:.28}36%{opacity:1}68%{opacity:.65}100%{opacity:0;transform:translateY(8px) scaleY(.92)}}@keyframes gibhaElectricRing{0%{opacity:0;transform:translateX(-50%) scale(.25)}20%{opacity:1}100%{opacity:0;transform:translateX(-50%) scale(1.65)}}
        @keyframes gibhaFireball{0%{opacity:0;transform:translate(-150px,-28px) scale(.35) rotate(-18deg)}18%{opacity:1}58%{transform:translate(-10px,0) scale(1) rotate(0)}72%{transform:translate(-5px,0) scale(1.32)}100%{opacity:0;transform:translate(-5px,0) scale(1.75)}}@keyframes gibhaFireTail{0%{opacity:0;transform:translateX(-45px) scaleX(.2)}20%{opacity:1}62%{opacity:.95;transform:translateX(18px) scaleX(1)}100%{opacity:0;transform:translateX(80px) scaleX(.18)}}@keyframes gibhaFireImpact{0%{opacity:0;transform:scale(.2)}24%{opacity:1}100%{opacity:0;transform:scale(2.3)}}@keyframes gibhaFireEmber{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--ex,34px),var(--ey,-30px)) scale(.25)}}
      `}</style>
    </div>
  );
}
