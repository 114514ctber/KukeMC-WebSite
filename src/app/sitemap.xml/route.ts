import { SITE_URL } from '@/utils/sitemap-helper';

export const dynamic = 'force-dynamic'; // We want this to be dynamic
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
    const today = new Date().toISOString().split('T')[0];
    
    // List of sub-sitemaps
    const sitemaps = [
        'sitemap-main.xml',
        'sitemap-news.xml',
        'sitemap-posts-hot.xml',
        'sitemap-posts-evergreen.xml',
        'sitemap-posts-trending.xml',
        'sitemap-posts-standard.xml'
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(filename => `  <sitemap>
    <loc>${SITE_URL}/sitemaps/${filename}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600' // 1 hour cache
        },
    });
}
