const Activity = require('./activity.model');

class ActivityRepository {
  async createActivity(activityData) {
    const activity = new Activity(activityData);
    return await activity.save();
  }

  async findActivities(filters = {}, pagination = { page: 1, limit: 10 }, sort = { date: -1 }) {
    const skip = (pagination.page - 1) * pagination.limit;
    
    // Always exclude soft-deleted activities in normal list queries
    const queryFilters = { ...filters, isDeleted: false };
    
    return await Activity.find(queryFilters)
      .sort(sort)
      .skip(skip)
      .limit(pagination.limit);
  }

  async countActivities(filters = {}) {
    const queryFilters = { ...filters, isDeleted: false };
    return await Activity.countDocuments(queryFilters);
  }

  async findActivityById(id) {
    return await Activity.findOne({ _id: id, isDeleted: false });
  }

  async updateActivityById(id, updateData) {
    return await Activity.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async softDeleteActivity(id) {
    return await Activity.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }
  
  // Note: Finding a soft-deleted activity is generally for internal operations/superadmins.
  // The public API should not use this.
  async findAnyActivityById(id) {
    return await Activity.findById(id);
  }
}

module.exports = new ActivityRepository();
