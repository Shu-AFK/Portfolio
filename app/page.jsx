'use client'
import Hero from '../components/Hero'
import About from '../components/About'
import Projects from '../components/Projects'
import BlogPreview from '../components/BlogPreview'
import Contact from '../components/Contact'

export const metadata = {
    title: 'Floyd Göttsch',
    description: 'C++ & Go. Making things that work (sometimes).',
    icons: {
        icon: '/favicon.svg',
    },
}

export default function Home() {
    return (
        <main>
            <Hero />
            <div className="max-w-5xl mx-auto px-6">
                <About />
                <Projects />
                <BlogPreview />
                <Contact />
            </div>
        </main>
    )
}
