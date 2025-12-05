// US Address Validation Utility

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
}

// All 50 US States with abbreviations
export const US_STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
];

const STATE_CODES = US_STATES.map(s => s.code);

// Common dummy/fake address patterns
const DUMMY_PATTERNS = [
    /test/i,
    /fake/i,
    /dummy/i,
    /example/i,
    /asdf/i,
    /qwerty/i,
    /abc\s*(street|st|avenue|ave|road|rd)/i,
    /123\s*(test|fake|dummy)/i,
    /^(a+|b+|c+|x+|y+|z+)$/i, // repeated single characters
];

/**
 * Validate street address
 * Must contain at least one number, minimum length, and not match dummy patterns
 */
export function validateStreet(street: string): string | null {
    const trimmed = street.trim();

    if (!trimmed) {
        return 'Street address is required';
    }

    if (trimmed.length < 5) {
        return 'Street address is too short';
    }

    // Must contain at least one number
    if (!/\d/.test(trimmed)) {
        return 'Street address must include a number';
    }

    // Check for dummy patterns
    for (const pattern of DUMMY_PATTERNS) {
        if (pattern.test(trimmed)) {
            return 'Please enter a valid street address';
        }
    }

    return null;
}

/**
 * Validate city name
 * Must be alphabetic (with spaces and hyphens allowed), no numbers
 */
export function validateCity(city: string): string | null {
    const trimmed = city.trim();

    if (!trimmed) {
        return 'City is required';
    }

    if (trimmed.length < 2) {
        return 'City name is too short';
    }

    // Only letters, spaces, hyphens, and apostrophes allowed
    if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
        return 'City name can only contain letters, spaces, and hyphens';
    }

    // Check for dummy patterns
    for (const pattern of DUMMY_PATTERNS) {
        if (pattern.test(trimmed)) {
            return 'Please enter a valid city name';
        }
    }

    return null;
}

/**
 * Validate US state code
 */
export function validateState(state: string): string | null {
    if (!state) {
        return 'State is required';
    }

    if (!STATE_CODES.includes(state.toUpperCase())) {
        return 'Please select a valid US state';
    }

    return null;
}

/**
 * Validate ZIP code
 * Supports both 5-digit (12345) and 5+4 format (12345-6789)
 */
export function validateZipCode(zipCode: string): string | null {
    const trimmed = zipCode.trim();

    if (!trimmed) {
        return 'ZIP code is required';
    }

    // 5-digit format: 12345
    const fiveDigitPattern = /^\d{5}$/;
    // 5+4 format: 12345-6789
    const ninedigitPattern = /^\d{5}-\d{4}$/;

    if (!fiveDigitPattern.test(trimmed) && !ninedigitPattern.test(trimmed)) {
        return 'ZIP code must be 5 digits (e.g., 12345) or 5+4 format (e.g., 12345-6789)';
    }

    return null;
}

/**
 * Validate complete address
 */
export function validateAddress(address: Address): ValidationResult {
    const errors: ValidationResult['errors'] = {};

    const streetError = validateStreet(address.street);
    if (streetError) errors.street = streetError;

    const cityError = validateCity(address.city);
    if (cityError) errors.city = cityError;

    const stateError = validateState(address.state);
    if (stateError) errors.state = stateError;

    const zipError = validateZipCode(address.zipCode);
    if (zipError) errors.zipCode = zipError;

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Format address as a single string
 */
export function formatAddress(address: Address): string {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
}
