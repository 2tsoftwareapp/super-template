// Click a rendered Mermaid diagram (or its "Expand" badge) to open it full screen.
// Wheel or +/- zooms, drag pans, 0 resets, Esc closes.

const MIN_SCALE = 0.25;
const MAX_SCALE = 8;

function button(label: string, title: string, onClick: () => void): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = label;
  el.title = title;
  el.setAttribute("aria-label", title);
  el.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return el;
}

function cloneDiagram(source: SVGSVGElement): SVGSVGElement {
  const svg = source.cloneNode(true) as SVGSVGElement;
  svg.removeAttribute("style");
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  // A unique id: Mermaid re-renders by id, and the inline <style> is scoped to it.
  const id = `${source.id}-viewer`;
  svg.querySelectorAll("style").forEach((style) => {
    style.textContent = (style.textContent ?? "").replaceAll(`#${source.id}`, `#${id}`);
  });
  svg.id = id;
  return svg;
}

// Zoom resizes the SVG itself (crisp text, no CSS transform); the stage scrolls to pan.
function enablePanZoom(stage: HTMLElement, svg: SVGSVGElement): (factor?: number) => void {
  const box = svg.viewBox.baseVal;
  const fit = Math.min(stage.clientWidth / box.width, stage.clientHeight / box.height) * 0.9;
  let scale = 1;
  const zoom = (factor?: number) => {
    scale = factor ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor)) : 1;
    svg.setAttribute("width", String(box.width * fit * scale));
    svg.setAttribute("height", String(box.height * fit * scale));
  };
  zoom();
  stage.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoom(event.deltaY < 0 ? 1.15 : 1 / 1.15);
    },
    { passive: false },
  );
  let drag: { x: number; y: number } | null = null;
  stage.addEventListener("pointerdown", (event) => {
    drag = { x: event.clientX + stage.scrollLeft, y: event.clientY + stage.scrollTop };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("dragging");
  });
  stage.addEventListener("pointermove", (event) => {
    if (!drag) return;
    stage.scrollLeft = drag.x - event.clientX;
    stage.scrollTop = drag.y - event.clientY;
  });
  const stop = () => {
    drag = null;
    stage.classList.remove("dragging");
  };
  stage.addEventListener("pointerup", stop);
  stage.addEventListener("pointercancel", stop);
  return zoom;
}

function openViewer(source: SVGSVGElement): void {
  const overlay = document.createElement("div");
  overlay.className = "diagram-viewer";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Diagram preview");

  const stage = document.createElement("div");
  stage.className = "diagram-viewer-stage";
  const svg = cloneDiagram(source);
  stage.append(svg);

  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = "";
  };
  const onKey = (event: KeyboardEvent) => {
    const actions: Record<string, () => void> = {
      Escape: close,
      "+": () => control(1.25),
      "=": () => control(1.25),
      "-": () => control(0.8),
      "0": () => control(),
    };
    actions[event.key]?.();
  };

  const toolbar = document.createElement("div");
  toolbar.className = "diagram-viewer-toolbar";
  const closeButton = button("✕", "Close (Esc)", close);
  toolbar.append(
    button("−", "Zoom out (-)", () => control(0.8)),
    button("Reset", "Reset (0)", () => control()),
    button("+", "Zoom in (+)", () => control(1.25)),
    closeButton,
  );

  overlay.append(toolbar, stage);
  document.body.append(overlay);
  const control = enablePanZoom(stage, svg);
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", onKey);
  closeButton.focus();
}

export function installDiagramZoom(): void {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const diagram = target.closest(".vp-doc .mermaid");
    const svg = diagram?.querySelector("svg");
    if (svg) openViewer(svg);
  });
}
