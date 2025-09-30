import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function GET() {
    const postsDir = path.join(process.cwd(), 'content', 'posts')
    const posts = []

    if (fs.existsSync(postsDir)) {
        const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
        files.forEach(filename => {
            const raw = fs.readFileSync(path.join(postsDir, filename), 'utf-8')
            const { data } = matter(raw)

            let formattedDate = data.date ? String(data.date) : ''
            if (formattedDate && /^\d{2}\.\d{2}\.\d{2}$/.test(formattedDate)) {
                const [day, month, year] = formattedDate.split('.').map(Number)
                const fullYear = year < 50 ? 2000 + year : 1900 + year
                formattedDate = new Date(fullYear, month - 1, day).toDateString()
            }

            posts.push({
                slug: filename.replace(/\.md$/, ''),
                title: data.title || filename.replace(/\.md$/, ''),
                date: formattedDate
            })
        })
        posts.sort((a, b) => new Date(b.date) - new Date(a.date))
    }

    return new Response(JSON.stringify(posts), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    })
}
