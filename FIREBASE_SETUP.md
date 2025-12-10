# Firebase Setup Instructions

## Backend Server Not Starting?

The backend needs Firebase Admin SDK credentials to access Firestore database.

### Quick Fix (5 minutes):

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/chat-app-6dfa7/settings/serviceaccounts/adminsdk

2. **Generate Service Account Key:**

   - Click "Generate New Private Key"
   - Click "Generate Key" in the dialog
   - A JSON file will download

3. **Save the File:**

   - Rename it to `serviceAccountKey.json`
   - Move it to the `backend/` folder

   ```bash
   mv ~/Downloads/chat-app-6dfa7-*.json backend/serviceAccountKey.json
   ```

4. **Start the Backend:**
   ```bash
   cd backend
   npm run dev
   ```

### Verify It's Working:

You should see:

```
✓ Server running on port 3001
✓ Connected to Firestore
```

### Alternative: Use JSON String

Instead of a file, you can add the entire JSON as an environment variable in `backend/.env`:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"chat-app-6dfa7",...}'
```

(Copy the entire contents of the downloaded JSON file)

---

## Current Status:

- ✅ Frontend Firebase config: Configured
- ❌ Backend Firebase credentials: **MISSING** ← Fix this!
- ✅ Payment bypass: Implemented

Once you add the credentials, your shipment creation will work!
