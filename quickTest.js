// Simple Firebase connection test
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

// Firebase config from your .env.local
const firebaseConfig = {
  apiKey: "AIzaSyA_fwd9dNVhtALSNjt798ufX96jFpI8_SI",
  authDomain: "chat-app-6dfa7.firebaseapp.com",
  projectId: "chat-app-6dfa7",
  storageBucket: "chat-app-6dfa7.firebasestorage.app",
  messagingSenderId: "112840467610",
  appId: "1:112840467610:web:6ff9e15a0f750161a3eb23",
  measurementId: "G-BKTCBQFS9H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirestore() {
  try {
    console.log('🔥 Testing Firestore connection...\n');

    // Test 1: Add a document
    console.log('1️⃣ Adding a test document...');
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Hello Firebase!',
      timestamp: new Date().toISOString(),
      from: 'Kiro Test'
    });
    console.log(`✅ Document added with ID: ${docRef.id}\n`);

    // Test 2: Read documents
    console.log('2️⃣ Reading test documents...');
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log(`✅ Found ${querySnapshot.size} documents in 'test' collection\n`);

    querySnapshot.forEach((doc) => {
      console.log(`   📄 ${doc.id}:`, doc.data());
    });

    console.log('\n🎉 Firebase Firestore is working correctly!');
    console.log('✅ You can now use the database functions in your app.');

  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Fix: Enable Firestore in Firebase Console:');
      console.log('   1. Go to https://console.firebase.google.com/project/chat-app-6dfa7');
      console.log('   2. Click "Firestore Database"');
      console.log('   3. Click "Create database"');
      console.log('   4. Choose "Start in test mode"');
    } else if (error.code === 'failed-precondition') {
      console.log('\n💡 Firestore is not enabled for this project.');
      console.log('   Enable it in the Firebase Console.');
    } else {
      console.log('\n💡 Check your internet connection and Firebase configuration.');
    }
  }
}

testFirestore();