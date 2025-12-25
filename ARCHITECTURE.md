# System Architecture

## 1. Design Overview
The system is architected as a **Monolithic REST API** built on Node.js and Express. It follows a simplified **Layered Architecture** where the controller logic is embedded within route definitions for simplicity, given the limited scope of the application.

The backend is stateless, relying on MongoDB for persistence and SMTP for asynchronous communication.

## 2. Module Responsibilities

| Module / Directory | Responsibility |
|-------------------|----------------|
| **`server.js`** | **Entry Point & Configuration.** Initializes the Express app, connects to MongoDB, configures global middleware (CORS, Body Parser), and binds routes. |
| **`routes/`** | **Request Handling.** Defines API endpoints. Currently, `register.js` acts as a hybrid Route-Controller, handling validation, business logic, and response formatting. |
| **`models/`** | **Data Access Layer.** Defines Mongoose schemas. Enforces data structure and validation rules at the application level before persistence. |
| **`images/`** | **Static Assets.** Stores assets like logos used in email templates or served statically. |

## 3. Data Flow

### Registration Request Lifecycle
1.  **Ingestion**: Client sends `POST /api/register` with JSON payload.
2.  **Middleware Processing**:
    *   `cors`: Validates Origin header against allowed list.
    *   `express.json`: Parses body payload.
3.  **Validation (Application Layer)**:
    *   Checks for presence of required fields (`name`, `email`, `rollNumber`, etc.).
    *   **Fail Fast**: Returns `400 Bad Request` immediately if validation fails.
4.  **Business Logic**:
    *   **Uniqueness Check**: Queries `newmembers` collection for existing `email`.
    *   **Persistence**: If unique, creates and saves a new document to MongoDB.
5.  **Side Effects (Notification)**:
    *   Triggers `nodemailer` transport.
    *   Executes fallback strategy (TLS -> SSL) if primary connection fails.
    *   Sends HTML email to user.
6.  **Response**: Returns `200 OK` JSON to client.

## 4. Key Architectural Decisions & Trade-offs

### A. Embedded Controller Logic
*   **Decision**: Business logic is written directly inside `routes/register.js` rather than separated into a dedicated `controllers/` directory.
*   **Trade-off**: Reduces boilerplate for a single-endpoint application but makes unit testing and future scalability harder.

### B. Synchronous Email Sending
*   **Decision**: Email sending is awaited within the request handler (mostly) or triggered as a side effect during the request.
*   **Trade-off**:
    *   *Pro*: Immediate feedback to the user if the email fails (or at least confirmation it was attempted).
    *   *Con*: Increases API latency. If the SMTP server is slow, the user waits.
    *   *Mitigation*: The current implementation catches email errors to prevent blocking the HTTP success response, effectively making it "fire-and-forget" from the user's perspective, though it still consumes server resources during the request.

### C. Direct SMTP vs. Transactional Email API
*   **Decision**: Uses `nodemailer` with direct SMTP credentials (Gmail) instead of an API like SendGrid or AWS SES.
*   **Trade-off**:
    *   *Pro*: Zero cost and no external vendor lock-in.
    *   *Con*: Lower deliverability rates and strict rate limits (e.g., Gmail's daily sending limits).

### D. Legacy Code Retention
*   **Decision**: Retained `models/registration.js` and `pdf-lib` despite being unused in the current flow.
*   **Trade-off**:
    *   *Pro*: Preserves "Ticket Generation" logic for potential future events.
    *   *Con*: Adds technical debt and confusion to the codebase (dead code).

### E. Hardcoded CORS
*   **Decision**: CORS origins are hardcoded in `server.js`.
*   **Trade-off**: Simple to read but requires code changes to deploy to new environments (e.g., staging vs. prod).
