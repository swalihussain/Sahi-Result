import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://sahi-result.onrender.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/en/admin/', '/ml/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
