const PHONE_VALIDATION_MESSAGE = 'Enter a valid phone number using 7 to 15 digits. You may use a leading + and separators like spaces, hyphens, or brackets.';

const normalizePhoneNumber = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';

    let expanded = raw;
    if (/^\d+(\.\d+)?e\+\d+$/i.test(expanded)) {
        expanded = Number(expanded).toLocaleString('fullwide', { useGrouping: false });
    }

    const hasLeadingPlus = expanded.startsWith('+');
    const digits = expanded.replace(/\D/g, '');
    return hasLeadingPlus ? `+${digits}` : digits;
};

const isValidPhoneNumber = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return false;

    const normalized = normalizePhoneNumber(raw);
    if (!normalized) return false;
    if (!/^\+?\d+$/.test(normalized)) return false;

    // Do not accept scientific notation here. Once Excel has rounded it, the
    // original phone digits cannot be recovered safely.
    const isAllowedRawFormat = /^\+?[\d\s().-]+$/.test(raw);
    if (!isAllowedRawFormat) return false;

    const digits = normalized.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return false;
    if (/^(\d)\1+$/.test(digits)) return false;

    return true;
};

module.exports = {
    PHONE_VALIDATION_MESSAGE,
    normalizePhoneNumber,
    isValidPhoneNumber
};
