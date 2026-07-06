import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      // ── Typography Scale (6 ระดับเท่านั้น) ─────────────────────────────────
      // micro/caption สำหรับ metadata, body เป็น default
      fontSize: {
        // legacy support (เก็บไว้ก่อน เพื่อไม่ break existing code)
        'xs':   ['0.75rem',   { lineHeight: '1.125rem' }],   // 12 / 18
        'sm':   ['0.875rem',  { lineHeight: '1.375rem' }],   // 14 / 22
        'base': ['1rem',      { lineHeight: '1.5rem' }],     // 16 / 24
        'lg':   ['1.125rem',  { lineHeight: '1.625rem' }],   // 18 / 26
        'xl':   ['1.25rem',   { lineHeight: '1.75rem' }],    // 20 / 28
        '2xl':  ['1.5rem',    { lineHeight: '2rem' }],       // 24 / 32 — display
        '3xl':  ['1.875rem',  { lineHeight: '2.375rem' }],   // 30 / 38
        '4xl':  ['2.25rem',   { lineHeight: '2.75rem' }],    // 36 / 44
        // new semantic tokens
        'micro':   ['0.6875rem', { lineHeight: '1rem' }],     // 11 / 16
        'caption': ['0.75rem',   { lineHeight: '1.125rem' }], // 12 / 18
        'body':    ['0.875rem',  { lineHeight: '1.375rem' }], // 14 / 22 — DEFAULT
        'heading': ['1.125rem',  { lineHeight: '1.625rem' }], // 18 / 26
        'display': ['1.5rem',    { lineHeight: '2rem' }],     // 24 / 32
      },

      // ── Border Radius (Sharper / Sleek Square UI) ────────────────────────
      borderRadius: {
        'none': '0',
        'sm':   '1px',
        DEFAULT: '2px',
        'md':   '3px',
        'lg':   '4px',
        'xl':   '6px',
        '2xl':  '8px',
        '3xl':  '8px',
        'full': '9999px',
      },

      colors: {
        // ── Primary (Indigo) — เก็บเดิม ────────────────────────────────────
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // ── Neutral (Zinc) — High contrast premium gray ─────────────────────
        gray: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        // ── Semantic — ขยาย ให้มี scale ใช้งานง่ายขึ้น ────────────────────
        status: {
          success: {
            DEFAULT: '#10b981',
            light:   '#d1fae5',
            lighter: '#ecfdf5',
            dark:    '#047857',
          },
          warning: {
            DEFAULT: '#f59e0b',
            light:   '#fef3c7',
            lighter: '#fffbeb',
            dark:    '#b45309',
          },
          danger: {
            DEFAULT: '#f43f5e',
            light:   '#ffe4e6',
            lighter: '#fff1f2',
            dark:    '#be123c',
          },
          info: {
            DEFAULT: '#0ea5e9',
            light:   '#e0f2fe',
            lighter: '#f0f9ff',
            dark:    '#0369a1',
          },
        },
      },

      fontFamily: {
        sans:     ['Anuphan', 'system-ui', 'sans-serif'],
        heading:  ['Anuphan', 'system-ui', 'sans-serif'],
        document: ['Anuphan', 'sans-serif'],
        sarabun:  ['Sarabun', 'sans-serif'],
      },
      fontWeight: {
        light:     '300',
        normal:    '400',
        medium:    '500',
        semibold:  '600',
        bold:      '700',
        extrabold: '800',
      },
      letterSpacing: {
        tight:   '-0.015em',
        snug:    '-0.01em',
        normal:  '0em',
        wide:    '0.01em',
        wider:   '0.025em',
      },

      // ── Elevation System (3 ระดับเท่านั้น) ────────────────────────────────
      boxShadow: {
        // legacy aliases (ให้ของเก่ายังใช้ได้)
        'sm':   '0 1px 2px 0 rgba(0,0,0,0.05)',
        DEFAULT:'0 2px 4px -1px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'md':   '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
        'lg':   '0 12px 32px -4px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.06)',
        'xl':   '0 20px 48px -8px rgba(0,0,0,0.15)',
        // new semantic
        'elev-1': '0 1px 2px 0 rgba(0,0,0,0.05)',
        'elev-2': '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
        'elev-3': '0 12px 32px -4px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.06)',
      },

      keyframes: {
        shrink: {
          '0%':   { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
      },
      animation: {
        'shrink': 'shrink 5s linear forwards',
      },
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    }
  },
  plugins: [
    forms,
    typography
  ]
};
