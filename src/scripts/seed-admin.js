/**
 * PCED — Superadmin Seed Script
 *
 * Creates the initial superadmin account in the database.
 * This script is the ONLY legitimate way to create the first superadmin.
 * Subsequent admins are created through the protected API by a superadmin.
 *
 * Usage:
 *   node src/scripts/seed-admin.js
 *
 * Environment variables required (via .env):
 *   MONGODB_URI
 *   SEED_ADMIN_EMAIL     (optional override — defaults to value below)
 *   SEED_ADMIN_PASSWORD  (optional override — defaults to value below)
 *
 * IMPORTANT:
 *   - Run this script ONCE on a fresh database.
 *   - Change the default password immediately after first login.
 *   - Never commit real credentials to version control.
 *   - Delete or restrict this script after use in production.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/database');
const { hashPassword } = require('../shared/utils/password');
const Admin = require('../modules/admins/admin.model');

const SEED_EMAIL = process.env.SEED_ADMIN_EMAIL || 'superadmin@pced.org';
const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@2024!';

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to database.');

    const existing = await Admin.findOne({ email: SEED_EMAIL.toLowerCase().trim() });

    if (existing) {
      console.log(`Superadmin already exists: ${SEED_EMAIL}`);
      console.log('No changes made.');
      await disconnectDB();
      process.exit(0);
    }

    const passwordHash = await hashPassword(SEED_PASSWORD);

    await Admin.create({
      email: SEED_EMAIL.toLowerCase().trim(),
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });

    console.log('');
    console.log('✅ Superadmin created successfully.');
    console.log(`   Email: ${SEED_EMAIL}`);
    console.log('   Password: [as provided]');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password immediately after first login.');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed script failed:', err.message);
    try {
      await disconnectDB();
    } catch (_) {
      // ignore disconnect errors during failure
    }
    process.exit(1);
  }
};

seed();
