import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: {
            DEFAULT: '#204CB4',
            hover: '#1B3F96',
            active: '#163378',
            light: '#EBF1FF',
            dark: '#142854',
            border: '#D4E2FD',
          },
          yellow: {
            DEFAULT: '#F4D868',
            hover: '#E8C850',
            light: '#FFF8DD',
            border: '#F6E294',
            text: '#8D6B00',
          },
          green: {
            DEFAULT: '#0D8249',
            light: '#E8F8F0',
            border: '#C7EED8',
          },
          red: {
            DEFAULT: '#D93838',
            light: '#FDECEC',
            border: '#F8C8C8',
          },
          canvas: '#F8F9FD',
          surface: {
            DEFAULT: '#FFFFFF',
            muted: '#F0F0F0',
          },
          border: '#EAECEF',
          text: {
            primary: '#182848',
            body: '#334155',
            muted: '#64748B',
            subtle: '#94A3B8',
          },
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
