import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori, { type Font } from 'satori';
import sharp from 'sharp';
import tokens from '../styles/tokens.css?raw';
import { formatDate } from './dates';
import { type Locale, ui } from './i18n';
import { getPostTags, type PostView } from './posts';
import { waveBox, waves } from './waves';

// The social image link previews show (`og:image`): a 1200×630 PNG drawn at
// build time as a postcard over the sunset, at dusk, the reference theme. The
// title is on a tilted card with its stamp, the sun sets behind the waves, and
// `blog.curieux.dev` is written on the sea. Satori lays it out with the brand
// fonts and turns the text into paths; sharp draws the PNG. No network.

export const socialImageSize = { width: 1200, height: 630 };

/** What the image's postcard says. */
interface CardText {
  /** The small line above the title. */
  kicker: string;
  title: string;
  /** Written on the stamp: a Post's first Tag. */
  stamp: string;
}

/** A Post's image (or its Translation's): its title, date and first Tag in the view's language. */
export async function postSocialImage({ locale, post, entry }: PostView): Promise<Response> {
  const [stamp] = await getPostTags(post);
  return socialImage({
    kicker: `Dev curieux · ${formatDate(post.data.publishedAt, locale)}`,
    title: entry.data.title,
    stamp: stamp.data[locale],
  });
}

/** A home page's image, which every page but Posts shares in its language. */
export function homeSocialImage(locale: Locale): Promise<Response> {
  const { title, heading } = ui[locale].home;
  return socialImage({ kicker: title, title: heading.join(''), stamp: 'blog' });
}

async function socialImage(text: CardText): Promise<Response> {
  const svg = await satori(scene(text), { ...socialImageSize, fonts: await brandFonts() });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}

/**
 * A color token's « crépuscule » value, read from `tokens.css`, where each is
 * written as `light-dark(<plein soleil>, <crépuscule>)`.
 */
function dusk(token: string): string {
  const value = new RegExp(String.raw`--${token}:\s*light-dark\([^,]+,\s*([^)]+)\)`).exec(tokens);
  if (!value?.[1]) throw new Error(`tokens.css has no color token --${token}`);
  return value[1].trim();
}

// The fonts of the site, static instances: satori draws a variable font at its
// default weight only. The Latin subset covers French and English.
const require = createRequire(import.meta.url);
const fontFiles: { name: string; weight: Font['weight']; file: string }[] = [
  {
    name: 'Bricolage Grotesque',
    weight: 800,
    file: '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2',
  },
  {
    name: 'Geist Mono',
    weight: 400,
    file: '@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2',
  },
  {
    name: 'Geist Mono',
    weight: 600,
    file: '@fontsource/geist-mono/files/geist-mono-latin-600-normal.woff2',
  },
];
let fonts: Promise<Font[]> | undefined;

/** Read once per build. */
function brandFonts(): Promise<Font[]> {
  fonts ??= Promise.all(
    fontFiles.map(async ({ name, weight, file }) => ({
      name,
      weight,
      style: 'normal' as const,
      data: await readFile(require.resolve(file)),
    })),
  );
  return fonts;
}

// The elements satori lays out: plain objects shaped like React elements.
type Style = Record<string, string | number>;
interface Block {
  type: string;
  props: Record<string, unknown> & { style?: Style; children?: Child | Child[] };
}
type Child = Block | string;

const element = (type: string, style: Style, ...children: Child[]): Block => ({
  type,
  props: { style, children },
});

// The tactile primitive at the image's scale: link previews shrink it to
// about half, so outlines and shadows are a little heavier than on the site.
const outline = `4px solid ${dusk('edge')}`;
const shadow = `10px 10px 0 ${dusk('edge')}`;
/** The sea below the waves, where the domain is written. */
const seaHeight = 64;
/** The sun sits on the horizon, its bottom just behind the back wave. */
const sun = { right: 64, bottom: seaHeight + 40, size: 170, glow: 480 };

// A few stars in the upper sky, as on the site at dusk: [left %, top %, size px].
const stars = [
  [5, 9, 3],
  [14, 30, 2],
  [24, 6, 3],
  [33, 22, 2],
  [44, 8, 4],
  [52, 34, 2],
  [61, 14, 3],
  [70, 5, 2],
  [76, 28, 4],
  [84, 12, 2],
  [91, 32, 3],
  [96, 7, 2],
] as const;

/** Long titles get a smaller size, and four lines at most, then an ellipsis. */
function titleSize(title: string): number {
  if (title.length <= 32) return 70;
  if (title.length <= 64) return 58;
  return 48;
}

/**
 * The stamp's label fits its longest word on one line: Geist Mono's glyphs are
 * 0.6em wide, and the dashed frame leaves 108px of a 140px stamp. A long word
 * gets a smaller size, down to 18px, then a wider stamp.
 */
function stampLayout(label: string): { width: number; fontSize: number } {
  const longestWord = Math.max(...label.split(/\s+/).map((word) => word.length));
  const fontSize = Math.min(22, Math.max(18, Math.floor(108 / (0.6 * longestWord))));
  return { width: Math.max(140, Math.ceil(0.6 * longestWord * fontSize) + 32), fontSize };
}

function scene({ kicker, title, stamp }: CardText): Block {
  const { width, height } = socialImageSize;
  const stampBox = stampLayout(stamp);
  return element(
    'div',
    {
      position: 'relative',
      display: 'flex',
      width,
      height,
      backgroundImage: `linear-gradient(${dusk('sky-top')}, ${dusk('sky-bot')} 62%, ${dusk('sky-glow')})`,
    },
    ...stars.map(([left, top, size]) =>
      element('div', {
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: dusk('star'),
      }),
    ),
    // The sun, setting behind the waves, in its glow (a gradient draws much
    // faster than a blurred shadow).
    element('div', {
      position: 'absolute',
      right: sun.right - (sun.glow - sun.size) / 2,
      bottom: sun.bottom - (sun.glow - sun.size) / 2,
      width: sun.glow,
      height: sun.glow,
      backgroundImage: `radial-gradient(circle closest-side, ${dusk('sun')}80, ${dusk('sun')}00)`,
    }),
    element('div', {
      position: 'absolute',
      right: sun.right,
      bottom: sun.bottom,
      width: sun.size,
      height: sun.size,
      borderRadius: '50%',
      border: outline,
      backgroundColor: dusk('sun'),
    }),
    ...waves.map(({ fill, d }) => ({
      type: 'svg',
      props: {
        width: waveBox.width,
        height: waveBox.height,
        viewBox: `0 0 ${waveBox.width} ${waveBox.height}`,
        style: { position: 'absolute', left: 0, bottom: seaHeight - 2 },
        children: {
          type: 'path',
          props: { d, fill: dusk(fill), stroke: dusk('edge'), strokeWidth: 3 },
        },
      },
    })),
    element('div', {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: seaHeight,
      backgroundColor: dusk('sea-2'),
    }),
    element(
      'div',
      {
        position: 'absolute',
        right: 48,
        bottom: 18,
        fontFamily: 'Geist Mono',
        fontSize: 26,
        color: dusk('sea-text'),
      },
      'blog.curieux.dev',
    ),
    // The postcard, centred in the sky.
    element(
      'div',
      {
        position: 'absolute',
        left: 72,
        top: 0,
        bottom: seaHeight + 24,
        display: 'flex',
        alignItems: 'center',
      },
      element(
        'div',
        {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 32,
          width: 860,
          padding: '36px 36px 44px 44px',
          backgroundColor: dusk('card'),
          border: outline,
          boxShadow: shadow,
          transform: 'rotate(-1.2deg)',
        },
        element(
          'div',
          { display: 'flex', flexDirection: 'column', flex: 1, gap: 16, paddingTop: 8 },
          element('div', { fontFamily: 'Geist Mono', fontSize: 24, color: dusk('muted') }, kicker),
          element(
            'div',
            {
              fontFamily: 'Bricolage Grotesque',
              fontWeight: 800,
              fontSize: titleSize(title),
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
              color: dusk('ink'),
              lineClamp: 4,
              overflowWrap: 'break-word',
            },
            title,
          ),
        ),
        // The stamp: sun-colored, with a dashed frame, slightly askew.
        element(
          'div',
          {
            display: 'flex',
            flexShrink: 0,
            width: stampBox.width,
            height: 156,
            padding: 9,
            backgroundColor: dusk('sun'),
            transform: 'rotate(4deg)',
          },
          element(
            'div',
            {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              padding: 4,
              border: `3px dashed ${dusk('edge')}`,
              fontFamily: 'Geist Mono',
              fontWeight: 600,
              fontSize: stampBox.fontSize,
              overflowWrap: 'break-word',
              lineHeight: 1.15,
              textAlign: 'center',
              color: dusk('on-sun'),
            },
            stamp,
          ),
        ),
      ),
    ),
  );
}
