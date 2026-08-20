const impactStatisticService = require('./impact-statistic.service');
const { successResponse } = require('../../shared/utils/response');

class ImpactStatisticController {
  async createImpactStatistic(req, res, next) {
    try {
      const statistic = await impactStatisticService.createImpactStatistic(req.body);
      return successResponse(res, { impactStatistic: statistic }, null, 201);
    } catch (error) {
      next(error);
    }
  }

  async getImpactStatistics(req, res, next) {
    try {
      // The requirement says "returns the full statistics collection and there is no required filtering/searching."
      // We wrap the array in data directly as expected by the framework when there's no pagination
      const statistics = await impactStatisticService.getImpactStatistics();
      return successResponse(res, statistics);
    } catch (error) {
      next(error);
    }
  }

  async updateImpactStatistic(req, res, next) {
    try {
      const statistic = await impactStatisticService.updateImpactStatistic(req.params.id, req.body);
      return successResponse(res, { impactStatistic: statistic });
    } catch (error) {
      next(error);
    }
  }

  async deleteImpactStatistic(req, res, next) {
    try {
      await impactStatisticService.deleteImpactStatistic(req.params.id);
      return successResponse(res, null, null, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ImpactStatisticController();
