require('dotenv').config();
const mongoose = require('mongoose');
const { hashPassword } = require('./src/shared/utils/password');
const Admin = require('./src/modules/admins/admin.model');

async function seedAdmin() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'superadmin@example.com';
    const password = 'Password123!';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin user already exists. You can login with:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      process.exit(0);
    }

    // Hash password and create admin
    const passwordHash = await hashPassword(password);

    await Admin.create({
      email,
      passwordHash,
      role: 'superadmin',
      isActive: true
    });

    console.log('Successfully created the first Superadmin!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
