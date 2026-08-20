const activityRepository = require('../activities/activity.repository');

class SearchService {
  async searchActivities(query) {
    const { q, page, limit } = query;
    
    // Protect against regex injection by escaping special characters
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeRegex = new RegExp(escapeRegExp(q), 'i');

    const filters = {
      $or: [
        { 'title.en': safeRegex },
        { 'title.ar': safeRegex },
        { 'description.en': safeRegex },
        { 'description.ar': safeRegex },
      ],
    };

    const pagination = { page, limit };
    
    // Sort deterministically by date descending (newest first)
    const sort = { date: -1 };

    const [activities, total] = await Promise.all([
      activityRepository.findActivities(filters, pagination, sort),
      activityRepository.countActivities(filters)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      results: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: totalPages === 0 ? 0 : totalPages,
      }
    };
  }
}

module.exports = new SearchService();
