const adminRepository = require('./admin.repository');
const { hashPassword } = require('../../shared/utils/password');
const AppError = require('../../shared/errors/AppError');

class AdminService {
  async createAdmin(data) {

    const exists = await adminRepository.existsByEmail(data.email);
    if (exists) {
      throw new AppError('Email already in use', 400);
    }

    const passwordHash = await hashPassword(data.password);

    const newAdmin = await adminRepository.create({
      email: data.email,
      passwordHash,
      ...(data.role && { role: data.role }),
    });

    const result = newAdmin.toObject();
    delete result.passwordHash;
    return result;
  }

  async getAllAdmins() {
    return adminRepository.findAll();
  }

  async getAdminById(id) {
    const admin = await adminRepository.findById(id);
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }
    return admin;
  }


  async updateAdmin(id, updateData, requestingAdmin) {
    const targetAdmin = await adminRepository.findById(id);
    if (!targetAdmin) {
      throw new AppError('Admin not found', 404);
    }

    const isSelf =
      requestingAdmin._id.toString() === targetAdmin._id.toString();

    if (isSelf && updateData.isActive === false) {
      throw new AppError('You cannot deactivate your own account.', 403);
    }

    // Rule B: A superadmin cannot demote themselves to editor
    if (isSelf && updateData.role === 'editor') {
      throw new AppError('You cannot demote yourself.', 403);
    }

    const targetIsActiveSuperadmin =
      targetAdmin.role === 'superadmin' && targetAdmin.isActive === true;
    const wouldLoseActiveSuperadminStatus =
      updateData.isActive === false || updateData.role === 'editor';

    if (targetIsActiveSuperadmin && wouldLoseActiveSuperadminStatus) {
      const activeCount = await adminRepository.countActiveSuperadmins();
      if (activeCount <= 1) {
        throw new AppError(
          'Cannot perform this action. The system must always have at least one active superadmin.',
          403
        );
      }
    }

    const updated = await adminRepository.updateById(id, updateData);
    return updated;
  }
}

module.exports = new AdminService();
