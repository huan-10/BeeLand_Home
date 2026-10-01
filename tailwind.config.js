/** @type {import('tailwindcss').Config} */
const tokens = require('./theme/tokens.json');

const px = (value) => `${value}px`;

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tokens.colors,
      borderRadius: Object.fromEntries(
        Object.entries(tokens.radius).map(([key, value]) => [key, px(value)]),
      ),
      fontSize: Object.fromEntries(
        Object.entries(tokens.fontSize).map(([key, [size, lineHeight]]) => [
          key,
          [px(size), { lineHeight: px(lineHeight) }],
        ]),
      ),
      fontFamily: {
        sans: [tokens.fontFamily.regular],
        // Tên riêng để không trùng với các lớp font-weight của Tailwind.
        'inter-medium': [tokens.fontFamily.medium],
        'inter-semibold': [tokens.fontFamily.semibold],
        'inter-bold': [tokens.fontFamily.bold],
      },
      maxWidth: {
        content: px(tokens.layout.contentMaxWidth),
      },
      width: {
        sidebar: px(tokens.layout.sidebarWidth),
      },
    },
  },
  plugins: [],
};
