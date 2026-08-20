const Admin = require('./admin.model');

class AdminRepository {

  async findByEmail(email) {
    return await Admin.findOne({ email }).select('+passwordHash');
  }


  async existsByEmail(email) {
    return await Admin.exists({ email });
  }

  async findById(id) {
    return await Admin.findById(id);
  }

  async create(adminData) {
    const admin = new Admin(adminData);
    return await admin.save();
  }

  async findAll() {
    return await Admin.find();
  }

  async updateById(id, updateData) {
    return await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async countActiveSuperadmins() {
    return await Admin.countDocuments({ role: 'superadmin', isActive: true });
  }
}

module.exports = new AdminRepository();
