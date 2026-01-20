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
                background: '#F8F9FA', // Light Grayish White
                surface: '#FFFFFF',    // Pure White
                primary: '#00A99D',    // Empylo Turquoise
                secondary: '#FFB347',  // Empylo Orange
                dark: '#191919',       // Empylo Black

                // Semantic aliases
                text: {
                    DEFAULT: '#191919',
                    muted: '#6C757D',
                    inverted: '#FFFFFF'
                },
                border: '#E9ECEF',

                // Accents
                accent: {
                    purple: '#A5A7F4',
                    blue: '#D8DEE8'
                },

                danger: '#DC3545',
                success: '#28A745',
                warning: '#FFC107',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Or Space Grotesk if available
            }
        },
    },
    plugins: [],
}
