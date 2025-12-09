// Quick test for payment functionality
import { firebaseService } from './services/firebaseService.js';

console.log('🧪 Testing Payment & Database Integration...\n');

async function testPaymentFlow() {
  try {
    // Test 1: Create a sample order
    console.log('1️⃣ Creating sample order...');
    const orderData = {
      trackingId: `TEST${Date.now()}`,
      customerId: 'test-customer',
      recipientName: 'Test Recipient',
      pickupAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'NY',
        zipCode: '12345'
      },
      dropoffAddress: {
        street: '456 Demo Avenue',
        city: 'Demo City',
        state: 'NY',
        zipCode: '67890'
      },
      weight: 2.0,
      description: 'Test package',
      serviceType: 'STANDARD',
      currentStatus: 'PLACED',
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: 'PAID',
      price: 25,
      distanceMiles: 10,
      estimatedDelivery: 'Dec 12, 2024',
      events: [
        {
          status: 'PLACED',
          timestamp: new Date().toISOString(),
          description: 'Test order placed',
          location: 'Test City, NY'
        }
      ]
    };

    // Test 2: Add to Firebase
    console.log('2️⃣ Adding order to Firebase...');
    const shipmentId = await firebaseService.addShipment(orderData);
    console.log(`✅ Order added with Firebase ID: ${shipmentId}`);

    // Test 3: Retrieve the order
    console.log('3️⃣ Retrieving order from Firebase...');
    const retrievedOrder = await firebaseService.getShipment(shipmentId);
    console.log(`✅ Order retrieved: ${retrievedOrder?.trackingId}`);

    // Test 4: Get all orders
    console.log('4️⃣ Getting all orders...');
    const allOrders = await firebaseService.getAllShipments();
    console.log(`✅ Found ${allOrders.length} total orders in database`);

    console.log('\n🎉 Payment & Database test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Order created with tracking ID: ${orderData.trackingId}`);
    console.log(`   • Firebase document ID: ${shipmentId}`);
    console.log(`   • Payment status: ${orderData.paymentStatus}`);
    console.log(`   • Total orders in database: ${allOrders.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Make sure Firestore is enabled in Firebase Console');
    } else {
      console.log('\n💡 Check your Firebase configuration and internet connection');
    }
  }
}

testPaymentFlow();