// Distance Calculation Utilities

import { Coordinates } from './geocoding';

export interface RouteDistance {
    totalMiles: number;
    totalKilometers: number;
    segments: {
        companyToPickup: number; // in miles
        pickupToDropoff: number; // in miles
    };
}

// Company headquarters location (default: New York City)
// TODO: Update this with actual company location
export const COMPANY_LOCATION: Coordinates = {
    latitude: 40.7128,
    longitude: -74.0060
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
    coord1: Coordinates,
    coord2: Coordinates
): number {
    const R = 3958.8; // Earth's radius in miles

    const lat1Rad = toRadians(coord1.latitude);
    const lat2Rad = toRadians(coord2.latitude);
    const deltaLat = toRadians(coord2.latitude - coord1.latitude);
    const deltaLon = toRadians(coord2.longitude - coord1.longitude);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Convert miles to kilometers
 */
export function milesToKilometers(miles: number): number {
    return miles * 1.60934;
}

/**
 * Convert kilometers to miles
 */
export function kilometersToMiles(kilometers: number): number {
    return kilometers / 1.60934;
}

/**
 * Calculate total route distance: Company → Pickup → Dropoff
 */
export function calculateRouteDistance(
    pickupCoords: Coordinates,
    dropoffCoords: Coordinates,
    companyCoords: Coordinates = COMPANY_LOCATION
): RouteDistance {
    const companyToPickup = calculateDistance(companyCoords, pickupCoords);
    const pickupToDropoff = calculateDistance(pickupCoords, dropoffCoords);
    const totalMiles = companyToPickup + pickupToDropoff;

    return {
        totalMiles: Math.round(totalMiles * 10) / 10, // Round to 1 decimal
        totalKilometers: Math.round(milesToKilometers(totalMiles) * 10) / 10,
        segments: {
            companyToPickup: Math.round(companyToPickup * 10) / 10,
            pickupToDropoff: Math.round(pickupToDropoff * 10) / 10
        }
    };
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
    if (miles < 1) {
        return `${Math.round(miles * 5280)} ft`; // Convert to feet for short distances
    }
    return `${miles.toFixed(1)} mi`;
}

/**
 * Calculate estimated delivery time based on distance
 * Assumes average speed of 30 mph for local, 60 mph for long distance
 */
export function estimateDeliveryTime(miles: number): string {
    const avgSpeed = miles < 50 ? 30 : 60; // mph
    const hours = miles / avgSpeed;

    if (hours < 1) {
        return `${Math.round(hours * 60)} minutes`;
    } else if (hours < 24) {
        return `${hours.toFixed(1)} hours`;
    } else {
        const days = Math.ceil(hours / 24);
        return `${days} day${days > 1 ? 's' : ''}`;
    }
}
