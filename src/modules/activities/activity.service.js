const activityRepository = require('./activity.repository');
const AppError = require('../../shared/errors/AppError');

const CATEGORIES = {
  relief: {
    en: 'Relief',
    ar: 'مشاريع الإغاثة',
  },
  psychosocial: {
    en: 'Psychosocial',
    ar: 'الدعم النفسي',
  },
  workshops: {
    en: 'Workshops',
    ar: 'ورش العمل',
  },
  development: {
    en: 'Development',
    ar: 'مشاريع تنموية',
  },
};

class ActivityService {
  _resolveCategory(key) {
    if (!CATEGORIES[key]) {
      throw new AppError(`Invalid category key: ${key}`, 400);
    }
    return {
      key,
      name: CATEGORIES[key],
    };
  }

  async createActivity(data) {
    const activityData = { ...data };

    // Resolve category
    activityData.category = this._resolveCategory(data.category);

    // Ensure system fields are pristine
    activityData.isDeleted = false;
    activityData.deletedAt = null;

    const activity = await activityRepository.createActivity(activityData);
    return activity;
  }

  async getActivities(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    
    // Build filters
    const filters = {};
    if (query.category) {
      filters['category.key'] = query.category;
    }

    // Build sort
    const sort = {};
    if (query.sort === 'asc') {
      sort.date = 1;
    } else {
      sort.date = -1; // Default descending
    }

    const activities = await activityRepository.findActivities(filters, { page, limit }, sort);
    const total = await activityRepository.countActivities(filters);

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getActivityById(id) {
    const activity = await activityRepository.findActivityById(id);
    if (!activity) {
      throw new AppError('Activity not found', 404);
    }
    return activity;
  }

  async updateActivity(id, data) {
    const updateData = { ...data };

    // Prevent modification of system fields (already handled by validation, but defense in depth)
    delete updateData.isDeleted;
    delete updateData.deletedAt;

    // Resolve category if provided
    if (data.category) {
      updateData.category = this._resolveCategory(data.category);
    }

    const activity = await activityRepository.updateActivityById(id, updateData);
    if (!activity) {
      throw new AppError('Activity not found', 404);
    }
    return activity;
  }

  async deleteActivity(id) {
    const activity = await activityRepository.findAnyActivityById(id);
    if (!activity || activity.isDeleted) {
      throw new AppError('Activity not found', 404);
    }

    const deletedActivity = await activityRepository.softDeleteActivity(id);
    return deletedActivity;
  }
}

module.exports = new ActivityService();
