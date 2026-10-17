import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0D0D0D', charcoal: '#1C1C1C', steel: '#3A3A3A',
        copper: '#B87333', ember: '#EA6600',
      },
      fontFamily: {
        kufi: ['"Noto Kufi Arabic"', 'sans-serif'],
        sans: ['"Noto Sans Arabic"', 'sans-serif'],
      },
      keyframes: { 'fade-in': { from:{opacity:'0'}, to:{opacity:'1'} }, 'pop-in': { from:{opacity:'0', transform:'translate(-50%,-48%) scale(.98)'}, to:{opacity:'1', transform:'translate(-50%,-50%) scale(1)'} } },
      animation: { 'fade-in':'fade-in .18s ease-out', 'pop-in':'pop-in .2s ease-out' },
      borderRadius: { DEFAULT: '0', sm: '2px' },
    },
  },
  plugins: [],
};
export default config;
