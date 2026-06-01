export const capitalizeName = (name: string): string => {
    if (!name || typeof name !== 'string') return '';
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const formatDateDDMMYYYY = (value?: string | null): string => {
    if (!value) return '-';
    const raw = String(value).trim();

    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [y, m, d] = raw.split('-');
        return `${d}-${m}-${y}`;
    }
    if (/^\d{4}-\d{2}-\d{2}\s/.test(raw)) {
        const [y, m, d] = raw.slice(0, 10).split('-');
        return `${d}-${m}-${y}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    const dd = String(parsed.getDate()).padStart(2, '0');
    // const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const month = parsed.toLocaleString('en-US', { month: 'short' });
    const yyyy = parsed.getFullYear();
    return `${dd}-${month}-${yyyy}`;
};
