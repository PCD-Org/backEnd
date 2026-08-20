require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../src/app');
const Activity = require('../activities/activity.model');

jest.setTimeout(30000);

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

describe('Global Search API - Phase 4D', () => {

  beforeEach(async () => {
    // Seed activities for testing
    await Activity.create({
      title: { en: 'Tree Planting', ar: 'زراعة الأشجار' },
      description: { en: 'Planting trees in the valley', ar: 'زراعة الأشجار في الوادي' },
      date: '2026-08-01',
      category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } },
    });

    await Activity.create({
      title: { en: 'Water distribution', ar: 'توزيع المياه' },
      description: { en: 'Clean water for families', ar: 'مياه نظيفة للعائلات' },
      date: '2026-08-05',
      category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } },
    });

    // Deleted activity
    await Activity.create({
      title: { en: 'Old tree workshop', ar: 'ورشة قديمة' },
      description: { en: 'Tree care workshop', ar: 'ورشة العناية بالأشجار' },
      date: '2026-08-10',
      category: { key: 'workshops', name: { en: 'Workshops', ar: 'ورشات عمل' } },
      isDeleted: true,
      deletedAt: new Date(),
    });
  });

  it('SEARCH-001: Valid English search', async () => {
    const res = await request(app).get('/api/v1/search?q=planting');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(1);
    expect(res.body.data.results[0].title.en).toBe('Tree Planting');
  });

  it('SEARCH-002: Valid Arabic search', async () => {
    const res = await request(app).get('/api/v1/search?q=المياه');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(1);
    expect(res.body.data.results[0].title.ar).toBe('توزيع المياه');
  });

  it('SEARCH-003: Search title.en', async () => {
    const res = await request(app).get('/api/v1/search?q=Tree');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(1);
    expect(res.body.data.results[0].title.en).toBe('Tree Planting');
  });

  it('SEARCH-004: Search title.ar', async () => {
    const res = await request(app).get('/api/v1/search?q=زراعة');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(1);
    expect(res.body.data.results[0].title.ar).toBe('زراعة الأشجار');
  });

  it('SEARCH-005: Search description.en', async () => {
    const res = await request(app).get('/api/v1/search?q=valley');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(1);
    expect(res.body.data.results[0].description.en).toBe('Planting trees in the valley');
  });

  it('SEARCH-006: Search description.ar', async () => {
    const res = await request(app).get('/api/v1/search?q=الوادي');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(1);
    expect(res.body.data.results[0].description.ar).toBe('زراعة الأشجار في الوادي');
  });

  it('SEARCH-007: Case-insensitive English search', async () => {
    const res = await request(app).get('/api/v1/search?q=WaTeR');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(1);
    expect(res.body.data.results[0].title.en).toBe('Water distribution');
  });

  it('SEARCH-008: Whitespace around query', async () => {
    const res = await request(app).get('/api/v1/search?q=  planting  ');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(1);
  });

  it('SEARCH-009: Query shorter than 2 chars', async () => {
    const res = await request(app).get('/api/v1/search?q=a');
    expect(res.status).toBe(400);
  });

  it('SEARCH-010: Query longer than 100 chars', async () => {
    const res = await request(app).get('/api/v1/search?q=' + 'a'.repeat(101));
    expect(res.status).toBe(400);
  });

  it('SEARCH-011: Missing q', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.status).toBe(400);
  });

  it('SEARCH-012: No matching results → 200 + empty array', async () => {
    const res = await request(app).get('/api/v1/search?q=nomatchhere');
    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it('SEARCH-013: Deleted activity must not appear', async () => {
    const res = await request(app).get('/api/v1/search?q=workshop');
    expect(res.status).toBe(200);
    expect(res.body.data.results).toEqual([]); // Old workshop has 'workshop' but is deleted
  });

  it('SEARCH-014: Pagination', async () => {
    // Add more activities to test pagination
    await Activity.create({
      title: { en: 'Tree 1', ar: 'شجرة 1' }, description: { en: 'Tree', ar: 'شجرة' }, date: '2026-08-02', category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } },
    });
    await Activity.create({
      title: { en: 'Tree 2', ar: 'شجرة 2' }, description: { en: 'Tree', ar: 'شجرة' }, date: '2026-08-03', category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } },
    });

    const res = await request(app).get('/api/v1/search?q=tree&page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(2);
    expect(res.body.pagination.total).toBe(3); // Tree Planting, Tree 1, Tree 2
    expect(res.body.pagination.totalPages).toBe(2);
  });

  it('SEARCH-015: Invalid page', async () => {
    const res = await request(app).get('/api/v1/search?q=tree&page=-1');
    expect(res.status).toBe(400);
  });

  it('SEARCH-016: Invalid limit', async () => {
    const res = await request(app).get('/api/v1/search?q=tree&limit=0');
    expect(res.status).toBe(400);
  });

  it('SEARCH-017: limit > 50', async () => {
    const res = await request(app).get('/api/v1/search?q=tree&limit=51');
    expect(res.status).toBe(400);
  });

  it('SEARCH-018: Regex injection attempt if regex is used', async () => {
    // Escaping regex prevents this from evaluating as regex
    const res = await request(app).get('/api/v1/search?q=.*');
    expect(res.status).toBe(200);
    // Should not match anything unless literally contains .*
    expect(res.body.data.results).toEqual([]);
  });

  it('SEARCH-019: MongoDB operator injection attempt', async () => {
    const res = await request(app).get('/api/v1/search?q[$ne]=test');
    expect(res.status).toBe(400); // Validation should reject object for 'q' (needs to be string)
  });

  it('SEARCH-020: Results use correct response contract', async () => {
    const res = await request(app).get('/api/v1/search?q=tree');
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('results');
    expect(res.body).toHaveProperty('pagination');
  });

  it('SEARCH-021: Results contain activity type', async () => {
    const res = await request(app).get('/api/v1/search?q=tree');
    expect(res.body.data.results[0].type).toBe('activity');
  });

  it('SEARCH-022: Results do not expose internal deletion fields', async () => {
    const res = await request(app).get('/api/v1/search?q=tree');
    const result = res.body.data.results[0];
    expect(result).not.toHaveProperty('isDeleted');
    expect(result).not.toHaveProperty('deletedAt');
    expect(result).not.toHaveProperty('__v');
  });

  it('SEARCH-023: Newest-first deterministic sorting', async () => {
    // Add one more with a newer date
    await Activity.create({
      title: { en: 'New Tree', ar: 'شجرة جديدة' },
      description: { en: 'Tree', ar: 'شجرة' },
      date: '2026-08-08',
      category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } },
    });

    const res = await request(app).get('/api/v1/search?q=tree');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(2);
    // The newest should be first
    expect(res.body.data.results[0].title.en).toBe('New Tree');
    expect(res.body.data.results[1].title.en).toBe('Tree Planting');
  });

  it('SEARCH-024: Search endpoint remains public', async () => {
    const res = await request(app).get('/api/v1/search?q=tree');
    expect(res.status).toBe(200); // Should not be 401
  });
});
