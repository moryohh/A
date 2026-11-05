declare module 'pixelfx' {
  export type PixelFxInstance = { update: (dt: number) => void; draw: (frame: unknown, layer?: string) => void; done?: boolean };
  export function createFrame(width: number, height: number): unknown;
  export function clearFrame(frame: unknown): void;
  export function createFx(effect: unknown, options?: Record<string, unknown>): PixelFxInstance;
  export function composite(frame: unknown, pixels: Uint8ClampedArray, background?: number): void;
}

declare module 'pixelfx/fx/*' {
  const effect: unknown;
  export = effect;
}
