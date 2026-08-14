import { useState } from "react";
import "./surfaces.css";

/**
 * Three specimen interfaces. Whichever one is selected gets handed to the
 * active effect as children — same content, different lens. Everything in
 * here is genuinely interactive on purpose: the point of html-in-canvas is
 * that the buttons still work while the page is being shattered.
 */

export type SurfaceId = "ops" | "shop" | "editorial";

export const SURFACES: { id: SurfaceId; label: string }[] = [
  { id: "ops", label: "Console" },
  { id: "shop", label: "Storefront" },
  { id: "editorial", label: "Editorial" },
];

const BARS = [38, 52, 44, 61, 49, 73, 58, 81, 66, 92, 74, 88, 69, 97, 83, 100];

const LOG: { t: string; lvl: "ok" | "wrn" | "err"; msg: string }[] = [
  { t: "09:41:02", lvl: "ok", msg: "edge/iad — deploy a3f91c promoted" },
  { t: "09:41:07", lvl: "wrn", msg: "p99 latency 412ms exceeds budget" },
  { t: "09:41:12", lvl: "ok", msg: "autoscale: 12 → 18 workers" },
  { t: "09:41:19", lvl: "err", msg: "upstream timeout: billing-svc" },
  { t: "09:41:23", lvl: "ok", msg: "retry succeeded in 84ms" },
];

function Ops() {
  const [armed, setArmed] = useState(false);
  return (
    <div className="surf ops">
      <div className="ops__top">
        <span className="ops__dot" />
        <span className="ops__title">edge-router</span>
        <span className="ops__env">prod · iad1</span>
      </div>

      <div className="ops__grid">
        <dl className="ops__stat">
          <dt>Requests</dt>
          <dd>
            1.42<small>M</small>
          </dd>
          <div className="ops__delta">▲ 12.4%</div>
        </dl>
        <dl className="ops__stat">
          <dt>p99</dt>
          <dd>
            412<small>ms</small>
          </dd>
          <div className="ops__delta ops__delta--down">▼ 3.1%</div>
        </dl>
        <dl className="ops__stat">
          <dt>Error rate</dt>
          <dd>
            0.03<small>%</small>
          </dd>
          <div className="ops__delta">▲ 0.01</div>
        </dl>
      </div>

      <div className="ops__chart">
        {BARS.map((h, i) => (
          <div key={i} className="ops__bar" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="ops__axis">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
      </div>

      <div className="ops__log">
        <div className="ops__logtop">Event stream</div>
        {LOG.map((l) => (
          <div key={l.t} className="ops__line">
            <time>{l.t}</time>
            <span className={`ops__lvl ops__lvl--${l.lvl}`}>{l.lvl.toUpperCase()}</span>
            <span className="ops__msg">{l.msg}</span>
          </div>
        ))}
      </div>

      <div className="ops__actions">
        <button className="ops__btn" onClick={() => setArmed((v) => !v)}>
          {armed ? "Disarm" : "Arm rollback"}
        </button>
        <button className="ops__btn ops__btn--go">
          {armed ? "Roll back now" : "Promote build"}
        </button>
      </div>
    </div>
  );
}

const SWATCHES = ["#b4441f", "#16150f", "#d6f84c", "#3f6f52"];

function Shop() {
  const [sw, setSw] = useState(0);
  const [pick, setPick] = useState(1);
  const tiers = [
    { name: "Single", price: 18, feats: ["One roast", "Ships Tuesday"] },
    { name: "Standing", price: 44, feats: ["Two roasts monthly", "Skip anytime", "Free grind"] },
    { name: "Cellar", price: 96, feats: ["Everything we roast", "Rare lots first", "Cupping notes"] },
  ];
  return (
    <div className="surf shop">
      <div className="shop__brand">
        <h3>Meridian</h3>
        <span>Est. 2019 · Oakland</span>
      </div>

      <div className="shop__hero">
        <p>
          Coffee for people who <em>read the label.</em>
        </p>
      </div>

      <div className="shop__tiers">
        {tiers.map((t, i) => (
          <div key={t.name} className="shop__tier" data-pick={pick === i}>
            <h4>{t.name}</h4>
            <div className="shop__price">
              ${t.price}
              <small>/mo</small>
            </div>
            <ul className="shop__feat">
              {t.feats.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button className="shop__cta" onClick={() => setPick(i)}>
              {pick === i ? "Selected" : "Choose"}
            </button>
          </div>
        ))}
      </div>

      <p className="shop__note">
        Bag color
        <span className="shop__swatches">
          {SWATCHES.map((c, i) => (
            <button
              key={c}
              className="shop__sw"
              style={{ background: c }}
              aria-pressed={sw === i}
              aria-label={`Swatch ${i + 1}`}
              onClick={() => setSw(i)}
            />
          ))}
        </span>
      </p>
    </div>
  );
}

function Editorial() {
  return (
    <div className="surf ed">
      <div className="ed__meta">
        <b>Issue 04</b>
        <span>Interface</span>
        <span style={{ marginLeft: "auto" }}>12 min</span>
      </div>

      <h3>
        The page was never <em>flat.</em>
      </h3>

      <p className="ed__standfirst">
        For thirty years the browser drew rectangles and we agreed to pretend that was the
        whole medium. A canvas that can sample live DOM quietly ends the arrangement.
      </p>

      <div className="ed__cols">
        <p>
          Every visual trick the web has shipped has been a negotiation with the compositor.
          Blur behind a panel, a shadow under a card, a transform on scroll — all of it lives
          inside a box model that was never designed to bend.
        </p>
        <blockquote className="ed__pull">
          The interface stops being a picture of a thing and starts being the thing.
        </blockquote>
        <p>
          What changes with an element you can paint into a texture is not fidelity but
          authorship. The shader is no longer decorating around your layout; it is reading it.
          Type stays selectable. Buttons stay clickable. Focus rings still land where they
          should.
        </p>
        <p>
          Which raises the only interesting question left: now that the page can be made of
          glass, fire, cloth or cipher text, what is actually worth saying with it?
        </p>
      </div>

      <div className="ed__sign">
        <span>Subscribe</span>
        <span className="ed__field">
          <input type="email" placeholder="you@studio.com" aria-label="Email" />
          <button>Join</button>
        </span>
      </div>
    </div>
  );
}

export function Surface({ id }: { id: SurfaceId }) {
  if (id === "ops") return <Ops />;
  if (id === "shop") return <Shop />;
  return <Editorial />;
}
