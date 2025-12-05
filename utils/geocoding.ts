// Geocoding Service using OpenStreetMap Nominatim API

import { Address, formatAddress } from './addressValidation';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface GeocodingResult {
    success: boolean;
    coordinates?: Coordinates;
    error?: string;
    displayName?: string;
}

// In-memory cache to reduce API calls
const geocodeCache = new Map<string, GeocodingResult>();

// Rate limiting - Nominatim requires 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

/**
 * Wait to respect rate limiting
 */
async function waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
}

/**
 * Geocode a structured US address to coordinates using Nominatim API
 */
export async function geocodeAddress(address: Address): Promise<GeocodingResult> {
    // Create cache key
    const addressString = formatAddress(address);
    const cacheKey = addressString.toLowerCase();

    // Check cache first
    if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey)!;
    }

    try {
        // Wait for rate limit
        await waitForRateLimit();

        // Build query parameters
        const params = new URLSearchParams({
            street: address.street,
            city: address.city,
            state: address.state,
            postalcode: address.zipCode,
            country: 'United States',
            format: 'json',
            limit: '1',
            addressdetails: '1'
        });

        const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CourierOS-App/1.0' // Nominatim requires a user agent
            }
        });

        if (!response.ok) {
            const result: GeocodingResult = {
                success: false,
                error: `Geocoding API error: ${response.status}`
            };
            geocodeCache.set(cacheKey, result);
            return result;
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            const result: GeocodingResult = {
                success: false,
                error: 'Address not found. Please verify the address is correct.'
            };
            geocodeCache.set(cacheKey, result);
            return result;
        }

        const location = data[0];
        const result: GeocodingResult = {
            success: true,
            coordinates: {
                latitude: parseFloat(location.lat),
                longitude: parseFloat(location.lon)
            },
            displayName: location.display_name
        };

        // Cache the result
        geocodeCache.set(cacheKey, result);

        return result;
    } catch (error) {
        const result: GeocodingResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to geocode address'
        };
        // Don't cache errors (might be temporary network issues)
        return result;
    }
}

/**
 * Geocode multiple addresses in sequence (respecting rate limits)
 */
export async function geocodeMultipleAddresses(
    addresses: Address[]
): Promise<GeocodingResult[]> {
    const results: GeocodingResult[] = [];

    for (const address of addresses) {
        const result = await geocodeAddress(address);
        results.push(result);
    }

    return results;
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache(): void {
    geocodeCache.clear();
}

/**
 * Get cache size
 */
export function getGeocacheCacheSize(): number {
    return geocodeCache.size;
}
