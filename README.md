# C³ Backend

Automated membership registration and data management system for the Cloud Community Club.

## Problem Statement

Managing student club memberships manually often results in fragmented data, delayed communication, and administrative overhead. This project addresses these challenges by providing a centralized, automated backend system for handling member intake. It ensures data integrity through validation, prevents duplicate registrations, and delivers immediate confirmation to applicants, streamlining the administrative process for the club.

## Key Features

- **Membership API**: Secure REST endpoint to capture and validate student details including Roll Number, Department, and Year.
- **Data Integrity**: Enforces unique constraints on email addresses to prevent duplicate registrations.
- **Automated Notifications**: Integrates with SMTP services to send formatted HTML welcome emails immediately upon successful registration.
- **Reliability**: Implements fallback SMTP connection strategies (TLS/SSL) to ensure email delivery resilience.
- **Diagnostics**: Includes dedicated endpoints for server health checks and SMTP configuration testing.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Email Service**: Nodemailer
- **Utilities**: Dotenv, CORS

## Architecture

The application operates as a standard REST API.

1. **Request Handling**: The Express server receives a POST request at `/api/register`.
2. **Validation**: Input data is validated for completeness.
3. **Verification**: The system queries MongoDB to ensure the user is not already registered.
4. **Persistence**: Validated data is stored in the `newmembers` collection.
5. **Notification**: An asynchronous process triggers Nodemailer to send a welcome email using configured SMTP credentials.
6. **Response**: A JSON response indicates success or failure to the client.

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- A MongoDB connection string (Local or Atlas)
- SMTP credentials (e.g., Gmail App Password)

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd c3_backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following keys:
   ```
   PORT=5000
   MONGO_URI=<your_mongodb_connection_string>
   EMAIL_USER=<your_email_address>
   EMAIL_PASS=<your_email_password>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Deployment

The application is designed to be deployed on any Node.js-compatible hosting environment. Ensure that all environment variables defined in the Setup section are correctly configured in the production environment.

## Limitations and Status

- **Administrative Interface**: There is currently no UI or API for administrators to view or manage registered members; database access is required.
- **Legacy Code**: The repository contains unused models (`registration.js`) and dependencies (`pdf-lib`) related to a dormant event ticketing feature. These are retained for potential future use.
- **CORS Configuration**: Cross-Origin Resource Sharing (CORS) origins are currently hardcoded in the server configuration.

## Contributors

Maintained by the Cloud Community Club technical team.