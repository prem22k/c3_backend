# Quick Start Guide

This guide will help you get the C³ Backend running locally in under 5 minutes.

## Prerequisites

Ensure you have the following installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (usually comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

You will also need:
- A **MongoDB Connection String** (Local instance or MongoDB Atlas)
- **Gmail Credentials** (Email address + [App Password](https://support.google.com/accounts/answer/185833)) for SMTP.

## 1. Clone the Repository

```bash
git clone <repository-url>
cd c3_backend
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Environment Configuration

Create a `.env` file in the root directory. You can copy the example below:

```bash
# .env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/c3_database
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

> **Note:** Do not use your regular Gmail password. You must generate an **App Password** if you have 2-Step Verification enabled.

## 4. Run the Server

### Development Mode
(If `nodemon` is installed globally or added to scripts)
```bash
npm start
```
*The default script runs `node server.js`.*

You should see:
```
Connected to MongoDB
Server running on port 5000
```

## 5. Verify Installation

### Health Check
Open your browser or Postman and visit:
`http://localhost:5000/health`

**Expected Output:**
```json
{ "status": "ok" }
```

### Test SMTP Connection
Visit:
`http://localhost:5000/api/register/test-email`

This will attempt to connect to Gmail using your credentials and return a success/failure report.

## Common Issues & Fixes

| Issue | Possible Cause | Fix |
|-------|----------------|-----|
| **MongoDB Connection Error** | IP Whitelist | Ensure your current IP is whitelisted in MongoDB Atlas Network Access. |
| **SMTP Auth Failed** | Wrong Password | Use a Google App Password, not your login password. |
| **SMTP Connection Timeout** | Firewall / Port Blocked | Ensure port 587 is open. Try using a different network (some corporate/school networks block SMTP). |
| **CORS Error** | Origin Mismatch | The server has hardcoded allowed origins. For local testing, ensure you are calling from `localhost:3000` or use a tool like Postman. |
