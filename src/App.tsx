import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { effects, loaders, type EffectMeta } from "./canvasui";
import { BY_SLUG, FAMILY_LABEL, FAMILY_NOTE, IDEAS, type Family } from "./data/effects";
import { SURFACES, Surface, type SurfaceId } from "./components/Surfaces";
import "./styles.css";

/* ── html-in-canvas probe ──────────────────────────────────────────────────
   Same check the components run internally, lifted out so the page can report
   support without pulling a 30kB shader module in just to ask. */
function detectHtmlInCanvas(): boolean {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("canvas") as HTMLCanvasElement & {
    requestPaint?: unknown;
  };
  const ctx = probe.getContext("2d") as (CanvasRenderingContext2D & {
    drawElementImage?: unknown;
  }) | null;
  return Boolean(
    ctx && typeof ctx.drawElementImage === "function" && typeof probe.requestPaint === "function",
  );
}

type Wrapper = ComponentType<{ children: ReactNode; className?: string; style?: React.CSSProperties }>;
type ObjectComp = ComponentType<
  { src?: string; className?: string; style?: React.CSSProperties } & Record<string, unknown>
>;

/** One React.lazy per slug, cached, so switching effects never re-downloads. */
const lazyCache = new Map<string, ComponentType<Record<string, unknown>>>();
function getLazy(slug: string) {
  let c = lazyCache.get(slug);
  if (!c) {
    c = lazy(loaders[slug]) as ComponentType<Record<string, unknown>>;
    lazyCache.set(slug, c);
  }
  return c;
}

const META = new Map(effects.map((e) => [e.slug, e]));

/** Masthead effect. Deliberately from the overlay family so it runs for every
 *  visitor regardless of the flag — the hero should never be the thing that
 *  looks broken. Tuned down from the defaults: this has to sit under reading
 *  type, not compete with it. */
const LiquidLazy = getLazy("liquid") as unknown as ComponentType<
  { children: ReactNode } & Record<string, unknown>
>;

/* These components lay their children out *inside* an absolutely-positioned
   canvas, so the wrapper contributes no intrinsic height — it must be given
   one explicitly or the whole subtree collapses to a 1px strip. The headline
   is a fixed-height band, which makes it a safe thing to lens; the rest of the
   masthead stays in normal flow. */
function Hero({ children }: { children: ReactNode }) {
  return (
    <LiquidLazy
      style={{ height: HERO_H, display: "block" }}
      color={[0.84, 0.97, 0.3]}
      rainbow={false}
      intensity={0.42}
      distortion={0.3}
      blend={0.3}
      radius={0.2}
      force={5}
      curl={12}
      densityDissipation={0.96}
      simResolution={96}
      dyeResolution={512}
    >
      {children}
    </LiquidLazy>
  );
}

const HERO_H = "clamp(112px, 17.5vw, 214px)";

/** Framing + material tuning for the 3D bench. All five share the layout keys
 *  (background/scale/autoRotate); the rest is per-material taste. */
const OBJ_BASE = {
  background: "#0e0e10",
  autoRotate: true,
  autoRotateSpeed: 0.55,
  scale: 1.75,
  floatIntensity: 0.5,
  rotationIntensity: 0.35,
} as const;

const OBJ_PROPS: Record<string, Record<string, unknown>> = {
  "glass-object": {
    ...OBJ_BASE,
    ior: 1.62,
    thickness: 1.5,
    roughness: 0.06,
    dispersion: 0.9,
    clearcoat: 1,
    tint: "#9fe8d8",
    tintDensity: 0.35,
    depth: 0.32,
    bevel: 0.55,
    highlight: "#d6f84c",
    environmentIntensity: 1.25,
  },
  "liquid-object": {
    ...OBJ_BASE,
    distortion: 0.7,
    iridescence: 0.8,
    sheen: 0.6,
    metallic: 0.35,
    tint: "#d6f84c",
    depth: 0.3,
    bevel: 0.5,
    highlight: "#d6f84c",
  },
  "particle-object": { ...OBJ_BASE, count: 90000, size: 1.5, color: "#d6f84c", drift: 0.3 },
  "ascii-object": {
    ...OBJ_BASE,
    cellSize: 9,
    colored: 0,
    color: "#d6f84c",
    contrast: 1.2,
    highlight: "#d6f84c",
  },
  "dithered-object": { ...OBJ_BASE, method: "floyd-steinberg", gridSize: 3, highlight: "#d6f84c" },
};

const LENSES = IDEAS.filter((i) => i.family !== "object");
const OBJECTS = IDEAS.filter((i) => i.family === "object");

const GROUPS: { family: Family; title: string; items: typeof IDEAS }[] = [
  {
    family: "overlay",
    title: "WebGL overlay",
    items: LENSES.filter((i) => i.family === "overlay"),
  },
  {
    family: "canvas",
    title: "html-in-canvas",
    items: LENSES.filter((i) => i.family === "canvas"),
  },
];

/* ── Sub-components ───────────────────────────────────────────────────────*/

function Snippet({ meta, kind }: { meta: EffectMeta; kind: "wrap" | "src" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(meta.install);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const M = <span className="tok-fn">{meta.component}</span>;
  return (
    <div className="snip">
      <div className="snip__top">
        Install
        <button className="snip__copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <code className="snip__cmd">
        <span className="tok-mut">$ </span>
        {meta.install}
      </code>
      <pre>
        {/* The *Object components take an asset URL, everything else wraps children. */}
        {kind === "src" ? (
          <>
            <span className="tok-mut">{"<"}</span>
            {M} src<span className="tok-mut">=</span>
            <span className="tok-str">"/logo.svg"</span> <span className="tok-mut">{"/>"}</span>
          </>
        ) : (
          <>
            <span className="tok-mut">{"<"}</span>
            {M}
            <span className="tok-mut">{">"}</span>
            {"\n  "}
            <span className="tok-mut">{"<"}</span>YourPage <span className="tok-mut">{"/>"}</span>
            {"\n"}
            <span className="tok-mut">{"</"}</span>
            {M}
            <span className="tok-mut">{">"}</span>
          </>
        )}
      </pre>
    </div>
  );
}

function Headline() {
  return (
    <div className="head__stage">
      <h1>
        The page is the <em>texture</em>
      </h1>
    </div>
  );
}

/** The masthead is deliberately thin on prose. The claim it makes is one the
 *  reader can verify by moving their cursor two inches, so it says that
 *  instead of describing the API. */
function Masthead({ supported }: { supported: boolean }) {
  return (
    <div className="head">
      <div className="head__kicker">
        <span className="label">canvasui.dev</span>
        <span className="head__rule" />
        <span className="label num">33 effects</span>
      </div>

      <Suspense fallback={<Headline />}>
        <Hero>
          <Headline />
        </Hero>
      </Suspense>

      <div className="head__sub">
        <p className="head__lede">
          Drag your cursor across that headline.{" "}
          {supported ? (
            <>That's your live DOM inside a shader — still selectable, still clickable.</>
          ) : (
            <>
              Right now that's a WebGL overlay. Turn on{" "}
              <code>chrome://flags/#canvas-draw-element</code> and the shader starts sampling
              the type itself.
            </>
          )}
        </p>
        <dl className="spec">
          <dt>Source</dt>
          <dd>shadcn registry · vendored, no build step</dd>
          <dt>Frameworks</dt>
          <dd>React · Solid · Vue · Svelte · Preact · vanilla</dd>
          <dt>License</dt>
          <dd>MIT + Commons Clause</dd>
          <dt>Keys</dt>
          <dd>
            <span className="num">[ ]</span> cycle · <span className="num">F</span> full bleed
          </dd>
        </dl>
      </div>
    </div>
  );
}

/** Mounts children only once they have been scrolled near — keeps idle WebGL
 *  contexts off the GPU until the section is actually being looked at. */
function WhenVisible({ children, minHeight }: { children: ReactNode; minHeight: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setSeen(true),
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return (
    <div ref={ref} style={{ minHeight }}>
      {seen ? children : null}
    </div>
  );
}

/* ── App ──────────────────────────────────────────────────────────────────*/

/** ?fx=shatter&surface=editorial — deep-links to a lens so a specific
 *  combination can be shared, bookmarked, or screenshotted. */
function readParams() {
  if (typeof location === "undefined") return {};
  const p = new URLSearchParams(location.search);
  const fx = p.get("fx");
  const sf = p.get("surface");
  return {
    fx: fx && loaders[fx] && BY_SLUG.get(fx)?.family !== "object" ? fx : undefined,
    obj: fx && BY_SLUG.get(fx)?.family === "object" ? fx : undefined,
    surface: SURFACES.some((s) => s.id === sf) ? (sf as SurfaceId) : undefined,
  };
}

export default function App() {
  const [supported] = useState(detectHtmlInCanvas);
  const init = useMemo(readParams, []);
  const [slug, setSlug] = useState(init.fx ?? "glass");
  const [surface, setSurface] = useState<SurfaceId>(init.surface ?? "ops");
  const [bleed, setBleed] = useState(false);
  const [objSlug, setObjSlug] = useState(init.obj ?? "glass-object");

  // Keep the URL in step without adding history entries on every click.
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    p.set("fx", slug);
    p.set("surface", surface);
    history.replaceState(null, "", `?${p}${location.hash}`);
  }, [slug, surface]);

  const meta = META.get(slug)!;
  const idea = BY_SLUG.get(slug)!;
  const Effect = useMemo(() => getLazy(slug) as unknown as Wrapper, [slug]);
  const ObjEffect = useMemo(() => getLazy(objSlug) as unknown as ObjectComp, [objSlug]);

  const step = useCallback(
    (d: number) => {
      const i = LENSES.findIndex((l) => l.slug === slug);
      setSlug(LENSES[(i + d + LENSES.length) % LENSES.length].slug);
    },
    [slug],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Escape") setBleed(false);
      else if (e.key === "f" || e.key === "F") setBleed((v) => !v);
      else if (e.key === "[") step(-1);
      else if (e.key === "]") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const inert = idea.family === "canvas" && !supported;

  const page = (
    <div className="app">
      <header className="bar">
        <div className="bar__mark">
          Optics <i>Bench</i>
        </div>
        <div className="bar__spacer" />
        <div className="bar__stat">
          <span className={`led ${supported ? "led--on" : "led--off"}`} />
          html-in-canvas {supported ? "active" : "off"}
        </div>
      </header>

      <Masthead supported={supported} />

      {/* ── Lens bench ───────────────────────────────────────────────── */}
      <section className="sec" id="bench">
        <div className="sec__head">
          <h2>Bench</h2>
          <p className="sec__note">
            Click the buttons. Type in the field. Nothing here is a screenshot.
          </p>
        </div>

        <div className="bench">
          <nav className="rail" aria-label="Effects">
            {GROUPS.map((g) => (
              <div className="rail__group" key={g.family}>
                <div className="rail__title">
                  <span className={`led ${g.family === "overlay" ? "led--on" : "led--off"}`} />
                  {g.title}
                  <b className="num">{g.items.length}</b>
                </div>
                {g.items.map((it, i) => (
                  <button
                    key={it.slug}
                    className={`rail__item${
                      g.family === "canvas" && !supported ? " rail__item--muted" : ""
                    }`}
                    aria-pressed={slug === it.slug}
                    onClick={() => setSlug(it.slug)}
                  >
                    <span className="rail__n num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="rail__name">{META.get(it.slug)?.title ?? it.slug}</span>
                    <span className="rail__tag">{it.tag}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="stage">
            <div className="stage__bar">
              <span className="stage__name">{meta.title}</span>
              <span className="label">{FAMILY_LABEL[idea.family]}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <div className="seg">
                  {SURFACES.map((s) => (
                    <button
                      key={s.id}
                      aria-pressed={surface === s.id}
                      onClick={() => setSurface(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="seg">
                  <button onClick={() => setBleed(true)}>Full bleed</button>
                </div>
              </div>
            </div>

            <div className="stage__body">
              <Suspense
                fallback={
                  <div style={{ position: "relative", width: "100%" }}>
                    <Surface id={surface} />
                    <div className="pending">
                      <span>compiling shader</span>
                    </div>
                  </div>
                }
              >
                {/* key forces a clean remount so the old WebGL context is released */}
                <Effect key={slug}>
                  <Surface id={surface} />
                </Effect>
              </Suspense>
            </div>
          </div>

          <aside className="readout">
            <span className="readout__fam">
              <span
                className={`led ${idea.family === "overlay" ? "led--on" : "led--off"}`}
                style={{ width: 5, height: 5, boxShadow: "none" }}
              />
              {FAMILY_LABEL[idea.family]}
            </span>
            <p className="readout__idea">{idea.idea}</p>
            <Snippet meta={meta} kind="wrap" />
            <p className="readout__idea" style={{ fontSize: 10.5, opacity: 0.6 }}>
              {FAMILY_NOTE[idea.family]}
            </p>
          </aside>
        </div>

        {inert && (
          <div className="flagnote">
            <span className="led led--off" style={{ marginTop: 6 }} />
            <div>
              <b>{meta.title} is sitting this one out.</b> You're seeing the plain-HTML
              fallback — exactly what your own visitors would see. Enable{" "}
              <code>chrome://flags/#canvas-draw-element</code> and restart Chrome to watch it
              work. The ten overlay effects above need no flag.
            </div>
          </div>
        )}
      </section>

      {/* ── Object bench ─────────────────────────────────────────────── */}
      <section className="sec" id="objects">
        <div className="sec__head">
          <h2>Objects</h2>
          <p className="sec__note">
            One SVG, five materials. No 3D pipeline, no flag.
          </p>
        </div>

        <div className="obj">
          <WhenVisible minHeight={460}>
            <div className="obj__stage">
              <Suspense
                fallback={
                  <div className="pending">
                    <span>building scene</span>
                  </div>
                }
              >
                <ObjEffect key={objSlug} src="/mark.svg" {...OBJ_PROPS[objSlug]} />
              </Suspense>
            </div>
          </WhenVisible>

          <aside className="readout">
            <div className="objpick">
              {OBJECTS.map((o) => (
                <button
                  key={o.slug}
                  aria-pressed={objSlug === o.slug}
                  onClick={() => setObjSlug(o.slug)}
                >
                  {o.tag}
                </button>
              ))}
            </div>
            <p className="readout__idea">{BY_SLUG.get(objSlug)!.idea}</p>
            <Snippet meta={META.get(objSlug)!} kind="src" />
            <p className="readout__idea" style={{ fontSize: 10.5, opacity: 0.6 }}>
              Rendering <code>public/mark.svg</code>. Swap <code>src</code> for your own
              wordmark and it extrudes automatically.
            </p>
          </aside>
        </div>
      </section>

      {/* ── Catalog ──────────────────────────────────────────────────── */}
      <section className="sec" id="catalog">
        <div className="sec__head">
          <h2>Uses</h2>
          <p className="sec__note">
            What each one is actually for. Click to load it on the bench.
          </p>
        </div>

        <div className="legend">
          <span>
            <i className="cat__fam--overlay" /> WebGL overlay — works everywhere
          </span>
          <span>
            <i className="cat__fam--canvas" /> html-in-canvas — needs the Chrome flag
          </span>
          <span>
            <i className="cat__fam--object" /> three.js object — works everywhere
          </span>
        </div>

        <div className="cat">
          {IDEAS.map((it, i) => {
            const m = META.get(it.slug)!;
            const isObj = it.family === "object";
            return (
              <button
                key={it.slug}
                className="cat__cell"
                onClick={() => {
                  if (isObj) {
                    setObjSlug(it.slug);
                    document.getElementById("objects")?.scrollIntoView({ block: "start" });
                  } else {
                    setSlug(it.slug);
                    document.getElementById("bench")?.scrollIntoView({ block: "start" });
                  }
                }}
              >
                <div className="cat__top">
                  <span className="cat__n num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="cat__name">{m.title}</span>
                  <span className={`cat__fam cat__fam--${it.family}`} />
                </div>
                <p className="cat__idea">{it.idea}</p>
                <span className="cat__go">Load on bench →</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="foot">
        <span>
          Effects by <a href="https://canvasui.dev">Canvas UI</a>, vendored into{" "}
          <code>src/canvasui/</code>.
        </span>
        <span>
          Re-pull: <code>npm run vendor</code>
        </span>
        <span style={{ marginLeft: "auto" }}>
          <a href="https://github.com/codyhxyz/htmlincanvas-demo">Source</a> ·{" "}
          <a href="https://canvasui.dev/docs">Canvas UI docs</a>
        </span>
      </footer>
    </div>
  );

  if (!bleed) return page;

  return (
    <Suspense fallback={page}>
      <Effect key={`bleed-${slug}`}>{page}</Effect>
      <button className="bleed-exit" onClick={() => setBleed(false)}>
        {meta.title} over the whole page <kbd>ESC</kbd>
      </button>
    </Suspense>
  );
}
