// Translation command line: `node src/translation/cli.ts check`.
// The content root is `BLOG_CONTENT_DIR`, as in `src/content.config.ts`.
import { translationStatus } from './translation.ts';

const contentDir = process.env.BLOG_CONTENT_DIR || 'src/content';
const [command] = process.argv.slice(2);

if (command === 'check') {
  // Fails while a non-Draft Post has a stale or missing Translation, naming each one.
  const outdated = (await translationStatus(contentDir)).filter(({ status }) => status !== 'fresh');
  if (outdated.length > 0) {
    console.error('Translation check failed. These Posts need a new Translation:');
    for (const { post, status } of outdated) console.error(`  ${post}: ${status}`);
    process.exitCode = 1;
  }
} else {
  console.error('Usage: node src/translation/cli.ts check');
  process.exitCode = 2;
}
