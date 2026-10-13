import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/account/', '/api/'],
    },
    sitemap: `${siteUrl.replace(/\/$/, '')}/sitemap.xml`,
  };
}
