// Simple script to test Firebase database operations
// Run this with: npx tsx scripts/testDatabase.ts

import { runDatabaseDemo } from '../utils/databaseDemo';

console.log('🔥 Firebase Database Test Script');
console.log('================================\n');

// Run the demo
runDatabaseDemo()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });