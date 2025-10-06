import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata = {
    metadataBase: new URL('https://floyd-dev.com'),
    title: {
        default: 'Floyd Göttsch',
        template: '%s | Floyd Göttsch',
    },
    description: 'C++ & Go. Making things that work (sometimes).',
    openGraph: {
        title: 'Floyd Göttsch',
        description: 'C++ & Go. Making things that work (sometimes).',
        url: 'https://floyd-dev.com/',
        siteName: 'Floyd Göttsch',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Floyd Göttsch',
        description: 'C++ & Go. Making things that work (sometimes).',
    },
    icons: {
        icon: '/favicon.svg',
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className="bg-white text-black dark:bg-[#070607] dark:text-white font-sans flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-14">
            {children}
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
        </body>
        </html>
    )
}
