import type { Config } from 'tailwindcss'
export default {
  content: [
    '../../apps/**/app/**/*.{ts,tsx}',
    '../../apps/**/components/**/*.{ts,tsx}',
    './**/*.{ts,tsx}'
  ],
  theme: { extend: {} },
  plugins: []
} satisfies Config
