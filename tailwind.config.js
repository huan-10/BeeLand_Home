/** @type {import('tailwindcss').Config} */
const tokens = require('./theme/tokens.json');

const px = (value) => `${value}px`;
const toPx = (obj) => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, px(value)]));

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Thay toàn bộ thang spacing mặc định bằng token: gap-md, p-lg, mb-sm...
    spacing: toPx(tokens.spacing),
    extend: {
      colors: tokens.colors,
      borderRadius: toPx(tokens.radius),
      fontSize: Object.fromEntries(
        Object.entries(tokens.fontSize).map(([key, [size, lineHeight]]) => [
          key,
          [px(size), { lineHeight: px(lineHeight) }],
        ]),
      ),
      fontFamily: {
        sans: [tokens.fontFamily.regular],
        medium: [tokens.fontFamily.medium],
        semibold: [tokens.fontFamily.semibold],
        bold: [tokens.fontFamily.bold],
      },
      maxWidth: {
        content: px(tokens.layout.contentMaxWidth),
        form: px(tokens.layout.formMaxWidth),
        readable: px(tokens.layout.readableMaxWidth),
      },
      width: {
        sidebar: px(tokens.layout.sidebarWidth),
      },
    },
  },
  plugins: [],
};
