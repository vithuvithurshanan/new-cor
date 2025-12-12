import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  setDoc,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebaseClient';
import { Shipment, User, Vehicle, Hub, RiderTask, AppNotification } from '../types';

export class FirebaseService {
  // Generic CRUD operations
  async addDocument<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  async getAllDocuments<T>(collectionName: string): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  async updateDocument<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Query with conditions
  async queryDocuments<T>(
    collectionName: string,
    conditions: Array<{ field: string; operator: any; value: any }> = [],
    orderByField?: string,
    limitCount?: number
  ): Promise<T[]> {
    try {
      let q = collection(db, collectionName);

      // Apply where conditions
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });

      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField, 'desc'));
      }

      // Apply limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Real-time listener
  subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    conditions: Array<{ field: string; operator: any; value: any }> = []
  ): () => void {
    let q = collection(db, collectionName);

    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    });
  }

  // Shipment-specific methods
  async addShipment(shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.addDocument<Shipment>('shipments', shipment);
  }

  async getShipment(shipmentId: string): Promise<Shipment | null> {
    return this.getDocument<Shipment>('shipments', shipmentId);
  }

  async getAllShipments(): Promise<Shipment[]> {
    return this.getAllDocuments<Shipment>('shipments');
  }

  async getShipmentsByCustomer(customerId: string): Promise<Shipment[]> {
    return this.queryDocuments<Shipment>('shipments', [
      { field: 'customerId', operator: '==', value: customerId }
    ], 'createdAt');
  }

  async updateShipmentStatus(shipmentId: string, status: string, location?: string): Promise<void> {
    const updateData: any = { currentStatus: status };
    if (location) updateData.location = location;

    return this.updateDocument<Shipment>('shipments', shipmentId, updateData);
  }

  // User-specific methods
  async addUser(user: User): Promise<string> {
    try {
      // Use the user's ID (from Firebase Auth) as the document ID
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return user.id;
    } catch (error) {
      console.error('Error adding user to Firestore:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    return this.getDocument<User>('users', userId);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.queryDocuments<User>('users', [
      { field: 'email', operator: '==', value: email }
    ]);
    return users.length > 0 ? users[0] : null;
  }

  async getAllUsers(): Promise<User[]> {
    return this.getAllDocuments<User>('users');
  }

  // Vehicle-specific methods
  async addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<string> {
    return this.addDocument<Vehicle>('vehicles', vehicle);
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return this.getAllDocuments<Vehicle>('vehicles');
  }

  async getAvailableVehicles(): Promise<Vehicle[]> {
    return this.queryDocuments<Vehicle>('vehicles', [
      { field: 'status', operator: '==', value: 'AVAILABLE' }
    ]);
  }

  // Hub-specific methods
  async addHub(hub: Omit<Hub, 'id'>): Promise<string> {
    return this.addDocument<Hub>('hubs', hub);
  }

  async getAllHubs(): Promise<Hub[]> {
    return this.getAllDocuments<Hub>('hubs');
  }

  // Rider Task-specific methods
  async addRiderTask(task: Omit<RiderTask, 'id'>): Promise<string> {
    return this.addDocument<RiderTask>('riderTasks', task);
  }

  async getRiderTasks(riderId?: string): Promise<RiderTask[]> {
    if (riderId) {
      return this.queryDocuments<RiderTask>('riderTasks', [
        { field: 'riderId', operator: '==', value: riderId }
      ], 'createdAt');
    }
    return this.getAllDocuments<RiderTask>('riderTasks');
  }

  async updateRiderTaskStatus(taskId: string, status: RiderTask['status']): Promise<void> {
    return this.updateDocument<RiderTask>('riderTasks', taskId, { status });
  }

  // Notification methods
  async addNotification(notification: Omit<AppNotification, 'id' | 'createdAt'>): Promise<string> {
    return this.addDocument<AppNotification>('notifications', {
      ...notification,
      read: false
    } as any);
  }

  async getUserNotifications(userId: string): Promise<AppNotification[]> {
    return this.queryDocuments<AppNotification>('notifications', [
      { field: 'userId', operator: '==', value: userId }
    ], 'createdAt', 50);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return this.updateDocument<AppNotification>('notifications', notificationId, { read: true });
  }
  async assignRouteShipments(riderId: string, referenceShipmentId: string): Promise<number> {
    try {
      // 1. Get the reference shipment to find the location
      const refShipment = await this.getShipment(referenceShipmentId);
      if (!refShipment) return 0;

      const currentCity = refShipment.pickupAddress.city;

      // 2. Get all PLACED shipments
      // Note: In a real app, we'd use a compound query, but for now we'll filter in memory for simplicity/flexibility with mock data structure
      const allShipments = await this.queryDocuments<Shipment>('shipments', [
        { field: 'currentStatus', operator: '==', value: 'PLACED' }
      ]);

      // 3. Filter for same city
      const routeShipments = allShipments.filter(s =>
        s.pickupAddress.city.toLowerCase() === currentCity.toLowerCase() &&
        s.id !== referenceShipmentId // Don't re-assign the current one (though it shouldn't be PLACED)
      );

      if (routeShipments.length === 0) return 0;

      // 4. Assign them to the rider
      let assignedCount = 0;
      for (const shipment of routeShipments) {
        // Update Shipment
        await this.updateDocument('shipments', shipment.id, {
          riderId: riderId,
          currentStatus: 'PICKUP_ASSIGNED'
        });

        // Create Rider Task
        await this.addRiderTask({
          riderId: riderId,
          type: 'PICKUP',
          status: 'PENDING',
          address: `${shipment.pickupAddress.street}, ${shipment.pickupAddress.city}`,
          customerName: shipment.recipientName,
          timeSlot: 'ASAP',
          packageDetails: shipment.description || 'Package',
          earnings: shipment.price ? shipment.price * 0.8 : 15.00,
          distance: `${shipment.distanceMiles || 0} miles`,
          shipmentId: shipment.id,
          startCoordinates: shipment.pickupAddress.coordinates || { lat: 40.7128, lng: -74.0060 },
          endCoordinates: shipment.dropoffAddress.coordinates || { lat: 40.7489, lng: -73.9680 }
        });

        // Notify Rider
        await this.addNotification({
          userId: riderId,
          title: 'New Route Assignment',
          message: `A new pickup at ${shipment.pickupAddress.street} has been added to your route.`,
          type: 'INFO',
          read: false,
          relatedId: shipment.id
        });

        assignedCount++;
      }

      // Check if vehicle needs upgrade based on new load
      if (assignedCount > 0) {
        await this.assignVehicleToRiderBasedOnLoad(riderId);
      }

      return assignedCount;
    } catch (error) {
      console.error('Error in assignRouteShipments:', error);
      return 0;
    }
  }

  // Helper to parse capacity string (e.g., "2000kg" -> 2000)
  private parseCapacity(capacityStr: string): number {
    const match = capacityStr.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async assignVehicleToRiderBasedOnLoad(riderId: string): Promise<string | null> {
    try {
      // 1. Fetch all active shipments for the rider
      // In a real app, we would query riderTasks or shipments directly.
      // For now, we'll query shipments where riderId matches and status is not DELIVERED
      const shipments = await this.queryDocuments<Shipment>('shipments', [
        { field: 'riderId', operator: '==', value: riderId }
      ]);

      const activeShipments = shipments.filter(s => s.currentStatus !== 'DELIVERED' && s.currentStatus !== 'CANCELLED');
      const totalWeight = activeShipments.reduce((sum, s) => sum + (s.weight || 0), 0);

      console.log(`Rider ${riderId} Total Load: ${totalWeight}kg`);

      // 2. Fetch rider's current vehicle
      const allVehicles = await this.getAllVehicles();
      const currentVehicle = allVehicles.find(v => v.currentDriverId === riderId);

      // 3. Check if current vehicle is sufficient
      if (currentVehicle) {
        const capacity = this.parseCapacity(currentVehicle.capacity);
        if (capacity >= totalWeight) {
          console.log(`Current vehicle ${currentVehicle.id} (${capacity}kg) is sufficient.`);
          return currentVehicle.id;
        }
        console.log(`Current vehicle ${currentVehicle.id} (${capacity}kg) is insufficient for ${totalWeight}kg.`);
      }

      // 4. Find a suitable available vehicle
      const availableVehicles = allVehicles.filter(v => v.status === 'AVAILABLE');

      // Sort by capacity ascending to find the smallest sufficient vehicle
      const suitableVehicle = availableVehicles
        .sort((a, b) => this.parseCapacity(a.capacity) - this.parseCapacity(b.capacity))
        .find(v => this.parseCapacity(v.capacity) >= totalWeight);

      if (suitableVehicle) {
        console.log(`Found suitable vehicle: ${suitableVehicle.id} (${suitableVehicle.capacity})`);

        // Unassign current vehicle if any
        if (currentVehicle) {
          await this.updateDocument('vehicles', currentVehicle.id, {
            status: 'AVAILABLE',
            currentDriverId: undefined
          });
        }

        // Assign new vehicle
        await this.updateDocument('vehicles', suitableVehicle.id, {
          status: 'IN_USE',
          currentDriverId: riderId
        });

        // Notify Rider
        await this.addNotification({
          userId: riderId,
          title: 'Vehicle Upgraded',
          message: `Your vehicle has been upgraded to ${suitableVehicle.type} (${suitableVehicle.plateNumber}) to handle the load.`,
          type: 'WARNING',
          read: false
        });

        return suitableVehicle.id;
      } else {
        console.warn('No suitable vehicle found for the load.');
        // Optionally notify admin
        return null;
      }

    } catch (error) {
      console.error('Error in assignVehicleToRiderBasedOnLoad:', error);
      return null;
    }
  }
}

export const firebaseService = new FirebaseService();