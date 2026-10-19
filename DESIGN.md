# Dev curieux blog — Design brief

**Status: brief, before prototypes.** This is the input to the `/prototype` round, not a locked design. The landing page's design system (`Falinor/curieux-dev`, `DESIGN.md`, « L'heure dorée ») is the parent: the blog is a calmer, reading-first branch of the same world.

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
- **Hierarchy:** clear H2/H3 rhythm for skimmable technical posts; a visible table of contents on long Posts is an option to prototype.
- **Code:** a syntax theme drawn from the brand palette; long lines scroll, never wrap mid-token; copy button.
- **Product angle:** room for a short "why it matters" framing near the top of a Post (prototype whether it is a component or just a writing habit).
- **Translation notice:** English pages say they are machine-translated from French and link to the original, visibly but without shouting.
- **Social image:** generated per Post (title on brand colors), consistent with the chosen direction.

## Open questions for the prototypes

- **Themes.** The landing page commits to a single world with no light/dark toggle. A blog is read for long stretches, often at night: prototype a light « plein soleil » theme and a dark « crépuscule » theme, and decide whether the blog breaks from the landing page's single-world rule.
- **How much scene.** From a thin horizon band in the header to a full sunset hero on the home page only.
- **Home page.** A plain list of Posts versus cards; how Tags appear.

## Hard requirements

- French first; accents render correctly.
- Responsive, mobile-first.
- WCAG 2.1 AA: contrast, visible focus, semantic order, reduced motion respected.
- Fast: static HTML, self-hosted fonts, no layout shift.
- No cookie banner (cookieless analytics).
