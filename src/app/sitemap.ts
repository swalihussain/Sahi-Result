import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sahi-result.onrender.com';
  
  // Since we have multiple locales, we output the main routes for English and Malayalam
  const locales = ['en', 'ml'];
  const routes = ['', '/results', '/events', '/news', '/gallery', '/points', '/matches', '/about', '/contact'];
  
  const sitemapEntries: MetadataRoute.Sitemap = [];
  
  for (const locale of locales) {
    for (const route of routes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' || route === '/news' || route === '/points' ? 'hourly' : 'daily',
        priority: route === '' ? 1 : 0.8,
      });
    }
  }

  return sitemapEntries;
}
