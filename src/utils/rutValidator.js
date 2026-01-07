// src/utils/rutValidator.js

/**
 * Validates a Chilean RUT (Rol Único Tributario).
 * @param {string} rut - The RUT string to validate (e.g., "12.345.678-9" or "123456789").
 * @returns {boolean} - True if the RUT is valid, false otherwise.
 */
export const validateRut = (rut) => {
    if (!rut || typeof rut !== 'string') return false;

    // Remove dots and hyphens, and convert to uppercase
    let cleanRut = rut.replace(/[.-]/g, '').toUpperCase();

    // Basic length and format check
    if (cleanRut.length < 8 || cleanRut.length > 9) return false;

    const dv = cleanRut.slice(-1);
    const cuerpo = cleanRut.slice(0, -1);

    // Body must be numeric
    if (!/^\d+$/.test(cuerpo)) return false;

    return calculateDV(cuerpo) === dv;
};

/**
 * Calculates the verification digit (DV) for a given RUT body.
 * @param {string} cuerpo - The numeric part of the RUT.
 * @returns {string} - The calculated verification digit.
 */
const calculateDV = (cuerpo) => {
    let suma = 0;
    let multiplo = 2;

    // Iterate from right to left
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplo;
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const res = 11 - (suma % 11);
    if (res === 11) return '0';
    if (res === 10) return 'K';
    return res.toString();
};

/**
 * Formats a RUT string to include dots and hyphen.
 * @param {string} rut - The RUT string to format.
 * @returns {string} - The formatted RUT.
 */
export const formatRut = (rut) => {
    if (!rut) return '';
    let value = rut.replace(/[.-]/g, '').toUpperCase();
    if (value.length <= 1) return value;

    let dv = value.slice(-1);
    let cuerpo = value.slice(0, -1);

    return cuerpo.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + '-' + dv;
};
