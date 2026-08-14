import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFx, supportsElementTexture, type FxHandle } from "./engine";
import { ASCII, CRT, DITHER, MOSAIC, RIPPLE, TEAR } from "./shaders";
import "./fx.css";

export const OURS = [
  {
    id: "mosaic",
    name: "Mosaic",
    tag: "cell quantise",
    fragment: MOSAIC,
    blurb: "UVs snapped to a cell grid around the cursor. The simplest thing you can do to a live page, and still the clearest proof it is a texture.",
  },
  {
    id: "dither",
    name: "Dither",
    tag: "bayer 4×4",
    fragment: DITHER,
    blurb: "Ordered dithering against a 4×4 Bayer matrix, posterised to a handful of levels. The technique is from 1973; the novelty is that the input is your DOM.",
  },
  {
    id: "ascii",
    name: "Ascii",
    tag: "glyph ramp",
    fragment: ASCII,
    blurb: "Cell luminance picks one of eight 5×5 glyphs packed as bitmasks, then each fragment tests its own bit. No font, no atlas texture.",
  },
  {
    id: "tear",
    name: "Tear",
    tag: "slice + rgb split",
    fragment: TEAR,
    blurb: "Horizontal bands displaced on a stepped clock with channel separation, so the glitch punctuates instead of running continuously.",
  },
  {
    id: "ripple",
    name: "Ripple",
    tag: "click waves",
    fragment: RIPPLE,
    blurb: "Click anywhere. A radial sine front expands from the point and decays, dragging the page with it and splitting light on the crest.",
  },
  {
    id: "crt",
    name: "CRT",
    tag: "barrel + grille",
    fragment: CRT,
    blurb: "Barrel distortion, aperture-grille scanlines, corner chromatic aberration and a rolling refresh bar. Every part is a separate cheap term.",
  },
] as const;

export type OurEffectId = (typeof OURS)[number]["id"];

export function useElementTextureSupport() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(supportsElementTexture()), []);
  return ok;
}

interface FxProps {
  effect: OurEffectId;
  amount?: number;
  detail?: number;
  children: ReactNode;
  /** Rendered instead of the canvas when the API is unavailable. */
  fallback?: ReactNode;
}

/**
 * Wraps children in a <canvas layoutsubtree> and runs a fragment shader over
 * the painted result. The children stay in the DOM either way, so they remain
 * focusable, selectable and clickable — and when the API is missing they simply
 * render as themselves.
 */
export function Fx({ effect, amount = 1, detail = 0.5, children, fallback }: FxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<FxHandle | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setSupported(supportsElementTexture()), []);

  const fragment = OURS.find((o) => o.id === effect)!.fragment;

  useEffect(() => {
    if (!supported || !canvasRef.current || !contentRef.current) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    try {
      fxRef.current = createFx({
        canvas: canvasRef.current,
        content: contentRef.current,
        fragment,
        uniforms: { amount, detail },
        reducedMotion: reduced,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    return () => {
      fxRef.current?.destroy();
      fxRef.current = null;
    };
    // Rebuilding on shader change is handled below; this effect owns the context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  useEffect(() => {
    fxRef.current?.setShader(fragment);
  }, [fragment]);

  useEffect(() => {
    fxRef.current?.setUniforms({ amount, detail });
  }, [amount, detail]);

  if (supported === null || !supported || error) {
    return (
      <div className="fx fx--plain">
        <div className="fx__content">{children}</div>
        {supported === false && fallback}
      </div>
    );
  }

  return (
    <div className="fx">
      <canvas ref={canvasRef} className="fx__canvas">
        <div ref={contentRef} className="fx__content">
          {children}
        </div>
      </canvas>
    </div>
  );
}
