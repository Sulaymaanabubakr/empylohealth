/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: 'var(--bg)',
                surface: 'var(--surface)',
                primary: 'var(--primary)',
                secondary: 'var(--secondary)',
                dark: 'var(--ink)',

                // Semantic aliases
                text: {
                    DEFAULT: 'var(--ink)',
                    muted: 'var(--muted)',
                    inverted: '#FFFFFF'
                },
                border: 'var(--border)',

                // Accents
                accent: {
                    purple: 'var(--accent-purple)',
                    blue: 'var(--accent-blue)'
                },

                danger: '#DC3545',
                success: '#28A745',
                warning: '#FFC107',
            },
            fontFamily: {
                sans: ['Space Grotesk', 'sans-serif'],
                display: ['DM Serif Display', 'serif']
            }
        },
    },
    plugins: [],
}
