// The real translator adapter (ADR 0002): Claude Code in non-interactive mode
// (`claude -p`) on the author's own subscription, so no API key is needed.
// Automated tests only use a stand-in `claude`; the author checks this one by hand.
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import type { English, Translator } from './translation.ts';

/** The translation prompt, versioned with the code: fix bad English here, not in a Translation. */
const PROMPT = fileURLToPath(new URL('prompt.md', import.meta.url));

const ENGLISH_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    body: { type: 'string' },
  },
  required: ['title', 'description', 'body'],
  additionalProperties: false,
});

const TIMEOUT_MINUTES = 10;

/**
 * A translator that sends each French Post to the local `claude` command and returns
 * its English. Reports the Post as unavailable, never throws, when Claude Code is
 * missing, not logged in, too slow or answers without the three fields.
 * `model` is a `--model` value; without it, Claude Code uses the author's default.
 */
export function claudeTranslator({ model }: { model?: string } = {}): Translator {
  const args = [
    '-p',
    '--output-format',
    'json',
    '--json-schema',
    ENGLISH_SCHEMA,
    '--system-prompt-file',
    PROMPT,
    // No tools, no MCP servers, no saved session: the Post goes in, JSON comes out.
    '--tools',
    '',
    '--strict-mcp-config',
    '--no-session-persistence',
    ...(model ? ['--model', model] : []),
    'Translate the French Post given on stdin.',
  ];
  return async (frenchPost) => {
    const run = spawnSync('claude', args, {
      input: frenchPost,
      encoding: 'utf8',
      // Outside the repo and in safe mode, so its CLAUDE.md, hooks and skills stay out.
      cwd: tmpdir(),
      env: { ...process.env, CLAUDE_CODE_SAFE_MODE: '1' },
      timeout: TIMEOUT_MINUTES * 60_000,
      maxBuffer: 64 * 1024 * 1024,
    });
    const code = (run.error as NodeJS.ErrnoException | undefined)?.code;
    if (code === 'ENOENT') {
      return { unavailable: 'the claude command was not found: install Claude Code and log in' };
    }
    if (code === 'ETIMEDOUT') {
      return { unavailable: `claude gave no answer within ${TIMEOUT_MINUTES} minutes` };
    }
    if (run.error) return { unavailable: `claude could not run: ${run.error.message}` };
    return english(run.stdout);
  };
}

// The English in `claude -p --output-format json` output.
function english(stdout: string): English | { unavailable: string } {
  const output = JSON.parse(stdout);
  const { title, description, body } = output.structured_output;
  return { title, description, body };
}
