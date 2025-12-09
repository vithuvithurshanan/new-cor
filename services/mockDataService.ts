import { Shipment, ShipmentStatus, RiderTask, User, Hub, Vehicle, DashboardStats, FleetStats, PackageAssignment, VehicleAssignment, PAYMENT_METHODS, PAYMENT_STATUS } from '../types';
import { apiService } from './apiService';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

// Mock Data Store
class MockDataService {
  private shipments: Shipment[] = [
    {
      id: 'TRK-885210',
      trackingId: 'TRK-885210',
      customerId: 'U1',
      recipientName: 'Sarah Jenkins',
      destination: '123 Maple Ave, Springfield',
      pickupAddress: { street: '123 Origin St', city: 'Origin City', state: 'NY', zipCode: '10001' },
      dropoffAddress: { street: '123 Maple Ave', city: 'Springfield', state: 'IL', zipCode: '62704' },
      weight: 5.5,
      serviceType: 'STANDARD',
  paymentMethod: PAYMENT_METHODS.CREDIT_CARD,
  paymentStatus: PAYMENT_STATUS.PAID as typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS],
      price: 25.00,
      createdAt: '2023-10-23T09:00:00Z',
      updatedAt: '2023-10-24T08:00:00Z',
      currentStatus: ShipmentStatus.IN_TRANSIT,
      estimatedDelivery: '2023-10-25',
      events: [
        { status: ShipmentStatus.PLACED, timestamp: '2023-10-23 09:00', description: 'Order placed' },
        { status: ShipmentStatus.PICKED, timestamp: '2023-10-23 14:00', description: 'Picked up by rider' },
        { status: ShipmentStatus.IN_TRANSIT, timestamp: '2023-10-24 08:00', description: 'Arrived at regional hub' }
      ]
    },
    {
      id: 'TRK-992100',
      trackingId: 'TRK-992100',
      customerId: 'U1',
      recipientName: 'Tech Solutions Inc',
      destination: '45 Corporate Blvd, Metro City',
      pickupAddress: { street: '456 Tech Park', city: 'Tech City', state: 'CA', zipCode: '94000' },
      dropoffAddress: { street: '45 Corporate Blvd', city: 'Metro City', state: 'NY', zipCode: '10002' },
      weight: 2.0,
      serviceType: 'EXPRESS',
  paymentMethod: PAYMENT_METHODS.WALLET,
  paymentStatus: PAYMENT_STATUS.PAID as typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS],
      price: 45.50,
      createdAt: '2023-10-20T10:00:00Z',
      updatedAt: '2023-10-22T11:30:00Z',
      currentStatus: ShipmentStatus.DELIVERED,
      estimatedDelivery: '2023-10-22',
      events: [
        { status: ShipmentStatus.PLACED, timestamp: '2023-10-20 10:00', description: 'Order placed' },
        { status: ShipmentStatus.DELIVERED, timestamp: '2023-10-22 11:30', description: 'Delivered to reception' }
      ]
    },
    {
      id: 'TRK-774321',
      trackingId: 'TRK-774321',
      customerId: 'U1',
      recipientName: 'John Doe',
      destination: '789 Oak St, Gotham',
      pickupAddress: { street: '789 Bat Cave', city: 'Gotham', state: 'NJ', zipCode: '07001' },
      dropoffAddress: { street: '789 Oak St', city: 'Gotham', state: 'NJ', zipCode: '07002' },
      weight: 10.0,
      serviceType: 'SAME_DAY',
  paymentMethod: PAYMENT_METHODS.COD,
  paymentStatus: PAYMENT_STATUS.PENDING as typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS],
      price: 15.00,
      createdAt: '2023-10-21T09:00:00Z',
      updatedAt: '2023-10-23T16:00:00Z',
      currentStatus: ShipmentStatus.EXCEPTION,
      estimatedDelivery: '2023-10-24',
      events: [
        { status: ShipmentStatus.PLACED, timestamp: '2023-10-21 09:00', description: 'Order placed' },
        { status: ShipmentStatus.EXCEPTION, timestamp: '2023-10-23 16:00', description: 'Delivery attempted - recipient not home' }
      ]
    }
  ];

  private riderTasks: RiderTask[] = [
    {
      id: 'TSK-101',
      type: 'PICKUP',
      status: 'PENDING',
      address: '55 Elm St, Downtown',
      customerName: 'Alice Cooper',
      timeSlot: '10:00 AM - 12:00 PM',
      packageDetails: 'Small Box (2kg)',
      earnings: 15.50,
      distance: '2.5 km',
      startCoordinates: { lat: 40.7128, lng: -74.0060 }, // NYC City Hall
      endCoordinates: { lat: 40.7061, lng: -74.0092 }  // Wall St
    },
    {
      id: 'TSK-102',
      type: 'DELIVERY',
      status: 'ACCEPTED',
      address: '123 Maple Ave, Springfield',
      customerName: 'Sarah Jenkins',
      timeSlot: '01:00 PM - 03:00 PM',
      packageDetails: 'Medium Box (5kg)',
      earnings: 22.00,
      distance: '5.1 km',
      startCoordinates: { lat: 40.7061, lng: -74.0092 }, // Wall St
      endCoordinates: { lat: 40.6782, lng: -73.9442 }  // Brooklyn
    }
  ];

  private hubs: Hub[] = [
    {
      id: 'HUB-001',
      code: 'NYC-CEN',
      name: 'New York Central',
      type: 'CENTRAL',
      manager: 'Hubert Manager',
      capacity: 10000,
      currentLoad: 7500
    },
    {
      id: 'HUB-002',
      code: 'BOS-REG',
      name: 'Boston Regional',
      type: 'REGIONAL',
      manager: 'Sarah Connor',
      capacity: 5000,
      currentLoad: 2100
    }
  ];

  // Fleet Management Data
  private packageAssignments: PackageAssignment[] = [
    {
      id: 'PA-001',
      shipmentId: 'TRK-885210',
      riderId: 'U2',
      vehicleId: 'V1',
      assignedAt: '2023-10-23 14:00',
      status: 'IN_TRANSIT',
      estimatedDelivery: '2023-10-25'
    },
    {
      id: 'PA-002',
      shipmentId: 'TRK-774321',
      riderId: 'U2',
      vehicleId: 'V1',
      assignedAt: '2023-10-21 09:00',
      status: 'ASSIGNED',
      estimatedDelivery: '2023-10-24'
    }
  ];

  private vehicleAssignments: VehicleAssignment[] = [
    {
      vehicleId: 'V1',
      riderId: 'U2',
      assignedAt: '2023-10-23 08:00',
      status: 'ACTIVE'
    }
  ];

  // Methods

  // Shipments
  getShipments(): Promise<Shipment[]> {
    return Promise.resolve([...this.shipments]);
  }

  getShipmentById(id: string): Promise<Shipment | undefined> {
    return Promise.resolve(this.shipments.find(s => s.id === id));
  }

  createShipment(shipment: Omit<Shipment, 'id' | 'events' | 'currentStatus' | 'trackingId' | 'createdAt' | 'updatedAt' | 'customerId'>): Promise<Shipment> {
    const id = `TRK-${Math.floor(Math.random() * 1000000)}`;
    const newShipment: Shipment = {
      ...shipment,
      id,
      trackingId: id,
      customerId: 'U1', // Default to first user for mock
      currentStatus: ShipmentStatus.PLACED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      events: [
        {
          status: ShipmentStatus.PLACED,
          timestamp: new Date().toLocaleString(),
          description: 'Order placed successfully'
        }
      ]
    };
    this.shipments.unshift(newShipment);
    return Promise.resolve(newShipment);
  }

  updateShipmentStatus(id: string, status: ShipmentStatus, location?: string): Promise<void> {
    const shipment = this.shipments.find(s => s.id === id);
    if (shipment) {
      shipment.currentStatus = status;
      shipment.events.push({
        status,
        timestamp: new Date().toLocaleString(),
        description: `Status updated to ${status}`,
        location: location || 'In Transit'
      });

      // Automatically create a Rider Task when Pickup is Assigned
      if (status === ShipmentStatus.PICKUP_ASSIGNED) {
        const newTask: RiderTask = {
          id: `TSK-${Math.floor(Math.random() * 10000)}`,
          type: 'PICKUP',
          status: 'PENDING',
          address: (shipment.destination || '').split(',')[0], // Simplified address
          customerName: shipment.recipientName,
          timeSlot: 'ASAP',
          packageDetails: 'Standard Package',
          earnings: 12.50, // Mock earnings
          distance: '3.2 km' // Mock distance
        };
        this.riderTasks.unshift(newTask);
      }
    }
    return Promise.resolve();
  }

  // Dashboard Stats
  getDashboardStats(): Promise<DashboardStats> {
    const active = this.shipments.filter(s => s.currentStatus !== ShipmentStatus.DELIVERED).length;
    const delivered = this.shipments.filter(s => s.currentStatus === ShipmentStatus.DELIVERED).length;
    const delayed = this.shipments.filter(s => s.currentStatus === ShipmentStatus.DELAYED || s.currentStatus === ShipmentStatus.EXCEPTION).length;

    return Promise.resolve({
      totalShipments: this.shipments.length,
      active,
      delivered,
      delayed
    });
  }

  // Rider Tasks
  getRiderTasks(): Promise<RiderTask[]> {
    return Promise.resolve([...this.riderTasks]);
  }

  updateTaskStatus(taskId: string, status: RiderTask['status']): Promise<void> {
    const task = this.riderTasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
    }
    return Promise.resolve();
  }

  // Hubs
  getHubs(): Promise<Hub[]> {
    return Promise.resolve([...this.hubs]);
  }

  // Users
  private users: User[] = [
    { id: 'U1', name: 'Alice Smith', role: 'CUSTOMER', email: 'alice@example.com', phone: '+1234567890', status: 'ACTIVE' },
    { id: 'U2', name: 'Bob Jones', role: 'RIDER', email: 'bob@courieros.com', phone: '+1987654321', status: 'ACTIVE' },
    { id: 'U3', name: 'Charlie Admin', role: 'ADMIN', email: 'admin@courieros.com', phone: '+1122334455', status: 'ACTIVE' },
    { id: 'U4', name: 'Hubert Manager', role: 'HUB_MANAGER', email: 'hub1@courieros.com', phone: '+1555666777', status: 'INACTIVE' },
    { id: 'U5', name: 'Frank Finance', role: 'FINANCE', email: 'billing@courieros.com', phone: '+1555999000', status: 'ACTIVE' },
    { id: 'U6', name: 'Sarah Support', role: 'SUPPORT', email: 'help@courieros.com', phone: '+1888000111', status: 'ACTIVE' },
    { id: 'U7', name: 'Steve Staff', role: 'HUB_STAFF', email: 'staff1@courieros.com', phone: '+1888000222', status: 'ACTIVE' },
  ];

  getUsers(): Promise<User[]> {
    return Promise.resolve([...this.users]);
  }

  // Vehicles
  private vehicles: Vehicle[] = [
    { id: 'V1', type: 'TRUCK', plateNumber: 'XYZ-123', status: 'IN_USE', currentDriverId: 'U2', capacity: '2000kg', lastMaintenance: '2023-10-15' },
    { id: 'V2', type: 'VAN', plateNumber: 'ABC-789', status: 'AVAILABLE', capacity: '800kg', lastMaintenance: '2023-11-01' },
    { id: 'V3', type: 'BIKE', plateNumber: 'BK-55', status: 'MAINTENANCE', capacity: '20kg', lastMaintenance: '2023-12-05' },
  ];

  getVehicles(): Promise<Vehicle[]> {
    return Promise.resolve([...this.vehicles]);
  }

  // Fleet Management Methods
  getFleetStats(): Promise<FleetStats> {
    const totalVehicles = this.vehicles.length;
    const activeVehicles = this.vehicles.filter(v => v.status === 'IN_USE').length;
    const availableVehicles = this.vehicles.filter(v => v.status === 'AVAILABLE').length;
    const inMaintenance = this.vehicles.filter(v => v.status === 'MAINTENANCE').length;

    return Promise.resolve({
      totalVehicles,
      activeVehicles,
      availableVehicles,
      inMaintenance,
      totalDistance: 342.5, // Mock data
      fuelEfficiency: 12.8 // Mock data
    });
  }

  getPackageAssignments(riderId?: string): Promise<PackageAssignment[]> {
    if (riderId) {
      return Promise.resolve(this.packageAssignments.filter(pa => pa.riderId === riderId));
    }
    return Promise.resolve([...this.packageAssignments]);
  }

  assignPackageToRider(shipmentId: string, riderId: string, vehicleId: string): Promise<PackageAssignment> {
    const newAssignment: PackageAssignment = {
      id: `PA-${Math.floor(Math.random() * 10000)}`,
      shipmentId,
      riderId,
      vehicleId,
      assignedAt: new Date().toLocaleString(),
      status: 'ASSIGNED',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
    this.packageAssignments.push(newAssignment);
    return Promise.resolve(newAssignment);
  }

  assignVehicleToRider(vehicleId: string, riderId: string): Promise<void> {
    // Update vehicle status
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = 'IN_USE';
      vehicle.currentDriverId = riderId;
    }

    // Create assignment record
    const newAssignment: VehicleAssignment = {
      vehicleId,
      riderId,
      assignedAt: new Date().toLocaleString(),
      status: 'ACTIVE'
    };
    this.vehicleAssignments.push(newAssignment);
    return Promise.resolve();
  }

  updateVehicleStatus(vehicleId: string, status: Vehicle['status']): Promise<void> {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = status;
      if (status === 'AVAILABLE') {
        vehicle.currentDriverId = undefined;
      }
    }
    return Promise.resolve();
  }

  addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `V${this.vehicles.length + 1}`
    };
    this.vehicles.push(newVehicle);
    return Promise.resolve(newVehicle);
  }
}

export const mockDataService = USE_BACKEND ? (apiService as any) : new MockDataService();
