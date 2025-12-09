// Quick test to verify Firebase database connection
import { databaseDemo } from './utils/databaseDemo.ts';

console.log('🔥 Testing Firebase Database Connection...\n');

// Test basic operations
async function testDatabase() {
  try {
    // Test 1: Add a sample user
    console.log('1️⃣ Adding a test user...');
    const userId = await databaseDemo.addUser('Test User', 'test@example.com');
    console.log(`✅ User added with ID: ${userId}\n`);

    // Test 2: Get all users
    console.log('2️⃣ Fetching all users...');
    const users = await databaseDemo.getAllUsers();
    console.log(`✅ Found ${users.length} users\n`);

    // Test 3: Add a sample shipment
    console.log('3️⃣ Adding a test shipment...');
    const shipmentId = await databaseDemo.addShipment(userId);
    console.log(`✅ Shipment added with ID: ${shipmentId}\n`);

    // Test 4: Get all shipments
    console.log('4️⃣ Fetching all shipments...');
    const shipments = await databaseDemo.getAllShipments();
    console.log(`✅ Found ${shipments.length} shipments\n`);

    console.log('🎉 All tests passed! Firebase database is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n💡 Make sure you have:');
    console.log('   - Enabled Firestore in Firebase Console');
    console.log('   - Set Firestore rules to test mode');
    console.log('   - Correct Firebase configuration in .env.local');
  }
}

testDatabase();