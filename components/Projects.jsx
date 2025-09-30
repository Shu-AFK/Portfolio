import projects from '../data/projects.json'

export default function Projects() {
    return (
        <section id="projects" className="py-12">
            <h2 className="text-3xl font-semibold mb-8 text-left relative inline-block">
        <span className="relative inline-block pr-2">
          Projects
          <span className="absolute bottom-0 left-0 w-[85%] h-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"></span>
        </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {projects.map((p) => (
                    <a
                        key={p.name}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block p-6 rounded-2xl bg-gray-100 dark:bg-zinc-900
                       border border-transparent hover:border-violet-400 transition-colors"
                    >
                        {/* Animated gradient bar */}
                        <div
                            className="h-1 w-full rounded-t-md animate-gradient-move"
                            style={{
                                background:
                                    'linear-gradient(90deg, #3C096C, #7B2CBF, #C77DFF, #3C096C)',
                                backgroundSize: '200% 100%',
                            }}
                        />
                        <h3 className="mt-4 text-xl font-semibold">{p.name}</h3>
                        <p className="mt-2 text-sm opacity-80">{p.description}</p>
                        <div className="mt-3 text-xs opacity-70 italic">{p.lang}</div>
                    </a>
                ))}
            </div>
        </section>
    )
}
