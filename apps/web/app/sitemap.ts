import type { MetadataRoute } from 'next';
import { getPublicOrganizationsForSitemap } from '../lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const baseUrl = siteUrl.replace(/\/$/, '');
  const organizations = await getPublicOrganizationsForSitemap();

  const corePages = ['/', '/temples', '/organizations', '/about', '/support-jainconnect'].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date('2026-10-13T00:00:00.000Z'),
    }),
  );

  const organizationPages = organizations.map((organization) => ({
    url: `${baseUrl}/organizations/${organization.slug}`,
    ...(organization.lastReviewedAt ? { lastModified: new Date(organization.lastReviewedAt) } : {}),
  }));

  return [...corePages, ...organizationPages];
}
