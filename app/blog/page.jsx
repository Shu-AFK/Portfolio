import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = {
    title: 'Blog - Floyd Göttsch',
    description:
        'Read articles, notes, and updates from Floyd Göttsch — exploring code, tools, and thoughts worth sharing.',
    icons: { icon: '/favicon.svg' }
}

export default function BlogIndex({ searchParams }) {
    const query = (searchParams?.q || '').toLowerCase()
    const activeTag = searchParams?.tag || ''

    const postsDir = path.join(process.cwd(), 'content', 'posts')
    const files = fs.existsSync(postsDir)
        ? fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
        : []

    const posts = files
        .map(fn => {
            const slug = fn.replace(/\.md$/, '')
            const raw = fs.readFileSync(path.join(postsDir, fn), 'utf8')
            const { data } = matter(raw)
            return {
                slug,
                title: data.title || slug,
                date: data.date || '',
                tags: data.tags || []
            }
        })
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    const allTags = Array.from(new Set(posts.flatMap(p => p.tags)))

    const filtered = posts.filter(
        p =>
            (!query ||
                p.title.toLowerCase().includes(query) ||
                p.tags.some(t => t.toLowerCase().includes(query))) &&
            (!activeTag || p.tags.includes(activeTag))
    )

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 flex-1">
            <h1 className="text-4xl font-bold mb-10 relative inline-block">
        <span className="relative inline-block pr-2">
          Blog
          <span className="absolute bottom-0 left-0 w-14 h-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"></span>
        </span>
            </h1>

            <form className="mb-2">
                <input
                    type="text"
                    name="q"
                    defaultValue={searchParams?.q || ''}
                    placeholder="Search by title or tag..."
                    className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 text-lg"
                />
                {activeTag && <input type="hidden" name="tag" value={activeTag} />}
            </form>

            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-16">
                    {allTags.map(tag => (
                        <Link
                            key={tag}
                            href={`/blog?tag=${encodeURIComponent(tag)}`}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                activeTag === tag
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-violet-500 hover:text-white'
                            }`}
                        >
                            #{tag}
                        </Link>
                    ))}
                    {activeTag && (
                        <Link
                            href="/blog"
                            className="px-3 py-1 rounded-full text-sm bg-red-500 text-white hover:bg-red-600"
                        >
                            Clear
                        </Link>
                    )}
                </div>
            )}

            {filtered.length === 0 ? (
                <p className="opacity-70 text-lg">No posts found.</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                    {filtered.map(p => (
                        <Link
                            key={p.slug}
                            href={`/blog/${p.slug}`}
                            className="group block p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all"
                        >
                            <h2 className="text-xl font-semibold text-violet-600 group-hover:text-violet-500 transition-colors">
                                {p.title}
                            </h2>
                            {p.date && (
                                <p className="text-sm text-zinc-500 mt-1">{p.date}</p>
                            )}
                            {p.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {p.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 rounded-full text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                                        >
                      #{tag}
                    </span>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center mt-4 text-sm text-violet-500 group-hover:text-violet-400 transition-colors">
                                <span>Read more</span>
                                <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
