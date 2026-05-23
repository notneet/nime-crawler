import { STAGES } from '@libs/commons/messaging/exchanges';
import type { Stage } from '@libs/commons/messaging/exchanges';
import type { StageConfig } from '@libs/commons/adapters/site-adapter.types';

export type StagesResult =
  | { ok: true; stages: Partial<Record<Stage, StageConfig>> }
  | { ok: false; error: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateStages(raw: string): StagesResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'stages is not valid JSON' };
  }
  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'stages must be a JSON object keyed by stage' };
  }
  const allowed = new Set<string>(STAGES as unknown as string[]);
  for (const [key, value] of Object.entries(parsed)) {
    if (!allowed.has(key)) {
      return { ok: false, error: `unknown stage "${key}" (allowed: ${[...allowed].join(', ')})` };
    }
    if (!isPlainObject(value)) {
      return { ok: false, error: `stage "${key}" must be an object` };
    }
    const engine = value['engine'];
    if (engine !== 'xpath' && engine !== 'browser') {
      return { ok: false, error: `stage "${key}" engine must be "xpath" or "browser"` };
    }
    if (engine === 'xpath' && !Array.isArray(value['patterns'])) {
      return { ok: false, error: `xpath stage "${key}" requires a "patterns" array` };
    }
    if (engine === 'browser' && !isPlainObject(value['workflow'])) {
      return { ok: false, error: `browser stage "${key}" requires a "workflow" object` };
    }
  }
  return { ok: true, stages: parsed as Partial<Record<Stage, StageConfig>> };
}
