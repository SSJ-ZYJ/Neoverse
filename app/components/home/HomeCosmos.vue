<script setup lang="ts">
const canvas = ref<HTMLCanvasElement | null>(null);

const LOOP_DURATION = 24_000;
const FRAME_INTERVAL = 1000 / 30;
const GLASS_BLUR_RADIUS = 10;
const TAU = Math.PI * 2;

let frame = 0;
let lastFrame = 0;
let width = 0;
let height = 0;
let pixelRatio = 1;
let observer: ResizeObserver | undefined;
let reducedMotion: MediaQueryList | undefined;
let backdrop: HTMLImageElement | undefined;
let glassSource: HTMLCanvasElement | undefined;
let glassRegion: HTMLCanvasElement | undefined;
let glassSourceContext: CanvasRenderingContext2D | null = null;
let glassRegionContext: CanvasRenderingContext2D | null = null;
let pointerX = 0;
let pointerY = 0;
let pointerTargetX = 0;
let pointerTargetY = 0;

const stars = Array.from({ length: 104 }, (_, index) => ({
  x: ((index * 47 + 13) % 101) / 100,
  y: ((index * 67 + 7) % 97) / 100,
  radius: 0.35 + ((index * 17) % 12) / 10,
  phase: (((index * 31) % 100) / 100) * TAU,
  cycle: (index % 3) + 1,
}));

const meteorTracks = [
  { period: 6_000, offset: 0, x: 0.06, y: 0.07, dx: 0.3, dy: 0.17, trail: 82, alpha: 0.75 },
  { period: 8_000, offset: 2_600, x: 0.4, y: 0.03, dx: 0.31, dy: 0.16, trail: 64, alpha: 0.6 },
  { period: 6_000, offset: 4_100, x: 0.63, y: 0.11, dx: 0.25, dy: 0.14, trail: 72, alpha: 0.68 },
  { period: 12_000, offset: 1_900, x: 0.16, y: 0.27, dx: 0.22, dy: 0.11, trail: 50, alpha: 0.5 },
  { period: 8_000, offset: 6_200, x: 0.7, y: 0.3, dx: 0.2, dy: 0.1, trail: 56, alpha: 0.56 },
] as const;

const resize = (layoutSize?: Pick<DOMRectReadOnly, 'width' | 'height'>) => {
  const element = canvas.value;
  if (!element) return;
  width = layoutSize?.width ?? element.clientWidth;
  height = layoutSize?.height ?? element.clientHeight;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
  const nextWidth = Math.max(1, Math.round(width * pixelRatio));
  const nextHeight = Math.max(1, Math.round(height * pixelRatio));
  if (element.width !== nextWidth) element.width = nextWidth;
  if (element.height !== nextHeight) element.height = nextHeight;

  glassSource ??= document.createElement('canvas');
  glassRegion ??= document.createElement('canvas');
  if (glassSource.width !== nextWidth) glassSource.width = nextWidth;
  if (glassSource.height !== nextHeight) glassSource.height = nextHeight;
  glassSourceContext ??= glassSource.getContext('2d');
  glassRegionContext ??= glassRegion.getContext('2d');
};

const drawBackdrop = (context: CanvasRenderingContext2D, phase: number) => {
  context.fillStyle = '#020812';
  context.fillRect(0, 0, width, height);
  if (!backdrop?.complete || !backdrop.naturalWidth) return;

  const baseScale = Math.max(width / backdrop.naturalWidth, height / backdrop.naturalHeight);
  // Ease the camera forward and back over one complete flight cycle. Using a
  // cosine envelope makes the first and last frames share both position and
  // velocity, so the loop has no visible jump at its seam.
  const flightProgress = (1 - Math.cos(phase * TAU)) / 2;
  const scale = baseScale * (1.05 + flightProgress * 0.07);
  const imageWidth = backdrop.naturalWidth * scale;
  const imageHeight = backdrop.naturalHeight * scale;
  const droneCorrectionX = Math.sin(phase * TAU) * width * 0.006;
  const droneTravelY = flightProgress * height * 0.035;
  const driftX = droneCorrectionX + pointerX * 10;
  const driftY = droneTravelY + pointerY * 7;
  context.drawImage(
    backdrop,
    (width - imageWidth) / 2 + driftX,
    (height - imageHeight) / 2 + driftY,
    imageWidth,
    imageHeight,
  );
};

/**
 * Chromium may expose backdrop-filter without sampling an animated canvas.
 * Mirror and blur the canvas beneath each social link so the glass surface
 * keeps real background diffusion instead of becoming a flat translucent fill.
 */
const drawSocialGlass = (context: CanvasRenderingContext2D) => {
  const element = canvas.value;
  if (!element || !glassSource || !glassRegion || !glassSourceContext || !glassRegionContext) return;

  const canvasBounds = element.getBoundingClientRect();
  const links = document.querySelectorAll<HTMLElement>('.home-socials a');
  if (!links.length || !canvasBounds.width || !canvasBounds.height) return;

  const viewportToCanvasX = element.width / canvasBounds.width;
  const viewportToCanvasY = element.height / canvasBounds.height;
  const radiusScale = Math.min(viewportToCanvasX, viewportToCanvasY);

  glassSourceContext.setTransform(1, 0, 0, 1, 0, 0);
  glassSourceContext.clearRect(0, 0, glassSource.width, glassSource.height);
  glassSourceContext.drawImage(element, 0, 0);

  const blurRadius = GLASS_BLUR_RADIUS * pixelRatio;
  const padding = Math.ceil(blurRadius * 3);

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);

  for (const link of links) {
    const copy = link.closest<HTMLElement>('.home-panel__copy');
    const linkStyle = getComputedStyle(link);
    const linkOpacity = Number.parseFloat(linkStyle.opacity) || 0;
    const copyOpacity = copy ? Number.parseFloat(getComputedStyle(copy).opacity) || 0 : 1;
    const effectiveOpacity = Math.min(1, Math.max(0, linkOpacity * copyOpacity));
    if (effectiveOpacity <= 0.001) continue;

    const bounds = link.getBoundingClientRect();
    const left = Math.max(0, Math.floor((bounds.left - canvasBounds.left) * viewportToCanvasX));
    const top = Math.max(0, Math.floor((bounds.top - canvasBounds.top) * viewportToCanvasY));
    const right = Math.min(element.width, Math.ceil((bounds.right - canvasBounds.left) * viewportToCanvasX));
    const bottom = Math.min(element.height, Math.ceil((bounds.bottom - canvasBounds.top) * viewportToCanvasY));
    if (right <= left || bottom <= top) continue;

    const sourceLeft = Math.max(0, left - padding);
    const sourceTop = Math.max(0, top - padding);
    const sourceRight = Math.min(element.width, right + padding);
    const sourceBottom = Math.min(element.height, bottom + padding);
    const regionWidth = sourceRight - sourceLeft;
    const regionHeight = sourceBottom - sourceTop;

    if (glassRegion.width !== regionWidth) glassRegion.width = regionWidth;
    if (glassRegion.height !== regionHeight) glassRegion.height = regionHeight;
    glassRegionContext.setTransform(1, 0, 0, 1, 0, 0);
    glassRegionContext.clearRect(0, 0, regionWidth, regionHeight);
    glassRegionContext.filter = `blur(${blurRadius}px)`;
    glassRegionContext.drawImage(
      glassSource,
      sourceLeft,
      sourceTop,
      regionWidth,
      regionHeight,
      0,
      0,
      regionWidth,
      regionHeight,
    );
    glassRegionContext.filter = 'none';

    const clipWidth = right - left;
    const clipHeight = bottom - top;
    const cssRadius = Number.parseFloat(linkStyle.borderTopLeftRadius) || 0;
    const radius = Math.min(cssRadius * radiusScale, clipWidth / 2, clipHeight / 2);

    context.save();
    context.globalAlpha = effectiveOpacity;
    context.beginPath();
    context.roundRect(left, top, clipWidth, clipHeight, radius);
    context.clip();
    context.drawImage(glassRegion, sourceLeft, sourceTop, regionWidth, regionHeight);
    context.restore();
  }

  context.restore();
};

const draw = (time = 0) => {
  const element = canvas.value;
  if (!element) return;
  if (!width || !height) resize();
  const context = element.getContext('2d');
  if (!context) return;

  const isReduced = reducedMotion?.matches ?? false;
  const loopTime = isReduced ? 0 : time % LOOP_DURATION;
  const phase = loopTime / LOOP_DURATION;
  pointerX += (pointerTargetX - pointerX) * 0.045;
  pointerY += (pointerTargetY - pointerY) * 0.045;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  drawBackdrop(context, phase);

  const readability = context.createLinearGradient(0, 0, width, 0);
  readability.addColorStop(0, 'rgba(2, 8, 18, .82)');
  readability.addColorStop(0.5, 'rgba(2, 8, 18, .34)');
  readability.addColorStop(1, 'rgba(2, 8, 18, .08)');
  context.fillStyle = readability;
  context.fillRect(0, 0, width, height);

  const horizonShade = context.createLinearGradient(0, 0, 0, height);
  horizonShade.addColorStop(0, 'rgba(1, 5, 12, .08)');
  horizonShade.addColorStop(0.68, 'rgba(1, 5, 12, .06)');
  horizonShade.addColorStop(1, 'rgba(1, 5, 12, .48)');
  context.fillStyle = horizonShade;
  context.fillRect(0, 0, width, height);

  const glowStrength = 0.075 + Math.sin(phase * TAU) * 0.025;
  const glow = context.createRadialGradient(width * 0.82, height * 0.2, 0, width * 0.82, height * 0.2, width * 0.42);
  glow.addColorStop(0, `rgba(50, 170, 235, ${glowStrength})`);
  glow.addColorStop(1, 'rgba(13, 96, 160, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  for (const star of stars) {
    const depth = 0.45 + star.radius * 0.56;
    const twinkle = 0.5 + Math.sin(phase * TAU * star.cycle + star.phase) * 0.26;
    const x = star.x * width + Math.sin(phase * TAU * star.cycle + star.phase) * 8 * depth + pointerX * 10 * depth;
    const y = star.y * height + Math.cos(phase * TAU * star.cycle + star.phase) * 5 * depth + pointerY * 7 * depth;
    context.fillStyle = `rgba(215, 241, 255, ${Math.max(0.18, twinkle)})`;
    context.beginPath();
    context.arc(x, y, star.radius, 0, TAU);
    context.fill();
  }

  if (!isReduced) {
    for (const meteor of meteorTracks) {
      const meteorPhase = ((loopTime + meteor.offset) % meteor.period) / meteor.period;
      if (meteorPhase >= 0.38) continue;
      const progress = meteorPhase / 0.38;
      const opacity = Math.sin(progress * Math.PI) * meteor.alpha;
      const x = width * (meteor.x + progress * meteor.dx);
      const y = height * (meteor.y + progress * meteor.dy);
      const trailX = meteor.trail;
      const trailY = meteor.trail * 0.5;
      const trail = context.createLinearGradient(x - trailX, y - trailY, x, y);
      trail.addColorStop(0, 'rgba(140, 220, 255, 0)');
      trail.addColorStop(1, `rgba(235, 251, 255, ${opacity})`);
      context.strokeStyle = trail;
      context.lineWidth = meteor.alpha > 0.65 ? 1.2 : 0.85;
      context.beginPath();
      context.moveTo(x - trailX, y - trailY);
      context.lineTo(x, y);
      context.stroke();
    }
  }

  drawSocialGlass(context);
};

const animate = (time: number) => {
  if (time - lastFrame >= FRAME_INTERVAL) {
    lastFrame = time;
    draw(time);
  }
  if (!reducedMotion?.matches) frame = requestAnimationFrame(animate);
};

const handlePointer = (event: PointerEvent) => {
  if (reducedMotion?.matches) return;
  pointerTargetX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
  pointerTargetY = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
};

const resetPointer = () => {
  pointerTargetX = 0;
  pointerTargetY = 0;
};

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const image = new Image();
  backdrop = image;
  image.decoding = 'async';
  image.src = '/images/home-city.webp';
  image.addEventListener('load', () => draw(performance.now()), { once: true });
  observer = new ResizeObserver(([entry]) => {
    resize(entry?.contentRect);
    draw(performance.now());
  });
  if (canvas.value) observer.observe(canvas.value);
  resize();
  window.addEventListener('pointermove', handlePointer, { passive: true });
  window.addEventListener('pointerleave', resetPointer);
  frame = requestAnimationFrame(animate);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  observer?.disconnect();
  window.removeEventListener('pointermove', handlePointer);
  window.removeEventListener('pointerleave', resetPointer);
  backdrop = undefined;
  glassSource = undefined;
  glassRegion = undefined;
  glassSourceContext = null;
  glassRegionContext = null;
});
</script>

<template><canvas ref="canvas" class="home-cosmos" aria-hidden="true" /></template>

<style scoped>
.home-cosmos { position: absolute; z-index: 0; inset: 0; display: block; width: 100%; height: 100%; pointer-events: none; }
</style>
