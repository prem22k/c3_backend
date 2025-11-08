# Project Overview

This is a Node.js backend server for the Cloud Community Club (C³) membership registration system. It provides RESTful API endpoints for handling new member registrations, storing member data in MongoDB, and sending automated welcome emails using Nodemailer. The application features CORS-enabled endpoints, robust email delivery with fallback SMTP configurations, duplicate email detection, and comprehensive error handling for a reliable registration experience.

# Repo Structure

```
c3_backend/
├─ models/
│  ├─ newMembers.js       # Primary member registration schema
│  └─ registration.js     # Alternative registration schema
├─ routes/
│  └─ register.js         # Registration API endpoints
├─ images/
│  ├─ ccc_logo.png        # Club logo asset
│  └─ sreenidhi-logo.png  # Institution logo asset
├─ server.js              # Main Express server entry point
├─ package.json           # Dependencies and scripts
└─ .env                   # Environment variables (not tracked)
```

# How to Run (dev / build / preview)

**Install Dependencies:**
```bash
npm install
```

**Development/Production:**
```bash
npm start
```
- Runs `node server.js` which starts the Express server
- Default port: **5000** (configurable via `PORT` environment variable)
- Server starts only after successful MongoDB connection

**Environment Variables Required:**
Create a `.env` file in the root directory with:
```
MONGO_URI=<your-mongodb-connection-string>
EMAIL_USER=<your-gmail-address>
EMAIL_PASS=<your-gmail-app-password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
PORT=5000
```

# Main Tech Stack & Dependencies

**Core Framework:**
- **Express.js** (v4.21.2) - Web server framework
- **Node.js** - Runtime environment (ES modules)

**Database:**
- **Mongoose** (v8.12.0) - MongoDB ODM for data modeling

**Email Service:**
- **Nodemailer** (v6.10.0) - SMTP email delivery with fallback configurations

**Utilities:**
- **CORS** (v2.8.5) - Cross-origin resource sharing
- **dotenv** (v16.4.7) - Environment variable management
- **axios** (v1.8.1) - HTTP client
- **pdf-lib** (v1.17.1) - PDF generation/manipulation

# Entry Points & Routing

**Main Entry:** `server.js`
- Initializes Express app
- Configures CORS for multiple origins (localhost:3000, production domains)
- Establishes MongoDB connection
- Registers middleware (JSON parsing, URL encoding, request logging)
- Mounts routes and error handlers

**API Routes:**
- `GET /health` - Health check endpoint
- `POST /test` - Test POST endpoint for debugging
- `/api/register/*` - Registration routes (mounted from `routes/register.js`)

# Visual / Motion Layers

N/A - This is a backend API server with no frontend UI components, visual rendering, or animations.

# Components Map (detailed for important UI blocks)

N/A - This is a backend-only application. Key functional modules include:

**Models:**
- **`models/newMembers.js`** - Defines the NewMembers schema with fields: name, email, mobile, rollNumber, department, year, interests (array), experience, expectations, and referral. Uses Mongoose for MongoDB document structure with unique email validation.

- **`models/registration.js`** - Alternative registration schema with fields: name, mobile, email, department, interests (array), expectations, and registrationID. Currently not actively used in the main registration flow.

**Routes:**
- **`routes/register.js`** - Handles all registration logic:
  - `GET /api/register` - Returns API information and available endpoints
  - `GET /api/register/test-email` - Tests SMTP configurations and displays connection status for debugging
  - `POST /api/register` - Main registration endpoint that validates input, checks for duplicate emails, saves to MongoDB, and sends welcome email with retry logic across multiple SMTP configurations

# State Management & Data Flow

**Data Flow:**
1. Frontend submits registration form via POST to `/api/register`
2. Server validates required fields (name, email, mobile, rollNumber, department, year, interests)
3. Checks MongoDB for existing email using `NewMembers.findOne()`
4. If unique, creates new document and saves to database
5. Attempts to send welcome email using Nodemailer with fallback SMTP configs
6. Returns success/error response to client

**Database:**
- **MongoDB** - Primary data store for member registrations
- **Collection:** `newmembers` (via Mongoose model)
- No global state management (stateless REST API)

**Email Logic:**
- Two SMTP configurations (port 587 TLS and port 465 SSL) for reliability
- Connection pooling and rate limiting implemented
- Email failure does not prevent registration success

# Styling & Theming

N/A - Backend server only. Email templates use inline HTML/CSS styling with:
- Font: Arial, sans-serif
- Primary color: #4285f4 (Google blue)
- Background accents: #f1f3f4 (light gray)
- Max-width: 600px for email content

# Performance / Accessibility notes

**Performance:**
- Connection pooling for SMTP (maxConnections: 5, maxMessages: 100)
- Rate limiting on email sending (5 emails per 20 seconds)
- MongoDB connection reuse with single connection instance
- Request logging for debugging and monitoring
- Graceful shutdown on MongoDB connection failure

**Reliability:**
- Duplicate email detection prevents multiple registrations
- Fallback SMTP configurations (tries port 587, then 465)
- Extended timeouts for SMTP operations (60s connection, 30s greeting)
- TLS certificate validation disabled for compatibility
- Email sending failures don't block registration success

**Security:**
- CORS whitelist for trusted origins only
- Environment variables for sensitive credentials
- Unique email constraint at database level
- Input validation for required fields

**Error Handling:**
- Global error handling middleware
- Detailed error logging with timestamps
- Graceful degradation (registration succeeds even if email fails)
- SMTP test endpoint for debugging connection issues

# Key Scripts / Build Configurations

**package.json scripts:**
```json
{
  "start": "node server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

**Module Configuration:**
- `"type": "module"` - Uses ES6 module syntax (import/export)
- Entry point: `"main": "index.js"` (though server.js is the actual entry)

**CORS Configuration (server.js):**
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://snist.cloudcommunityclub.tech',
    'https://cloudcommunityclub-c3.vercel.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
```

**MongoDB Connection:**
- Uses environment variable `MONGO_URI`
- Server only starts after successful DB connection
- Process exits with code 1 on connection failure

**Middleware Stack:**
1. CORS with specific origin whitelist
2. `express.json()` - Parse JSON request bodies
3. `express.urlencoded({ extended: true })` - Parse URL-encoded data
4. Custom request logger - Logs method, URL, headers, and body
5. Routes mounting
6. Global error handler
