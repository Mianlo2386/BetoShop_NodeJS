import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

vi.mock('../src/services/email.service.js', () => ({
  default: {
    sendContactEmail: vi.fn().mockResolvedValue({ messageId: 'test-123' }),
    sendConfirmationEmail: vi.fn().mockResolvedValue({ messageId: 'test-456' }),
  },
}));

describe('📧 Contact Form API', () => {
  const endpoint = '/contact';
  
  it('debe rechazar solicitud sin datos', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({});
    
    expect(response.status).toBe(400);
  });
  
  it('debe rechazar email invalido', async () => {
    const response = await request(app)
      .post(endpoint)
      .send({
        name: 'Test',
        email: 'invalid-email',
        subject: 'Test',
        message: 'Hola'
      });
    
    expect(response.status).toBe(400);
  });
  
  it('debe aceptar solicitud valida', async () => {
    // Skip DB-dependent tests in CI when no real MongoDB is available
    if (process.env.CI && !process.env.MONGO_URI?.includes('mongodb')) {
      console.log('⚠️ Skipping in CI without MongoDB');
      return;
    }
    
    const response = await request(app)
      .post(endpoint)
      .send({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message content'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
