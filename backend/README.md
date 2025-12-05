# CourierOS Backend

Express.js backend with Supabase cloud database for CourierOS logistics application.

## Features

- 🔐 **Authentication**: Email/password and OTP login with Supabase Auth
- 📦 **Shipment Management**: CRUD operations for shipments with role-based access
- 👥 **User Management**: Profile management and admin user operations
- 🛡️ **Security**: JWT authentication, Row Level Security (RLS), role-based access control
- 🗄️ **Cloud Database**: PostgreSQL via Supabase (free tier available)

## Prerequisites

- Node.js 18+ installed
- Supabase account (free at [supabase.com](https://supabase.com))

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the project to be provisioned (~2 minutes)
4. Go to **Project Settings** → **API**
5. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key**
   - **service_role key** (keep this secret!)

### 2. Set Up Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `database/schema.sql`
4. Click **Run** to execute the schema
5. Verify tables were created in **Table Editor**

### 3. Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_key_here
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production build**:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Shipments

All shipment endpoints require authentication (`Authorization: Bearer <token>`)

- `GET /api/shipments` - List shipments (filtered by role)
- `GET /api/shipments/:id` - Get shipment details
- `POST /api/shipments` - Create new shipment (customers only)
- `PATCH /api/shipments/:id` - Update shipment
- `DELETE /api/shipments/:id` - Cancel shipment

### Users

- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update profile
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PATCH /api/users/:id` - Update user (admin only)

## Database Schema

### Tables

- **users**: User accounts with roles (CUSTOMER, RIDER, HUB_MANAGER, ADMIN)
- **shipments**: Delivery orders with tracking, status, and pricing
- **addresses**: Geocoding cache for address lookups

### Security

- **Row Level Security (RLS)** enabled on all tables
- Customers can only see their own shipments
- Riders can only see assigned shipments
- Admins and Hub Managers can see all data
- JWT token validation on all protected routes

## Testing

### Health Check

```bash
curl http://localhost:3001/health
```

### Login Example

```bash
curl -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Create Shipment

```bash
curl -X POST http://localhost:3001/api/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "recipient_name": "John Doe",
    "pickup_address": {"street": "123 Main St", "city": "New York", "state": "NY", "zipCode": "10001"},
    "dropoff_address": {"street": "456 Oak Ave", "city": "Boston", "state": "MA", "zipCode": "02101"},
    "weight": 5.5,
    "service_type": "EXPRESS",
    "payment_method": "CREDIT_CARD",
    "price": 45.00,
    "estimated_delivery": "2024-12-06T10:00:00Z"
  }'
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.ts       # Supabase client configuration
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts            # Authentication routes
│   │   ├── shipments.ts       # Shipment CRUD routes
│   │   └── users.ts           # User management routes
│   └── server.ts              # Express server setup
├── database/
│   └── schema.sql             # Database schema
├── .env.example               # Environment variables template
├── package.json
└── tsconfig.json
```

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created `.env` file from `.env.example`
- Verify all Supabase credentials are correct

### "User not found" after OTP login
- The schema automatically creates users on first OTP login
- Check if the `users` table exists in Supabase

### CORS errors from frontend
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check that frontend is running on the specified port

### "Invalid token" errors
- Token might be expired (default: 1 hour)
- Re-login to get a new token
- Check that you're sending `Authorization: Bearer <token>` header

## Next Steps

1. Update frontend to use this API instead of mock data
2. Configure Supabase authentication settings
3. Set up email templates for OTP
4. Add more endpoints as needed
5. Deploy to production (Vercel, Railway, etc.)

## License

ISC
