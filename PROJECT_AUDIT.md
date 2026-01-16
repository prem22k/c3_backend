# PROJECT_AUDIT

## The One-Liner
A specialized, fail-safe backend API built on Node.js and Express that manages high-volume student membership registrations with resilient, multi-protocol email delivery.

## The 'Technical Hook' (Crucial)
**Custom Fail-Safe SMTP Connection Strategy**
The most impressive logic is the **recursive retry mechanism for SMTP transport creation** tailored for restrictive network environments. Instead of relying on a single email configuration, the system defines an array of fallback strategies (trying varying ports 587/465 and protocols TLS/SSL). It iterates through these configurations in real-time during a request, creating and verifying a temporary transporter for each until a successful connection is established, ensuring email delivery even when standard ports are blocked.

**File Path:** `routes/register.js` (Lines 152-211)

## The True Stack (Evidence-Based)
*   **Core Framework:** Express (`express`)
*   **Database ODM:** Mongoose (`mongoose`)
*   **Email Services:** Nodemailer (`nodemailer`)
*   **Utilities:** Dotenv (`dotenv`), CORS (`cors`)
*   **Legacy/Dormant:** PDF-Lib (`pdf-lib`) - included in dependencies but not utilized in the active registration flow.

## Architecture & Scale Indicators
*   **Database:** **MongoDB** (Evidence: `models/newMembers.js` defines a Schema, `server.js` connects via `mongoose.connect`).
*   **Authentication:** **Public API**. The registration endpoint is open without JWT or session management.
*   **Deployment:** Standard Node.js process (`node server.js`). CORS whitelist (`cloudcommunityclub-c3.vercel.app`) enforces client-server security boundaries. `process.env.PORT` ensures PaaS compatibility.

## Product Features
1.  **Resilient Student Registration:** A robust intake endpoint that validates 10+ data points (roll number, department, interests), enforces uniqueness on email, and handles persistence.
2.  **Multi-Protocol Email Diagnostics:** A dedicated `/test-email` endpoint that runs connectivity tests across multiple SMTP configurations to debug network blockers in real-time.
3.  **Automatic Welcome Workflows:** An integrated notification system that immediately sends HTML-formatted welcome emails with dynamic user details upon successful database insertion.
