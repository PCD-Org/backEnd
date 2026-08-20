const impactStatisticRepository = require('./impact-statistic.repository');
const AppError = require('../../shared/errors/AppError');

class ImpactStatisticService {
  async createImpactStatistic(data) {
    const statisticData = { ...data };
    
    // We don't have isDeleted or deletedAt to strip here, 
    // Joi already strips unknown fields.
    const statistic = await impactStatisticRepository.createImpactStatistic(statisticData);
    return statistic;
  }

  async getImpactStatistics() {
    const statistics = await impactStatisticRepository.findImpactStatistics();
    return statistics;
  }

  async getImpactStatisticById(id) {
    const statistic = await impactStatisticRepository.findImpactStatisticById(id);
    if (!statistic) {
      throw new AppError('Impact statistic not found', 404);
    }
    return statistic;
  }

  async updateImpactStatistic(id, data) {
    // Check if exists
    const existing = await impactStatisticRepository.findImpactStatisticById(id);
    if (!existing) {
      throw new AppError('Impact statistic not found', 404);
    }

    const statistic = await impactStatisticRepository.updateImpactStatisticById(id, data);
    return statistic;
  }

  async deleteImpactStatistic(id) {
    const existing = await impactStatisticRepository.findImpactStatisticById(id);
    if (!existing) {
      throw new AppError('Impact statistic not found', 404);
    }

    await impactStatisticRepository.deleteImpactStatistic(id);
    return true;
  }
}

module.exports = new ImpactStatisticService();
