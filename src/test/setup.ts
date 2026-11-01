import "@testing-library/jest-dom/vitest";

// jsdom lacks a few browser APIs that the map and motion layers touch.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!Element.prototype.animate) {
  Element.prototype.animate = () =>
    ({ onfinish: null, cancel: () => undefined, finish: () => undefined }) as unknown as Animation;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

const svgProto = SVGElement.prototype as unknown as { getBBox?: () => DOMRect };
if (!svgProto.getBBox) {
  svgProto.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 }) as DOMRect;
}
