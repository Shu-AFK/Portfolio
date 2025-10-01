import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeStringify from 'rehype-stringify'

const prettyCodeOptions = {
    theme: 'catppuccin-mocha',
    keepBackground: true,
}

async function getPost(slug) {
    const postsDir = path.join(process.cwd(), 'content', 'posts')
    const filePath = path.join(postsDir, `${slug}.md`)
    if (!fs.existsSync(filePath)) return null

    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)

    let formattedDate = data.date ? String(data.date) : ''
    if (formattedDate && /^\d{2}\.\d{2}\.\d{2}$/.test(formattedDate)) {
        const [day, month, year] = formattedDate.split('.').map(Number)
        const fullYear = year < 50 ? 2000 + year : 1900 + year
        formattedDate = new Date(fullYear, month - 1, day).toDateString()
    }

    const processed = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypePrettyCode, prettyCodeOptions)
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(content)

    return {
        title: data.title || slug,
        date: formattedDate,
        tags: data.tags || [],
        description: data.description || '',
        keywords: data.keywords || [],
        coverImage: data.coverImage || '',
        html: processed.toString(),
    }
}

export async function generateMetadata({ params }) {
    const post = await getPost(params.slug)
    if (!post) return {}

    return {
        title: post.title,
        description: post.description,
        keywords: post.keywords,
        openGraph: {
            title: post.title,
            description: post.description,
            images: post.coverImage ? [post.coverImage] : [],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
            images: post.coverImage ? [post.coverImage] : [],
        },
    }
}

export default async function BlogPost({ params }) {
    const post = await getPost(params.slug)
    if (!post) return <p className="p-8">Post not found.</p>

    return (
        <main className="flex flex-col min-h-screen max-w-3xl mx-auto px-6 py-12 prose prose-zinc dark:prose-invert">
            <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
            {post.date && <p className="text-base opacity-60 mb-4">{post.date}</p>}

            {post.tags.length > 0 && (
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
        </main>
    )
}
