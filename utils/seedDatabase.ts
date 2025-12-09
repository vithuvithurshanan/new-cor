import { firebaseService } from '../services/firebaseService';
import { ShipmentStatus, UserRole } from '../types';

// Sample data to seed the database
export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Add sample users
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'CUSTOMER' as UserRole,
        status: 'ACTIVE' as const,
        phone: '+1234567890'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'RIDER' as UserRole,
        status: 'ACTIVE' as const,
        phone: '+1234567891'
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN' as UserRole,
        status: 'ACTIVE' as const,
        phone: '+1234567892'
      }
    ];

    const userIds = [];
    for (const user of users) {
      const userId = await firebaseService.addUser(user);
      userIds.push(userId);
      console.log(`Added user: ${user.name} with ID: ${userId}`);
    }

    // Add sample vehicles
    const vehicles = [
      {
        type: 'VAN' as const,
        plateNumber: 'ABC-123',
        status: 'AVAILABLE' as const,
        capacity: '500kg',
        lastMaintenance: '2024-01-15'
      },
      {
        type: 'TRUCK' as const,
        plateNumber: 'XYZ-789',
        status: 'IN_USE' as const,
        capacity: '2000kg',
        lastMaintenance: '2024-01-10',
        currentDriverId: userIds[1] // Jane Smith (rider)
      },
      {
        type: 'BIKE' as const,
        plateNumber: 'BIKE-001',
        status: 'AVAILABLE' as const,
        capacity: '50kg',
        lastMaintenance: '2024-01-20'
      }
    ];

    const vehicleIds = [];
    for (const vehicle of vehicles) {
      const vehicleId = await firebaseService.addVehicle(vehicle);
      vehicleIds.push(vehicleId);
      console.log(`Added vehicle: ${vehicle.plateNumber} with ID: ${vehicleId}`);
    }

    // Add sample hubs
    const hubs = [
      {
        code: 'HUB-001',
        name: 'Central Hub',
        type: 'CENTRAL' as const,
        manager: 'Hub Manager 1',
        capacity: 1000,
        currentLoad: 250
      },
      {
        code: 'HUB-002',
        name: 'North Regional Hub',
        type: 'REGIONAL' as const,
        manager: 'Hub Manager 2',
        capacity: 500,
        currentLoad: 150
      }
    ];

    const hubIds = [];
    for (const hub of hubs) {
      const hubId = await firebaseService.addHub(hub);
      hubIds.push(hubId);
      console.log(`Added hub: ${hub.name} with ID: ${hubId}`);
    }

    // Add sample shipments
    const shipments = [
      {
        trackingId: 'TRK001',
        customerId: userIds[0], // John Doe
        riderId: userIds[1], // Jane Smith
        recipientName: 'Alice Johnson',
        pickupAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        dropoffAddress: {
          street: '456 Oak Ave',
          city: 'Brooklyn',
          state: 'NY',
          zipCode: '11201',
          coordinates: { lat: 40.6892, lng: -73.9442 }
        },
        weight: 2.5,
        description: 'Electronics package',
        serviceType: 'STANDARD' as const,
        currentStatus: ShipmentStatus.IN_TRANSIT,
        paymentMethod: 'CREDIT_CARD' as const,
        paymentStatus: 'PAID' as const,
        price: 25.99,
        distanceMiles: 8.5,
        estimatedDelivery: '2024-12-09T15:00:00Z',
        events: [
          {
            status: ShipmentStatus.PLACED,
            timestamp: '2024-12-08T10:00:00Z',
            description: 'Order placed',
            location: 'New York, NY'
          },
          {
            status: ShipmentStatus.PICKED,
            timestamp: '2024-12-08T14:00:00Z',
            description: 'Package picked up',
            location: '123 Main St, New York, NY'
          },
          {
            status: ShipmentStatus.IN_TRANSIT,
            timestamp: '2024-12-08T16:00:00Z',
            description: 'Package in transit',
            location: 'Distribution Center'
          }
        ]
      },
      {
        trackingId: 'TRK002',
        customerId: userIds[0], // John Doe
        recipientName: 'Bob Wilson',
        pickupAddress: {
          street: '789 Pine St',
          city: 'Manhattan',
          state: 'NY',
          zipCode: '10002',
          coordinates: { lat: 40.7589, lng: -73.9851 }
        },
        dropoffAddress: {
          street: '321 Elm St',
          city: 'Queens',
          state: 'NY',
          zipCode: '11375',
          coordinates: { lat: 40.7282, lng: -73.7949 }
        },
        weight: 1.2,
        description: 'Documents',
        serviceType: 'EXPRESS' as const,
        currentStatus: ShipmentStatus.PLACED,
        paymentMethod: 'WALLET' as const,
        paymentStatus: 'PENDING' as const,
        price: 15.50,
        distanceMiles: 12.3,
        estimatedDelivery: '2024-12-09T12:00:00Z',
        events: [
          {
            status: ShipmentStatus.PLACED,
            timestamp: '2024-12-08T11:30:00Z',
            description: 'Order placed',
            location: 'Manhattan, NY'
          }
        ]
      }
    ];

    const shipmentIds = [];
    for (const shipment of shipments) {
      const shipmentId = await firebaseService.addShipment(shipment);
      shipmentIds.push(shipmentId);
      console.log(`Added shipment: ${shipment.trackingId} with ID: ${shipmentId}`);
    }

    // Add sample rider tasks
    const riderTasks = [
      {
        type: 'PICKUP' as const,
        status: 'ACCEPTED' as const,
        address: '123 Main St, New York, NY',
        customerName: 'John Doe',
        timeSlot: '2:00 PM - 4:00 PM',
        packageDetails: 'Electronics package - 2.5kg',
        earnings: 12.50,
        distance: '3.2 km',
        shipmentId: shipmentIds[0]
      },
      {
        type: 'DELIVERY' as const,
        status: 'IN_PROGRESS' as const,
        address: '456 Oak Ave, Brooklyn, NY',
        customerName: 'Alice Johnson',
        timeSlot: '3:00 PM - 5:00 PM',
        packageDetails: 'Electronics package - 2.5kg',
        earnings: 15.75,
        distance: '5.8 km',
        shipmentId: shipmentIds[0]
      }
    ];

    for (const task of riderTasks) {
      const taskId = await firebaseService.addRiderTask(task);
      console.log(`Added rider task: ${task.type} with ID: ${taskId}`);
    }

    console.log('Database seeding completed successfully!');
    return {
      userIds,
      vehicleIds,
      hubIds,
      shipmentIds
    };

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Individual functions to add specific types of data
export const addSampleShipment = async (customerId: string) => {
  const shipment = {
    trackingId: `TRK${Date.now()}`,
    customerId,
    recipientName: 'Sample Recipient',
    pickupAddress: {
      street: '100 Sample St',
      city: 'Sample City',
      state: 'NY',
      zipCode: '10001',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    dropoffAddress: {
      street: '200 Delivery Ave',
      city: 'Delivery City',
      state: 'NY',
      zipCode: '10002',
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    weight: 1.5,
    description: 'Sample package',
    serviceType: 'STANDARD' as const,
    currentStatus: ShipmentStatus.PLACED,
    paymentMethod: 'CREDIT_CARD' as const,
    paymentStatus: 'PAID' as const,
    price: 19.99,
    distanceMiles: 5.2,
    estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    events: [
      {
        status: ShipmentStatus.PLACED,
        timestamp: new Date().toISOString(),
        description: 'Order placed',
        location: 'Sample City, NY'
      }
    ]
  };

  return await firebaseService.addShipment(shipment);
};

export const addSampleUser = async (name: string, email: string, role: UserRole = 'CUSTOMER') => {
  const user = {
    name,
    email,
    role,
    status: 'ACTIVE' as const,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
  };

  return await firebaseService.addUser(user);
};