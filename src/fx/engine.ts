/**
 * A small html-in-canvas engine, written from scratch.
 *
 * The whole API surface is three calls, which this module wraps:
 *
 *   canvas.setAttribute("layoutsubtree", "")   children lay out inside the canvas
 *   canvas.requestPaint()                      ask for a paint record
 *   gl.texElementImage2D(target, fmt, el)      upload it — ONLY inside the
 *                                              canvas's "paint" event, and the
 *                                              format must be a sized one
 *                                              (RGBA8 / SRGB8_ALPHA8 / RGBA16F
 *                                              / RGBA32F).
 *
 * Everything else here is ordinary WebGL2: compile a program, upload the live
 * DOM as a texture each frame, draw one fullscreen triangle.
 *
 * MIT. No third-party code.
 */

export interface FxUniforms {
  /** Master intensity, 0–1. */
  amount: number;
  /** Extra per-effect scalar; meaning depends on the shader. */
  detail: number;
}

export const DEFAULT_UNIFORMS: FxUniforms = { amount: 1, detail: 0.5 };

/** True when Chrome's experimental html-in-canvas API is actually usable. */
export function supportsElementTexture(): boolean {
  if (typeof document === "undefined") return false;
  const c = document.createElement("canvas") as HTMLCanvasElement & { requestPaint?: unknown };
  if (typeof c.requestPaint !== "function") return false;
  const gl = c.getContext("webgl2") as (WebGL2RenderingContext & {
    texElementImage2D?: unknown;
  }) | null;
  return Boolean(gl && typeof gl.texElementImage2D === "function");
}

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  // One oversized triangle covers the viewport with no index buffer.
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`fx: shader failed to compile — ${log}`);
  }
  return sh;
}

type GL2 = WebGL2RenderingContext & {
  texElementImage2D(target: number, internalformat: number, element: Element): void;
};

export interface FxHandle {
  setShader(fragment: string): void;
  setUniforms(u: Partial<FxUniforms>): void;
  destroy(): void;
}

export interface FxInit {
  canvas: HTMLCanvasElement;
  /** The element inside the canvas whose painted output becomes the texture. */
  content: HTMLElement;
  fragment: string;
  uniforms?: Partial<FxUniforms>;
  /** Skip the animation loop and pointer wiring. */
  reducedMotion?: boolean;
}

export function createFx({
  canvas,
  content,
  fragment,
  uniforms,
  reducedMotion = false,
}: FxInit): FxHandle {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
  }) as GL2 | null;
  if (!gl) throw new Error("fx: WebGL2 unavailable");

  canvas.setAttribute("layoutsubtree", "");

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  let program: WebGLProgram | null = null;
  let loc: Record<string, WebGLUniformLocation | null> = {};

  const state: FxUniforms = { ...DEFAULT_UNIFORMS, ...uniforms };
  const pointer = { x: -9999, y: -9999, inside: 0 };
  const click = { x: 0, y: 0, at: -999 };
  let start = performance.now();
  let raf = 0;
  let dead = false;

  function build(fragSrc: string) {
    const fs = compile(gl!, gl!.FRAGMENT_SHADER, fragSrc);
    const p = gl!.createProgram()!;
    gl!.attachShader(p, vs);
    gl!.attachShader(p, fs);
    gl!.linkProgram(p);
    gl!.deleteShader(fs);
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
      const log = gl!.getProgramInfoLog(p);
      gl!.deleteProgram(p);
      throw new Error(`fx: program link failed — ${log}`);
    }
    if (program) gl!.deleteProgram(program);
    program = p;
    gl!.useProgram(p);
    const a = gl!.getAttribLocation(p, "aPos");
    gl!.bindBuffer(gl!.ARRAY_BUFFER, quad);
    gl!.enableVertexAttribArray(a);
    gl!.vertexAttribPointer(a, 2, gl!.FLOAT, false, 0, 0);
    loc = {
      uSrc: gl!.getUniformLocation(p, "uSrc"),
      uRes: gl!.getUniformLocation(p, "uRes"),
      uTime: gl!.getUniformLocation(p, "uTime"),
      uPointer: gl!.getUniformLocation(p, "uPointer"),
      uClick: gl!.getUniformLocation(p, "uClick"),
      uAmount: gl!.getUniformLocation(p, "uAmount"),
      uDetail: gl!.getUniformLocation(p, "uDetail"),
    };
  }

  build(fragment);

  /** Match the drawing buffer to the laid-out content, capped for fill-rate. */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = content.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    canvas.style.height = `${h}px`;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
  }

  const ro = new ResizeObserver(resize);
  ro.observe(content);
  resize();

  // The paint record only exists inside this event — uploading anywhere else
  // throws InvalidStateError ("no cached paint record for element").
  function onPaint() {
    if (dead || !program) return;
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    try {
      gl!.texElementImage2D(gl!.TEXTURE_2D, gl!.RGBA8, content);
    } catch {
      return; // transient: subtree not ready this frame
    }
    const t = (performance.now() - start) / 1000;
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.useProgram(program);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    if (loc.uSrc) gl!.uniform1i(loc.uSrc, 0);
    if (loc.uRes) gl!.uniform2f(loc.uRes, canvas.width, canvas.height);
    if (loc.uTime) gl!.uniform1f(loc.uTime, t);
    if (loc.uPointer) gl!.uniform3f(loc.uPointer, pointer.x, pointer.y, pointer.inside);
    if (loc.uClick) gl!.uniform3f(loc.uClick, click.x, click.y, t - click.at);
    if (loc.uAmount) gl!.uniform1f(loc.uAmount, state.amount);
    if (loc.uDetail) gl!.uniform1f(loc.uDetail, state.detail);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  canvas.addEventListener("paint", onPaint);

  function toBuffer(e: PointerEvent | MouseEvent) {
    const r = canvas.getBoundingClientRect();
    const dpr = canvas.width / Math.max(1, r.width);
    return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
  }

  const onMove = (e: PointerEvent) => {
    const p = toBuffer(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.inside = 1;
  };
  const onLeave = () => {
    pointer.inside = 0;
  };
  const onDown = (e: PointerEvent) => {
    const p = toBuffer(e);
    click.x = p.x;
    click.y = p.y;
    click.at = (performance.now() - start) / 1000;
  };

  canvas.addEventListener("pointermove", onMove, { passive: true });
  canvas.addEventListener("pointerleave", onLeave, { passive: true });
  canvas.addEventListener("pointerdown", onDown, { passive: true });

  function frame() {
    if (dead) return;
    canvas.requestPaint?.();
    raf = requestAnimationFrame(frame);
  }

  if (reducedMotion) {
    // Paint once so the effect is visible, but do not animate.
    canvas.requestPaint?.();
  } else {
    frame();
  }

  return {
    setShader(f: string) {
      if (dead) return;
      build(f);
      start = performance.now();
    },
    setUniforms(u: Partial<FxUniforms>) {
      Object.assign(state, u);
    },
    destroy() {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("paint", onPaint);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      if (program) gl!.deleteProgram(program);
      gl!.deleteShader(vs);
      gl!.deleteBuffer(quad);
      gl!.deleteTexture(tex);
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

declare global {
  interface HTMLCanvasElement {
    requestPaint?: () => void;
  }
}
