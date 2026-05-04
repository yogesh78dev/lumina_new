export const capitalizeName = (name: string): string => {
    if (!name || typeof name !== 'string') return '';
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};