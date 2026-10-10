/**
 * Some embedded Chromium hosts disable StandardizedBrowserZoom. Their Element
 * rectangles are divided by the element's cumulative CSS zoom, whereas canvas,
 * pointer coordinates and the shared UI use viewport pixels. Restore the
 * standard Element geometry contract before mounting the application.
 */
export function installCssZoomGeometry(view: Window & typeof globalThis = window): void {
  const prototype = view.Element.prototype;
  const getBoundingClientRect = prototype.getBoundingClientRect;
  const getClientRects = prototype.getClientRects;
  const probe = view.document.createElement('div');
  probe.style.cssText =
    'all:initial!important;position:fixed!important;width:1px!important;height:1px!important;visibility:hidden!important;pointer-events:none!important;zoom:1!important;';
  view.document.documentElement.append(probe);
  let legacy = false;
  try {
    const width = getBoundingClientRect.call(probe).width;
    probe.style.setProperty('zoom', '2', 'important');
    legacy =
      view.getComputedStyle(probe).zoom === '2' && Math.abs(getBoundingClientRect.call(probe).width - width) < 0.01;
  } finally {
    probe.remove();
  }
  if (!legacy) return;

  const cumulativeZoom = (element: Element): number => {
    let zoom = 1;
    let current: Element | null = element;
    while (current) {
      const value = Number.parseFloat(view.getComputedStyle(current).zoom);
      if (Number.isFinite(value) && value > 0) zoom *= value;
      const root = current.getRootNode();
      current = current.parentElement ?? (root instanceof view.ShadowRoot ? root.host : null);
    }
    return zoom;
  };
  const normalize = (rect: DOMRect, zoom: number): DOMRect =>
    zoom === 1 ? rect : new view.DOMRect(rect.x * zoom, rect.y * zoom, rect.width * zoom, rect.height * zoom);

  prototype.getBoundingClientRect = function () {
    return normalize(getBoundingClientRect.call(this), cumulativeZoom(this));
  };
  prototype.getClientRects = function () {
    const native = getClientRects.call(this);
    const zoom = cumulativeZoom(this);
    if (zoom === 1) return native;
    const rects = Array.from(native, (rect) => normalize(rect, zoom));
    const result = Object.create(view.DOMRectList.prototype) as DOMRectList;
    Object.defineProperties(result, {
      length: { value: rects.length },
      item: {
        value: (index: number) => {
          const rect = native.item(index);
          return rect ? normalize(rect, zoom) : null;
        },
      },
      [Symbol.iterator]: { value: () => rects[Symbol.iterator]() },
    });
    for (const [index, rect] of rects.entries()) {
      Object.defineProperty(result, index, { value: rect, enumerable: true });
    }
    return result;
  };
}
