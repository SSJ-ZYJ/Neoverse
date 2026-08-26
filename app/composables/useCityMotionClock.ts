export const CITY_MOTION_DURATION = 24_000;
export const CITY_MOTION_INITIAL_SCALE = 1.05;
const CITY_MOTION_SEGMENTS = 64;

export interface CityMotionFrame {
  offset: number;
  x: number;
  y: number;
  scale: number;
}

export const CITY_MOTION_KEYFRAMES: readonly CityMotionFrame[] = Array.from(
  { length: CITY_MOTION_SEGMENTS + 1 },
  (_, index) => {
    const offset = index / CITY_MOTION_SEGMENTS;
    const angle = offset * Math.PI * 2;
    const flightProgress = (1 - Math.cos(angle)) / 2;
    return {
      offset,
      x: Math.sin(angle) * 0.6,
      y: flightProgress * 3.5,
      scale: CITY_MOTION_INITIAL_SCALE + flightProgress * 0.07,
    };
  },
);

/** Natural pixel size of the production room-and-city WebP asset. */
export const OTHER_CITY_SIZE = { w: 1448, h: 1086 } as const;

/**
 * Canonical Home city rect inside `other-city.webp`, in natural pixels.
 * Measured via WIC decode + brightness edge scan at clean positions:
 * left/right at y=150 (sky, avoids plant/lamp), top/bottom at x=600
 * (centre, avoids desk reflection). Frame ≈ 0-2 vs glass ≈ 9-19.
 * Top ≈79, bottom ≈753, left ≈195, right ≈1255.
 */
export const CITY_WINDOW_RECT = { x: 195, y: 79, w: 1060, h: 674 } as const;
/** HomeCosmos renders this exact crop from the same decoded source image. */
export const HOME_CITY_SIZE = { w: CITY_WINDOW_RECT.w, h: CITY_WINDOW_RECT.h } as const;

/** Duration of the shared city handoff (`--motion-city-return` = `--motion-expressive` = 760ms). */
export const CITY_WINDOW_HANDOFF_DURATION = 760;

/**
 * Compute the camera end/start transform that makes the window rect of `other-city`
 * (cover-fitted) coincide with the canonical window crop rendered as
 * `center/cover` at the supplied motion frame. Both sides use the same source
 * pixels, motion scale, and drift, so the seam stays aligned away from frame zero.
 */
export function getCityWindowTransform(
  viewW: number,
  viewH: number,
  trackFrame: CityMotionFrame,
): { scale: number; shiftX: number; shiftY: number } {
  const sOther = Math.max(viewW / OTHER_CITY_SIZE.w, viewH / OTHER_CITY_SIZE.h);
  const kCover = Math.max(CITY_WINDOW_RECT.w / HOME_CITY_SIZE.w, CITY_WINDOW_RECT.h / HOME_CITY_SIZE.h);
  // HomeCosmos applies the same motion scale to the crop that CityBackdrop
  // applies to the outer track. Use the target frame's scale here so the
  // window stays pixel-aligned throughout the shared timeline, not only at
  // the initial frame.
  const sHome = Math.max(viewW / HOME_CITY_SIZE.w, viewH / HOME_CITY_SIZE.h) * trackFrame.scale;
  const mTotal = sHome / (kCover * sOther);
  const scale = mTotal / trackFrame.scale;

  const ox = (viewW - OTHER_CITY_SIZE.w * sOther) / 2;
  const oy = (viewH - OTHER_CITY_SIZE.h * sOther) / 2;
  const windowCenterX = ox + (CITY_WINDOW_RECT.x + CITY_WINDOW_RECT.w / 2) * sOther;
  const windowCenterY = oy + (CITY_WINDOW_RECT.y + CITY_WINDOW_RECT.h / 2) * sOther;
  const vcX = viewW / 2;
  const vcY = viewH / 2;
  const trackDriftX = (viewW * trackFrame.x) / 100;
  const trackDriftY = (viewH * trackFrame.y) / 100;
  const homeDriftX = trackDriftX;
  const homeDriftY = trackDriftY;

  // CSS `translate(...) scale(...)` applies scale first (about center)
  // then translate outside. Track has the same order:
  //   camera:  qc = vc + (ql - vc)*cs + Cc
  //   track:   qs = vc + (qc - vc)*ts + Tc
  // => qs = vc + (ql - vc)*cs*ts + Cc*ts + Tc
  // Requirement qs(windowCenter)=homeCenter(=vc + HomeDrift):
  //   Cc = (homeDrift - Tc)/ts - (windowCenter - vc)*cs
  // Home and the child track intentionally use the same drift, so those terms
  // cancel instead of pulling the child window away from the Home Canvas.
  const tx = (homeDriftX - trackDriftX) / trackFrame.scale - (windowCenterX - vcX) * scale;
  const ty = (homeDriftY - trackDriftY) / trackFrame.scale - (windowCenterY - vcY) * scale;

  return {
    scale,
    shiftX: (tx / viewW) * 100,
    shiftY: (ty / viewH) * 100,
  };
}

let cityMotionStartedAt: number | undefined;

/**
 * One browser-wide clock keeps the city flight at the same phase while Nuxt
 * swaps Home's canvas for the child-page backdrop (and vice versa). It is
 * intentionally never reset during navigation; both surfaces must keep the
 * same frame sequence through a return handoff.
 */
export function getCityMotionElapsed(timestamp = import.meta.client ? performance.now() : 0) {
  cityMotionStartedAt ??= timestamp;
  return Math.max(0, timestamp - cityMotionStartedAt);
}

export function getCityMotionFrame(elapsed: number): CityMotionFrame {
  const loopProgress = (elapsed % CITY_MOTION_DURATION) / CITY_MOTION_DURATION;
  const framePosition = loopProgress * CITY_MOTION_SEGMENTS;
  const frameIndex = Math.floor(framePosition);
  const progress = framePosition - frameIndex;
  const fallback = { offset: 0, x: 0, y: 0, scale: CITY_MOTION_INITIAL_SCALE };
  const from = CITY_MOTION_KEYFRAMES[frameIndex] ?? fallback;
  const to = CITY_MOTION_KEYFRAMES[frameIndex + 1] ?? fallback;
  const interpolate = (start: number, end: number) => start + (end - start) * progress;

  return {
    offset: loopProgress,
    x: interpolate(from.x, to.x),
    y: interpolate(from.y, to.y),
    scale: interpolate(from.scale, to.scale),
  };
}
