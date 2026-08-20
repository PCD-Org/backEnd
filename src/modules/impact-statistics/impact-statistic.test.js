require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../src/app');
const Admin = require('../../../src/modules/admins/admin.model');
const ImpactStatistic = require('./impact-statistic.model');
const { generateAccessToken } = require('../../../src/shared/utils/jwt');

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

const getSuperadminToken = async () => {
  const admin = await Admin.create({
    email: 'superadmin_stat@test.com',
    passwordHash: 'dummy',
    role: 'superadmin',
    isActive: true,
  });
  const token = generateAccessToken({ id: admin._id, role: admin.role });
  return `accessToken=${token}`;
};

const getEditorToken = async () => {
  const admin = await Admin.create({
    email: 'editor_stat@test.com',
    passwordHash: 'dummy',
    role: 'editor',
    isActive: true,
  });
  const token = generateAccessToken({ id: admin._id, role: admin.role });
  return `accessToken=${token}`;
};

const validStatistic = {
  label: {
    en: 'Trees Planted',
    ar: 'الأشجار المزروعة',
  },
  value: 15000,
};

describe('Impact Statistics API - Phase 4B', () => {

  describe('Create Impact Statistic (STAT-001 to STAT-008, STAT-016 to STAT-018, STAT-026, STAT-027, STAT-028)', () => {
    it('STAT-001: Create valid statistic', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/impact-statistics')
        .set('Cookie', cookie)
        .send(validStatistic);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.impactStatistic.label.en).toBe(validStatistic.label.en);
      expect(res.body.data.impactStatistic.value).toBe(validStatistic.value);
    });

    it('STAT-002: Missing label.en', async () => {
      const cookie = await getSuperadminToken();
      const payload = { label: { ar: 'الأشجار' }, value: 10 };
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send(payload);
      expect(res.status).toBe(400);
    });

    it('STAT-003: Missing label.ar', async () => {
      const cookie = await getSuperadminToken();
      const payload = { label: { en: 'Trees' }, value: 10 };
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send(payload);
      expect(res.status).toBe(400);
    });

    it('STAT-004: label > 1000 chars', async () => {
      const cookie = await getSuperadminToken();
      const payload = { label: { en: 'a'.repeat(1001), ar: 'شجرة' }, value: 10 };
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send(payload);
      expect(res.status).toBe(400);
    });

    it('STAT-005: Negative value', async () => {
      const cookie = await getSuperadminToken();
      const payload = { label: validStatistic.label, value: -5 };
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send(payload);
      expect(res.status).toBe(400);
    });

    it('STAT-006: Non-numeric value', async () => {
      const cookie = await getSuperadminToken();
      const payload = { label: validStatistic.label, value: '15K+' };
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send(payload);
      expect(res.status).toBe(400);
    });

    it('STAT-007: value = 0', async () => {
      const cookie = await getSuperadminToken();
      const payload = { label: validStatistic.label, value: 0 };
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send(payload);
      expect(res.status).toBe(201);
      expect(res.body.data.impactStatistic.value).toBe(0);
    });

    it('STAT-008: Valid positive value', async () => {
      const cookie = await getSuperadminToken();
      const payload = { label: validStatistic.label, value: 999999 };
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send(payload);
      expect(res.status).toBe(201);
      expect(res.body.data.impactStatistic.value).toBe(999999);
    });

    it('STAT-016: Unauthenticated create', async () => {
      const res = await request(app).post('/api/v1/impact-statistics').send(validStatistic);
      expect(res.status).toBe(401);
    });

    it('STAT-017: Editor create', async () => {
      const cookie = await getEditorToken();
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send(validStatistic);
      expect(res.status).toBe(403);
    });

    it('STAT-018: Superadmin create', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send(validStatistic);
      expect(res.status).toBe(201);
    });

    it('STAT-026: Verify negative values cannot be persisted', async () => {
      // Direct mongoose test
      try {
        await ImpactStatistic.create({ label: validStatistic.label, value: -10 });
        fail('Should have thrown validation error');
      } catch (err) {
        expect(err.name).toBe('ValidationError');
      }
    });

    it('STAT-027: Verify values remain numeric in MongoDB', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send({ label: validStatistic.label, value: 42 });

      const doc = await ImpactStatistic.findById(res.body.data.impactStatistic._id);
      expect(typeof doc.value).toBe('number');
      expect(doc.value).toBe(42);
    });

    it('STAT-028: Verify bilingual labels remain intact', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send({ label: { en: 'A', ar: 'ب' }, value: 1 });

      const doc = await ImpactStatistic.findById(res.body.data.impactStatistic._id);
      expect(doc.label.en).toBe('A');
      expect(doc.label.ar).toBe('ب');
    });

    it('STAT-029: Create request with unknown system fields', async () => {
      const cookie = await getSuperadminToken();
      const payload = {
        label: validStatistic.label,
        value: 15000,
        createdAt: '2000-01-01T00:00:00.000Z',
        updatedAt: '2000-01-01T00:00:00.000Z',
        isDeleted: true,
        status: 'archived',
      };

      const res = await request(app).post('/api/v1/impact-statistics').set('Cookie', cookie).send(payload);
      expect(res.status).toBe(201);

      const doc = await ImpactStatistic.findById(res.body.data.impactStatistic._id);
      expect(doc.createdAt.toISOString()).not.toBe('2000-01-01T00:00:00.000Z');
      expect(doc.updatedAt.toISOString()).not.toBe('2000-01-01T00:00:00.000Z');
      expect(doc.isDeleted).toBeUndefined();
      expect(doc.status).toBeUndefined();
    });
  });

  describe('Update Impact Statistic (STAT-009 to STAT-012, STAT-019 to STAT-020, STAT-023 to STAT-025)', () => {
    let statId;

    beforeEach(async () => {
      const stat = await ImpactStatistic.create(validStatistic);
      statId = stat._id;
    }, 30000);

    it('STAT-009: Empty PATCH', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({});
      expect(res.status).toBe(400); // min(1) fails
    });

    it('STAT-010: Partial label update missing one language', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({ label: { en: 'Updated Trees' } });
      expect(res.status).toBe(400); // both languages required when updating label
    });

    it('STAT-011: Valid label update', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({ label: { en: 'Updated', ar: 'محدث' } });
      expect(res.status).toBe(200);
      expect(res.body.data.impactStatistic.label.en).toBe('Updated');
    });

    it('STAT-012: Valid value update', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({ value: 20000 });
      expect(res.status).toBe(200);
      expect(res.body.data.impactStatistic.value).toBe(20000);
    });

    it('STAT-019: Unauthorized update', async () => {
      const cookie = await getEditorToken(); // Editor is unauthorized
      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({ value: 100 });
      expect(res.status).toBe(403);
    });

    it('STAT-020: Superadmin update', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({ value: 100 });
      expect(res.status).toBe(200);
    });

    it('STAT-023: Client injects createdAt', async () => {
      const cookie = await getSuperadminToken();
      const originalDoc = await ImpactStatistic.findById(statId);
      const originalCreatedAt = originalDoc.createdAt.getTime();

      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({ value: 100, createdAt: new Date(originalCreatedAt + 100000) });
      const stat = await ImpactStatistic.findById(statId);
      expect(stat.createdAt.getTime()).toBe(originalCreatedAt);
    });

    it('STAT-024: Client injects updatedAt', async () => {
      const cookie = await getSuperadminToken();
      const originalDoc = await ImpactStatistic.findById(statId);
      const originalUpdatedAt = originalDoc.updatedAt.getTime();

      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({ value: 100, updatedAt: new Date(originalUpdatedAt - 100000) });
      const stat = await ImpactStatistic.findById(statId);
      expect(stat.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);
    });

    it('STAT-025: Client injects unknown fields', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({ value: 100, isDeleted: true, status: 'active' });
      expect(res.status).toBe(200);
      const stat = await ImpactStatistic.findById(statId);
      expect(stat.isDeleted).toBeUndefined();
      expect(stat.status).toBeUndefined();
    });

    it('STAT-030: PATCH valid non-existent ObjectId', async () => {
      const cookie = await getSuperadminToken();
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).patch(`/api/v1/impact-statistics/${fakeId}`).set('Cookie', cookie).send({ value: 100 });
      expect(res.status).toBe(404);
    });

    it('STAT-032: Verify createdAt cannot be client-controlled', async () => {
      const cookie = await getSuperadminToken();
      const originalDoc = await ImpactStatistic.findById(statId);
      const originalCreatedAt = originalDoc.createdAt.getTime();

      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({ value: 200, createdAt: new Date(originalCreatedAt + 50000) });
      const stat = await ImpactStatistic.findById(statId);
      expect(stat.createdAt.getTime()).toBe(originalCreatedAt);
    });

    it('STAT-033: Verify updatedAt is managed by Mongoose', async () => {
      const cookie = await getSuperadminToken();
      const originalDoc = await ImpactStatistic.findById(statId);
      const originalUpdatedAt = originalDoc.updatedAt.getTime();

      await new Promise(resolve => setTimeout(resolve, 50));

      const res = await request(app).patch(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie).send({ value: 300, updatedAt: new Date(originalUpdatedAt - 50000) });
      const stat = await ImpactStatistic.findById(statId);
      expect(stat.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);
    });
  });

  describe('Delete Impact Statistic (STAT-013, STAT-014, STAT-021, STAT-022)', () => {
    let statId;

    beforeEach(async () => {
      const stat = await ImpactStatistic.create(validStatistic);
      statId = stat._id;
    }, 30000);

    it('STAT-013: Invalid ObjectId', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).delete(`/api/v1/impact-statistics/invalid-id`).set('Cookie', cookie);
      expect(res.status).toBe(400);
    });

    it('STAT-014: Nonexistent statistic', async () => {
      const cookie = await getSuperadminToken();
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/v1/impact-statistics/${fakeId}`).set('Cookie', cookie);
      expect(res.status).toBe(404);
    });

    it('STAT-021: Unauthorized delete', async () => {
      const cookie = await getEditorToken();
      const res = await request(app).delete(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie);
      expect(res.status).toBe(403);
    });

    it('STAT-022: Superadmin delete', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).delete(`/api/v1/impact-statistics/${statId}`).set('Cookie', cookie);
      expect(res.status).toBe(200);

      const check = await ImpactStatistic.findById(statId);
      expect(check).toBeNull();
    });
  });

  describe('Get Impact Statistics (STAT-015, STAT-031)', () => {
    it('STAT-031: GET collection when no statistics exist', async () => {
      // Clear before test
      await ImpactStatistic.deleteMany({});
      const res = await request(app).get('/api/v1/impact-statistics');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('STAT-015: Public GET', async () => {
      await ImpactStatistic.create(validStatistic);
      await ImpactStatistic.create({ label: { en: 'Volunteers', ar: 'متطوعين' }, value: 50 });

      const res = await request(app).get('/api/v1/impact-statistics');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].label).toBeDefined();
      expect(res.body.data[0].value).toBeDefined();
    });
  });
});
