import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeStringify from 'rehype-stringify'

const prettyCodeOptions = {
    theme: 'catppuccin-mocha',
    keepBackground: true
}

export async function GET(req, { params }) {
    const postsDir = path.join(process.cwd(), 'content', 'posts')
    const filePath = path.join(postsDir, `${params.slug}.md`)

    if (!fs.existsSync(filePath)) {
        return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 })
    }

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
        .use(remarkRehype)
        .use(rehypePrettyCode, prettyCodeOptions)
        .use(rehypeStringify)
        .process(content)

    return new Response(
        JSON.stringify({
            title: data.title || params.slug,
            date: formattedDate,
            html: processed.toString()
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }
    )
}
