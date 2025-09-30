export default function Footer() {
    return (
        <footer className="w-full mt-auto py-6 text-center relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            <div
                className="absolute top-0 left-0 w-full h-[2px] animate-gradient-move"
                style={{
                    background:
                        'linear-gradient(90deg, #3C096C, #7B2CBF, #C77DFF, #3C096C)',
                    backgroundSize: '200% 100%',
                }}
            />

            <p className="text-sm opacity-80 text-zinc-600 dark:text-zinc-400">
                © {new Date().getFullYear()} <span className="font-medium text-zinc-800 dark:text-zinc-200">Floyd Göttsch</span>
            </p>
        </footer>
    )
}
