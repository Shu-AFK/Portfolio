import fs from 'fs'
import path from 'path'

const baseUrl = 'https://floyd-dev.com'

const normalizeDate = value => {
    const date = value instanceof Date ? value : new Date(value)
    const now = new Date()

    if (isNaN(date.getTime()) || date > now) {
        return now
    }

    return date
}

/**
 * @returns {import('next').MetadataRoute.Sitemap}
 */
export default function sitemap() {
    const staticPages = [
        { path: '', file: path.join(process.cwd(), 'app', 'page.jsx') },
        { path: '/blog', file: path.join(process.cwd(), 'app', 'blog', 'page.jsx') },
        { path: '/beatmaker', file: path.join(process.cwd(), 'app', 'beatmaker', 'page.jsx') },
    ]

    const staticEntries = staticPages
        .filter(({ file }) => fs.existsSync(file))
        .map(({ path: routePath, file }) => {
            const stats = fs.statSync(file)
            return {
                url: `${baseUrl}${routePath}`,
                lastModified: normalizeDate(stats.mtime),
            }
        })

    const postsDir = path.join(process.cwd(), 'content', 'posts')
    const postEntries = fs.existsSync(postsDir)
        ? fs
              .readdirSync(postsDir)
              .filter(filename => filename.endsWith('.md'))
              .map(filename => {
                  const slug = filename.replace(/\.md$/, '')
                  const filePath = path.join(postsDir, filename)
                  const stats = fs.statSync(filePath)

                  return {
                      url: `${baseUrl}/blog/${slug}`,
                      lastModified: normalizeDate(stats.mtime),
                  }
              })
        : []

    return [...staticEntries, ...postEntries]
}
