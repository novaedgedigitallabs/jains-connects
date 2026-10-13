import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicTemple, getPublicTemples } from '../lib/api';

afterEach(() => {
  vi.unstubAllGlobals();
});

const temple = {
  id: '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242',
  name: 'Synthetic Published Temple',
  slug: 'synthetic-published-temple',
  traditionOrLineage: null,
  description: 'Synthetic test record.',
  history: null,
  addressLine1: null,
  addressLine2: null,
  city: 'Indore',
  state: 'Madhya Pradesh',
  postalCode: null,
  country: 'India',
  timezone: null,
  publicEmail: null,
  publicPhone: null,
  websiteUrl: null,
  darshanInformation: null,
  verificationStatus: 'VERIFIED',
  lastReviewedAt: null,
};

describe('public temple API adapter', () => {
  it('parses a valid paginated directory response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [temple],
          pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await getPublicTemples(new URLSearchParams({ q: 'temple', page: '1' }));

    expect(result).toEqual({
      ok: true,
      value: {
        data: [temple],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/temples?q=temple&page=1'),
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
  });

  it('converts an unavailable API into a user-safe result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'The service is not ready' } }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    await expect(getPublicTemples(new URLSearchParams())).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
      message: 'The service is not ready',
    });
  });

  it('maps an approved detail response and treats a missing slug as not found', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: temple }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Temple not found' } }), { status: 404 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPublicTemple('synthetic-published-temple')).resolves.toEqual({
      ok: true,
      value: temple,
    });
    await expect(getPublicTemple('missing-temple')).resolves.toEqual({
      ok: false,
      reason: 'not-found',
      message: 'Temple not found.',
    });
  });
});
