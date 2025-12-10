import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to parse .env.local manually
function getEnvConfig() {
    try {
        const envPath = path.join(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('❌ .env.local not found!');
            return null;
        }
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const config = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                config[key] = value;
            }
        });
        return {
            apiKey: config.VITE_FIREBASE_API_KEY,
            authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: config.VITE_FIREBASE_PROJECT_ID,
            storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: config.VITE_FIREBASE_APP_ID,
            measurementId: config.VITE_FIREBASE_MEASUREMENT_ID
        };
    } catch (e) {
        console.error('Error reading .env.local:', e);
        return null;
    }
}

async function verify() {
    console.log('🔍 Reading configuration...');
    const config = getEnvConfig();
    if (!config) return;

    if (!config.apiKey || !config.projectId) {
        console.error('❌ Missing critical Firebase configuration keys in .env.local');
        console.log('Found keys:', Object.keys(config).filter(k => config[k]));
        return;
    }

    console.log('✅ Configuration loaded.');
    console.log(`   Project ID: ${config.projectId}`);

    try {
        console.log('🔌 Initializing Firebase...');
        const app = initializeApp(config);
        const db = getFirestore(app);

        console.log('📡 Testing Firestore connection (fetching users)...');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(1));
        const snapshot = await getDocs(q);

        console.log('✅ Connection Successful!');
        console.log(`   Successfully accessed 'users' collection.`);
        console.log(`   Documents found: ${snapshot.size}`);

    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.code) console.error('   Error Code:', error.code);
    }
}

verify();
