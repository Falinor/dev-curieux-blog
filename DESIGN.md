# Dev curieux blog — Design brief

**Status: direction locked → « Cartes postales ».** Chosen from three prototyped directions; see [Decisions from the prototype](#decisions-from-the-prototype). The landing page's design system (`Falinor/curieux-dev`, `DESIGN.md`, « L'heure dorée ») is the parent: the blog is a reading-friendly branch of the same world.

---

## Identity

The blog of **Dev curieux**: a French freelance fullstack developer writing about dev things, learning in public. Same brand, same domain family (`blog.curieux.dev`), same warmth.

Two pillars, and every design choice should serve both:

- **The person.** Sun, ocean, enjoying life. Warm, human, playful, never corporate. Carried over from « L'heure dorée ».
- **The builder.** Curious, passionate, technical, and **product-minded**. In the AI era one developer can build anything, so the developer is also the product owner: the blog cares about _why_ something is built and for whom, not only _how_.

**Voice.** First person, French, honest about what is still being figured out. Technical without showing off; always ties the tech back to the product or the person using it.

**Audience.** Fellow developers first (French readers on the original, everyone else through the English Translation); prospective clients second, who should come away trusting the builder.

## What carries over from the landing page

- Color tokens: `ink`, `cream`, `coral`, `sun`, the ocean blues, and the day / gold / dusk skies.
- Typefaces: Bricolage Grotesque (display), Geist (body), Geist Mono (code, tags, stamps).
- The tactile primitive (ink outline + hard offset shadow), used sparingly: cards, tags, buttons. Never on running text.
- The legal-page precedent: brand frame kept, scene calmed for long-form legibility.

## What changes for a blog

Reading comes first. The scene is atmosphere at the edges, never behind the text.

- **Measure:** 60–75 characters per line; body 18–20px; generous line height.
- **Hierarchy:** clear H2/H3 rhythm for skimmable technical posts. No table of contents in v1; add one if long Posts need it.
- **Code:** a syntax theme drawn from the brand palette; long lines scroll, never wrap mid-token; copy button.
- **Product angle:** a way of writing, not a template feature. Posts often open on why something matters and close on what was learned, but there is no dedicated component or frontmatter field for it.
- **Translation notice:** English pages say they are machine-translated from French and link to the original, visibly but without shouting.
- **Social image:** generated per Post (title on brand colors), consistent with the chosen direction.

## Decisions from the prototype

Three directions were prototyped (A « Carnet de bord », B « Cartes postales », C « Atelier »), each with home page, Post page and social image, in both themes and both languages. **B « Cartes postales » won on every page.** The prototype is the primary source: `prototype/blog-design/index.html` on the `claude/epic-pascal-mhqjc2` branch (open with `#b-accueil-fr-crepuscule`).

- **Direction.** Tactile, playful, closest to the landing page: a sunset scene with drifting waves at the top, a tilted « Dev curieux » badge, Posts as tilted postcards (ink outline, hard offset shadow) with the first Tag as a stamp, on a sea-colored background.
- **Home page.** Scene hero, then the Posts as postcards, **at most two per row**. The top slot holds the **Pinned Posts**, newest first; with no Pinned Post, it holds the most recent Post. The other Posts follow, newest first.
- **Post page.** A title postcard overlapping the horizon, then the Post on a cream sheet with ink outline and hard shadow; code blocks and quotes are tactile cards too.
- **Themes.** Both: « crépuscule » (dark) and « plein soleil » (light), following the reader's system setting, with a toggle. This deliberately breaks the landing page's single-world rule. **The dark theme is the reference**; the light theme needs another design pass before launch.
- **Social image.** The postcard: Post title on a tilted card over the sunset, Tag stamp, `blog.curieux.dev`.
- **Not kept.** The sidebar, timeline and Problem → Built → Learned triad from C; the product framing stays a writing habit (see above).

## Hard requirements

- French first; accents render correctly.
- Responsive, mobile-first.
- WCAG 2.1 AA: contrast, visible focus, semantic order, reduced motion respected.
- Fast: static HTML, self-hosted fonts, no layout shift.
- No cookie banner (cookieless analytics).
