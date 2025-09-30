'use client'
import { Shield, Wrench, Zap, Terminal } from 'lucide-react'

export default function About() {
    return (
        <section id="about" className="py-16">
            <h2 className="text-3xl font-semibold mb-8 text-left relative inline-block">
                About Me
                <span className="absolute bottom-0 left-0 w-20 h-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"></span>
            </h2>

            <p className="max-w-5xl text-left text-lg leading-relaxed mb-10 text-zinc-700 dark:text-zinc-300">
                I’m <span className="font-semibold text-violet-600">Floyd Göttsch</span>, a software
                developer who prefers code that’s fast, minimal, and usually works.
                Most of my work is done in <strong>C++</strong> and <strong>Go</strong>,
                focusing on low-level systems and practical tools.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center space-x-3 mb-3">
                        <Terminal className="w-6 h-6 text-violet-500" />
                        <h3 className="text-xl font-semibold">Code</h3>
                    </div>
                    <p>
                        I build low-level systems, command-line tools and automations.
                        Most of them “just work”… until they don’t.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center space-x-3 mb-3">
                        <Zap className="w-6 h-6 text-violet-500" />
                        <h3 className="text-xl font-semibold">Approach</h3>
                    </div>
                    <p>
                        I like finding the simplest path through messy problems.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center space-x-3 mb-3">
                        <Shield className="w-6 h-6 text-violet-500" />
                        <h3 className="text-xl font-semibold">Cybersecurity</h3>
                    </div>
                    <p>
                        I like peeling back the layers of technology to see what’s really going on underneath.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center space-x-3 mb-3">
                        <Wrench className="w-6 h-6 text-violet-500" />
                        <h3 className="text-xl font-semibold">Philosophy</h3>
                    </div>
                    <p>
                        I try to build things that make sense,
                        don’t get in the way,
                        and don’t require a 200-page manual to use.
                    </p>
                </div>
            </div>
        </section>
    )
}
