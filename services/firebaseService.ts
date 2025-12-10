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
  setDoc
} from 'firebase/firestore';
import { db } from '../firebaseClient';
import { Shipment, User, Vehicle, Hub, RiderTask } from '../types';

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
}

export const firebaseService = new FirebaseService();