
export enum ShipmentStatus {
  PLACED = "PLACED",
  PICKUP_ASSIGNED = "PICKUP_ASSIGNED",
  PICKED = "PICKED",
  HUB1_ARRIVAL = "HUB1_ARRIVAL",
  IN_TRANSIT = "IN_TRANSIT",
  HUB2_ARRIVAL = "HUB2_ARRIVAL",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  EXCEPTION = "EXCEPTION",
  DELAYED = "DELAYED"
}

export interface ShipmentEvent {
  status: ShipmentStatus;
  timestamp: string;
  description: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Shipment {
  id: string;
  trackingId: string;
  customerId: string;
  riderId?: string;
  recipientName: string;
  pickupAddress: any; // JSONB
  dropoffAddress: any; // JSONB
  weight: number;
  description?: string;
  serviceType: 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
  currentStatus: ShipmentStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  price: number;
  distanceMiles?: number;
  estimatedDelivery: string;
  events: ShipmentEvent[];
  createdAt: string;
  updatedAt: string;
  destination?: string;
}

export interface DashboardStats {
  totalShipments: number;
  active: number;
  delivered: number;
  delayed: number;
}

export type ViewState = 'DASHBOARD' | 'ACCOUNT_DASHBOARD' | 'FLEET_DASHBOARD' | 'VEHICLE_DASHBOARD' | 'TRACKING' | 'NEW_SHIPMENT' | 'AI_ASSISTANT' | 'RIDER' | 'HUB_MANAGER' | 'PROFILE' | 'MY_ORDERS' | 'PAYMENT_DEMO';

// Rider Module Types
export type RiderTaskType = 'PICKUP' | 'DELIVERY';
export type RiderTaskStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface RiderTask {
  id: string;
  type: RiderTaskType;
  status: RiderTaskStatus;
  address: string;
  customerName: string;
  timeSlot: string;
  packageDetails: string;
  earnings: number;
  distance: string;
  shipmentId?: string; // Link to shipment for package tracking
  startCoordinates?: { lat: number; lng: number };
  endCoordinates?: { lat: number; lng: number };
}

export interface RiderEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  completedTrips: number;
}

// Admin Panel Types
export type UserRole = 'CUSTOMER' | 'RIDER' | 'ADMIN' | 'HUB_MANAGER' | 'HUB_STAFF' | 'FINANCE' | 'SUPPORT';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  phone: string;
  avatarUrl?: string;
}

export interface PricingConfig {
  baseRate: number;
  perKm: number;
  perKg: number;
  serviceMultipliers: {
    standard: number;
    express: number;
    sameDay: number;
  };
  peakHourSurcharge: number;
}

// Fleet Management Types
export interface Vehicle {
  id: string;
  type: 'TRUCK' | 'VAN' | 'BIKE';
  plateNumber: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentDriverId?: string;
  capacity: string;
  lastMaintenance: string;
}

// Hub Module Types
export type HubType = 'CENTRAL' | 'REGIONAL' | 'LOCAL';

export interface Hub {
  id: string;
  code: string;
  name: string;
  type: HubType;
  manager: string;
  capacity: number;
  currentLoad: number;
}

export interface StorageRack {
  id: string;
  zone: string; // A, B, C
  type: 'GENERAL' | 'FRAGILE' | 'HEAVY' | 'SECURE';
  capacity: number;
  occupied: number;
}

export interface HubManifest {
  id: string;
  destinationHub: string;
  driverId: string;
  packageCount: number;
  status: 'PREPARING' | 'DISPATCHED' | 'RECEIVED';
  generatedAt: string;
}

export type PaymentMethod = 'CREDIT_CARD' | 'WALLET' | 'COD';

export const PAYMENT_METHODS = {
  CREDIT_CARD: 'CREDIT_CARD' as PaymentMethod,
  WALLET: 'WALLET' as PaymentMethod,
  COD: 'COD' as PaymentMethod,
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING' as const,
  PAID: 'PAID' as const,
  FAILED: 'FAILED' as const,
} as const;

// Fleet Management Enhancement Types
export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  inMaintenance: number;
  totalDistance: number; // km traveled today
  fuelEfficiency: number; // avg km/L
}

export interface PackageAssignment {
  id: string;
  shipmentId: string;
  riderId: string;
  vehicleId: string;
  assignedAt: string;
  status: 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';
  estimatedDelivery: string;
  actualDelivery?: string;
}

export interface VehicleAssignment {
  vehicleId: string;
  riderId: string;
  assignedAt: string;
  status: 'ACTIVE' | 'COMPLETED';
}
