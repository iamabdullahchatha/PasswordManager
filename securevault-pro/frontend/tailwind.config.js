/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],

  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1440px' },
    },

    extend: {
      /* ── CSS Variable Colors ── */
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* ── Sidebar ── */
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          muted: 'hsl(var(--sidebar-muted))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
        },
      },

      /* ── Border Radius ── */
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },

      /* ── Typography ── */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs:   ['12px', { lineHeight: '16px' }],
        sm:   ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '22px' }],
        md:   ['15px', { lineHeight: '24px' }],
        lg:   ['16px', { lineHeight: '24px' }],
        xl:   ['18px', { lineHeight: '28px' }],
        '2xl':['20px', { lineHeight: '32px', fontWeight: '600' }],
        '3xl':['24px', { lineHeight: '36px', fontWeight: '700' }],
        '4xl':['30px', { lineHeight: '40px', fontWeight: '700' }],
        '5xl':['36px', { lineHeight: '48px', fontWeight: '800' }],
      },
      fontWeight: {
        thin: '100', extralight: '200', light: '300',
        normal: '400', medium: '500', semibold: '600',
        bold: '700', extrabold: '800', black: '900',
      },
      letterSpacing: {
        tightest: '-0.04em', tighter: '-0.02em', tight: '-0.01em',
        normal: '0', wide: '0.01em', wider: '0.05em', widest: '0.1em',
      },

      /* ── Shadows ── */
      boxShadow: {
        'xs':   'var(--shadow-sm)',
        'sm':   'var(--shadow)',
        DEFAULT:'var(--shadow-md)',
        'md':   'var(--shadow-md)',
        'lg':   'var(--shadow-lg)',
        'xl':   'var(--shadow-xl)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'card-active': '0 0 0 2px hsl(var(--primary))',
        'blue-sm': '0 2px 8px rgba(37,99,235,0.2)',
        'blue':    '0 4px 14px rgba(37,99,235,0.25)',
        'blue-lg': '0 8px 25px rgba(37,99,235,0.3)',
        'inner-blue': 'inset 0 0 0 1px rgba(37,99,235,0.2)',
        'modal': '0 25px 50px rgba(0,0,0,0.12), 0 12px 24px rgba(0,0,0,0.08)',
        'sidebar': '4px 0 20px rgba(0,0,0,0.15)',
        'topbar': '0 1px 0 hsl(var(--border)), 0 2px 8px rgba(0,0,0,0.04)',
        'none': 'none',
      },

      /* ── Spacing ── */
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '17': '4.25rem',
        '18': '4.5rem',
        '19': '4.75rem',
        '22': '5.5rem',
        '68': '17rem',
        '72': '18rem',
        '76': '19rem',
        '80': '20rem',
        '84': '21rem',
        '88': '22rem',
        '256': '64rem',
        '280': '70rem',
      },

      /* ── Z-Index ── */
      zIndex: {
        sidebar: '40',
        overlay: '45',
        modal: '50',
        toast: '60',
        tooltip: '70',
      },

      /* ── Keyframes & Animations ── */
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'slide-in-left': { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'slide-in-right':{ from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'count-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
        'pulse-ring': {
          '0%':    { boxShadow: '0 0 0 0 rgba(37,99,235,0.4)' },
          '70%':   { boxShadow: '0 0 0 10px rgba(37,99,235,0)' },
          '100%':  { boxShadow: '0 0 0 0 rgba(37,99,235,0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        shimmer:          'shimmer 2s linear infinite',
        'fade-in':        'fadeIn 0.3s ease-out',
        'slide-up':       'slideUp 0.35s ease-out',
        'scale-in':       'scaleIn 0.2s ease-out',
        'slide-in-left':  'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        float:            'float 3s ease-in-out infinite',
        'pulse-ring':     'pulse-ring 2s ease-in-out infinite',
      },

      /* ── Backdrop Blur ── */
      backdropBlur: { xs: '2px', sm: '4px', DEFAULT: '8px', md: '12px', lg: '16px', xl: '24px' },

      /* ── Grid & Flex ── */
      gridTemplateColumns: {
        'sidebar-open': '260px 1fr',
        'sidebar-collapsed': '72px 1fr',
      },

      /* ── Transition ── */
      transitionDuration: { '250': '250ms', '350': '350ms', '400': '400ms', '600': '600ms' },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },

  plugins: [require('tailwindcss-animate')],
};
