import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

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
