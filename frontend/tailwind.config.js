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
                outfit: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
                manrope: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
            },
            colors: {
                primary: {
                    DEFAULT: "#0A2540",
                    foreground: "#FFFFFF",
                    50: "#E6EAF0",
                    100: "#B8C3D2",
                    700: "#0A2540",
                    800: "#071A2E",
                    900: "#040F1C",
                },
                secondary: {
                    DEFAULT: "#D4AF37",
                    foreground: "#0A2540",
                    50: "#FBF6E3",
                    600: "#B8941F",
                },
                background: "#F8FAFC",
                foreground: "#0F172A",
                muted: {
                    DEFAULT: "#F1F5F9",
                    foreground: "#64748B",
                },
                card: {
                    DEFAULT: "#FFFFFF",
                    foreground: "#0F172A",
                },
                border: "#E2E8F0",
                ring: "#0A2540",
                destructive: {
                    DEFAULT: "#DC2626",
                    foreground: "#FFFFFF",
                },
            },
            borderRadius: {
                xl: "0.875rem",
                "2xl": "1.25rem",
            },
            keyframes: {
                "fade-in-up": {
                    "0%": { opacity: 0, transform: "translateY(20px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
                marquee: {
                    "0%": { transform: "translateX(0)" },
                    "100%": { transform: "translateX(-50%)" },
                },
            },
            animation: {
                "fade-in-up": "fade-in-up 0.6s ease-out forwards",
                marquee: "marquee 40s linear infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
