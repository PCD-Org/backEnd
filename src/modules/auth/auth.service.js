const adminRepository = require('../admins/admin.repository');
const { comparePassword } = require('../../shared/utils/password');
const {
  generateAccessToken,
} = require('../../shared/utils/jwt');
const AppError = require('../../shared/errors/AppError');


const DUMMY_HASH =
  '$2b$12$RIuHLJWeze20DhxYLS9Dk.ct9H0t5gak09T5F6IpGA2KqN1vPwACm';

class AuthService {
  async login({ email, password }) {
    const admin = await adminRepository.findByEmail(email);

    const hashToCompare = admin ? admin.passwordHash : DUMMY_HASH;
    const isPasswordCorrect = await comparePassword(password, hashToCompare);

    if (!admin || !admin.isActive || !isPasswordCorrect) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const payload = { id: admin._id, role: admin.role };
    const accessToken = generateAccessToken(payload);

    // Strip passwordHash before returning the profile
    const adminProfile = admin.toObject();
    delete adminProfile.passwordHash;

    return { admin: adminProfile, accessToken };
  }


}

module.exports = new AuthService();
