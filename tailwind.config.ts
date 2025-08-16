import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        main: "var(--font-onest)",
      },
      colors: {
        // Somnia Brand Colors
        somnia: {
          cyan: "#22C7FF",      // Bright cyan
          blue: "#007BFF",      // Light blue
          violet: "#8C00FF",    // Violet
          magenta: "#FF0080",   // Magenta
          indigo: "#3C00A5",    // Dark indigo
        },
        // Dark Theme Design System
        bg: {
          main: "#0A0A1A",          // Main background
          card: "rgba(255, 255, 255, 0.03)",  // Card background with glassmorphism
          overlay: "rgba(0, 0, 0, 0.5)",      // Modal/overlay background
        },
        border: {
          card: "rgba(255, 255, 255, 0.05)",  // Card borders
          input: "rgba(255, 255, 255, 0.1)",  // Input borders
        },
        text: {
          primary: "#FFFFFF",       // Primary text (headers)
          secondary: "#E4E4FA",     // Body text
          muted: "#C2C2D6",        // Muted text
          accent: "#22C7FF",       // Accent text
        },
        // Semantic colors using Somnia palette
        primary: "#22C7FF",     // Somnia cyan as primary
        secondary: "#FF0080",   // Somnia magenta as secondary
        accent: "#8C00FF",      // Somnia violet as accent
        success: "#00D9A5",
        warning: "#FFB800",
        error: "#FF4757",
        // Legacy colors (keeping for backward compatibility during migration)
        dark: {
          1: "#161616",
          2: "#222222",
          3: "#333333",
        },
        light: {
          1: "#fefefe",
        },
        disabled: {
          1: "#d1d1d1",
        },
      },
      backgroundImage: {
        'gradient-main': 'radial-gradient(circle at top left, #0C0C23, #000015)',
        'gradient-somnia': 'linear-gradient(135deg, #22C7FF 0%, #007BFF 25%, #8C00FF 50%, #FF0080 75%, #3C00A5 100%)',
        'gradient-primary': 'linear-gradient(135deg, #22C7FF 0%, #007BFF 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #FF0080 0%, #8C00FF 100%)',
        'gradient-accent': 'linear-gradient(135deg, #8C00FF 0%, #3C00A5 100%)',
        'gradient-text': 'linear-gradient(135deg, #22C7FF 0%, #FF0080 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(34, 199, 255, 0.3)',
        'glow-magenta': '0 0 20px rgba(255, 0, 128, 0.3)',
        'glow-violet': '0 0 20px rgba(140, 0, 255, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.4)',
        'button': '0 4px 16px rgba(34, 199, 255, 0.2)',
        'button-hover': '0 6px 20px rgba(34, 199, 255, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
        'card': '8px',
        'modal': '16px',
      },
      animation: {
        'gradient-flow': 'gradient-flow 3s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'color-cycle': 'color-cycle 10s linear infinite',
        'logo-cycle': 'logo-cycle 6s ease-in-out infinite',
        'somnia-color-cycle': 'somnia-color-cycle 8s linear infinite',
      },
              keyframes: {
          'logo-cycle': {
            '0%': { 
              filter: 'hue-rotate(0deg) brightness(1) saturate(1.2)',
              transform: 'scale(1)'
            },
            '33%': { 
              filter: 'hue-rotate(120deg) brightness(1.1) saturate(1.4)',
              transform: 'scale(1.05)'
            },
            '66%': { 
              filter: 'hue-rotate(240deg) brightness(1.2) saturate(1.3)',
              transform: 'scale(1.02)'
            },
            '100%': { 
              filter: 'hue-rotate(360deg) brightness(1) saturate(1.2)',
              transform: 'scale(1)'
            },
          },
          'color-cycle': {
            '0%': { filter: 'hue-rotate(0deg)' },
            '100%': { filter: 'hue-rotate(360deg)' },
          },
        'gradient-flow': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(34, 199, 255, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(34, 199, 255, 0.6)' 
          }
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-1000px 0'
          },
          '100%': {
            backgroundPosition: '1000px 0'
          }
        },
        'somnia-color-cycle': {
          '0%': { filter: 'hue-rotate(0deg)' },
          '20%': { filter: 'hue-rotate(72deg)' }, // To Violet
          '40%': { filter: 'hue-rotate(144deg)' }, // To Magenta
          '60%': { filter: 'hue-rotate(216deg)' }, // To Cyan
          '80%': { filter: 'hue-rotate(288deg)' }, // To Blue
          '100%': { filter: 'hue-rotate(360deg)' },
        },
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
