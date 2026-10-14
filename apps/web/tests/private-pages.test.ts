import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { metadata as organizationReportMetadata } from '../app/organizations/[slug]/report/page';
import { metadata as organizationClaimMetadata } from '../app/organizations/[slug]/claim/page';
import { metadata as templeReportMetadata } from '../app/temples/[slug]/report/page';
import OrganizationReportPage from '../app/organizations/[slug]/report/page';

describe('private member pages', () => {
  it('marks report and claim pages noindex', () => {
    expect(organizationReportMetadata.robots).toEqual({ index: false, follow: true });
    expect(organizationClaimMetadata.robots).toEqual({ index: false, follow: true });
    expect(templeReportMetadata.robots).toEqual({ index: false, follow: true });
  });

  it('server-renders the report workflow around a verified organization', async () => {
    vi.stubGlobal('React', React);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              id: '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242',
              name: 'Synthetic Organization',
              slug: 'synthetic-organization',
              organizationType: 'COMMUNITY_GROUP',
              description: null,
              publicEmail: null,
              publicPhone: null,
              websiteUrl: null,
              addressLine1: null,
              addressLine2: null,
              city: null,
              state: null,
              postalCode: null,
              country: null,
              verificationStatus: 'VERIFIED',
              lastReviewedAt: null,
              temples: [],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );
    const rendered = await OrganizationReportPage({
      params: Promise.resolve({ slug: 'synthetic-organization' }),
    });
    expect(rendered).toBeTruthy();
    expect(rendered).toMatchObject({ type: 'main' });
  });
});
