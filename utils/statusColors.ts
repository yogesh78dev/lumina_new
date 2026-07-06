export const isHexColor = (color?: string) => /^#([0-9A-F]{3}){1,2}$/i.test(String(color || '').trim());

export const normalizeStatusColor = (color?: string, fallback = '#2563eb') => {
  const value = String(color || '').trim();
  return isHexColor(value) ? value : fallback;
};

export const hexToRgba = (color?: string, alpha = 1) => {
  const hex = normalizeStatusColor(color).replace('#', '');
  const fullHex = hex.length === 3
    ? hex.split('').map(char => char + char).join('')
    : hex;

  const intValue = parseInt(fullHex, 16);
  const red = (intValue >> 16) & 255;
  const green = (intValue >> 8) & 255;
  const blue = intValue & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const getStatusVisual = (color?: string) => {
  const base = normalizeStatusColor(color);
  return {
    color: base,
    borderColor: hexToRgba(base, 0.32),
    backgroundColor: hexToRgba(base, 0.09),
    strongBackgroundColor: hexToRgba(base, 0.16),
    shadowColor: hexToRgba(base, 0.18)
  };
};
