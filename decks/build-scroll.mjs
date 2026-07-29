// Build a scrolling "frames" deck from a Marp-style markdown file.
//
// Same source as the Marp deck: YAML frontmatter, then slides separated by ---.
// Instead of a paged deck you get one long page where each slide is a 16:9 card
// that the browser snaps to as you scroll.
//
//   node build-scroll.mjs [source.md] [--watch] [--serve] [--port=4321]
//
// --serve implies --watch and adds a local server with live reload, because a
// page opened as file:// can't be told to refresh itself. Open the localhost
// URL it prints; the built file on disk stays clean either way.
//
// --port lets a second deck be served alongside the first (one port each), for
// comparing two drafts in two tabs.
//
// Defaults to retreat.md -> ../site/quartz/static/decks/retreat-scroll.html

import { readFileSync, writeFileSync, mkdirSync, watchFile, existsSync } from "node:fs";
import { dirname, basename, resolve, join, extname } from "node:path";
import { createServer } from "node:http";
import { marked } from "marked";

const args = process.argv.slice(2);
const serve = args.includes("--serve");
const watch = serve || args.includes("--watch");
const port = Number(args.find((a) => a.startsWith("--port="))?.slice(7)) || 4321;
const source = resolve(args.find((a) => !a.startsWith("--")) ?? "retreat.md");
const slug = basename(source, ".md");
const out = resolve(`../site/quartz/static/decks/${slug}-scroll.html`);

// Images live in the hub's content/attachments — where Quartz publishes them,
// reachable at /attachments/<file> on the built site. The dev server mirrors
// that path (see below), so the same src works locally and in production.
const ATTACH = resolve("../content/attachments");

// Translate Obsidian embeds — ![[file.png]] or ![[file.png|200]] (width, or
// WxH) — into <img>. marked passes the raw HTML straight through.
//
// The width you type is read as "pixels at full projector size" but emitted as
// a container-relative width (cqw), so images scale in lockstep with the text
// at every screen size instead of staying a fixed pixel block. CARD_MAX matches
// the .card max-width, so `|200` == 200px when the card is at full size.
const CARD_MAX = 1280;
function resolveEmbeds(md) {
  return md.replace(/!\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g, (_, file, opt) => {
    const name = file.trim();
    if (!existsSync(join(ATTACH, name))) console.warn("  ! missing image:", name);
    let style = "";
    const m = opt && /^(\d+)(?:x(\d+))?$/.exec(opt.trim());
    if (m) style = ` style="width:${((+m[1] / CARD_MAX) * 100).toFixed(2)}cqw"`;
    const alt = opt && !m ? opt.trim().replace(/"/g, "&quot;") : "";
    return `<img src="/attachments/${encodeURIComponent(name)}"${style} alt="${alt}">`;
  });
}

// Slides run in pairs: 1a 1b, 2a 2b, ... Each pair shares a pastel backdrop so
// the two read as bound together; the colour change is what marks a new pair.
// Cycles if a deck outruns the palette. An odd final slide is an "a" on its own.
const PASTELS = [
  "#f8dcd6", // coral
  "#d8ebe6", // teal
  "#e7dcf3", // lilac
  "#f9ecc9", // butter
  "#d9e7f5", // powder blue
  "#e3ecd0", // sage
  "#f7dcea", // blush
  "#dcdcf0", // periwinkle
  "#f9e0cd", // apricot
];

// Heading level drives the structure:
//   #   -> a slide, titled at full size
//   ##  -> a slide, titled one size down — a continuation of the point above it
//   --- -> a section break: everything after it takes the next pastel
//   ### and deeper are just content inside whichever frame they're in.
//
// Both make an ordinary 16:9 slide the deck snaps to; the heading level only
// sets how loud the title is. Slides number straight through, 1..n. A page with
// more on it than a card holds takes {.tall} — see the marker note below.
//
// Colour marks a *section of the talk*, not a slide. Consecutive slides run in
// the same colour until a --- says otherwise.
function parseFrames(body) {
  const frames = [];
  let section = 0; // colour band
  let slide = 0; // runs 1..n across the whole deck
  for (const line of body.split(/\r?\n/)) {
    if (/^-{3,}\s*$/.test(line)) {
      section++;
      continue;
    }
    const heading = /^(#{1,2})\s+\S/.exec(line);
    if (heading) {
      if (!section) section = 1;
      slide++;
      frames.push({ section, slide, level: heading[1].length, newSection: true, lines: [line] });
      // only the first slide of a colour run opens the section, visually
      if (frames.filter((f) => f.section === section).length > 1) frames.at(-1).newSection = false;
    } else if (frames.length) {
      frames.at(-1).lines.push(line);
    }
  }
  const mapped = frames.map((f) => {
    // A trailing marker on the heading:
    //   {.class}   tags the frame  (e.g. {.indent})
    //   {bg:#hex}  or {bg:name}    overrides that frame's colour
    // The marker is stripped before rendering; it rides on the frame so it
    // travels with the slide even if slide numbers shift.
    const classes = [];
    let bg = "";
    f.lines[0] = f.lines[0].replace(/\s*\{([^}]*)\}\s*$/, (_, spec) => {
      for (const tok of spec.split(/\s+/)) {
        if (tok.startsWith(".")) classes.push(tok.slice(1));
        else if (/^bg:/i.test(tok)) bg = tok.slice(3).replace(/[^#\w(),.%-]/g, "");
      }
      return "";
    });
    return {
      ...f,
      classes,
      bg,
      md: resolveEmbeds(f.lines.join("\n").trim()),
      label: String(f.slide),
      color: PASTELS[(f.section - 1) % PASTELS.length],
    };
  });
  return mapped;
}

function build() {
  const raw = readFileSync(source, "utf8");

  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ""); // drop frontmatter
  const list = parseFrames(body);

  const title = (raw.match(/^#\s+(.+)$/m)?.[1] ?? slug).trim();

  const frames = list
    .map(
      (f) => `<section class="frame${f.level === 2 ? " sub" : ""}${f.classes.length ? " " + f.classes.join(" ") : ""}" id="s${f.label}" style="--pastel:${f.bg || f.color}">
  <article class="card">
${marked.parse(f.md).trim()}
    <span class="num">${f.label}</span>
  </article>
</section>`
    )
    .join("\n");

  const dots = list
    .map(
      (f) =>
        `<a href="#s${f.label}" class="${f.newSection ? "newsec" : ""}" style="--pastel:${f.bg || f.color}" aria-label="Slide ${f.label}"></a>`
    )
    .join("");

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page(title, frames, dots), "utf8");

  // Marp reads the same source, but wants --- between slides. Write it a copy
  // so retreat.md stays the single file you edit.
  const marpSrc = resolve(`.build/${slug}.marp.md`);
  mkdirSync(dirname(marpSrc), { recursive: true });
  writeFileSync(
    marpSrc,
    (raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)?.[0] ?? "") +
      "\n" +
      list.map((f) => f.md).join("\n\n---\n\n") +
      "\n",
    "utf8"
  );

  const sub = list.filter((f) => f.level === 2).length;
  console.log(`${basename(source)} => ${out}  (${list.length} slides, ${sub} of them ##)`);
}

const page = (title, frames, dots) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #202228;
    --accent: #0288a8;
    --muted: #7b8794;
    --card: #fff;
    --backdrop: #34383f; /* dark, so the pastel cards read as the lit surface */
    --pad: clamp(2rem, 5vw, 5rem);
    --font: "Lexend", "Segoe UI", -apple-system, system-ui, sans-serif;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: var(--backdrop);
    color: var(--ink);
    font: 400 16px/1.6 var(--font);
    /* the scroll container: one frame at a time */
    height: 100vh;
    overflow-y: scroll;
    /* proximity, not mandatory: a {.tall} page is longer than the window, so
       you can rest partway down one instead of being yanked to its edge. */
    scroll-snap-type: y proximity;
  }
  /* every heading makes one of these: full screen, 16:9, snaps */
  .frame {
    display: grid;
    place-items: center;
    padding: clamp(1rem, 3vh, 2.5rem);
    height: 100vh;
    scroll-snap-align: center;
    padding-bottom: clamp(.5rem, 1.5vh, 1.25rem);
  }
  .card {
    position: relative;
    width: min(100%, 1280px);
    background: var(--pastel, var(--card));
    border-radius: 6px;
    box-shadow: 0 2px 4px rgb(0 0 0 / .18), 0 16px 40px rgb(0 0 0 / .28);
    padding: var(--pad);
    display: flex;
    flex-direction: column;
    container-type: inline-size;
    aspect-ratio: 16 / 9;
    max-height: 100%;
    overflow: auto;
    justify-content: center;
  }
  /* Frame marker {.tall} — for a page carrying more than a 16:9 card holds.
     Drops the fixed height so the card grows to its content and scrolls in the
     flow of the deck, rather than scrolling inside itself. Still a slide. */
  .frame.tall {
    height: auto;
    scroll-snap-align: start;
    padding-block: clamp(2rem, 6vh, 4rem);
  }
  .frame.tall .card {
    aspect-ratio: auto;
    max-height: none;
    overflow: visible;
    justify-content: flex-start;
  }
  /* type scales with the card, not the window, so frames stay slide-like */
  .card h1 {
    font-size: clamp(1.4rem, 3.7cqi, 2.5rem);
    line-height: 1.15;
    margin: 0 0 .7em;
    color: var(--accent);
    font-weight: 700;
  }
  /* ## — the same title one size down, for a page continuing the point above */
  .card h2 {
    font-size: clamp(1.2rem, 3cqi, 2rem);
    line-height: 1.2;
    margin: 0 0 .7em;
    color: var(--accent);
    font-weight: 700;
  }
  .card a { color: #0a6e8a; overflow-wrap: anywhere; }
  .card p, .card li { font-size: clamp(.95rem, 1.9cqi, 1.5rem); }
  .card p { margin: 0 0 .8em; }
  /* {.notitle} hides the slide's title but keeps the heading (page break +
     colour), so a full-bleed image or dense page reclaims the space it took. */
  .frame.notitle .card > h1,
  .frame.notitle .card > h2 { display: none; }
  /* Frame marker: add {.indent} to the heading to inset everything below it.
     Topics sit at the base inset; their bullets nest further right. Listed by
     element (not *:not) so the two rules carry equal specificity and the list
     inset actually wins on lists. */
  .frame.indent .card > h3,
  .frame.indent .card > h4,
  .frame.indent .card > h5,
  .frame.indent .card > h6,
  .frame.indent .card > p,
  .frame.indent .card > blockquote { margin-left: 1.5rem; }
  .frame.indent .card > ul,
  .frame.indent .card > ol { margin-left: 3rem; }
  /* Size tiers on a slide — NOT structural, so they never start a slide/note.
     Use them to make a line big without it becoming a heading:
       ###  big lead line      ####  medium      #####  small caption
     Normal weight, ink colour, so an inline **bold** still stands out. */
  .card h3 {
    font-size: clamp(1.2rem, 2.9cqi, 2.2rem);
    line-height: 1.25;
    font-weight: 400;
    color: var(--ink);
    margin-block: 0 .5em;
  }
  .card h4 {
    font-size: clamp(1.05rem, 2.3cqi, 1.7rem);
    line-height: 1.3;
    font-weight: 400;
    color: var(--ink);
    margin-block: 0 .5em; /* vertical only — leave margin-left for {.indent} */
  }
  .card h5 {
    font-size: clamp(.9rem, 1.6cqi, 1.2rem);
    font-weight: 400;
    color: #4a5260;
    margin-block: 0 .5em;
  }
  .card ul { margin: 0 0 .8em; padding-left: 1.4em; }
  .card li { margin-bottom: .35em; }
  .card li ul { margin: .35em 0 .5em; }
  .card li li { opacity: .8; font-size: .88em; }
  .card blockquote {
    margin: 0;
    padding: .6em 0 .6em 1.1em;
    border-left: 4px solid var(--accent);
    color: #3c4450;
    font-style: italic;
  }
  .card strong { color: #101418; }
  .card em { color: #4a5260; }
  /* tables — usually two columns of parallel points. A browser centres <th> by
     default, which floats the headings off the left edge their column sits on;
     these share one alignment so a heading reads as the label for what's under
     it. Cell type is the same cqi scale as body text, not a fixed 16px. */
  .card table { border-collapse: collapse; width: 100%; margin: 0 0 .8em; }
  .card th,
  .card td {
    font-size: clamp(.95rem, 1.9cqi, 1.5rem);
    text-align: left;
    vertical-align: top;
    padding: .2em 1.5em .2em 0;
  }
  .card th { color: #101418; padding-bottom: .7em; }
  .card img { max-width: 100%; height: auto; }
  .num {
    position: absolute;
    right: calc(var(--pad) * .55);
    bottom: calc(var(--pad) * .4);
    font-size: .85rem;
    color: var(--muted);
  }
  /* jump dots */
  nav.dots {
    position: fixed;
    right: .9rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: .5rem;
    z-index: 10;
  }
  nav.dots a {
    width: 9px; height: 9px;
    border-radius: 50%;
    background: var(--pastel);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / .35);
    transition: transform .2s;
  }
  /* extra air where the colour changes, so the dots show the sections too */
  nav.dots a.newsec { margin-top: .5rem; }
  nav.dots a.newsec:first-child { margin-top: 0; }
  nav.dots a:hover { transform: scale(1.6); }
  @media (max-width: 900px) {
    .card { aspect-ratio: auto; height: 100%; justify-content: flex-start; }
    nav.dots { display: none; }
  }
  @media print {
    body { height: auto; overflow: visible; background: #fff; }
    .frame { height: auto; page-break-after: always; padding: 0; }
    .card { box-shadow: none; border-radius: 0; }
    nav.dots { display: none; }
  }
</style>
</head>
<body>
${frames}
<nav class="dots">${dots}</nav>
<script>
  // Presenting: arrows / space / PageDown move slide to slide. Plain scrolling
  // still walks through everything.
  const slides = [...document.querySelectorAll(".frame")];
  const current = () => {
    const mid = scrollY + innerHeight / 2;
    let best = 0;
    slides.forEach((el, i) => {
      if (el.offsetTop <= mid) best = i;
    });
    return best;
  };
  addEventListener("keydown", (e) => {
    const fwd = ["ArrowRight", "PageDown", " "].includes(e.key);
    const back = ["ArrowLeft", "PageUp"].includes(e.key);
    if (!fwd && !back) return;
    e.preventDefault();
    const i = current();
    // parked partway down a {.tall} page? back returns to its top, not the one before
    const parked = scrollY > slides[i].offsetTop + innerHeight / 2;
    const next = fwd ? i + 1 : parked ? i : i - 1;
    slides[Math.max(0, Math.min(slides.length - 1, next))]
      .scrollIntoView({ behavior: "smooth", block: "center" });
  });
</script>
</body>
</html>
`;

// --- dev-only injection: live reload + a font picker -------------------
// Injected only by the dev server, never written to the file on disk. The
// picker is an exploration aid — whatever you settle on gets baked into the
// stylesheet's --font, and this UI never ships.
//
// Candidates are quiet, matter-of-fact sans faces (the ethos: don't call
// attention to yourself). "System" is the current default. They're grouped by
// the three calm neighborhoods of the sans world so the menu itself shows the
// axis: neutral/grotesque (mechanical, recedes) -> humanist (warm, open, easier
// long reading) -> geometric (circles & lines, a touch more "designed", still
// restrained). All within the not-flashy rubric.
const FONT_GROUPS = [
  ["Neutral / grotesque", [
    ["System (current)", `"Segoe UI", -apple-system, system-ui, sans-serif`],
    ["Inter", `"Inter", sans-serif`],
    ["Roboto", `"Roboto", sans-serif`],
    ["Public Sans", `"Public Sans", sans-serif`],
    ["Work Sans", `"Work Sans", sans-serif`],
    ["Libre Franklin", `"Libre Franklin", sans-serif`],
    ["IBM Plex Sans", `"IBM Plex Sans", sans-serif`],
  ]],
  ["Humanist / warm", [
    ["Source Sans 3", `"Source Sans 3", sans-serif`],
    ["Atkinson Hyperlegible", `"Atkinson Hyperlegible", sans-serif`],
    ["Fira Sans", `"Fira Sans", sans-serif`],
    ["Mulish", `"Mulish", sans-serif`],
    ["Lexend", `"Lexend", sans-serif`],
  ]],
  ["Geometric / modern", [
    ["DM Sans", `"DM Sans", sans-serif`],
    ["Manrope", `"Manrope", sans-serif`],
  ]],
];
const googleFonts =
  "https://fonts.googleapis.com/css2?" +
  [
    "Inter:wght@400;700",
    "Public+Sans:wght@400;700",
    "Source+Sans+3:wght@400;700",
    "IBM+Plex+Sans:wght@400;700",
    "Roboto:wght@400;700",
    "Work+Sans:wght@400;700",
    "Atkinson+Hyperlegible:wght@400;700",
    "Libre+Franklin:wght@400;700",
    "Fira+Sans:wght@400;700",
    "Mulish:wght@400;700",
    "Lexend:wght@400;700",
    "DM+Sans:wght@400;700",
    "Manrope:wght@400;700",
  ]
    .map((f) => "family=" + f)
    .join("&") +
  "&display=swap";

const reloadClient = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${googleFonts}" rel="stylesheet">
<style>
  #fontpick {
    position: fixed; left: .8rem; bottom: .8rem; z-index: 50;
    font: 13px/1 "Segoe UI", system-ui, sans-serif;
    background: rgb(255 255 255 / .92); color: #202228;
    border: 1px solid rgb(0 0 0 / .2); border-radius: 6px;
    padding: .35rem .5rem; box-shadow: 0 4px 14px rgb(0 0 0 / .25);
  }
  #fontpick select { font: inherit; border: 0; background: none; }
</style>
<label id="fontpick">Aa&nbsp;<select>${FONT_GROUPS.map(
  ([g, opts]) =>
    `<optgroup label='${g}'>` +
    opts
      .map(([n, v]) => `<option value='${v.replace(/'/g, "&#39;")}'>${n}</option>`)
      .join("") +
    `</optgroup>`
).join("")}</select></label>
<script>
  // restore scroll position across reloads so you land where you were
  const key = "deck-scroll";
  addEventListener("load", () => {
    const y = sessionStorage.getItem(key);
    if (y) scrollTo({ top: +y, behavior: "instant" });
    new EventSource("/__reload").onmessage = () => location.reload();
  });
  addEventListener("scroll", () => sessionStorage.setItem(key, scrollY), { passive: true });

  // font picker — persists your choice across reloads
  const sel = document.querySelector("#fontpick select");
  const saved = localStorage.getItem("deck-font");
  if (saved) { sel.value = saved; document.documentElement.style.setProperty("--font", saved); }
  sel.addEventListener("change", () => {
    document.documentElement.style.setProperty("--font", sel.value);
    localStorage.setItem("deck-font", sel.value);
  });
</script>`;

const clients = new Set();

build();

if (watch) {
  console.log("[Watch mode] Start watching...");
  watchFile(source, { interval: 400 }, () => {
    build();
    for (const res of clients) res.write("data: rebuild\n\n");
  });
}

if (serve) {
  createServer((req, res) => {
    if (req.url === "/__reload") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write("retry: 1000\n\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }
    if (req.url.startsWith("/attachments/")) {
      const file = join(ATTACH, decodeURIComponent(req.url.slice("/attachments/".length)));
      if (existsSync(file) && file.startsWith(ATTACH)) {
        const types = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", webp: "image/webp" };
        res.writeHead(200, { "Content-Type": types[extname(file).slice(1).toLowerCase()] || "application/octet-stream" });
        res.end(readFileSync(file));
      } else {
        res.writeHead(404).end("not found");
      }
      return;
    }
    const html = readFileSync(out, "utf8").replace("</body>", `${reloadClient}\n</body>`);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(html);
  }).listen(port, () => console.log(`[Serve] http://localhost:${port}/`));
}
