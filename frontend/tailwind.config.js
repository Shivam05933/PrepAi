/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ZERO BLUE POLICY - Custom premium dark mode palette
        darkbg: '#09090b', // Deep Zinc 950
        cardbg: '#18181b', // Premium Zinc 900
        borderbg: '#27272a', // Zinc 800
        accent: {
          violet: '#8b5cf6', // Electric Violet
          violetHover: '#7c3aed',
          emerald: '#10b981', // Neon Emerald
          emeraldHover: '#059669',
          orange: '#f97316', // Sunset Orange
          orangeHover: '#ea580c'
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
