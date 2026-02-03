import { describe, it, expect } from 'vitest';
import { safeJson } from '../http';

describe('safeJson', () => {
  it('returns null for 204 responses', async () => {
    const response = new Response(null, { status: 204 });

    await expect(safeJson(response)).resolves.toBeNull();
  });

  it('returns parsed JSON when content-type is JSON', async () => {
    const payload = { ok: true };
    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    await expect(safeJson(response)).resolves.toEqual(payload);
  });

  it('returns text for non-JSON responses', async () => {
    const response = new Response('plain text', {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });

    await expect(safeJson(response)).resolves.toBe('plain text');
  });

  it('returns null for empty non-JSON responses', async () => {
    const response = new Response('', {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });

    await expect(safeJson(response)).resolves.toBeNull();
  });
});
