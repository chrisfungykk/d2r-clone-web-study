// Input mapping — pointer/keyboard → intents + camera control (controls.md, camera.md).
// Game-side: imports only the seam. The host (main.ts) supplies pickGround + camera hooks so
// input stays decoupled from the concrete Renderer. Listeners attach to the canvas ONLY, so a
// click on a DOM UI overlay never reaches here (click-through is impossible).

const ORBIT_STEP = Math.PI / 24; // ~7.5° per key press

export interface InputHost {
  pickGround(clientX: number, clientY: number): { x: number; z: number } | null;
  zoomByDetents(detents: number): void;
  orbitBy(dYaw: number): void;
  resetZoom(): void;
  resetYaw(): void;
  moveTo(x: number, z: number): void;
}

export function attachInput(canvas: HTMLElement, host: InputHost): () => void {
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return; // left = move
    const hit = host.pickGround(e.clientX, e.clientY);
    if (hit) host.moveTo(hit.x, hit.z);
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    host.zoomByDetents(e.deltaY > 0 ? 1 : -1); // wheel down = zoom out along the rail
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "q" || e.key === "Q") host.orbitBy(-ORBIT_STEP);
    else if (e.key === "e" || e.key === "E") host.orbitBy(ORBIT_STEP);
    else if (e.key === "Home") host.resetYaw();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeyDown);
  };
}
