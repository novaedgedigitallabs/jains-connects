import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicOrganization, getPublicOrganizations } from '../lib/api';
import { generateMetadata } from '../app/organizations/[slug]/page';
import sitemap from '../app/sitemap';

afterEach(() => {
  vi.unstubAllGlobals();
});

const organization = {
  id: '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242',
  name: 'Synthetic Jain Trust',
  slug: 'synthetic-jain-trust',
  organizationType: 'TEMPLE_TRUST' as const,
  description: 'Synthetic test listing.',
  publicEmail: null,
  publicPhone: null,
  websiteUrl: 'https://example.test/trust',
  addressLine1: '1 Community Way',
  addressLine2: null,
  city: 'Indore',
  state: 'Madhya Pradesh',
  postalCode: null,
  country: 'India',
  verificationStatus: 'VERIFIED' as const,
  lastReviewedAt: '2026-10-13T00:00:00.000Z',
  temples: [],
};

describe('public organization API adapter', () => {
  it('parses a valid filtered list response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [organization],
          pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      getPublicOrganizations(
        new URLSearchParams({ organizationType: 'TEMPLE_TRUST', city: 'Indore' }),
      ),
    ).resolves.toEqual({
      ok: true,
      value: {
        data: [organization],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/organizations?organizationType=TEMPLE_TRUST&city=Indore'),
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
  });

  it('handles detail not-found and unavailable responses safely', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: organization }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Organization not found' } }), {
          status: 404,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Directory offline' } }), { status: 503 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPublicOrganization('synthetic-jain-trust')).resolves.toEqual({
      ok: true,
      value: organization,
    });
    await expect(getPublicOrganization('missing')).resolves.toEqual({
      ok: false,
      reason: 'not-found',
      message: 'Organization not found.',
    });
    await expect(getPublicOrganization('offline')).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
      message: 'Directory offline',
    });
  });

  it('rejects malformed organization payloads rather than rendering guessed data', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ data: [{ id: 'not-enough-fields' }] }), { status: 200 }),
        ),
    );

    await expect(getPublicOrganizations(new URLSearchParams())).resolves.toEqual({
      ok: false,
      reason: 'invalid-response',
      message: 'The organization directory returned an invalid response.',
    });
  });
});

describe('organization SEO integration', () => {
  it('generates a canonical detail URL from the approved public slug', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ data: organization }), { status: 200 })),
    );

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: organization.slug }),
    });
    expect(metadata.alternates?.canonical).toBe('/organizations/synthetic-jain-trust');
    expect(metadata.title).toBe('Synthetic Jain Trust');
    expect(metadata.description).toContain('Synthetic test listing.');
  });

  it('includes the organization directory and approved detail URLs in the sitemap', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [organization],
            pagination: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
          }),
          { status: 200 },
        ),
      ),
    );

    const entries = await sitemap();
    expect(entries.some((entry) => entry.url.endsWith('/organizations'))).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith('/organizations/synthetic-jain-trust'))).toBe(
      true,
    );
  });
});
