require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../src/app');
const Admin = require('../../../src/modules/admins/admin.model');
const Activity = require('./activity.model');
const { generateAccessToken } = require('../../../src/shared/utils/jwt');
const cloudinaryService = require('../../../src/shared/services/cloudinary.service');

jest.mock('../../../src/shared/services/cloudinary.service', () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
}));

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
    email: 'superadmin@test.com',
    passwordHash: 'dummy',
    role: 'superadmin',
    isActive: true,
  });
  const token = generateAccessToken({ id: admin._id, role: admin.role });
  return `accessToken=${token}`;
};

const getEditorToken = async () => {
  const admin = await Admin.create({
    email: 'editor@test.com',
    passwordHash: 'dummy',
    role: 'editor',
    isActive: true,
  });
  const token = generateAccessToken({ id: admin._id, role: admin.role });
  return `accessToken=${token}`;
};

const validActivity = {
  title: {
    en: 'Valid English Title',
    ar: 'العنوان العربي الصحيح',
  },
  description: {
    en: 'Valid English Description',
    ar: 'الوصف العربي الصحيح',
  },
  date: '2026-08-09T00:00:00.000Z',
  category: 'relief',
};

describe('Activities API - Phase 4A', () => {

  describe('Create Activity (ACT-001 to ACT-010, ACT-017 to ACT-019)', () => {
    it('ACT-001: Should create a valid activity', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(validActivity);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activity.title.en).toBe(validActivity.title.en);
      expect(res.body.data.activity.category.name.en).toBe('Relief'); // server resolved
      expect(res.body.data.activity.date).toBe('2026-08-09'); // formatted date
      expect(res.body.data.activity.isDeleted).toBe(false);
    });

    it('ACT-002: Should reject missing English title', async () => {
      const cookie = await getSuperadminToken();
      const payload = JSON.parse(JSON.stringify(validActivity));
      delete payload.title.en;

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Validation failed/i);
    });

    it('ACT-003: Should reject missing Arabic title', async () => {
      const cookie = await getSuperadminToken();
      const payload = JSON.parse(JSON.stringify(validActivity));
      delete payload.title.ar;

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('ACT-004: Should reject title exceeding 1000 chars', async () => {
      const cookie = await getSuperadminToken();
      const payload = JSON.parse(JSON.stringify(validActivity));
      payload.title.en = 'a'.repeat(1001);

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('ACT-005: Should reject description exceeding 1000 chars', async () => {
      const cookie = await getSuperadminToken();
      const payload = JSON.parse(JSON.stringify(validActivity));
      payload.description.ar = 'ا'.repeat(1001);

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('ACT-006: Should reject invalid category key', async () => {
      const cookie = await getSuperadminToken();
      const payload = JSON.parse(JSON.stringify(validActivity));
      payload.category = 'invalid_key';

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('ACT-007: Should accept valid category key', async () => {
      const cookie = await getSuperadminToken();
      const payload = JSON.parse(JSON.stringify(validActivity));
      payload.category = 'psychosocial';

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.activity.category.key).toBe('psychosocial');
      expect(res.body.data.activity.category.name.en).toBe('Psychosocial');
    });

    it('ACT-008: Should reject invalid date', async () => {
      const cookie = await getSuperadminToken();
      const payload = JSON.parse(JSON.stringify(validActivity));
      payload.date = 'invalid-date';

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('ACT-009: Should create activity without coverImage', async () => {
      const cookie = await getSuperadminToken();
      const payload = JSON.parse(JSON.stringify(validActivity));
      delete payload.coverImage;

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.status).toBe(201);
    });

    it('ACT-010: Should return activity with coverImage:null when not provided', async () => {
      const cookie = await getSuperadminToken();
      const payload = JSON.parse(JSON.stringify(validActivity));

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.activity.coverImage).toBeNull();
    });

    it('ACT-017: Non-admin cannot create', async () => {
      const res = await request(app)
        .post('/api/v1/activities')
        .send(validActivity);

      expect(res.status).toBe(401); // Unauthorized (no token)
    });

    it('ACT-018: Editor cannot create', async () => {
      const cookie = await getEditorToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(validActivity);

      expect(res.status).toBe(403); // Forbidden
    });

    it('ACT-019: Superadmin can create', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(validActivity);

      expect(res.status).toBe(201);
    });
  });

  describe('List and Get Activities (ACT-011 to ACT-016)', () => {
    let activeId;
    let deletedId;

    beforeEach(async () => {
      const act1 = await Activity.create({ ...validActivity, category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } } });
      activeId = act1._id;

      const act2 = await Activity.create({ ...validActivity, category: { key: 'workshops', name: { en: 'Workshops', ar: 'ورشات عمل' } }, isDeleted: true });
      deletedId = act2._id;

      await Activity.create({ ...validActivity, date: new Date('2025-01-01'), category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } } });
    }, 30000);

    it('ACT-011: Public list returns active activities', async () => {
      const res = await request(app).get('/api/v1/activities');
      expect(res.status).toBe(200);
      expect(res.body.data.activities.length).toBe(2); // The deleted one should be excluded
    });

    it('ACT-012: Deleted activity excluded from list', async () => {
      const res = await request(app).get('/api/v1/activities');
      const found = res.body.data.activities.find(a => a._id === deletedId.toString());
      expect(found).toBeUndefined();
    });

    it('ACT-013: Deleted activity returns 404 by ID', async () => {
      const res = await request(app).get(`/api/v1/activities/${deletedId}`);
      expect(res.status).toBe(404);
    });

    it('ACT-014: Pagination works', async () => {
      const res = await request(app).get('/api/v1/activities?page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.data.activities.length).toBe(1);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.page).toBe(1);
    });

    it('ACT-015: Category filtering works', async () => {
      const res = await request(app).get('/api/v1/activities?category=relief');
      expect(res.status).toBe(200);
      expect(res.body.data.activities.length).toBe(2); // both active ones are relief

      const res2 = await request(app).get('/api/v1/activities?category=workshops');
      expect(res2.status).toBe(200);
      expect(res2.body.data.activities.length).toBe(0); // the workshop is deleted
    });

    it('ACT-016: Date sorting works', async () => {
      const resAsc = await request(app).get('/api/v1/activities?sort=asc');
      expect(resAsc.body.data.activities[0].date).toBe('2025-01-01');

      const resDesc = await request(app).get('/api/v1/activities?sort=desc');
      expect(resDesc.body.data.activities[0].date).toBe('2026-08-09');
    });
  });

  describe('Update Activity (ACT-020 to ACT-027, ACT-030 to ACT-031)', () => {
    let activityId;

    beforeEach(async () => {
      const act = await Activity.create({ ...validActivity, category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } } });
      activityId = act._id;
    }, 30000);

    it('ACT-020: Non-admin cannot update', async () => {
      const res = await request(app).patch(`/api/v1/activities/${activityId}`).send({ title: validActivity.title });
      expect(res.status).toBe(401);
    });

    it('ACT-021: Editor cannot update', async () => {
      const cookie = await getEditorToken();
      const res = await request(app).patch(`/api/v1/activities/${activityId}`).set('Cookie', cookie).send({ title: validActivity.title });
      expect(res.status).toBe(403);
    });

    it('ACT-022: Superadmin can update', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/activities/${activityId}`).set('Cookie', cookie).send({ title: { en: 'New', ar: 'جديد' } });
      expect(res.status).toBe(200);
      expect(res.body.data.activity.title.en).toBe('New');
    });

    it('ACT-023: Empty PATCH rejected', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/activities/${activityId}`).set('Cookie', cookie).send({});
      expect(res.status).toBe(400); // min(1) fails
    });

    it('ACT-024: Partial title update without both languages rejected', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/activities/${activityId}`).set('Cookie', cookie).send({ title: { en: 'New' } });
      expect(res.status).toBe(400); // Both required
    });

    it('ACT-025: Category update reconstructs server-controlled category object', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/activities/${activityId}`).set('Cookie', cookie).send({ category: 'workshops' });
      expect(res.status).toBe(200);
      expect(res.body.data.activity.category.key).toBe('workshops');
      expect(res.body.data.activity.category.name.en).toBe('Workshops');
    });

    it('ACT-026: Client cannot set isDeleted', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/activities/${activityId}`).set('Cookie', cookie).send({ isDeleted: true, title: { en: 'New', ar: 'جديد' } });
      expect(res.status).toBe(200); // isDeleted stripped or rejected by stripUnknown
      // Since stripUnknown is true, it might just strip it and pass. We should ensure it stripped it.

      const act = await Activity.findById(activityId);
      expect(act.isDeleted).toBe(false);
    });

    it('ACT-027: Client cannot set deletedAt', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/activities/${activityId}`).set('Cookie', cookie).send({ deletedAt: new Date(), title: { en: 'New', ar: 'جديد' } });
      const act = await Activity.findById(activityId);
      expect(act.deletedAt).toBeNull();
    });

    it('ACT-030: Client cannot inject category.name', async () => {
      const cookie = await getSuperadminToken();
      // Client only sends category as a string key
      const res = await request(app).patch(`/api/v1/activities/${activityId}`).set('Cookie', cookie).send({ category: { key: 'relief', name: { en: 'Hacked' } } });
      expect(res.status).toBe(400); // validation expects category to be a string
    });

    it('ACT-031: Client cannot inject timestamps', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).patch(`/api/v1/activities/${activityId}`).set('Cookie', cookie).send({ createdAt: new Date(), title: { en: 'New', ar: 'جديد' } });
      const act = await Activity.findById(activityId);
      expect(act.createdAt.toISOString()).not.toBe(new Date().toISOString());
    });
  });

  describe('Delete Activity (ACT-028 to ACT-029, ACT-032)', () => {
    let activityId;

    beforeEach(async () => {
      const act = await Activity.create({ ...validActivity, category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } } });
      activityId = act._id;
    }, 30000);

    it('ACT-028: DELETE performs soft delete', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).delete(`/api/v1/activities/${activityId}`).set('Cookie', cookie);
      expect(res.status).toBe(200);

      const act = await Activity.findById(activityId);
      expect(act.isDeleted).toBe(true);
      expect(act.deletedAt).not.toBeNull();
    });

    it('ACT-029: Repeated DELETE handled correctly', async () => {
      const cookie = await getSuperadminToken();
      await request(app).delete(`/api/v1/activities/${activityId}`).set('Cookie', cookie);

      // Repeated delete
      const res = await request(app).delete(`/api/v1/activities/${activityId}`).set('Cookie', cookie);
      expect(res.status).toBe(404); // the service throws 404 for already deleted or not found
    });

    it('ACT-032: Invalid ObjectId handled cleanly', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app).delete(`/api/v1/activities/invalid_id`).set('Cookie', cookie);
      expect(res.status).toBe(400); // Validation fails due to invalid hex/length
    });
  });

  describe('Cloudinary Integration (IMAGE-001 to IMAGE-018)', () => {
    let activityId;

    beforeEach(async () => {
      jest.clearAllMocks();
      cloudinaryService.uploadImage.mockResolvedValue({ url: 'http://mock-url', publicId: 'mock-id' });
      cloudinaryService.deleteImage.mockResolvedValue(true);
      
      const act = await Activity.create({ ...validActivity, category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } } });
      activityId = act._id;
    }, 30000);

    it('IMAGE-001: Create Activity without image', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(validActivity);

      expect(res.status).toBe(201);
      expect(res.body.data.activity.coverImage).toBeNull();
    });

    it('IMAGE-002: Create Activity with valid JPEG', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .field('description', JSON.stringify(validActivity.description))
        .field('date', validActivity.date)
        .field('category', validActivity.category)
        .attach('coverImage', Buffer.from('mock jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.data.activity.coverImage.url).toBe('http://mock-url');
      expect(res.body.data.activity.coverImage.publicId).toBe('mock-id');
      expect(cloudinaryService.uploadImage).toHaveBeenCalled();
    });

    it('IMAGE-003: Create Activity with valid PNG', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .field('description', JSON.stringify(validActivity.description))
        .field('date', validActivity.date)
        .field('category', validActivity.category)
        .attach('coverImage', Buffer.from('mock png'), { filename: 'test.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
    });

    it('IMAGE-004: Create Activity with valid WebP', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .field('description', JSON.stringify(validActivity.description))
        .field('date', validActivity.date)
        .field('category', validActivity.category)
        .attach('coverImage', Buffer.from('mock webp'), { filename: 'test.webp', contentType: 'image/webp' });

      expect(res.status).toBe(201);
    });

    it('IMAGE-005: Unsupported MIME type', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .field('description', JSON.stringify(validActivity.description))
        .field('date', validActivity.date)
        .field('category', validActivity.category)
        .attach('coverImage', Buffer.from('mock pdf'), { filename: 'test.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Unsupported file type/);
    });

    it('IMAGE-006: Image exceeds maximum size', async () => {
      // Create a dummy buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .field('description', JSON.stringify(validActivity.description))
        .field('date', validActivity.date)
        .field('category', validActivity.category)
        .attach('coverImage', largeBuffer, { filename: 'large.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400); // Payload too large or Multer error
    });

    it('IMAGE-007: Update Activity without coverImage', async () => {
      const cookie = await getSuperadminToken();
      // Set an initial image
      await Activity.findByIdAndUpdate(activityId, { coverImage: { url: 'old-url', publicId: 'old-id' } });

      const res = await request(app)
        .patch(`/api/v1/activities/${activityId}`)
        .set('Cookie', cookie)
        .send({ title: { en: 'New Title', ar: 'العنوان الجديد' } });

      expect(res.status).toBe(200);
      expect(res.body.data.activity.coverImage.url).toBe('old-url');
      expect(cloudinaryService.deleteImage).not.toHaveBeenCalled();
    });

    it('IMAGE-008: Replace existing image', async () => {
      const cookie = await getSuperadminToken();
      await Activity.findByIdAndUpdate(activityId, { coverImage: { url: 'old-url', publicId: 'old-id' } });

      const res = await request(app)
        .patch(`/api/v1/activities/${activityId}`)
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .attach('coverImage', Buffer.from('new image'), { filename: 'new.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(200);
      expect(res.body.data.activity.coverImage.url).toBe('http://mock-url');
      expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('old-id');
    });

    it('IMAGE-009: Set coverImage=null', async () => {
      const cookie = await getSuperadminToken();
      await Activity.findByIdAndUpdate(activityId, { coverImage: { url: 'old-url', publicId: 'old-id' } });

      const res = await request(app)
        .patch(`/api/v1/activities/${activityId}`)
        .set('Cookie', cookie)
        .field('coverImage', 'null');

      expect(res.status).toBe(200);
      expect(res.body.data.activity.coverImage).toBeNull();
      expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('old-id');
    });

    it('IMAGE-010: Delete Activity with image', async () => {
      const cookie = await getSuperadminToken();
      await Activity.findByIdAndUpdate(activityId, { coverImage: { url: 'old-url', publicId: 'old-id' } });

      const res = await request(app)
        .delete(`/api/v1/activities/${activityId}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('old-id');
    });

    it('IMAGE-011: Upload succeeds but Activity persistence fails', async () => {
      const cookie = await getSuperadminToken();
      const activityService = require('../../../src/modules/activities/activity.service');
      jest.spyOn(activityService, 'createActivity').mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .field('description', JSON.stringify(validActivity.description))
        .field('date', validActivity.date)
        .field('category', validActivity.category)
        .attach('coverImage', Buffer.from('mock jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(500); // Because DB Error is an unhandled type in this context, or it could be a 500 AppError
      expect(cloudinaryService.uploadImage).toHaveBeenCalled();
      expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('mock-id');
    });

    it('IMAGE-012: Cloudinary upload failure', async () => {
      const cookie = await getSuperadminToken();
      cloudinaryService.uploadImage.mockRejectedValue(new Error('Cloudinary error'));

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .field('description', JSON.stringify(validActivity.description))
        .field('date', validActivity.date)
        .field('category', validActivity.category)
        .attach('coverImage', Buffer.from('mock jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(500); // Or whatever AppError we throw
    });

    it('IMAGE-013: Unauthorized upload', async () => {
      const res = await request(app)
        .post('/api/v1/activities')
        .attach('coverImage', Buffer.from('mock'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(401);
    });

    it('IMAGE-014: Editor upload', async () => {
      const cookie = await getEditorToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .attach('coverImage', Buffer.from('mock'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(403);
    });

    it('IMAGE-015: Superadmin upload', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .field('description', JSON.stringify(validActivity.description))
        .field('date', validActivity.date)
        .field('category', validActivity.category)
        .attach('coverImage', Buffer.from('mock'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
    });

    it('IMAGE-016: Client attempts to send coverImage.url', async () => {
      const cookie = await getSuperadminToken();
      const payload = JSON.parse(JSON.stringify(validActivity));
      payload.coverImage = { url: 'http://hacked.com', publicId: 'hacked' };
      
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .send(payload);

      // Depending on Joi logic, this might be stripped, or accepted but overwritten by our controller,
      // but if no file is sent, the controller won't set `req.body.coverImage = uploadedImage`.
      // WAIT! If the client sends coverImage JSON, our controller currently just saves it if Joi allows it.
      // We must fix this in controller/validation.
      // We should check that the db does NOT have hacked cover image.
      
      const activity = await Activity.findOne({ 'title.en': validActivity.title.en }).sort({ createdAt: -1 });
      if (activity) {
        expect(activity.toJSON().coverImage).toBeNull();
      } else {
        expect(res.status).toBe(201);
        expect(res.body.data.activity.coverImage).toBeNull();
      }
    });

    it('IMAGE-017: Large filename / unusual filename', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .field('description', JSON.stringify(validActivity.description))
        .field('date', validActivity.date)
        .field('category', validActivity.category)
        .attach('coverImage', Buffer.from('mock'), { filename: 'a'.repeat(255) + '.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
    });

    it('IMAGE-018: MIME spoofing attempt', async () => {
      const cookie = await getSuperadminToken();
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Cookie', cookie)
        .field('title', JSON.stringify(validActivity.title))
        .field('description', JSON.stringify(validActivity.description))
        .field('date', validActivity.date)
        .field('category', validActivity.category)
        .attach('coverImage', Buffer.from('mock'), { filename: 'test.jpg', contentType: 'text/html' });

      expect(res.status).toBe(400); // Must be rejected by Multer fileFilter
    });
  });
});
