import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const baseUrl = siteUrl.replace(/\/$/, '');

  return ['/', '/temples', '/about', '/support-jainconnect'].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date('2026-10-13T00:00:00.000Z'),
  }));
}
