/**
 * The catalog. Every Canvas UI effect paired with what it is actually good for.
 *
 * `family` decides where an effect can run:
 *   overlay — pure WebGL drawn on top of the page. Works in any modern browser.
 *   canvas  — needs the experimental html-in-canvas API (chrome://flags/#canvas-draw-element).
 *             Without it the content still renders, the effect just sits out.
 *   object  — three.js scene fed an asset URL. No children, no html-in-canvas. Works everywhere.
 */
export type Family = "overlay" | "canvas" | "object";

export interface Idea {
  slug: string;
  family: Family;
  /** Two or three words for the rail. */
  tag: string;
  /** What to actually build with it. */
  idea: string;
}

export const IDEAS: Idea[] = [
  // ── Pure WebGL overlay: safe everywhere ──────────────────────────────────
  {
    slug: "liquid",
    family: "overlay",
    tag: "ink in water",
    idea: "The default “this page is alive” hero. Tint it to one brand color and it reads as premium devtool; leave rainbow on and it reads as creative studio. Cheapest possible way to make a static landing page feel responsive to a human being.",
  },
  {
    slug: "glass",
    family: "overlay",
    tag: "inspect lens",
    idea: "Point `targets` at your pricing tiers and the lens crystal-balls each one as you pass over it. A spec sheet, comparison table, or map that rewards looking closely — the interaction *is* the argument that you sweat details.",
  },
  {
    slug: "magnify",
    family: "overlay",
    tag: "scanner HUD",
    idea: "Sci-fi reticle for anything that inspects data: an OSINT tool, satellite imagery, log search, anomaly detection. Sells the claim “we look closer at your data than anyone else” without a single word of copy.",
  },
  {
    slug: "blaze",
    family: "overlay",
    tag: "fire + heat",
    idea: "Launch day, a streak counter, Black Friday, or a status page during an incident. Heat distortion rising over real UI is a genuinely rare effect on the web — save it for one moment that deserves it.",
  },
  {
    slug: "ripple",
    family: "overlay",
    tag: "pond surface",
    idea: "Click feedback that spreads across the whole page instead of one button. Perfect for calm software — meditation, journaling, a bank that wants to feel unhurried. Also a beautiful footer.",
  },
  {
    slug: "droplets",
    family: "overlay",
    tag: "rain on glass",
    idea: "Outdoor and rain gear, a moody album or film page, or a weather dashboard where the droplets are driven by the actual forecast you are displaying. Wire `intensity` to real precipitation data.",
  },
  {
    slug: "clouds",
    family: "overlay",
    tag: "parting fog",
    idea: "A pre-launch teaser where the cursor is the only thing that clears the fog — visitors have to explore to read your copy. Also strong for sleep, meditation, and aviation.",
  },
  {
    slug: "bubble",
    family: "overlay",
    tag: "metaball drop",
    idea: "Consumer and playful: beverages, skincare, kids' apps, a soda brand. The cursor becomes a drop of your product and refracts whatever it passes over. Rare in that it is charming rather than technical.",
  },
  {
    slug: "grid",
    family: "overlay",
    tag: "tile waves",
    idea: "A portfolio or case-study index where the whole grid breathes under the cursor. Also good for a dashboard overview — it makes a wall of cards feel like a physical surface instead of a spreadsheet.",
  },
  {
    slug: "laser",
    family: "overlay",
    tag: "etched scroll",
    idea: "Long-form done properly: a manifesto, a changelog, a launch essay where every line is burned onto the page as you arrive at it. One of the few scroll effects that improves reading instead of fighting it.",
  },

  // ── html-in-canvas: the live DOM becomes a texture ───────────────────────
  {
    slug: "shatter",
    family: "canvas",
    tag: "glass shards",
    idea: "The break-it moment. A destructive-action confirm, a security breach demo, a dramatic 404, or the transition when a user cancels. Your real UI lifts into refracting shards and stays clickable the entire time.",
  },
  {
    slug: "decrypt-reveal",
    family: "canvas",
    tag: "cipher text",
    idea: "The single best fit for a security or privacy product: the page ships encrypted and decodes only where you look. Also a superb waitlist teaser, or a changelog with genuinely redacted unreleased entries.",
  },
  {
    slug: "frost",
    family: "canvas",
    tag: "melting ice",
    idea: "The best “unlock” metaphor available. A paywalled article that thaws under the cursor, a gated report, a winter product drop. Hovering melts a hole and it refreezes behind you — the tease is the whole mechanic.",
  },
  {
    slug: "peel",
    family: "canvas",
    tag: "lift a corner",
    idea: "Before/after with no slider. Peel the old UI back to show the redesign, peel light theme back to dark, peel the marketing page back to the code underneath. Two real layers, both interactive.",
  },
  {
    slug: "asciify",
    family: "canvas",
    tag: "live ascii",
    idea: "For a CLI, terminal, or infra brand: your marketing page is secretly a TUI, and the cursor is what proves it. Far more convincing than an ASCII art block because the glyphs are your actual rendered layout.",
  },
  {
    slug: "glyph-rain",
    family: "canvas",
    tag: "falling code",
    idea: "Matrix rain that everyone has seen — except each drop head casts a real pool of light onto your UI, so the rain appears to be in the same room as the interface. That lighting is the entire trick.",
  },
  {
    slug: "vhs",
    family: "canvas",
    tag: "worn tape",
    idea: "An archive section, a “version 1.0 looked like this” toggle, a music or film project, an 80s campaign. Great for a changelog: render the old release notes through the tape and the new ones clean.",
  },
  {
    slug: "glitch",
    family: "canvas",
    tag: "signal tear",
    idea: "Incident and error states that feel intentional rather than broken: a status page mid-outage, a 500, a horror or cyberpunk game site, or a beta badge that destabilizes on hover.",
  },
  {
    slug: "particle-reveal",
    family: "canvas",
    tag: "dust to UI",
    idea: "Empty states and onboarding where the product assembles itself as you explore. Also the most honest “generating…” state an AI tool can have — the interface is literally condensing out of noise.",
  },
  {
    slug: "particle-scroll",
    family: "canvas",
    tag: "sand on scroll",
    idea: "Scrollytelling for a research report or annual review. Everything below the fold is drifting sand until you scroll it into being — it enforces reading pace without hijacking the scrollbar.",
  },
  {
    slug: "cloth",
    family: "canvas",
    tag: "hanging fabric",
    idea: "Apparel and textiles, obviously — hang your size chart on real cloth. Less obviously: a manifesto printed on a banner, or a soft About page for a studio that wants to feel handmade.",
  },
  {
    slug: "canvas",
    family: "canvas",
    tag: "woven paper",
    idea: "Makes a web page feel like a physical print: photography portfolios, print shops, zines, a small-batch goods store. Text stays crisp, so unlike most texture effects it does not cost you legibility.",
  },
  {
    slug: "displacement",
    family: "canvas",
    tag: "ripple grid",
    idea: "Audio and music products where the page behaves like a speaker cone. Also a convincing “model is thinking” state — chromatic fringing over live UI reads as computation, not decoration.",
  },
  {
    slug: "retro-dither",
    family: "canvas",
    tag: "1-bit lens",
    idea: "Indie games, e-ink hardware, a zine, or a low-fi mode toggle that is actually fun to turn on. Pair with a pixel or CRT type stack and commit fully — half-hearted retro reads as a mistake.",
  },
  {
    slug: "force-field",
    family: "canvas",
    tag: "energy shield",
    idea: "A firewall, WAF, or DDoS product visualizing its own perimeter, where clicks detonate shockwaves through your live dashboard. Also a strong game menu or a “protected” account state.",
  },
  {
    slug: "hex-float",
    family: "canvas",
    tag: "hex floor",
    idea: "Anything built on a mesh or a network: infra, distributed systems, esports, strategy games. Your real page becomes the floor of the world, tilting back in perspective and rising toward the cursor.",
  },
  {
    slug: "bend",
    family: "canvas",
    tag: "cube scroll",
    idea: "Multi-chapter documents — a portfolio, an annual report, a long case study — where each scroll is a physical page turn over an edge. Gives structure to long content without a nav rail.",
  },
  {
    slug: "flame-wrap",
    family: "canvas",
    tag: "one hot element",
    idea: "The most surgical effect here, and probably the highest-converting: it wraps a single element, not the page. Put it on the primary CTA or the “most popular” pricing tier and nothing else.",
  },

  // ── three.js object renderers: feed them a GLB, SVG, or image ────────────
  {
    slug: "glass-object",
    family: "object",
    tag: "liquid glass",
    idea: "Your logo as a floating glass sculpture with real refraction and dispersion — and it accepts a plain SVG, so you do not need a 3D artist. The fastest route to an Apple-adjacent hero.",
  },
  {
    slug: "liquid-object",
    family: "object",
    tag: "fluid drag",
    idea: "Fragrance, beverages, paint, anything fluid. Also a superb title card: drag your wordmark through the fluid once on load and let it settle into chromatic fringes.",
  },
  {
    slug: "particle-object",
    family: "object",
    tag: "point cloud",
    idea: "AI and ML products where a point cloud is the honest visual metaphor, plus photogrammetry and 3D-scanning tools. The cursor shoves the particles and they spring back into shape.",
  },
  {
    slug: "ascii-object",
    family: "object",
    tag: "ascii solid",
    idea: "A 3D product rendered entirely in terminal glyphs, chosen by shape so they trace the silhouette. For a CLI brand where a photoreal render would feel completely off-key.",
  },
  {
    slug: "dithered-object",
    family: "object",
    tag: "1-bit solid",
    idea: "Retro computing, e-ink hardware, Playdate-adjacent games, or a Bauhaus-flavored print aesthetic. Floyd–Steinberg on a rotating 3D object is a look almost nobody on the web is using.",
  },
];

export const BY_SLUG = new Map(IDEAS.map((i) => [i.slug, i]));

export const FAMILY_LABEL: Record<Family, string> = {
  overlay: "WebGL overlay",
  canvas: "html-in-canvas",
  object: "three.js object",
};

export const FAMILY_NOTE: Record<Family, string> = {
  overlay: "Runs in any modern browser. No flag needed.",
  canvas: "Needs the experimental html-in-canvas API. Degrades to plain HTML without it.",
  object: "Renders an asset in a 3D studio scene. No flag needed.",
};
