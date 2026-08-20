const request = require('supertest');
const app = require('./app');

describe('CORS Security Tests', () => {
  const allowedOrigins = ['http://localhost:5173', 'https://pced.vercel.app'];

  allowedOrigins.forEach((origin) => {
    it(`CORS-001/002: Origin ${origin} should be allowed`, async () => {
      const res = await request(app)
        .options('/api/v1/health')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'GET');
        
      expect(res.headers['access-control-allow-origin']).toBe(origin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  it('CORS-003: Origin http://localhost:3000 should NOT be allowed', async () => {
    const res = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');
      
    // Express CORS passes an error which the error handler intercepts, returning a 500 status usually
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('CORS-004: Origin https://evil.example.com should NOT be allowed', async () => {
    const res = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'GET');
      
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('CORS-005: Credentials should be true', async () => {
    const res = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'https://pced.vercel.app')
      .set('Access-Control-Request-Method', 'GET');
      
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('CORS-006: OPTIONS preflight', async () => {
    const res = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'https://pced.vercel.app')
      .set('Access-Control-Request-Method', 'POST');
      
    expect(res.status).toBe(204);
  });

  it('CORS-007: Request without Origin should work normally (Postman/curl)', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
