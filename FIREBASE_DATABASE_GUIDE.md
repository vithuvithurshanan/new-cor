# Firebase Database Integration Guide

This guide shows you how to add and manage data in your Firebase Firestore database.

## 🚀 Quick Start

### 1. Make sure your Firebase configuration is set up

Check that your `.env.local` file contains your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to "Firestore Database"
4. Click "Create database"
5. Choose "Start in test mode" for development

### 3. Test the Database Integration

You can test the database in several ways:

#### Option A: Use the Test Component
Add the `DatabaseTestView` component to your app to interact with the database through a UI.

#### Option B: Run the Demo Script
```bash
# Install tsx if you haven't already
npm install -g tsx

# Run the test script
npx tsx scripts/testDatabase.ts
```

#### Option C: Use the Demo Functions Directly
```typescript
import { databaseDemo } from './utils/databaseDemo';

// Seed the database with sample data
await databaseDemo.seedAll();

// Add a new user
const userId = await databaseDemo.addUser('John Doe', 'john@example.com');

// Add a shipment
const shipmentId = await databaseDemo.addShipment(userId);

// Get all shipments
const shipments = await databaseDemo.getAllShipments();
```

## 📚 Available Services

### FirebaseService Class

The `FirebaseService` class provides methods for all database operations:

```typescript
import { firebaseService } from './services/firebaseService';

// Generic operations
await firebaseService.addDocument('collection', data);
await firebaseService.getDocument('collection', 'docId');
await firebaseService.getAllDocuments('collection');
await firebaseService.updateDocument('collection', 'docId', updates);
await firebaseService.deleteDocument('collection', 'docId');

// Specific operations
await firebaseService.addShipment(shipmentData);
await firebaseService.getShipment('shipmentId');
await firebaseService.updateShipmentStatus('shipmentId', 'DELIVERED');
```

### Database Collections

The following collections are set up:

- **users** - User accounts and profiles
- **shipments** - Package delivery orders
- **vehicles** - Fleet vehicles
- **hubs** - Distribution centers
- **riderTasks** - Delivery assignments

## 🔧 Common Operations

### Adding Data

```typescript
// Add a new shipment
const shipmentId = await firebaseService.addShipment({
  trackingId: 'TRK123',
  customerId: 'user123',
  recipientName: 'John Doe',
  pickupAddress: { /* address object */ },
  dropoffAddress: { /* address object */ },
  weight: 2.5,
  serviceType: 'STANDARD',
  currentStatus: 'PLACED',
  paymentMethod: 'CREDIT_CARD',
  paymentStatus: 'PAID',
  price: 25.99,
  // ... other fields
});
```

### Querying Data

```typescript
// Get shipments by customer
const customerShipments = await firebaseService.getShipmentsByCustomer('customerId');

// Get available vehicles
const availableVehicles = await firebaseService.getAvailableVehicles();

// Custom query
const pendingShipments = await firebaseService.queryDocuments('shipments', [
  { field: 'currentStatus', operator: '==', value: 'PLACED' }
], 'createdAt', 10);
```

### Real-time Updates

```typescript
// Listen to shipment changes
const unsubscribe = firebaseService.subscribeToCollection('shipments', (shipments) => {
  console.log('Shipments updated:', shipments);
});

// Stop listening
unsubscribe();
```

### Updating Data

```typescript
// Update shipment status
await firebaseService.updateShipmentStatus('shipmentId', 'IN_TRANSIT', 'Distribution Center');

// Update any document
await firebaseService.updateDocument('users', 'userId', {
  status: 'ACTIVE',
  lastLogin: new Date().toISOString()
});
```

## 🛡️ Security Rules

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Shipments - customers can read their own, staff can read/write all
    match /shipments/{shipmentId} {
      allow read: if request.auth != null && 
        (resource.data.customerId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'RIDER', 'HUB_MANAGER']);
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'CUSTOMER'];
    }
    
    // Vehicles - only staff can access
    match /vehicles/{vehicleId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'RIDER', 'HUB_MANAGER'];
    }
  }
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure Firestore is in test mode or security rules allow access
2. **Network Error**: Check your Firebase configuration and internet connection
3. **Invalid Data**: Ensure your data matches the expected TypeScript interfaces

### Debug Mode

Enable debug logging:

```typescript
// Add to your firebaseClient.ts
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// For development with emulator
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## 📖 Next Steps

1. **Integrate with your existing components** - Replace mock data with Firebase calls
2. **Add authentication** - Connect user authentication with database operations
3. **Implement real-time features** - Use subscriptions for live updates
4. **Add data validation** - Implement client-side validation before database writes
5. **Optimize queries** - Add indexes for better performance

## 🎯 Example Integration

Here's how to integrate with your existing `PlaceOrderView`:

```typescript
// In PlaceOrderView.tsx
import { firebaseService } from '../services/firebaseService';

const handleSubmitOrder = async (orderData) => {
  try {
    const shipmentId = await firebaseService.addShipment({
      ...orderData,
      currentStatus: 'PLACED',
      events: [{
        status: 'PLACED',
        timestamp: new Date().toISOString(),
        description: 'Order placed',
        location: orderData.pickupAddress.city
      }]
    });
    
    console.log('Order created with ID:', shipmentId);
    // Navigate to tracking page or show success message
  } catch (error) {
    console.error('Error creating order:', error);
    // Show error message to user
  }
};
```

Happy coding! 🚀