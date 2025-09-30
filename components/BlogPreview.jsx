'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function BlogPreview() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/posts')
            .then(r => r.json())
            .then(data => {
                setPosts(data.slice(0, 5))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <section className="py-16">
                <h2 className="text-3xl font-semibold mb-6 text-left">Blog</h2>
                <p className="opacity-70">Loading...</p>
            </section>
        )
    }

    return (
        <section className="py-16">
            <h2 className="text-3xl font-semibold mb-8 text-left relative inline-block">
                Blog Preview
                <span className="absolute bottom-0 left-0 w-12 h-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"></span>
            </h2>

            {posts.length === 0 && (
                <p className="text-zinc-500">No posts yet.</p>
            )}

            <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
                {posts.map(post => (
                    <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="group block p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all"
                    >
                        <h3 className="text-xl font-semibold text-violet-600 group-hover:text-violet-500 transition-colors">
                            {post.title}
                        </h3>

                        {post.date && (
                            <p className="text-sm text-zinc-500 mt-1">{post.date}</p>
                        )}

                        {post.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {post.tags.map(tag => (
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
        </section>
    )
}
