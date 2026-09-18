/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['Fraunces', 'Cormorant Garamond', 'Georgia', 'serif'],
                sans: ['Outfit', 'system-ui', 'sans-serif'],
                script: ['Italianno', 'cursive'],
            },
            colors: {
                ivory: '#FAF9F6',
                champagne: '#F5F2EA',
                cream: '#F2E8DF',
                gold: {
                    DEFAULT: '#D4AF37',
                    light: '#EEDEA8',
                    dark: '#B8932E',
                },
                charcoal: {
                    DEFAULT: '#2C2A29',
                    soft: '#595654',
                    deep: '#1A1A1A',
                },
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
                popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
                primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
                secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
                muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
                accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
                destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
                'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 50%' },
                    '100%': { backgroundPosition: '200% 50%' },
                },
                floatY: {
                    '0%,100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGold: {
                    '0%,100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.6)' },
                    '50%': { boxShadow: '0 0 0 12px rgba(212,175,55,0)' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                shimmer: 'shimmer 4s linear infinite',
                floatY: 'floatY 7s ease-in-out infinite',
                marquee: 'marquee 40s linear infinite',
                fadeUp: 'fadeUp 0.8s ease-out both',
                pulseGold: 'pulseGold 2.4s ease-out infinite',
            },
        }
    },
    plugins: [require("tailwindcss-animate")],
};
