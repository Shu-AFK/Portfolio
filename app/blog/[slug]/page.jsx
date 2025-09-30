'use client'

import { useEffect, useState } from 'react'

export default function BlogPost({ params }) {
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log('Fetching blog post for slug:', params.slug)
        fetch(`/api/renderMarkdown/${params.slug}`)
            .then(r => r.json())
            .then(data => {
                console.log('Received post data:', data)
                setPost(data);
                setLoading(false)
            })
            .catch((err) => {
                console.error('Error fetching post:', err)
                setLoading(false)
            })
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
                <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
                {post.date && <p className="text-base mb-8 opacity-60">{post.date}</p>}
                <div dangerouslySetInnerHTML={{ __html: post.html }} />
            </div>
        </main>
    )
}
