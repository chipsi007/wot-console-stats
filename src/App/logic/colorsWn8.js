// Pick color for WN8.


// Scale and the corresponding colors are taken from 'http://wiki.wnefficiency.net/pages/Color_Scale'.
const COLORS = [
  {start: -999, end: 300,   h: 0,   s: 0,  l: 0},
  {start: 300,  end: 600,   h: 0,   s: 61, l: 50},
  {start: 600,  end: 900,   h: 34,  s: 34, l: 42},
  {start: 900,  end: 1250,  h: 51,  s: 51, l: 42},
  {start: 1250, end: 1600,  h: 81,  s: 64, l: 36},
  {start: 1600, end: 1900,  h: 95,  s: 44, l: 32},
  {start: 1900, end: 2350,  h: 200, s: 43, l: 50},
  {start: 2350, end: 2900,  h: 278, s: 29, l: 48},
  {start: 2900, end: 99999, h: 276, s: 41, l: 33}
];


export default function getWn8Color(nScore, saturationMultiplier, luminosityMultiplier) {
  for (let color of COLORS) {
    if (nScore < color.end) {
      const S = Math.min(color.s * saturationMultiplier, 100);
      const L = Math.min(color.l * luminosityMultiplier, 100);
      return `hsl(${color.h}, ${S}%, ${L}%)`;
    }
  }
  return 'hsl(276, 41%, 33%)';
}