module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'queens-red': '#a6192e',
        'queens-blue': '#00205b',
        'queens-gold': '#ffd100',
        // Solar & Sustainability Theme Colors
        'solar-green': '#166534',      // Deep forest green
        'solar-dark-green': '#14532d',  // Darker forest green for depth
        'solar-light-green': '#4ade80', // Muted light green for accents
        'solar-yellow': '#fbbf24',      // Solar panel yellow/gold
        'solar-orange': '#f97316',      // Sunset/solar warmth
        'earth-green': '#15803d',       // Earthy green
        'sustainability': '#166534',    // Sustainability green
      },
    },
  },
  plugins: [],
}

