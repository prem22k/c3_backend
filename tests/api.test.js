import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import { jest } from '@jest/globals';

// Set timeout to avoid issues with slow CI environments
jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('API Tests', () => {
  test('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('POST /test', async () => {
    const payload = { test: 'data' };
    const res = await request(app).post('/test').send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.body).toEqual(payload);
  });

  // Test registration endpoint (validation)
  test('POST /api/register - Validation Error', async () => {
    const res = await request(app).post('/api/register').send({});
    expect(res.statusCode).toBe(400);
  });

  // Test registration endpoint (success)
  test('POST /api/register - Success', async () => {
     // The code swallows email errors so it should succeed even if email fails.

     const payload = {
        name: "Test User",
        email: "test@example.com",
        mobile: "1234567890",
        rollNumber: "123",
        department: "CSE",
        year: "3",
        interests: ["Cloud"],
        experience: "None",
        expectations: "Learn",
        referral: "None"
     };

     const res = await request(app).post('/api/register').send(payload);
     expect(res.statusCode).toBe(200);
     expect(res.body.message).toBe("success");

     // Verify it is in DB
     const NewMembers = mongoose.model('NewMembers');
     const member = await NewMembers.findOne({ email: "test@example.com" });
     expect(member).toBeTruthy();
     expect(member.name).toBe("Test User");
  });
});
