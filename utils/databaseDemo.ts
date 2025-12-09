import { firebaseService } from '../services/firebaseService';
import { seedDatabase, addSampleUser, addSampleShipment } from './seedDatabase';

// Demo functions to show how to interact with Firebase
export const databaseDemo = {
  // Seed the database with sample data
  async seedAll() {
    console.log('🌱 Seeding database with sample data...');
    return await seedDatabase();
  },

  // Add a new user
  async addUser(name: string, email: string) {
    console.log(`👤 Adding user: ${name} (${email})`);
    const userId = await addSampleUser(name, email);
    console.log(`✅ User added with ID: ${userId}`);
    return userId;
  },

  // Add a new shipment
  async addShipment(customerId: string) {
    console.log(`📦 Adding shipment for customer: ${customerId}`);
    const shipmentId = await addSampleShipment(customerId);
    console.log(`✅ Shipment added with ID: ${shipmentId}`);
    return shipmentId;
  },

  // Get all shipments
  async getAllShipments() {
    console.log('📋 Fetching all shipments...');
    const shipments = await firebaseService.getAllShipments();
    console.log(`✅ Found ${shipments.length} shipments`);
    return shipments;
  },

  // Get all users
  async getAllUsers() {
    console.log('👥 Fetching all users...');
    const users = await firebaseService.getAllUsers();
    console.log(`✅ Found ${users.length} users`);
    return users;
  },

  // Get shipments for a specific customer
  async getCustomerShipments(customerId: string) {
    console.log(`📦 Fetching shipments for customer: ${customerId}`);
    const shipments = await firebaseService.getShipmentsByCustomer(customerId);
    console.log(`✅ Found ${shipments.length} shipments for customer`);
    return shipments;
  },

  // Update shipment status
  async updateShipmentStatus(shipmentId: string, status: string, location?: string) {
    console.log(`🔄 Updating shipment ${shipmentId} status to: ${status}`);
    await firebaseService.updateShipmentStatus(shipmentId, status, location);
    console.log(`✅ Shipment status updated`);
  },

  // Add a vehicle
  async addVehicle(plateNumber: string, type: 'TRUCK' | 'VAN' | 'BIKE' = 'VAN') {
    console.log(`🚐 Adding vehicle: ${plateNumber}`);
    const vehicleId = await firebaseService.addVehicle({
      type,
      plateNumber,
      status: 'AVAILABLE',
      capacity: type === 'TRUCK' ? '2000kg' : type === 'VAN' ? '500kg' : '50kg',
      lastMaintenance: new Date().toISOString().split('T')[0]
    });
    console.log(`✅ Vehicle added with ID: ${vehicleId}`);
    return vehicleId;
  },

  // Get all vehicles
  async getAllVehicles() {
    console.log('🚛 Fetching all vehicles...');
    const vehicles = await firebaseService.getAllVehicles();
    console.log(`✅ Found ${vehicles.length} vehicles`);
    return vehicles;
  },

  // Listen to real-time updates for shipments
  subscribeToShipments(callback: (shipments: any[]) => void) {
    console.log('👂 Setting up real-time listener for shipments...');
    return firebaseService.subscribeToCollection('shipments', callback);
  },

  // Example of complex query - get pending shipments
  async getPendingShipments() {
    console.log('⏳ Fetching pending shipments...');
    const shipments = await firebaseService.queryDocuments('shipments', [
      { field: 'currentStatus', operator: '==', value: 'PLACED' }
    ], 'createdAt', 10);
    console.log(`✅ Found ${shipments.length} pending shipments`);
    return shipments;
  }
};

// Example usage function
export const runDatabaseDemo = async () => {
  try {
    console.log('🚀 Starting Firebase Database Demo...\n');

    // 1. Seed the database
    const seededData = await databaseDemo.seedAll();
    console.log('\n📊 Seeded data IDs:', seededData);

    // 2. Add a new user
    const newUserId = await databaseDemo.addUser('Demo User', 'demo@example.com');

    // 3. Add a shipment for the new user
    const newShipmentId = await databaseDemo.addShipment(newUserId);

    // 4. Get all shipments
    const allShipments = await databaseDemo.getAllShipments();
    console.log('\n📦 All shipments:', allShipments.map(s => ({ id: s.id, trackingId: s.trackingId, status: s.currentStatus })));

    // 5. Update shipment status
    if (allShipments.length > 0) {
      await databaseDemo.updateShipmentStatus(allShipments[0].id, 'PICKED', 'Pickup location');
    }

    // 6. Get pending shipments
    const pendingShipments = await databaseDemo.getPendingShipments();
    console.log('\n⏳ Pending shipments:', pendingShipments.length);

    console.log('\n✅ Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
};

export default databaseDemo;