import { 
    SITE_URL, 
    STATIC_ROUTES, 
    fetchNews, 
    fetchAllPosts, 
    categorizePost, 
    generateSitemapXML,
    SitemapUrl
} from '@/utils/sitemap-helper';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
    const { filename } = await params;
    
    // Check if filename is valid .xml
    if (!filename.endsWith('.xml')) {
        return new Response('Not Found', { status: 404 });
    }

    const type = filename.replace('.xml', '');
    const today = new Date().toISOString().split('T')[0];
    let urls: SitemapUrl[] = [];

    // 1. Main Static Routes
    if (type === 'sitemap-main') {
        STATIC_ROUTES.forEach(route => {
            urls.push({
                loc: `${SITE_URL}${route.loc === '/' ? '' : route.loc}`,
                lastmod: today,
                changefreq: route.changefreq,
                priority: route.priority
            });
        });
    } 
    
    // 2. News
    else if (type === 'sitemap-news') {
        const newsList = await fetchNews();
        newsList.forEach((news: any) => {
            const lastMod = (news.updated_at || news.created_at).split('T')[0];
            urls.push({
                loc: `${SITE_URL}/news/${news.id}`,
                lastmod: lastMod,
                changefreq: 'monthly',
                priority: 0.8
            });
        });
    }

    // 3. Posts (Split by category)
    else if (type.startsWith('sitemap-posts-')) {
        const categoryTarget = type.replace('sitemap-posts-', ''); // hot, evergreen, etc.
        const posts = await fetchAllPosts();
        
        posts.forEach((post: any) => {
            const category = categorizePost(post);
            if (category !== categoryTarget) return;

            const lastMod = (post.updated_at || post.created_at).split('T')[0];
            let priority = 0.5;
            let changefreq = 'weekly';

            // Set specific props based on category (logic mirrored from original script)
            switch (category) {
                case 'evergreen':
                    priority = 1.0;
                    changefreq = 'monthly';
                    break;
                case 'hot':
                    priority = 0.9;
                    changefreq = 'daily';
                    break;
                case 'trending':
                    priority = 0.8;
                    changefreq = 'daily';
                    break;
                case 'standard':
                    priority = 0.6;
                    break;
            }

            urls.push({
                loc: post.type === 'album' ? `${SITE_URL}/album/${post.id}` : `${SITE_URL}/activity/${post.id}`,
                lastmod: lastMod,
                changefreq,
                priority
            });
        });
    } 
    
    else {
        return new Response('Sitemap not found', { status: 404 });
    }

    const xml = generateSitemapXML(urls);

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600'
        },
    });
}
