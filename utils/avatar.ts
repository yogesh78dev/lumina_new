// A simple hashing function to get a deterministic color from a string.
// Replaced a generic red with the brand's primary color for better theming.
const colors = [
  '#c4161c', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Extracts initials from a name string.
const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/**
 * Generates a data URI for an SVG avatar.
 * @param name The user's full name.
 * @returns A base64 encoded SVG data URI.
 */
export const generateAvatar = (name: string): string => {
    if (!name || !name.trim()) return '';

    const initials = getInitials(name);
    const bgColor = stringToColor(name);

    // Using btoa() to encode the SVG string to base64
    const svg = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="${bgColor}" />
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="40" font-family="Poppins, sans-serif" font-weight="600">${initials}</text>
        </svg>
    `;

    // In modern browsers, you can use btoa() for base64 encoding.
    // Make sure the environment supports it, which browsers do.
    const base64Svg = btoa(svg);

    return `data:image/svg+xml;base64,${base64Svg}`;
};