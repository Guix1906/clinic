/**
 * Tailwind config gerado a partir do design system do PageCloner
 */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    // ajuste caso haja outros caminhos (ex: components fora de src)
  ],
  theme: {
    // PREMIUM UI — DESIGN TOKENS REFINADOS
    borderRadius: {
      none: '0',
      sm: '0.5rem',     // 8px — base para botões
      DEFAULT: '0.75rem', // 12px — inputs/cards pequenas
      md: '0.75rem',    // 12px
      lg: '1rem',       // 16px — cards, popovers
      xl: '1.5rem',     // 24px — sidebar/header grande
      '2xl': '2rem',    // 32px — overlays grandes
      full: '999999px',
    },
    boxShadow: {
      sm: '0 2px 8px 0 rgba(30,41,59,0.06)',
      DEFAULT: '0 4px 24px 0 rgba(30,41,59,0.10)',
      md: '0 8px 32px -4px rgba(30,41,59,0.11)',
      lg: '0 18px 40px -4px rgba(30,41,59,0.13)',
      xl: '0 40px 80px -8px rgba(30,41,59,0.14)',
      none: 'none',
    },
    transitionDuration: {
      DEFAULT: '200ms', // microinterações suaves
      150: '150ms',
      200: '200ms',
      250: '250ms',
      300: '300ms',
    },
    transitionTimingFunction: {
      DEFAULT: 'cubic-bezier(.4,0,.2,1)', // curva ease premium
    },
    extend: {
      spacing: {
        8: '2rem',
        16: '4rem',
        24: '6rem',
        32: '8rem',
        40: '10rem',
        48: '12rem',
      },
      colors: {
        // Azuis premium e variantes
        premium: {
          DEFAULT: '#0066D0', // Azul institucional
          50: '#FAFBFC',
          100: '#ECF3FF',
          200: '#CBE3FE',
          300: '#90BFFE',
          500: '#0066D0',
          700: '#0051A3',
        },
        background: '#FAFBFC',
        border: '#E4E7EC',
        card: '#FFFFFF',
      },
    },
    fontFamily: {
      sans: [
        'Plus Jakarta Sans',
        'ui-sans-serif',
        'system-ui',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji',
      ],
      mono: [
        'DM Sans',
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace'
      ]
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1' }], // 12px
      sm: ['0.875rem', { lineHeight: '1.25' }], // 14px
      base: ['1rem', { lineHeight: '1.5' }], // 16px
      lg: ['1.125rem', { lineHeight: '1.75' }], // 18px
      '2xl': ['1.5rem', { lineHeight: '2' }], // 24px
      '4xl': ['2.25rem', { lineHeight: '2.5' }], // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000',
      white: '#fff',
      primary: {
        200: '#bdb8f4',
        500: '#6f65e8',
      },
      gray: {
        50: 'oklch(98.5% .002 247.839)',
        100: 'oklch(96.7% .003 264.542)',
        200: 'oklch(92.8% .006 264.531)',
        300: 'oklch(87.2% .01 258.338)',
        400: 'oklch(70.7% .022 261.325)',
        500: 'oklch(55.1% .027 264.364)',
        600: 'oklch(44.6% .03 256.802)',
        700: 'oklch(37.3% .034 259.733)',
        800: 'oklch(27.8% .033 256.848)',
        900: 'oklch(21% .034 264.665)',
      },
      slate: {
        800: 'oklch(27.9% .041 260.031)'
      },
      blue: {
        50: 'oklch(97% .014 254.604)',
        700: 'oklch(48.8% .243 264.376)',
      },
      red: {
        50: 'oklch(97.1% .013 17.38)',
        500: 'oklch(63.7% .237 25.331)',
        700: 'oklch(50.5% .213 27.518)',
      },
      orange: {
        50: 'oklch(98% .016 73.684)',
        500: 'oklch(70.5% .213 47.604)',
        700: 'oklch(55.3% .195 38.402)',
      },
      yellow: {
        50: 'oklch(98.7% .026 102.212)',
        700: 'oklch(55.4% .135 66.442)',
      },
      green: {
        50: 'oklch(98.2% .018 155.826)',
        500: 'oklch(72.3% .219 149.579)',
        700: 'oklch(52.7% .154 150.069)'
      },
      purple: {
        50: 'oklch(97.7% .014 308.299)',
        500: 'oklch(62.7% .265 303.9)'
      },
      destructive: {
        DEFAULT: '#EF4444',
        foreground: '#FFFFFF',
      },
      success: {
        DEFAULT: '#22C55E',
        foreground: '#FFFFFF',
      },
      info: {
        DEFAULT: '#0EA5E9',
        foreground: '#FFFFFF',
      },
      warning: {
        DEFAULT: '#F59E0B',
        foreground: '#FFFFFF',
      },
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem', // 2px
      DEFAULT: '0.375rem', // 6px
      md: '0.375rem', // 6px
      lg: '0.5rem', // 8px
      xl: '0.75rem', // 12px
      '2xl': '1rem', // 16px
      '3xl': '1.5rem', // 24px
      full: '999999px',
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      none: 'none',
    },
    extend: {
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '22': '5.5rem',
        '24': '6rem',
        '64': '16rem',
        '65': '16.25rem', // custom do pagecloner
      },
      transitionProperty: {
        'all': 'all',
        'colors': 'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
        'shadow': 'box-shadow',
        'transform': 'transform',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(.4,0,.2,1)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        '200': '200ms',
        '300': '300ms',
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}