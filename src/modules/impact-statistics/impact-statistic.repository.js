const ImpactStatistic = require('./impact-statistic.model');

class ImpactStatisticRepository {
  async createImpactStatistic(data) {
    const statistic = new ImpactStatistic(data);
    return await statistic.save();
  }

  async findImpactStatistics() {
    return await ImpactStatistic.find({}).sort({ createdAt: -1 });
  }

  async findImpactStatisticById(id) {
    return await ImpactStatistic.findById(id);
  }

  async updateImpactStatisticById(id, data) {
    return await ImpactStatistic.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteImpactStatistic(id) {
    return await ImpactStatistic.findByIdAndDelete(id);
  }
}

module.exports = new ImpactStatisticRepository();
