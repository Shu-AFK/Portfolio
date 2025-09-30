import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function GET(){
    const postsDir = path.join(process.cwd(), 'content', 'posts')
    let posts = []
    if(fs.existsSync(postsDir)){
        const files = fs.readdirSync(postsDir).filter(f=>f.endsWith('.md'))
        posts = files.map(fn => {
            const slug = fn.replace(/\.md$/, '')
            const raw = fs.readFileSync(path.join(postsDir, fn), 'utf-8')
            const { data } = matter(raw)
            return { slug, title: data.title || slug, date: data.date ? String(data.date) : '' }
        }).sort((a,b)=> (b.date||'').localeCompare(a.date||''))
    }
    return new Response(JSON.stringify(posts), { status:200, headers:{'Content-Type':'application/json'} })
}