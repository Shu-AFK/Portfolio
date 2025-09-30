'use client'

import { useEffect, useState } from 'react'

export default function BlogPost({ params }) {
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/renderMarkdown/${params.slug}`)
            .then(r => r.json())
            .then(data => {
                setPost(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [params.slug])

    useEffect(() => {
        if (post) {
            const blocks = document.querySelectorAll('pre > code')
            blocks.forEach(codeBlock => {
                const pre = codeBlock.parentElement
                if (!pre.querySelector('.copy-btn')) {
                    const btn = document.createElement('button')
                    btn.textContent = 'Copy'
                    btn.className = 'copy-btn absolute top-2 right-2 bg-zinc-700 text-white text-xs px-2 py-1 rounded hover:bg-zinc-600'
                    btn.style.position = 'absolute'
                    btn.addEventListener('click', () => {
                        navigator.clipboard.writeText(codeBlock.innerText)
                        btn.textContent = 'Copied!'
                        setTimeout(() => { btn.textContent = 'Copy' }, 1500)
                    })
                    pre.style.position = 'relative'
                    pre.appendChild(btn)
                }
            })
        }
    }, [post])

    if (loading) return <p className="p-8">Loading...</p>
    if (!post) return <p className="p-8">Post not found.</p>

    return (
        <main className="flex flex-col min-h-screen max-w-3xl mx-auto px-6 py-12 prose prose-zinc dark:prose-invert">
            <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
                {post.date && <p className="text-base opacity-60 mb-4">{post.date}</p>}
                {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {post.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1 text-sm rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                            >
                #{tag}
              </span>
                        ))}
                    </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: post.html }} />
            </div>
        </main>
    )
}
