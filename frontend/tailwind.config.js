/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  mode: "jit",
  theme: {
    fontFamily: {
    },
    extend: {
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
        fadeInDown: "fadeInDown 0.5s ease-out",
        slideIn: "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeInDown: {
          "0%": { opacity: 0, transform: "translateY(-20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: 0, transform: "scale(0.9) translateY(-20px)" },
          "100%": { opacity: 1, transform: "scale(1) translateY(0)" },
        },
      },
      backgroundImage: {
      },
      screens: {
        "1000px": "1050px",
        "1100px": "1110px",
        "800px": "800px",
        "1300px": "1300px",
        "400px":"400px"
      },
    },
  },
  plugins: [],
};
