import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import sharp from 'sharp';
import { builtPages } from './support/pages';

// The social images link previews show: a 1200×630 PNG per Post, per
// Translation, and per home page, generated at build time.

const notFound = '/404.html';

/** The page's social image, as its head names it: an absolute URL on blog.curieux.dev. */
async function socialImage(page: Page): Promise<string> {
  const [image] = await page
    .locator('head meta[property="og:image"]')
    .evaluateAll((metas) => metas.map((meta) => meta.getAttribute('content')));
  if (!image) throw new Error(`${page.url()} names no social image`);
  return image;
}

interface Png {
  width: number;
  height: number;
  bytes: Buffer;
}

/**
 * Fetches an image from the preview, at the path of its blog.curieux.dev URL,
 * and reads its size from the PNG header (the IHDR chunk follows the signature).
 */
async function fetchPng(request: APIRequestContext, url: string): Promise<Png> {
  const response = await request.get(new URL(url).pathname);
  expect(response.status(), url).toBe(200);
  expect(response.headers()['content-type'], url).toBe('image/png');
  const bytes = await response.body();
  expect(bytes.subarray(0, 8), `${url} is a PNG`).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  expect(bytes.toString('latin1', 12, 16), url).toBe('IHDR');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes };
}

test('the social image of every page is a 1200×630 PNG the site serves', async ({
  page,
  request,
}, testInfo) => {
  const checked = new Set<string>();
  for (const path of await builtPages(testInfo)) {
    if (path === notFound) continue;
    await page.goto(path);
    const image = await socialImage(page);
    if (checked.has(image)) continue;

    const { width, height } = await fetchPng(request, image);

    expect({ width, height }, `${image} (from ${path})`).toEqual({ width: 1200, height: 630 });
    checked.add(image);
  }
  // Every kind: French and English Posts, both home pages.
  expect(checked.size).toBeGreaterThanOrEqual(4);
});

/** A PNG's pixels, red, green and blue, row by row. */
interface Pixels {
  width: number;
  height: number;
  rgb: Buffer;
}

async function decode({ bytes }: Png): Promise<Pixels> {
  const { data, info } = await sharp(bytes)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, rgb: data };
}

/** The « crépuscule » `card` token: the postcard's fill. */
const card = [42, 32, 82];

/** The rightmost column the postcard's fill reaches. */
function cardRight({ width, height, rgb }: Pixels): number {
  let right = -1;
  for (let y = 0; y < height; y++) {
    for (let x = right + 1; x < width; x++) {
      const i = (y * width + x) * 3;
      if (card.every((channel, c) => Math.abs(rgb[i + c]! - channel) <= 1)) right = x;
    }
  }
  return right;
}

/** How many pixels differ between two images of the same size, from column `x` on. */
function differences(a: Pixels, b: Pixels, x: number): number {
  let count = 0;
  for (let y = 0; y < a.height; y++) {
    for (let column = x; column < a.width; column++) {
      const i = (y * a.width + column) * 3;
      if (a.rgb.compare(b.rgb, i, i + 3, i, i + 3) !== 0) count++;
    }
  }
  return count;
}

test('a long title wraps on its postcard: beside the card, the image shows the sunset every image shares', async ({
  request,
}) => {
  // The home page image has a short title: beside its card, only the scene.
  const scene = await decode(await fetchPng(request, 'https://blog.curieux.dev/og.png'));
  // « IntersectionObserver en vrai », and in English a title that starts with a 64-character word.
  for (const path of ['/intersection-observer/og.png', '/en/intersection-observer/og.png']) {
    const image = await decode(await fetchPng(request, `https://blog.curieux.dev${path}`));

    // Past the card's hard shadow and tilt.
    const beside = Math.max(cardRight(image), cardRight(scene)) + 18;
    expect(beside, path).toBeLessThan(image.width);
    expect(differences(image, scene, beside), `${path}: pixels drawn beside the card`).toBe(0);
  }
});
