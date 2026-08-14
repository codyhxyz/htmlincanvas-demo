/**
 * Original fragment shaders for the html-in-canvas engine.
 *
 * Every one of these is a long-established graphics technique implemented from
 * the maths — ordered dithering (Bayer, 1973), luminance-to-glyph mapping,
 * channel separation, radial wave displacement, barrel distortion. None of it
 * is anyone's proprietary work; the only novel part of the pipeline is that the
 * source texture happens to be live DOM.
 *
 * Shared uniforms, supplied by engine.ts:
 *   uSrc     sampler2D  the page, as a texture
 *   uRes     vec2       drawing-buffer size in device pixels
 *   uTime    float      seconds since mount
 *   uPointer vec3       cursor xy in buffer px, z = 1 while inside
 *   uClick   vec3       last click xy, z = seconds since
 *   uAmount  float      master intensity 0–1
 *   uDetail  float      per-effect scalar 0–1
 */

const HEAD = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uPointer;
uniform vec3 uClick;
uniform float uAmount;
uniform float uDetail;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

/** 1 at the cursor, falling to 0 at radius r (device px). Full-frame when the
 *  pointer has never entered, so the effect is never invisible on load. */
float cursorMask(float r) {
  if (uPointer.z < 0.5) return 1.0;
  float d = distance(vUv * uRes, uPointer.xy);
  return 1.0 - smoothstep(r * 0.55, r, d);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
`;

/* ── Mosaic ──────────────────────────────────────────────────────────────
   Quantise UVs to a cell grid. Cell size grows with uDetail. */
export const MOSAIC = `${HEAD}
void main() {
  float cell = mix(3.0, 26.0, uDetail);
  float m = cursorMask(mix(140.0, 460.0, uAmount));
  vec2 grid = floor(vUv * uRes / cell) * cell + cell * 0.5;
  vec2 q = mix(vUv, grid / uRes, m * uAmount);
  outColor = vec4(texture(uSrc, q).rgb, 1.0);
}`;

/* ── Ordered dither ──────────────────────────────────────────────────────
   Classic 4×4 Bayer threshold matrix, normalised to 0–1, applied per channel
   after posterising to N levels. */
export const DITHER = `${HEAD}
const float BAYER[16] = float[16](
   0.0,  8.0,  2.0, 10.0,
  12.0,  4.0, 14.0,  6.0,
   3.0, 11.0,  1.0,  9.0,
  15.0,  7.0, 13.0,  5.0
);

void main() {
  float px = mix(1.0, 5.0, uDetail);
  vec2 cell = floor(vUv * uRes / px);
  vec3 src = texture(uSrc, (cell * px + px * 0.5) / uRes).rgb;

  ivec2 b = ivec2(mod(cell, 4.0));
  float threshold = (BAYER[b.y * 4 + b.x] + 0.5) / 16.0;

  float levels = mix(2.0, 6.0, 1.0 - uDetail);
  vec3 scaled = src * (levels - 1.0);
  vec3 quantised = floor(scaled + step(vec3(threshold), fract(scaled))) / (levels - 1.0);

  float m = cursorMask(mix(160.0, 520.0, uAmount)) * uAmount;
  outColor = vec4(mix(src, quantised, m), 1.0);
}`;

/* ── ASCII ───────────────────────────────────────────────────────────────
   Map cell luminance to one of eight 5×5 glyphs packed as 25-bit masks, then
   test the bit under this fragment. Denser glyphs for brighter cells. */
export const ASCII = `${HEAD}
// 5×5 bitmaps, bit index = y*5 + x, bit 0 top-left. Densities run
// 0,1,2,5,8,12,16,25 of 25 — monotonic, so the ramp reads as a gradient.
//   space    .        :        +        o        O        #        solid
const int GLYPH[8] = int[8](
  0, 131072, 131200, 145536, 469440, 15255086, 11512810, 33554431
);

void main() {
  float cw = mix(5.0, 11.0, uDetail);
  vec2 cellPx = vec2(cw, cw * 1.6);
  vec2 cell = floor(vUv * uRes / cellPx);
  vec2 centre = (cell + 0.5) * cellPx / uRes;

  vec3 src = texture(uSrc, centre).rgb;
  float g = luma(src);

  // Adapt to the surface: on light UI, ink is dark and density tracks
  // darkness; on dark UI it inverts. Without this, a light page picks the
  // densest glyph everywhere and floods.
  float light = step(0.5, g);
  float density = clamp(mix(g, 1.0 - g, light) * 1.25, 0.0, 1.0);
  int idx = int(floor(density * 7.999));

  vec2 inCell = fract(vUv * uRes / cellPx);
  ivec2 bit = ivec2(floor(inCell * 5.0));
  float on = float((GLYPH[idx] >> (bit.y * 5 + bit.x)) & 1);

  vec3 paper = mix(vec3(0.035, 0.035, 0.04), src, light * 0.9);
  vec3 ink = mix(mix(vec3(0.84, 0.97, 0.30), src * 1.7, 0.3), vec3(0.05, 0.05, 0.04), light);
  vec3 ascii = mix(paper, ink, on);

  float m = cursorMask(mix(150.0, 500.0, uAmount)) * uAmount;
  outColor = vec4(mix(src, ascii, m), 1.0);
}`;

/* ── Tear ────────────────────────────────────────────────────────────────
   Horizontal slice displacement plus RGB channel separation, pulsed on a
   stepped clock so bursts are punctuated rather than continuous. */
export const TEAR = `${HEAD}
void main() {
  float burst = step(0.58, hash(vec2(floor(uTime * 6.0), 3.7)));
  float band = floor(vUv.y * mix(8.0, 40.0, uDetail));
  float jitter = (hash(vec2(band, floor(uTime * 5.0))) - 0.5);

  float shift = jitter * burst * 0.09 * uAmount;
  float split = (0.002 + 0.012 * burst) * uAmount;

  vec2 uv = vec2(vUv.x + shift, vUv.y);
  float r = texture(uSrc, uv + vec2(split, 0.0)).r;
  float g = texture(uSrc, uv).g;
  float b = texture(uSrc, uv - vec2(split, 0.0)).b;

  vec3 col = vec3(r, g, b);
  // Scanline dropout on the torn bands.
  col *= 1.0 - 0.35 * burst * step(0.5, fract(vUv.y * uRes.y * 0.25));
  outColor = vec4(col, 1.0);
}`;

/* ── Ripple ──────────────────────────────────────────────────────────────
   Radial sine wave expanding from the last click, decaying over ~2.4s. */
export const RIPPLE = `${HEAD}
void main() {
  vec2 px = vUv * uRes;
  float age = uClick.z;
  float decay = exp(-age * 1.6);
  float d = distance(px, uClick.xy);

  float front = age * 620.0;
  float wave = sin((d - front) * 0.045) * exp(-abs(d - front) * 0.006);
  float amp = wave * decay * 26.0 * uAmount * step(age, 6.0);

  vec2 dir = d > 0.001 ? (px - uClick.xy) / d : vec2(0.0);
  vec2 uv = (px + dir * amp) / uRes;

  // Split the channels slightly along the crest for a glassy edge.
  float disp = amp * 0.35 * mix(0.2, 1.0, uDetail);
  vec3 col = vec3(
    texture(uSrc, (px + dir * (amp + disp)) / uRes).r,
    texture(uSrc, uv).g,
    texture(uSrc, (px + dir * (amp - disp)) / uRes).b
  );
  col += vec3(0.84, 0.97, 0.30) * max(wave, 0.0) * decay * 0.16;
  outColor = vec4(col, 1.0);
}`;

/* ── CRT ─────────────────────────────────────────────────────────────────
   Barrel distortion, aperture-grille scanlines, vignette, corner chroma. */
export const CRT = `${HEAD}
void main() {
  vec2 c = vUv * 2.0 - 1.0;
  float r2 = dot(c, c);
  float k = 0.12 * uAmount;
  vec2 uv = (c * (1.0 + k * r2)) * 0.5 + 0.5;

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    outColor = vec4(0.02, 0.02, 0.025, 1.0);
    return;
  }

  float ca = 0.0018 * uAmount * r2;
  vec3 col = vec3(
    texture(uSrc, uv + vec2(ca, 0.0)).r,
    texture(uSrc, uv).g,
    texture(uSrc, uv - vec2(ca, 0.0)).b
  );

  // Scanlines + RGB grille.
  float lines = 0.82 + 0.18 * sin(uv.y * uRes.y * 1.6);
  float grille = 0.88 + 0.12 * sin(uv.x * uRes.x * 3.14159);
  col *= mix(1.0, lines * grille, uAmount * mix(0.4, 1.0, uDetail));

  // Rolling refresh bar and vignette.
  col *= 1.0 + 0.05 * sin(uv.y * 3.0 - uTime * 2.2) * uAmount;
  col *= 1.0 - 0.28 * r2 * uAmount;
  outColor = vec4(col, 1.0);
}`;

export const SHADERS = { MOSAIC, DITHER, ASCII, TEAR, RIPPLE, CRT };
