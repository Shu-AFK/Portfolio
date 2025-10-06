import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DOMAIN = 'https://floyd-dev.com';
const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const SITEMAP_PATH = path.join(ROOT, 'public', 'sitemap.xml');

// Format date as YYYY-MM-DD or fallback to today's date
function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0]; // fallback to today
    }
    return date.toISOString().split('T')[0];
}

function normalizeDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    const now = new Date();

    if (isNaN(date.getTime()) || date > now) {
        return now;
    }

    return date;
}

function generateSitemap() {
    const urls = [];

    const staticPages = [
        { loc: `${DOMAIN}/`, file: path.join(ROOT, 'app', 'page.jsx') },
        { loc: `${DOMAIN}/blog`, file: path.join(ROOT, 'app', 'blog', 'page.jsx') },
        { loc: `${DOMAIN}/beatmaker`, file: path.join(ROOT, 'app', 'beatmaker', 'page.jsx') }
    ];

    for (const { loc, file } of staticPages) {
        if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            urls.push({ loc, lastmod: normalizeDate(stats.mtime) });
        }
    }

    if (!fs.existsSync(POSTS_DIR)) {
        console.warn(`Posts directory not found: ${POSTS_DIR}`);
    } else {
        const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

        for (const file of files) {
            const slug = file.replace(/\.md$/, '');
            const filePath = path.join(POSTS_DIR, file);
            const stats = fs.statSync(filePath);
            const raw = fs.readFileSync(filePath, 'utf8');
            const { data } = matter(raw);

            let lastmod = normalizeDate(stats.mtime);

            if (data.updated) {
                lastmod = normalizeDate(new Date(data.updated));
            } else if (data.date) {
                if (/^\d{2}\.\d{2}\.\d{4}$/.test(data.date)) {
                    const [day, month, year] = data.date.split('.');
                    lastmod = normalizeDate(new Date(`${year}-${month}-${day}`));
                } else if (/^\d{2}\.\d{2}\.\d{2}$/.test(data.date)) {
                    const [day, month, year] = data.date.split('.');
                    lastmod = normalizeDate(new Date(`20${year}-${month}-${day}`));
                } else {
                    const parsed = new Date(data.date);
                    if (!isNaN(parsed.getTime())) {
                        lastmod = normalizeDate(parsed);
                    }
                }
            }

            urls.push({
                loc: `${DOMAIN}/blog/${slug}`,
                lastmod
            });
        }
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
