import { Shipment, ShipmentStatus, RiderTask, User, Hub, Vehicle, DashboardStats, FleetStats, PackageAssignment, VehicleAssignment, UserRole } from '../types';

const API_URL = 'http://localhost:3001/api';

class ApiService {
    private token: string | null = null;

    setToken(token: string) {
        this.token = token;
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    }

    // Auth
    async sendOtp(email: string): Promise<void> {
        await this.fetch('/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async verifyOtp(email: string, token: string): Promise<{ user: User; session: any }> {
        const data = await this.fetch<{ user: User; session: any }>('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, token }),
        });
        if (data.session && data.session.access_token) {
            this.setToken(data.session.access_token);
        }
        return data;
    }

    async logout(): Promise<void> {
        try {
            await this.fetch('/auth/logout', { method: 'POST' });
        } finally {
            this.setToken(null);
        }
    }

    // Shipments
    async getShipments(): Promise<Shipment[]> {
        const data = await this.fetch<{ shipments: Shipment[] }>('/shipments');
        return data.shipments;
    }

    async getShipmentById(id: string): Promise<Shipment | undefined> {
        try {
            const data = await this.fetch<{ shipment: Shipment }>(`/shipments/${id}`);
            return data.shipment;
        } catch (error) {
            return undefined;
        }
    }

    async createShipment(shipment: Omit<Shipment, 'id' | 'events' | 'currentStatus' | 'trackingId' | 'createdAt' | 'updatedAt' | 'customerId'>): Promise<Shipment> {
        const payload = {
            recipient_name: shipment.recipientName,
            pickup_address: shipment.pickupAddress,
            dropoff_address: shipment.dropoffAddress,
            weight: shipment.weight,
            description: shipment.description,
            service_type: shipment.serviceType,
            payment_method: shipment.paymentMethod,
            payment_status: shipment.paymentStatus,
            price: shipment.price,
            distance_miles: shipment.distanceMiles,
            estimated_delivery: shipment.estimatedDelivery
        };

        const data = await this.fetch<{ shipment: Shipment }>('/shipments', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return data.shipment;
    }

    async updateShipmentStatus(id: string, status: ShipmentStatus, location?: string): Promise<void> {
        await this.fetch(`/shipments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, location }),
        });
    }

    // Dashboard Stats
    async getDashboardStats(): Promise<DashboardStats> {
        // Calculate stats from shipments for now
        const shipments = await this.getShipments();
        const active = shipments.filter(s => s.currentStatus !== ShipmentStatus.DELIVERED && s.currentStatus !== ShipmentStatus.EXCEPTION).length;
        const delivered = shipments.filter(s => s.currentStatus === ShipmentStatus.DELIVERED).length;
        const delayed = shipments.filter(s => s.currentStatus === ShipmentStatus.EXCEPTION).length; // Mapping Exception to Delayed for stats

        return {
            totalShipments: shipments.length,
            active,
            delivered,
            delayed
        };
    }

    // Rider Tasks
    async getRiderTasks(): Promise<RiderTask[]> {
        // TODO: Implement backend endpoint
        return [];
    }

    async updateTaskStatus(taskId: string, status: RiderTask['status']): Promise<void> {
        // TODO: Implement backend endpoint
    }

    // Hubs
    async getHubs(): Promise<Hub[]> {
        // TODO: Implement backend endpoint
        return [];
    }

    // Users
    async getUsers(): Promise<User[]> {
        const data = await this.fetch<{ users: User[] }>('/users');
        return data.users;
    }

    async updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
        await this.fetch(`/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // Vehicles
    async getVehicles(): Promise<Vehicle[]> {
        // TODO: Implement backend endpoint
        return [];
    }

    // Fleet Management
    async getFleetStats(): Promise<FleetStats> {
        return {
            totalVehicles: 0,
            activeVehicles: 0,
            availableVehicles: 0,
            inMaintenance: 0,
            totalDistance: 0,
            fuelEfficiency: 0
        };
    }

    async getPackageAssignments(riderId?: string): Promise<PackageAssignment[]> {
        return [];
    }

    async assignPackageToRider(shipmentId: string, riderId: string, vehicleId: string): Promise<PackageAssignment> {
        throw new Error('Not implemented');
    }

    async assignVehicleToRider(vehicleId: string, riderId: string): Promise<void> {
        throw new Error('Not implemented');
    }

    async updateVehicleStatus(vehicleId: string, status: Vehicle['status']): Promise<void> {
        throw new Error('Not implemented');
    }

    async addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
        throw new Error('Not implemented');
    }
}

export const apiService = new ApiService();
