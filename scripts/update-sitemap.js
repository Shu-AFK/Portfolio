import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DOMAIN = 'https://floyd-dev.com';
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const SITEMAP_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');

// Format date as YYYY-MM-DD or fallback to today's date
function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0]; // fallback to today
    }
    return date.toISOString().split('T')[0];
}

function generateSitemap() {
    if (!fs.existsSync(POSTS_DIR)) {
        console.error(`Posts directory not found: ${POSTS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

    const urls = [
        { loc: `${DOMAIN}/`, lastmod: new Date() },
        { loc: `${DOMAIN}/blog`, lastmod: new Date() }
    ];

    for (const file of files) {
        const slug = file.replace(/\.md$/, '');
        const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
        const { data } = matter(raw);

        let lastmod;

        // Try to parse the front-matter date
        if (data.date) {
            // Convert DD.MM.YYYY or DD.MM.YY to YYYY-MM-DD
            if (/^\d{2}\.\d{2}\.\d{4}$/.test(data.date)) {
                const [day, month, year] = data.date.split('.');
                lastmod = new Date(`${year}-${month}-${day}`);
            } else if (/^\d{2}\.\d{2}\.\d{2}$/.test(data.date)) {
                const [day, month, year] = data.date.split('.');
                lastmod = new Date(`20${year}-${month}-${day}`);
            } else {
                lastmod = new Date(data.date);
            }
        }

        urls.push({
            loc: `${DOMAIN}/blog/${slug}`,
            lastmod: lastmod || new Date()
        });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${formatDate(u.lastmod)}</lastmod>
  </url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`✅ Sitemap generated at ${SITEMAP_PATH}`);
}

generateSitemap();
