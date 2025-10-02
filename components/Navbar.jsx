'use client'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
    const [open, setOpen] = useState(false)

    return (
        <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border-b border-violet-500/10 shadow-sm">
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 opacity-50 blur-[2px]" />

            <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <a
                    href="/"
                    className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:opacity-90 transition-opacity"
                >
                    Floyd&nbsp;Göttsch
                </a>

                <div className="hidden md:flex items-center gap-8 text-base font-medium">
                    {[
                        { href: '/#about', label: 'About' },
                        { href: '/#projects', label: 'Projects' },
                        { href: '/blog', label: 'Blog' },
                        { href: '/beatmaker', label: 'Breatmaker' },
                        { href: '/#contact', label: 'Contact' },
                    ].map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="
                relative px-1
                text-zinc-800 dark:text-zinc-200
                transition-all duration-300
                hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-violet-500 hover:to-fuchsia-500
                hover:drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]
              "
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-300 hover:w-full" />
                        </a>
                    ))}
                    <ThemeToggle />
                </div>

                <button
                    className="md:hidden p-2 text-zinc-800 dark:text-zinc-200"
                    onClick={() => setOpen(!open)}
                >
                    {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </nav>

            {open && (
                <div className="md:hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-violet-500/10">
                    <div className="flex flex-col px-6 py-4 space-y-4 text-base font-medium">
                        {[
                            { href: '#about', label: 'About' },
                            { href: '#projects', label: 'Projects' },
                            { href: '/blog', label: 'Blog' },
                            { href: '/beatmaker', label: 'Breatmaker' },
                            { href: '#contact', label: 'Contact' },
                        ].map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="
                  relative
                  text-zinc-800 dark:text-zinc-200
                  transition-all duration-300
                  hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-violet-500 hover:to-fuchsia-500
                  hover:drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]
                "
                            >
                                {link.label}
                            </a>
                        ))}
                        <ThemeToggle />
                    </div>
                </div>
            )}
        </header>
    )
}
