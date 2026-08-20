require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const Admin = require('../admins/admin.model');
const { generateAccessToken } = require('../../shared/utils/jwt');
const { hashPassword } = require('../../shared/utils/password');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const { parseDurationMs } = require('../../shared/utils/parse-duration');

beforeAll(async () => {
  let uri = process.env.MONGODB_TEST_URI;
  if (!uri) {
    throw new Error('MONGODB_TEST_URI is required');
  }
  await mongoose.connect(uri);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}, 30000);

describe('Auth API Tests', () => {
  let testAdmin;
  let testPassword = 'Password123!';

  beforeEach(async () => {
    const passwordHash = await hashPassword(testPassword);
    testAdmin = await Admin.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'admin@test.com',
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully login and return access token cookie with 90d maxAge, and no refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.email).toBe('admin@test.com');
      
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();

      let accessTokenCookie = null;
      let refreshTokenCookie = null;

      cookies.forEach(cookie => {
        if (cookie.startsWith('accessToken=')) accessTokenCookie = cookie;
        if (cookie.startsWith('refreshToken=')) refreshTokenCookie = cookie;
      });

      expect(accessTokenCookie).toBeTruthy();
      expect(refreshTokenCookie).toBeNull(); // No refresh token should be issued

      // Check maxAge is approximately 90 days (7776000000 ms)
      const maxAgeMatch = accessTokenCookie.match(/Max-Age=(\d+)/i);
      const expectedMaxAgeSeconds = Math.floor(parseDurationMs(config.jwt.accessExpiresIn) / 1000);
      expect(parseInt(maxAgeMatch[1])).toBeCloseTo(expectedMaxAgeSeconds, -1);
    });

    it('should fail login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should fail login with unknown email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'unknown@test.com', password: testPassword });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail login for inactive admin', async () => {
      await Admin.findByIdAndUpdate(testAdmin._id, { isActive: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: testPassword });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should access protected route with valid access token', async () => {
      const token = generateAccessToken({ id: testAdmin._id, role: testAdmin.role });
      
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.email).toBe('admin@test.com');
    });

    it('should reject access with expired access token', async () => {
      // Sign an expired token
      const expiredToken = jwt.sign(
        { id: testAdmin._id, role: testAdmin.role },
        config.jwt.accessSecret,
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`accessToken=${expiredToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('should reject access without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear access token cookie', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      
      const cookies = res.headers['set-cookie'];
      let accessTokenCookie = null;
      let refreshTokenCookie = null;

      cookies.forEach(cookie => {
        if (cookie.startsWith('accessToken=')) accessTokenCookie = cookie;
        if (cookie.startsWith('refreshToken=')) refreshTokenCookie = cookie;
      });

      expect(accessTokenCookie).toBeTruthy();
      expect(accessTokenCookie).toMatch(/Expires=/i); // Cleared cookie has past expiry
      expect(refreshTokenCookie).toBeNull(); // Should not attempt to clear refresh token
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('endpoint must no longer exist (404)', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');
      expect(res.status).toBe(404);
    });
  });
});
