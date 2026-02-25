import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "SF Mono", "Consolas", "monospace"],
        heading: ["Playfair Display", "Georgia", "Times New Roman", "serif"],
        body: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        'xs': ['0.6875rem', { lineHeight: '0.875rem' }],     // 11px - Extra small
        'sm': ['0.8125rem', { lineHeight: '1.125rem' }],     // 13px - Body Small
        'base': ['0.875rem', { lineHeight: '1.375rem' }],    // 14px - Body
        'lg': ['1rem', { lineHeight: '1.5rem' }],            // 16px - Body Large
        'xl': ['1.125rem', { lineHeight: '1.625rem' }],      // 18px
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],       // 20px
        'subtitle': ['1.5rem', { lineHeight: '2rem' }],      // 24px - Subtitle
        'title': ['1.875rem', { lineHeight: '2.25rem' }],    // 30px - Title
        'display': ['2.5rem', { lineHeight: '1.1' }],        // 40px - Display
        'hero': ['3.5rem', { lineHeight: '1.1' }],           // 56px - Hero
        '3xl': ['1.5rem', { lineHeight: '2rem' }],           // 24px
        '4xl': ['1.75rem', { lineHeight: '2.125rem' }],      // 28px
        '5xl': ['2.25rem', { lineHeight: '1.1' }],           // 36px
        '6xl': ['2.75rem', { lineHeight: '1.1' }],           // 44px
        '7xl': ['3.25rem', { lineHeight: '1.1' }],           // 52px
        '8xl': ['4rem', { lineHeight: '1.1' }],              // 64px
        '9xl': ['5rem', { lineHeight: '1.1' }],              // 80px
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        kenya: {
          black: "hsl(var(--kenya-black))",
          green: "hsl(var(--secondary))",
          red: "hsl(var(--primary))",
          gold: "hsl(var(--accent))",
        },
        warm: {
          cream: "hsl(var(--warm-cream))",
          peach: "hsl(var(--soft-peach))",
          mist: "hsl(var(--love-mist))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      boxShadow: {
        'glass-sm': '0 6px 16px -10px rgba(15, 23, 42, 0.2)',
        'glass-md': '0 18px 40px -18px rgba(15, 23, 42, 0.3)',
        'soft': '0 10px 30px -20px rgba(15, 23, 42, 0.25)',
        'elevated': '0 20px 45px -25px rgba(15, 23, 42, 0.35)',
        'glow': '0 15px 35px -20px rgba(225, 29, 72, 0.45)',
        'glow-strong': '0 25px 60px -30px rgba(225, 29, 72, 0.65)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
      },
      backgroundImage: {
        "hero-pattern": "radial-gradient(circle at 25% 15%, hsl(var(--warm-cream)) 0%, transparent 45%), radial-gradient(circle at 70% 80%, hsl(var(--soft-peach)) 0%, transparent 50%), radial-gradient(circle at 85% 35%, hsl(var(--love-mist)) 0%, transparent 35%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.4))",
        "kenya-sunset": "linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--secondary)) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
