import axios from 'axios';

// --- Configuration & Tuning ---
export const CONFIG = {
    limits: {
        maxPosts: 10000,
        minScoreToindex: 5, // Minimum score required to be indexed at all
    },
    weights: {
        like: 1.5,
        comment: 3.0, // Comments indicate engagement
        collect: 5.0, // Collections indicate high value/utility
        freshness_decay: 1.2 // Exponential decay factor
    },
    thresholds: {
        hot: 50,      // High interaction
        evergreen: 100 // Very high interaction, time-independent
    }
};

export const SITE_URL = 'https://kuke.ink';
// Use internal API URL if available, otherwise fallback to public
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.kuke.ink';

// Static Routes (Core Pages)
export const STATIC_ROUTES = [
    { loc: '/', priority: 1.0, changefreq: 'daily' },
    { loc: '/news', priority: 0.9, changefreq: 'daily' },
    { loc: '/activity', priority: 0.9, changefreq: 'always' },
    { loc: '/stats', priority: 0.8, changefreq: 'daily' },
    { loc: '/consensus', priority: 0.8, changefreq: 'weekly' },
    { loc: '/players', priority: 0.7, changefreq: 'daily' },
    { loc: '/bans', priority: 0.6, changefreq: 'daily' },
    { loc: '/monitor', priority: 0.5, changefreq: 'always' },
];

export interface SitemapUrl {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: number;
}

// --- Helpers ---

async function fetchData(endpoint: string, params: any = {}) {
    try {
        // Add a timestamp to prevent internal caching if needed, though Next.js fetch is preferred
        const response = await axios.get(`${API_BASE}${endpoint}`, { 
            params,
            headers: { 'Cache-Control': 'no-cache' } // Ensure we get fresh data from backend
        });
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching ${endpoint}:`, error.message);
        return null;
    }
}

// Post Score Algorithm
function calculateInteractionScore(post: any) {
    const likes = post.likes_count || 0;
    const comments = post.comments_count || 0;
    const collects = post.collects_count || 0;
    const contentLen = post.content ? post.content.length : 0;
    
    // Interaction Score
    let score = (likes * CONFIG.weights.like) + 
                (comments * CONFIG.weights.comment) + 
                (collects * CONFIG.weights.collect);

    // Content Length Bonus (0.02 point per char, max 20 points)
    const lengthBonus = Math.min(contentLen * 0.02, 20);
    
    return score + lengthBonus;
}

export function categorizePost(post: any): 'evergreen' | 'hot' | 'trending' | 'standard' | 'excluded' {
    const interactionScore = calculateInteractionScore(post);
    const lastMod = post.updated_at || post.created_at;
    const daysOld = (new Date().getTime() - new Date(lastMod).getTime()) / (1000 * 60 * 60 * 24);

    // 1. Evergreen: High Value, Age doesn't matter
    if (interactionScore >= CONFIG.thresholds.evergreen) {
        return 'evergreen';
    }

    // 2. Hot: High Value, Recent (last 30 days)
    if (interactionScore >= CONFIG.thresholds.hot && daysOld < 30) {
        return 'hot';
    }

    // 3. Trending: Good Value, Very Recent (last 7 days)
    if (interactionScore >= 10 && daysOld < 7) {
        return 'trending';
    }

    // 4. Standard: Meets minimum quality
    if (interactionScore >= CONFIG.limits.minScoreToindex) {
        return 'standard';
    }

    return 'excluded';
}

// --- Fetchers ---

export async function fetchAllPosts() {
    console.log('Fetching posts for sitemap...');
    let page = 1;
    const allPosts: any[] = [];
    const perPage = 50;
    const seenIds = new Set();

    // Limit pages to avoid timeout in serverless function
    // For a real production app with massive data, you might want to fetch only recent ones 
    // or use a more efficient backend endpoint.
    const MAX_PAGES = 20; 

    while (page <= MAX_PAGES) {
        const data = await fetchData('/api/posts', { page, per_page: perPage, type: 'latest' });
        if (!data || !data.data || data.data.length === 0) break;
        
        for (const post of data.data) {
            if (!seenIds.has(post.id)) {
                seenIds.add(post.id);
                allPosts.push(post);
            }
        }
        
        if (allPosts.length >= CONFIG.limits.maxPosts || allPosts.length >= data.total) break;
        page++;
    }
    return allPosts;
}

export async function fetchNews() {
    try {
        const data = await fetchData('/api/website/news/', { limit: 1000 });
        return data || [];
    } catch (e) {
        console.error("Error fetching news", e);
        return [];
    }
}

export function generateSitemapXML(urls: SitemapUrl[]) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}
