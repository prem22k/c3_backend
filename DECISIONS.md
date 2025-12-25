# Architectural Decision Records (ADR)

This document records the key architectural decisions, trade-offs, and constraints that shaped the current implementation of the C³ Backend.

## 1. Technology Stack Selection

### Runtime: Node.js & Express
*   **Decision:** Use Node.js with Express.js.
*   **Context:** The team required a lightweight, non-blocking I/O environment to handle concurrent registration requests efficiently.
*   **Why:**
    *   **Speed of Development:** JavaScript on both frontend and backend allows for rapid prototyping and context switching.
    *   **Ecosystem:** Express provides a minimal yet robust framework with easy middleware integration (CORS, Body Parser).
    *   **Performance:** Sufficient for the expected load of student registrations.

### Database: MongoDB (Mongoose)
*   **Decision:** Use MongoDB with Mongoose ODM.
*   **Context:** The data schema (student profiles) is semi-structured and liable to change (e.g., adding new interest fields or event-specific data).
*   **Why:**
    *   **Flexibility:** Schema-less nature allows for easy iteration on the data model without complex migrations.
    *   **JSON Native:** Seamless integration with Node.js.
    *   **Mongoose:** Provides necessary schema validation at the application level to ensure data consistency despite the NoSQL backend.

### Email Service: Nodemailer (SMTP)
*   **Decision:** Use Nodemailer with Gmail SMTP.
*   **Context:** The project needed a zero-cost solution to send transactional emails (welcome messages).
*   **Why:**
    *   **Cost:** Free (within Gmail's daily limits).
    *   **Simplicity:** Easy to implement without setting up complex cloud infrastructure (SES/SendGrid).
*   **Trade-off:** Lower deliverability and strict rate limits compared to dedicated transactional email providers.

## 2. Key Architectural Decisions & Trade-offs

### A. Monolithic Structure
*   **Decision:** Build as a single monolithic service.
*   **Trade-off:**
    *   *Benefit:* Simplifies deployment and local development. No need to manage microservices or complex inter-service communication.
    *   *Drawback:* Tighter coupling between components. Scaling individual parts (e.g., just the email worker) is not possible without scaling the whole app.

### B. Synchronous Email Triggering
*   **Decision:** Trigger email sending within the HTTP request lifecycle (awaited or side-effect).
*   **Trade-off:**
    *   *Benefit:* Immediate feedback loop. We know if the email process started.
    *   *Drawback:* Increases API latency. If the SMTP handshake is slow, the user's registration spinner spins longer.
    *   *Mitigation:* We catch email errors so they don't block the successful registration response, but the latency cost remains.

### C. Hardcoded CORS Configuration
*   **Decision:** Hardcode allowed origins in `server.js`.
*   **Trade-off:**
    *   *Benefit:* Explicit and secure for the known set of client domains.
    *   *Drawback:* Requires code changes and redeployment to add new environments (e.g., a new Vercel preview URL).

## 3. Constraints

*   **Cost:** The project had to be deployable with zero infrastructure cost (Free Tier hosting, Free Tier DB, Free SMTP).
*   **Time:** Developed under tight timelines, prioritizing core functionality (registration flow) over administrative features.
*   **Scope:** Focused strictly on *intake*. Management of members was out of scope for v1.

## 4. Roadmap for v2 (Improvements)

If we were to rebuild or significantly upgrade this system, we would:

1.  **Decouple Email Service:** Move email sending to a background job queue (e.g., BullMQ + Redis) to make the registration API instant and resilient to SMTP outages.
2.  **Admin Dashboard:** Build a secure admin API and frontend to view, search, and export member data, removing the need for direct DB access.
3.  **Dynamic Configuration:** Move CORS origins and other hardcoded values to environment variables or a configuration service.
4.  **Transactional Email Provider:** Switch from Gmail SMTP to a proper provider (SendGrid/AWS SES) to improve deliverability and avoid rate limits.
5.  **Clean Up Legacy Code:** Properly archive or remove the unused `registration.js` and `pdf-lib` code if the ticketing feature is not imminent.
