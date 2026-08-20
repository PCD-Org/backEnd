require('dotenv').config();
const mongoose = require('mongoose');
const Activity = require('./src/modules/activities/activity.model');
const searchService = require('./src/modules/search/search.service');

async function run() {
  await mongoose.connect(process.env.MONGODB_TEST_URI);
  await Activity.deleteMany({});
  
  await Activity.create({
    title: { en: 'Tree Planting', ar: 'زراعة الأشجار' },
    description: { en: 'Planting trees in the valley', ar: 'زراعة الأشجار في الوادي' },
    date: '2026-08-01',
    category: { key: 'relief', name: { en: 'Relief', ar: 'مشاريع الإغاثة' } },
  });
  
  const res = await searchService.searchActivities({ q: 'Tree', page: 1, limit: 10 });
  console.log('Tree:', res.results.length);
  
  const res2 = await searchService.searchActivities({ q: 'planting', page: 1, limit: 10 });
  console.log('planting:', res2.results.length);

  await mongoose.disconnect();
}
run().catch(console.error);
