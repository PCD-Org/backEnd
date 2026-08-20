const searchService = require('./search.service');
const { successResponse } = require('../../shared/utils/response');

class SearchController {
  async search(req, res, next) {
    try {
      const { results, pagination } = await searchService.searchActivities(req.query);
      
      const formattedResults = results.map(doc => {
        const activity = doc.toJSON();
        
        return {
          _id: activity._id,
          type: 'activity',
          title: activity.title,
          description: activity.description,
          date: activity.date,
          coverImage: activity.coverImage,
          category: activity.category,
        };
      });

      return successResponse(res, { results: formattedResults }, pagination);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
