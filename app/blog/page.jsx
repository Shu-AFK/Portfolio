import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = {
    title: 'Blog - Floyd Göttsch',
    description:
        'Read articles, notes, and updates from Floyd Göttsch — exploring code, tools, and thoughts worth sharing.',
    icons: {
        icon: '/favicon.svg',
    },
}

export default function BlogIndex() {
    const postsDir = path.join(process.cwd(), 'content', 'posts')
    const files = fs.existsSync(postsDir)
        ? fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'))
        : []

    const posts = files
        .map((fn) => {
            const slug = fn.replace(/\.md$/, '')
            const raw = fs.readFileSync(path.join(postsDir, fn), 'utf8')
            const { data } = matter(raw)
            return { slug, title: data.title || slug, date: data.date || '' }
        })
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 flex-1">
            <h1 className="text-4xl font-bold mb-10 relative inline-block">
        <span className="relative inline-block pr-2">
          Blog
          <span className="absolute bottom-0 left-0 w-12 h-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"></span>
        </span>
            </h1>

            {posts.length === 0 ? (
                <p className="opacity-70 text-lg">No posts yet.</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                    {posts.map((p) => (
                        <Link
                            key={p.slug}
                            href={`/blog/${p.slug}`}
                            className="group block p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all"
                        >
                            <h2 className="text-xl font-semibold text-violet-600 group-hover:text-violet-500 transition-colors">
                                {p.title}
                            </h2>
                            {p.date && <p className="text-sm text-zinc-500 mt-1">{p.date}</p>}
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
