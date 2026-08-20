require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../src/app');
const Admin = require('../../../src/modules/admins/admin.model');
const ContactInquiry = require('./contact-inquiry.model');
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
  await ContactInquiry.deleteMany({});
  await Admin.deleteMany({});
}, 30000);

const getSuperadminToken = async () => {
  const admin = await Admin.create({
    email: 'superadmin_inq@test.com',
    passwordHash: 'dummy',
    role: 'superadmin',
    isActive: true,
  });
  const token = generateAccessToken({ id: admin._id, role: admin.role });
  return `accessToken=${token}`;
};

const getEditorToken = async () => {
  const admin = await Admin.create({
    email: 'editor_inq@test.com',
    passwordHash: 'dummy',
    role: 'editor',
    isActive: true,
  });
  const token = generateAccessToken({ id: admin._id, role: admin.role });
  return `accessToken=${token}`;
};

const validInquiry = {
  name: 'Mohammed',
  email: 'example@email.com',
  message: 'I would like to contact the organization.',
};

describe('Contact Inquiries API - Phase 4C', () => {

  describe('Create Contact Inquiry (Public)', () => {
    it('INQ-001: Create valid inquiry', async () => {
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-001').send(validInquiry);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inquiry.name).toBe(validInquiry.name);
      expect(res.body.data.inquiry.email).toBe(validInquiry.email);
      expect(res.body.data.inquiry.status).toBe('new');
    });

    it('INQ-002: Missing name', async () => {
      const payload = { ...validInquiry };
      delete payload.name;
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-002').send(payload);
      expect(res.status).toBe(400);
    });

    it('INQ-003: Missing email', async () => {
      const payload = { ...validInquiry };
      delete payload.email;
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-003').send(payload);
      expect(res.status).toBe(400);
    });

    it('INQ-004: Invalid email', async () => {
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-004').send({ ...validInquiry, email: 'invalid-email' });
      expect(res.status).toBe(400);
    });

    it('INQ-005: Missing message', async () => {
      const payload = { ...validInquiry };
      delete payload.message;
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-005').send(payload);
      expect(res.status).toBe(400);
    });

    it('INQ-006: Name > 200', async () => {
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-006').send({ ...validInquiry, name: 'a'.repeat(201) });
      expect(res.status).toBe(400);
    });

    it('INQ-007: Message > 5000', async () => {
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-007').send({ ...validInquiry, message: 'a'.repeat(5001) });
      expect(res.status).toBe(400);
    });

    it('INQ-008: Status defaults to new', async () => {
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-008').send(validInquiry);
      expect(res.status).toBe(201);
      expect(res.body.data.inquiry.status).toBe('new');
    });

    it('INQ-009: Client attempts to set status=replied', async () => {
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-009').send({ ...validInquiry, status: 'replied' });
      expect(res.status).toBe(201);
      const doc = await ContactInquiry.findById(res.body.data.inquiry._id);
      expect(doc.status).toBe('new');
    });

    it('INQ-010: Client attempts to set createdAt', async () => {
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-010').send({ ...validInquiry, createdAt: '2020-01-01T00:00:00.000Z' });
      expect(res.status).toBe(201);
      const doc = await ContactInquiry.findById(res.body.data.inquiry._id);
      expect(doc.createdAt.toISOString()).not.toBe('2020-01-01T00:00:00.000Z');
    });

    it('INQ-011: Client attempts to set updatedAt', async () => {
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-011').send({ ...validInquiry, updatedAt: '2020-01-01T00:00:00.000Z' });
      expect(res.status).toBe(201);
      const doc = await ContactInquiry.findById(res.body.data.inquiry._id);
      expect(doc.updatedAt.toISOString()).not.toBe('2020-01-01T00:00:00.000Z');
    });

    it('INQ-012: Unknown fields are stripped', async () => {
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-012').send({ ...validInquiry, isSpam: true });
      expect(res.status).toBe(201);
      const doc = await ContactInquiry.findById(res.body.data.inquiry._id).lean();
      expect(doc.isSpam).toBeUndefined();
    });

    it('INQ-013: Public create without authentication', async () => {
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-013').send(validInquiry);
      expect(res.status).toBe(201);
    });

    it('INQ-032: Rate limiting behavior if implemented', async () => {
      // 5 requests per hour. Send 5, then the 6th should fail.
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-032').send(validInquiry);
      }
      const res = await request(app).post('/api/v1/contact-inquiries').set('X-Test-IP', 'ip-032').send(validInquiry);
      expect(res.status).toBe(429);
    });
  });

  describe('Get Contact Inquiries (Admin)', () => {
    let newInquiry, readInquiry;

    beforeEach(async () => {
      newInquiry = await ContactInquiry.create(validInquiry);
      readInquiry = await ContactInquiry.create({ ...validInquiry, status: 'read' });
    }, 30000);

    it('INQ-014: Unauthenticated GET → 401', async () => {
      const res = await request(app).get('/api/v1/contact-inquiries');
      expect(res.status).toBe(401);
    });

    it('INQ-015: Editor GET → 403', async () => {
      const cookie = await getEditorToken();
      const res = await request(app).get('/api/v1/contact-inquiries').set('Cookie', cookie);
      expect(res.status).toBe(403);
    });

    it('INQ-016: Superadmin GET → 200', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).get('/api/v1/contact-inquiries').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.inquiries.length).toBe(2);
    });

    it('INQ-017: Status filter new', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).get('/api/v1/contact-inquiries?status=new').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.inquiries.length).toBe(1);
      expect(res.body.data.inquiries[0].status).toBe('new');
    });

    it('INQ-018: Status filter read', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).get('/api/v1/contact-inquiries?status=read').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.inquiries.length).toBe(1);
      expect(res.body.data.inquiries[0].status).toBe('read');
    });

    it('INQ-019: Invalid status filter', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).get('/api/v1/contact-inquiries?status=invalid').set('Cookie', cookie);
      expect(res.status).toBe(400);
    });

    it('INQ-020: Pagination', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).get('/api/v1/contact-inquiries?page=1&limit=1').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.data.inquiries.length).toBe(1);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.totalPages).toBe(2);
    });

    it('INQ-021: Invalid ObjectId', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).get('/api/v1/contact-inquiries/invalid-id').set('Cookie', cookie);
      expect(res.status).toBe(400);
    });

    it('INQ-022: Nonexistent inquiry → 404', async () => {
      const cookie = await getSuperadminToken();
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/v1/contact-inquiries/${fakeId}`).set('Cookie', cookie);
      expect(res.status).toBe(404);
    });

    it('INQ-030: Default sorting is newest first', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).get('/api/v1/contact-inquiries').set('Cookie', cookie);
      expect(res.status).toBe(200);
      // second one created should be first in array
      expect(res.body.data.inquiries[0]._id).toBe(readInquiry._id.toString());
    });

    it('INQ-031: Invalid page/limit', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).get('/api/v1/contact-inquiries?page=-1&limit=200').set('Cookie', cookie);
      expect(res.status).toBe(400);
    });
  });

  describe('Update Contact Inquiry (Admin)', () => {
    let inquiryId;

    beforeEach(async () => {
      const inquiry = await ContactInquiry.create(validInquiry);
      inquiryId = inquiry._id;
    }, 30000);

    it('INQ-023: Empty PATCH → 400', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/contact-inquiries/${inquiryId}`).set('Cookie', cookie).send({});
      expect(res.status).toBe(400);
    });

    it('INQ-024: Invalid status update', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/contact-inquiries/${inquiryId}`).set('Cookie', cookie).send({ status: 'archived' });
      expect(res.status).toBe(400);
    });

    it('INQ-025: Valid status update', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/contact-inquiries/${inquiryId}`).set('Cookie', cookie).send({ status: 'read' });
      expect(res.status).toBe(200);
      expect(res.body.data.inquiry.status).toBe('read');
    });

    it('INQ-026: Attempt to modify email through PATCH', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/contact-inquiries/${inquiryId}`).set('Cookie', cookie).send({ status: 'read', email: 'hacked@email.com' });
      expect(res.status).toBe(200); // the invalid field is stripped, status is updated

      const doc = await ContactInquiry.findById(inquiryId);
      expect(doc.email).toBe(validInquiry.email);
    });

    it('INQ-027: Attempt to modify message through PATCH', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/contact-inquiries/${inquiryId}`).set('Cookie', cookie).send({ status: 'read', message: 'Hacked message' });
      expect(res.status).toBe(200); // stripped

      const doc = await ContactInquiry.findById(inquiryId);
      expect(doc.message).toBe(validInquiry.message);
    });

    it('INQ-028: Editor cannot update status', async () => {
      const cookie = await getEditorToken();
      const res = await request(app).patch(`/api/v1/contact-inquiries/${inquiryId}`).set('Cookie', cookie).send({ status: 'read' });
      expect(res.status).toBe(403);
    });

    it('INQ-029: Superadmin can update status', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/contact-inquiries/${inquiryId}`).set('Cookie', cookie).send({ status: 'replied' });
      expect(res.status).toBe(200);
      expect(res.body.data.inquiry.status).toBe('replied');
    });
  });
});
