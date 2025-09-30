module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular']
            },
            colors: {
                primary: '#10002B'
            }
        }
    },
    plugins: [
        require('@tailwindcss/typography')
    ]
};
