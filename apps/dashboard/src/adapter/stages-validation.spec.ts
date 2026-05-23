import { validateStages } from './stages-validation';

describe('validateStages', () => {
  it('accepts a valid xpath stage', () => {
    const r = validateStages('{"index":{"engine":"xpath","patterns":[]}}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.stages.index?.engine).toBe('xpath');
  });

  it('accepts a valid browser stage', () => {
    const r = validateStages('{"episode":{"engine":"browser","workflow":{"version":"1.0","actions":[]}}}');
    expect(r.ok).toBe(true);
  });

  it('rejects non-JSON', () => {
    const r = validateStages('{not json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/JSON/i);
  });

  it('rejects an unknown stage key', () => {
    const r = validateStages('{"bogus":{"engine":"xpath","patterns":[]}}');
    expect(r.ok).toBe(false);
  });

  it('rejects an unknown engine', () => {
    const r = validateStages('{"index":{"engine":"telepathy"}}');
    expect(r.ok).toBe(false);
  });

  it('rejects an xpath stage without a patterns array', () => {
    const r = validateStages('{"index":{"engine":"xpath"}}');
    expect(r.ok).toBe(false);
  });

  it('rejects a browser stage without a workflow object', () => {
    const r = validateStages('{"episode":{"engine":"browser"}}');
    expect(r.ok).toBe(false);
  });
});
