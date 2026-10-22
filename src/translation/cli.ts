// Translation command line, run by package scripts, the pre-commit hook and CI:
//   check                         fails while a non-Draft Post has a stale or missing Translation
//   translate [--stage] [post…]   translates the stale or missing Posts (all, or the given
//                                 files); --stage also `git add`s their Translations
// The content root is `BLOG_CONTENT_DIR`, as in `src/content.config.ts`.
// `TRANSLATION_MODEL` picks Claude Code's `--model` (default: the author's own default).
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { claudeTranslator } from './claude.ts';
import { translatePosts, translationStatus } from './translation.ts';

const contentDir = process.env.BLOG_CONTENT_DIR || 'src/content';
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { stage: { type: 'boolean', default: false } },
});
const [command, ...posts] = positionals;

if (command === 'check') {
  // Fails while a non-Draft Post has a stale or missing Translation, naming each one.
  const outdated = (await translationStatus(contentDir)).filter(({ status }) => status !== 'fresh');
  if (outdated.length > 0) {
    console.error('Translation check failed. These Posts need a new Translation:');
    for (const { post, status } of outdated) console.error(`  ${post}: ${status}`);
    process.exitCode = 1;
  }
} else if (command === 'translate') {
  // When Claude Code cannot translate, warns and still exits zero: the pre-commit hook
  // must never block a commit (the check catches the Posts left behind).
  const report = await translatePosts(
    claudeTranslator({ model: process.env.TRANSLATION_MODEL || undefined }),
    posts.length > 0 ? { posts } : { contentDir },
  );
  for (const { post, translation } of report.translated) {
    console.log(`Translated ${post} into ${translation}`);
  }
  if (values.stage && report.translated.length > 0) {
    // In the pre-commit hook: the Translations go into the same commit as their Posts.
    gitAdd(report.translated.map(({ translation }) => translation));
  }
  if (report.unavailable.length > 0) {
    console.error(
      'Warning: these Posts were not translated. Run `pnpm translate` once Claude Code works; until then the Translation check fails.',
    );
    for (const { post, reason } of report.unavailable) console.error(`  ${post}: ${reason}`);
  }
} else {
  console.error('Usage: node src/translation/cli.ts check | translate [--stage] [post…]');
  process.exitCode = 2;
}

function gitAdd(files: string[]) {
  const run = spawnSync('git', ['add', '--', ...files], { stdio: 'inherit' });
  if (run.status !== 0) throw new Error(`git add failed for ${files.join(', ')}`);
}
