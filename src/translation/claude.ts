// The real translator adapter (ADR 0002): Claude Code in non-interactive mode
// (`claude -p`) on the author's own subscription, so no API key is needed.
// Automated tests only use a stand-in `claude`; the author checks this one by hand.
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import type { English, Translator, Unavailable } from './translation.ts';

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
    return english(run);
  };
}

// The English in `claude -p --output-format json` output, or why there is none
// (`is_error` with exit code 1 when not logged in, for instance).
function english({ status, stdout, stderr }: SpawnSyncReturns<string>): English | Unavailable {
  let output;
  try {
    output = JSON.parse(stdout);
  } catch {
    return { unavailable: firstLine(stderr) || `claude exited with code ${status} and no JSON` };
  }
  if (status !== 0 || output?.is_error) {
    const why = firstLine(String(output?.result ?? ''));
    return { unavailable: why || `claude failed (${output?.subtype ?? `exit code ${status}`})` };
  }
  const { title, description, body } = output?.structured_output ?? {};
  // A Translation needs all three: an empty one would ship a blank page.
  if (![title, description, body].every((field) => typeof field === 'string' && field.trim())) {
    return { unavailable: 'claude answered without a title, description or body' };
  }
  return { title, description, body };
}

function firstLine(text: string): string {
  return text.trim().split('\n')[0];
}
