'use client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen px-6 bg-zinc-50 dark:bg-[#070607] text-center">
            <h1 className="text-[8rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-400 animate-pulse">
                404
            </h1>

            <p className="mt-4 text-lg text-zinc-700 dark:text-zinc-300 max-w-md">
                Oops… looks like you wandered off the map.
                The page you’re looking for doesn’t exist (yet).
            </p>

            <Link
                href="/"
                className="mt-8 inline-flex items-center gap-2 px-5 py-2 rounded-lg
                   bg-violet-600 hover:bg-violet-700 text-white shadow-lg
                   transition-all duration-200 hover:shadow-violet-600/40"
            >
                <ArrowLeft className="w-5 h-5" />
                Back Home
            </Link>

            <div className="mt-16 text-xs text-zinc-400">
                <span className="font-mono">[ Error code: 404_NOT_FOUND ]</span>
            </div>
        </main>
    )
}
