# Firestore panel format for CourierOS

This document describes a recommended Firestore data model and Console (panel) layout for this CourierOS project. The repository currently uses a Supabase Postgres schema; this guide maps the most relevant tables to Firestore collections and gives example documents, security rules, recommended indexes, and tips for showing a useful Firestore console layout for operators.

Use this as a starting point — adapt field names and types to your app code and migration strategy.

---

## Purpose

- Provide a simple, searchable, and realtime-friendly representation of users, shipments, addresses and application settings in Firestore.
- Keep sensitive auth responsibilities in Firebase Authentication. Store user profile and app data in Firestore when realtime updates or simple mobile-friendly reads are desired.

## High-level mapping (Supabase -> Firestore)

- `users` (Postgres) -> `users` (Firestore collection)
- `shipments` -> `shipments`
- `addresses` -> `addresses` (or embedded inside shipments/users, depending on query patterns)

If you keep Postgres as the canonical store, Firestore can be used as a read-replica for realtime features or for mobile clients.

---

## Collections & Document Shape

All timestamps use Firestore `Timestamp` type. IDs are strings (use the same UUIDs if syncing from Postgres).

### Collection: `users`

Document ID: user's uid (from Firebase Auth) or the same id used in your Postgres `users` table.

Fields:
- `email` (string)
- `name` (string)
- `phone` (string)
- `role` (string) — enum: `CUSTOMER` | `RIDER` | `HUB_MANAGER` | `HUB_STAFF` | `ADMIN`
- `status` (string) — `ACTIVE` | `INACTIVE`
- `avatarUrl` (string | null)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

Example:

```
users/uid_12345 {
  email: "alice@example.com",
  name: "Alice",
  phone: "+15551234567",
  role: "RIDER",
  status: "ACTIVE",
  avatarUrl: null,
  createdAt: Timestamp(...),
  updatedAt: Timestamp(...)
}
```

### Collection: `shipments`

Document ID: UUID or generated string. Keep `trackingId` if you already have one.

Fields:
- `trackingId` (string)
- `customerId` (string) — reference to `users` doc id
- `riderId` (string | null)
- `recipientName` (string)
- `pickup` (map)
  - `street`, `city`, `state`, `zipCode`, `latitude`, `longitude`
- `dropoff` (map)
  - `street`, `city`, `state`, `zipCode`, `latitude`, `longitude`
- `weight` (number)
- `description` (string)
- `serviceType` (string) — `STANDARD` | `EXPRESS` | `SAME_DAY`
- `status` (string) — `PENDING` | `APPROVED` | `PICKED_UP` | `IN_TRANSIT` | `DELIVERED` | `CANCELLED`
- `paymentMethod` (string)
- `paymentStatus` (string)
- `price` (number)
- `distanceMiles` (number | null)
- `estimatedDelivery` (timestamp | string)
- `createdAt`, `updatedAt` (timestamp)

Example:

```
shipments/sh_001 {
  trackingId: "CR-0001",
  customerId: "uid_customer_1",
  riderId: "uid_rider_2",
  recipientName: "Bob",
  pickup: { street: "1 Main St", city: "Metropolis", state: "CA", zipCode: "90001", latitude: 34.05, longitude: -118.24 },
  dropoff: { street: "2 Elm St", city: "Gotham", state: "NY", zipCode: "10001", latitude: 40.71, longitude: -74.01 },
  weight: 2.3,
  description: "Small parcel",
  serviceType: "STANDARD",
  status: "IN_TRANSIT",
  paymentMethod: "CREDIT_CARD",
  paymentStatus: "PAID",
  price: 9.99,
  distanceMiles: 12.5,
  estimatedDelivery: Timestamp(...),
  createdAt: Timestamp(...),
  updatedAt: Timestamp(...)
}
```

### Collection: `addresses` (optional)

If you frequently search saved addresses (for autocomplete or frequent pickup points), create a separate collection:

Fields:
- `ownerId` (string) — user id
- `label` (string) — e.g., "Home", "Office"
- `street`, `city`, `state`, `zipCode`, `latitude`, `longitude`
- `createdAt`, `updatedAt`

### Collection: `settings` (optional)

For application-wide settings visible in the Console, keep a small document like `settings/app` containing feature flags, pricing tiers, and global configuration.

---

## Security rules (example)

This example demonstrates role-based access: end users can read and write their own user doc and create shipments; riders can update shipments assigned to them; admins can read/write everything.

Rules are intentionally simple — adapt to your business logic before using in production.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    function isAdmin() {
      return isSignedIn() && request.auth.token.role == 'ADMIN';
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (isAdmin() || request.auth.uid == userId);
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update: if isSignedIn() && (isAdmin() || request.auth.uid == userId);
      allow delete: if isAdmin();
    }

    match /shipments/{shipmentId} {
      allow create: if isSignedIn(); // any signed-in user may create shipments (validate server-side too)
      allow read: if isSignedIn() && (isAdmin() || resource.data.customerId == request.auth.uid || resource.data.riderId == request.auth.uid);
      allow update: if isSignedIn() && (isAdmin() || resource.data.riderId == request.auth.uid || resource.data.customerId == request.auth.uid);
      allow delete: if isAdmin();
    }

    match /addresses/{addrId} {
      allow read, write: if isSignedIn() && (isAdmin() || resource.data.ownerId == request.auth.uid || request.auth.uid == resource.data.ownerId);
    }

    // settings/doc
    match /settings/{doc} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```

Notes:
- Use custom claims (e.g., `role`) on Firebase Auth users for role checks. Set claims server-side using the Admin SDK.
- Keep critical validations server-side as Firestore rules are not a replacement for business logic.

---

## Composite Indexes & Queries

If you query shipments by status and riderId or by customerId and createdAt, create composite indexes in the Firestore console.

Examples:
- shipments: (riderId ASC, status ASC, createdAt DESC)
- shipments: (customerId ASC, createdAt DESC)

Add indexes via `firestore indexes` or the console when you get an index error for a complex query.

---

## Console (panel) setup tips

- In the Firestore console, pin these collections to the top: `shipments`, `users`, `addresses`, `settings`.
- Use column view and add the most useful fields for each collection:
  - `users`: email, name, role, status, createdAt
  - `shipments`: trackingId, status, customerId, riderId, serviceType, createdAt
  - `addresses`: ownerId, label, city
- Create saved filters for Operator views, e.g., `shipments` where `status == "PENDING"` or `status == "IN_TRANSIT"`.

---

## Migration notes

- If you have an existing Postgres (Supabase) dataset, export rows and write a migration script that:
  1. Converts Postgres timestamps to Firestore Timestamps.
  2. Writes documents to Firestore using the same IDs if you want a 1:1 mapping.
  3. Optionally stores a `source: 'supabase'` field for tracing.

- Example Node.js snippet (pseudo):

```js
// Use firebase-admin in backend to write documents
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore();

await db.collection('users').doc(pgUser.id).set({
  email: pgUser.email,
  name: pgUser.name,
  role: pgUser.role,
  createdAt: Firestore.Timestamp.fromDate(new Date(pgUser.created_at)),
});
```

---

## Service account and env

- Provide a service account to backend workers that will write/read from Firestore. Use one of these options for the server:
  - Set `FIREBASE_SERVICE_ACCOUNT_PATH` to a JSON file path (recommended for local dev).
  - Set `FIREBASE_SERVICE_ACCOUNT_JSON` (or `FIREBASE_SERVICE_ACCOUNT_KEY`) to the JSON string.
  - On GCP, use Application Default Credentials.

## Example common operations (Admin SDK)

- Verify ID token (server):

```ts
const decoded = await firebaseAuth.verifyIdToken(idToken);
// decoded.uid contains the Firebase UID
```

- Create custom claim (role):

```ts
await firebaseAuth.setCustomUserClaims(uid, { role: 'RIDER' });
```

---

## Final tips

- Keep auth (Firebase Auth) and data (Firestore/Postgres) concerns separated.
- Prefer client-side Firebase Auth sign-in and pass ID tokens to the backend for verification.
- Always validate and sanitize writes server-side when business rules are important (payments, price calculation, role escalation).

If you want, I can also:
- Add an automated migration script from your Supabase `users` and `shipments` tables into Firestore.
- Create example Firestore Console screenshots (or JSON) for the exact panel columns and filters.

---

Generated on: 2025-12-07
