// The real translator adapter (ADR 0002): Claude Code in non-interactive mode
// (`claude -p`) on the author's own subscription, so no API key is needed.
import { spawnSync } from 'node:child_process';
import type { Translator } from './translation.ts';

/** A translator that asks the local `claude` command for the English of each Post. */
export function claudeTranslator(): Translator {
  return async (frenchPost) => {
    const run = spawnSync('claude', ['-p'], { input: frenchPost, encoding: 'utf8' });
    if ((run.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
      return { unavailable: 'the claude command was not found: install Claude Code and log in' };
    }
    throw new Error('not implemented');
  };
}
